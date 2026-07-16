// src/lib/venator/services/tickets-service.ts — tickets internes (one-shot ou rattachés à un dossier).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Ticket, TicketCreateInput } from '../types'
import { logJournal } from './journal-service'
import { VenatorError } from './errors'

export async function creerTicket(db: SupabaseClient, input: TicketCreateInput): Promise<Ticket> {
  const { data, error } = await db.from('venator_tickets')
    .insert({ ...input, dossier_id: input.dossier_id ?? null }).select().single()
  if (error || !data) throw new VenatorError('invalid', error?.message ?? 'création impossible')
  await logJournal(db, { copro_id: data.copro_id, ticket_id: data.id, dossier_id: data.dossier_id, type_evenement: 'ticket_cree', contenu: `Ticket créé : ${data.titre}` })
  return { ...data, dossier_id: data.dossier_id ?? null }
}

export async function listerTickets(db: SupabaseClient, f: { copro_id?: string; dossier_id?: string; statut?: string } = {}): Promise<Ticket[]> {
  let q = db.from('venator_tickets').select('*')
  if (f.copro_id) q = q.eq('copro_id', f.copro_id)
  if (f.dossier_id) q = q.eq('dossier_id', f.dossier_id)
  if (f.statut) q = q.eq('statut', f.statut)
  const { data } = await q.order('created_at', { ascending: false })
  return data ?? []
}

export async function majTicket(db: SupabaseClient, id: string, patch: { statut?: string; dossier_id?: string | null }): Promise<Ticket> {
  const full: Record<string, unknown> = { ...patch }
  if (patch.statut === 'clos') full.closed_at = new Date().toISOString()
  const { data, error } = await db.from('venator_tickets').update(full).eq('id', id).select().single()
  if (error || !data) throw new VenatorError('not_found', 'Ticket introuvable')
  if (patch.dossier_id) await logJournal(db, { copro_id: data.copro_id, ticket_id: id, dossier_id: patch.dossier_id, type_evenement: 'ticket_rattache', contenu: `Ticket rattaché : ${data.titre}` })
  return data
}
