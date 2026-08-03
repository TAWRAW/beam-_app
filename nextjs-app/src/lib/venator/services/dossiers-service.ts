// src/lib/venator/services/dossiers-service.ts — cœur métier : dossiers + étapes (gabarits).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Dossier, DossierCreateInput, DossierType, Etape } from '../types'
import { resumerChangements } from '../dossier-diff'
import { instancierGabarit } from '../gabarits'
import { lireGabarit } from './gabarits-service'
import { logJournal } from './journal-service'
import { purgerFil } from './fil-service'
import { VenatorError } from './errors'

export async function creerDossier(db: SupabaseClient, input: DossierCreateInput): Promise<{ dossier: Dossier; etapes: Etape[] }> {
  const { data: dossier, error } = await db.from('venator_dossiers')
    .insert({ ...input, gabarit_key: input.type }).select().single()
  if (error || !dossier) throw new VenatorError('invalid', error?.message ?? 'création impossible')

  // Les étapes viennent du gabarit réglé par l'utilisateur (écran Réglages).
  // Aucun gabarit défini ⇒ dossier sans étape : plus d'étapes imposées par défaut.
  const gabarit = await lireGabarit(db, input.type)
  let etapes: Etape[] = []
  if (gabarit.length > 0) {
    const lignes = instancierGabarit(gabarit, new Date())
    const { data } = await db.from('venator_dossier_etapes')
      .insert(lignes.map(g => ({ ...g, dossier_id: dossier.id }))).select()
    etapes = (data ?? []) as Etape[]
  }

  await logJournal(db, { copro_id: dossier.copro_id, dossier_id: dossier.id, type_evenement: 'dossier_cree', contenu: `Dossier ${input.type} créé : ${input.titre}` })
  return { dossier, etapes }
}

export async function listerDossiers(db: SupabaseClient, f: { copro_id?: string; type?: string; statut?: string } = {}): Promise<Dossier[]> {
  let q = db.from('venator_dossiers').select('*')
  if (f.copro_id) q = q.eq('copro_id', f.copro_id)
  if (f.type) q = q.eq('type', f.type)
  if (f.statut) q = q.eq('statut', f.statut)
  const { data } = await q.order('created_at', { ascending: false })
  return data ?? []
}

export async function detailDossier(db: SupabaseClient, id: string): Promise<{ dossier: Dossier; etapes: Etape[] }> {
  const { data: dossier } = await db.from('venator_dossiers').select('*').eq('id', id).maybeSingle()
  if (!dossier) throw new VenatorError('not_found', 'Dossier introuvable')
  const { data: etapes } = await db.from('venator_dossier_etapes').select('*').eq('dossier_id', id).order('ordre')
  return { dossier, etapes: etapes ?? [] }
}

export async function majEtape(db: SupabaseClient, etapeId: string, patch: { statut?: string; echeance?: string | null; notes?: string | null }): Promise<Etape> {
  const full: Record<string, unknown> = { ...patch }
  if (patch.statut === 'fait') full.done_at = new Date().toISOString()
  const { data: etape, error } = await db.from('venator_dossier_etapes').update(full).eq('id', etapeId).select().single()
  if (error || !etape) throw new VenatorError('not_found', 'Étape introuvable')
  if (patch.statut === 'fait') {
    const { data: dossier } = await db.from('venator_dossiers').select('*').eq('id', etape.dossier_id).maybeSingle()
    if (dossier) await logJournal(db, { copro_id: dossier.copro_id, dossier_id: dossier.id, type_evenement: 'etape_faite', contenu: `Étape faite : ${etape.titre}` })
  }
  return etape
}

export async function ajouterEtape(db: SupabaseClient, dossierId: string, titre: string): Promise<Etape> {
  const { etapes } = await detailDossier(db, dossierId)
  const ordre = (etapes.at(-1)?.ordre ?? 0) + 1
  const { data, error } = await db.from('venator_dossier_etapes').insert({ dossier_id: dossierId, ordre, titre }).select().single()
  if (error || !data) throw new VenatorError('invalid', error?.message ?? 'ajout impossible')
  return data
}

export async function majStatutDossier(db: SupabaseClient, id: string, statut: 'ouvert' | 'en_cours' | 'en_attente'): Promise<Dossier> {
  const { data, error } = await db.from('venator_dossiers').update({ statut }).eq('id', id).select().single()
  if (error || !data) throw new VenatorError('not_found', 'Dossier introuvable')
  return data
}

