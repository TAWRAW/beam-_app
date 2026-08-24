// Trace pérenne des notes envoyées par Resend (table `mailing_notes`, cf. scripts/mailing-notes.sql).
// Toujours appelé derrière requireAdmin() côté route. Dégradation volontaire : si la table
// n'existe pas encore, l'envoi n'échoue pas — on renvoie un avertissement à afficher.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface EnvoiNote {
  email: string
  resend_id?: string
  statut?: string
  erreur?: string
  maj_at?: string
}

export interface NoteEnregistree {
  id: string
  created_at: string
  copro_estale_id: string
  copro_ref: string
  copro_nom: string
  cible: string | null
  type_note: string
  objet: string
  corps: string
  canal: string
  dossier_id: string | null
  envois: EnvoiNote[]
  nb_destinataires: number
  nb_echecs: number
  statuts_maj_at: string | null
}

function db(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        // cache:'no-store' — même piège que Venator : sans lui, Next met les GET Supabase en cache.
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' }),
      },
    },
  )
}

export async function enregistrerNote(input: {
  copro_estale_id: string
  copro_ref: string
  copro_nom: string
  cible?: string | null
  type_note: string
  objet: string
  corps: string
  dossier_id?: string | null
  envois: EnvoiNote[]
}): Promise<{ id: string | null; warning?: string }> {
  const nbEchecs = input.envois.filter((e) => e.erreur).length
  const { data, error } = await db()
    .from('mailing_notes')
    .insert({
      copro_estale_id: input.copro_estale_id,
      copro_ref: input.copro_ref,
      copro_nom: input.copro_nom,
      cible: input.cible?.trim() || null,
      type_note: input.type_note,
      objet: input.objet,
      corps: input.corps,
      dossier_id: input.dossier_id ?? null,
      envois: input.envois,
      nb_destinataires: input.envois.length,
      nb_echecs: nbEchecs,
    })
    .select('id')
    .single()

  if (error) {
    console.error('mailing_notes — insert impossible:', error.message)
    return {
      id: null,
      warning:
        'Envoi effectué mais trace non enregistrée (table mailing_notes absente ? exécuter scripts/mailing-notes.sql).',
    }
  }
  return { id: data.id }
}

export async function listerNotes(filtre: {
  copro_ref?: string
  dossier_id?: string
  limit?: number
}): Promise<NoteEnregistree[]> {
  let q = db()
    .from('mailing_notes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filtre.limit ?? 30)
  if (filtre.copro_ref) q = q.eq('copro_ref', filtre.copro_ref)
  if (filtre.dossier_id) q = q.eq('dossier_id', filtre.dossier_id)
  const { data, error } = await q
  if (error) {
    console.error('mailing_notes — lecture impossible:', error.message)
    return []
  }
  return (data ?? []) as NoteEnregistree[]
}

export async function lireNote(id: string): Promise<NoteEnregistree | null> {
  const { data, error } = await db().from('mailing_notes').select('*').eq('id', id).maybeSingle()
  if (error) {
    console.error('mailing_notes — lecture impossible:', error.message)
    return null
  }
  return (data as NoteEnregistree) ?? null
}

/** Écrit les statuts relus depuis Resend (delivered, bounced…). */
export async function majStatutsNote(
  id: string,
  envois: EnvoiNote[],
): Promise<void> {
  const nbEchecs = envois.filter(
    (e) => e.erreur || e.statut === 'bounced' || e.statut === 'complained' || e.statut === 'failed',
  ).length
  const { error } = await db()
    .from('mailing_notes')
    .update({ envois, nb_echecs: nbEchecs, statuts_maj_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error('mailing_notes — maj statuts impossible:', error.message)
}
