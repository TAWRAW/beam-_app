// src/lib/venator/services/journal-service.ts — journal technique (timeline par copro).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { JournalEntry } from '../types'

export async function logJournal(db: SupabaseClient, e: { copro_id: string; dossier_id?: string | null; ticket_id?: string | null; type_evenement: string; contenu: string; acteur?: string }) {
  await db.from('venator_journal').insert({ acteur: 'tom', ...e })
}

export async function listerJournal(db: SupabaseClient, copro_id: string, limit = 100): Promise<JournalEntry[]> {
  const { data } = await db.from('venator_journal').select('*').eq('copro_id', copro_id).order('created_at', { ascending: false })
  return (data ?? []).slice(0, limit)
}