/**
 * Modifie l'identité d'un dossier : titre, type, priorité.
 *
 * Le changement de type NE régénère PAS les étapes. Elles appartiennent au
 * dossier une fois instanciées, et peuvent déjà être cochées ou annotées : les
 * remplacer parce qu'on corrige un classement détruirait du travail.
 */
export async function majDossier(
  db: SupabaseClient,
  id: string,
  patch: { titre?: string; type?: DossierType; priorite?: number }
): Promise<Dossier> {
  const { data: avant } = await db.from('venator_dossiers').select('*').eq('id', id).maybeSingle()
  if (!avant) throw new VenatorError('not_found', 'Dossier introuvable')

  const resume = resumerChangements(
    { titre: avant.titre, type: avant.type, priorite: avant.priorite },
    patch
  )
  // Rien n'a changé : on évite l'écriture et l'entrée de journal inutiles.
  if (!resume) return avant

  const { data, error } = await db.from('venator_dossiers').update(patch).eq('id', id).select().single()
  if (error || !data) throw new VenatorError('invalid', error?.message ?? 'Modification impossible')

  await logJournal(db, {
    copro_id: data.copro_id,
    dossier_id: id,
    type_evenement: 'dossier_modifie',
    contenu: resume,
  })
  return data
}

/**
 * Rattache un libellé Gmail au dossier, ou le détache (`labelId` à null).
 *
 * Le chemin complet accompagne l'id : l'id seul ne dirait rien à la lecture, et
 * « Toiture » existe sous plusieurs copropriétés. `gmail_last_sync` est remis à
 * zéro pour que la première relève reprenne l'historique du libellé plutôt que
 * de partir de la date de liaison.
 */
export async function majLabelGmail(
  db: SupabaseClient,
  id: string,
  labelId: string | null,
  chemin: string | null
): Promise<Dossier> {
  const { data, error } = await db
    .from('venator_dossiers')
    .update({
      gmail_label_id: labelId,
      gmail_label_chemin: labelId ? chemin : null,
      gmail_last_sync: null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) throw new VenatorError('not_found', error?.message ?? 'Dossier introuvable')
  return data
}

/**
 * Marché de travaux : simple projet, ou voté en assemblée générale.
 *
 * Le passage à « voté » est journalisé — c'est la date de vote qui fait courir
 * les délais de contestation et qui autorise l'engagement de la dépense, donc
 * l'information doit rester traçable au-delà du seul état courant.
 */
export async function majVoteTravaux(db: SupabaseClient, id: string, vote: boolean): Promise<Dossier> {
  const { data, error } = await db.from('venator_dossiers')
    .update({ travaux_vote: vote }).eq('id', id).select().single()
  if (error || !data) throw new VenatorError('not_found', error?.message ?? 'Dossier introuvable')
  await logJournal(db, {
    copro_id: data.copro_id,
    dossier_id: id,
    type_evenement: vote ? 'travaux_vote' : 'travaux_projet',
    contenu: vote ? `Travaux votés en AG : ${data.titre}` : `Travaux repassés en projet : ${data.titre}`,
  })
  return data
}

export async function cloreDossier(db: SupabaseClient, id: string): Promise<Dossier> {
  const { data, error } = await db.from('venator_dossiers')
    .update({ statut: 'clos', closed_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error || !data) throw new VenatorError('not_found', 'Dossier introuvable')
  await logJournal(db, { copro_id: data.copro_id, dossier_id: id, type_evenement: 'dossier_clos', contenu: `Dossier clos : ${data.titre}` })
  return data
}

export async function supprimerDossier(db: SupabaseClient, id: string): Promise<void> {
  const { dossier } = await detailDossier(db, id) // throw not_found si absent
  await logJournal(db, { copro_id: dossier.copro_id, dossier_id: id, type_evenement: 'dossier_supprime', contenu: `Dossier supprimé : ${dossier.titre}` })
  // purge le fil du dossier + des tickets rattachés
  await purgerFil(db, 'dossier', id)
  const { data: tks } = await db.from('venator_tickets').select('id').eq('dossier_id', id)
  for (const t of tks ?? []) await purgerFil(db, 'ticket', t.id)
  await db.from('venator_dossiers').delete().eq('id', id) // étapes cascade, tickets set null (DB)
}

export async function supprimerEtape(db: SupabaseClient, id: string): Promise<void> {
  const { data: e } = await db.from('venator_dossier_etapes').select('id').eq('id', id).maybeSingle()
  if (!e) throw new VenatorError('not_found', 'Étape introuvable')
  await db.from('venator_dossier_etapes').delete().eq('id', id)
}
