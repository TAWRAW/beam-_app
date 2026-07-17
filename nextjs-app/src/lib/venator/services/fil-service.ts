// src/lib/venator/services/fil-service.ts — fil conversationnel des dossiers/tickets.
// V1 : notes manuelles ; l'add-on Gmail (V2) POSTera ici, la dédup est déjà en place.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { FilCreateInput, FilMessage } from '../types'
import { VenatorError } from './errors'

export async function ajouterAuFil(db: SupabaseClient, input: FilCreateInput): Promise<{ message: FilMessage | null; deduplicated: boolean }> {
  const { data, error } = await db.from('venator_fil_messages')
    .insert({ ...input, gmail_message_id: input.gmail_message_id ?? null }).select().single()
  if (error) {
    if (String((error as any).code) === '23505' || /duplicate key/i.test(error.message)) return { message: null, deduplicated: true }
    throw new VenatorError('invalid', error.message)
  }
  return { message: data, deduplicated: false }
}

export async function listerFil(db: SupabaseClient, parent_type: 'dossier' | 'ticket', parent_id: string): Promise<FilMessage[]> {
  const { data } = await db.from('venator_fil_messages').select('*')
    .eq('parent_type', parent_type).eq('parent_id', parent_id).order('created_at', { ascending: true })
  return data ?? []
}

export async function purgerFil(db: SupabaseClient, parent_type: 'dossier' | 'ticket', parent_id: string): Promise<void> {
  await db.from('venator_fil_messages').delete().eq('parent_type', parent_type).eq('parent_id', parent_id)
}
