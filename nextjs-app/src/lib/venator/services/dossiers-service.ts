// src/lib/venator/services/dossiers-service.ts — cœur métier : dossiers + étapes (gabarits).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Dossier, DossierCreateInput, Etape } from '../types'
import { instancierGabarit } from '../gabarits'
import { logJournal } from './journal-service'
import { VenatorError } from './errors'

export async function creerDossier(db: SupabaseClient, input: DossierCreateInput): Promise<{ dossier: Dossier; etapes: Etape[] }> {
  const { data: dossier, error } = await db.from('venator_dossiers')
    .insert({ ...input, gabarit_key: input.type }).select().single()
  if (error || !dossier) throw new VenatorError('invalid', error?.message ?? 'création impossible')
  const gabarit = instancierGabarit(input.type, new Date())
  const { data: etapes } = await db.from('venator_dossier_etapes')
    .insert(gabarit.map(g => ({ ...g, dossier_id: dossier.id }))).select()
  await logJournal(db, { copro_id: dossier.copro_id, dossier_id: dossier.id, type_evenement: 'dossier_cree', contenu: `Dossier ${input.type} créé : ${input.titre}` })
  return { dossier, etapes: (etapes ?? []) as Etape[] }
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

export async function cloreDossier(db: SupabaseClient, id: string): Promise<Dossier> {
  const { data, error } = await db.from('venator_dossiers')
    .update({ statut: 'clos', closed_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error || !data) throw new VenatorError('not_found', 'Dossier introuvable')
  await logJournal(db, { copro_id: data.copro_id, dossier_id: id, type_evenement: 'dossier_clos', contenu: `Dossier clos : ${data.titre}` })
  return data
}
