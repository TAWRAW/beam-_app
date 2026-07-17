// src/lib/venator/services/os-service.ts — émission d'OS depuis un ticket (Estale injecté, pur).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Os, OsEmettreInput } from '../types'
import { logJournal } from './journal-service'
import { VenatorError } from './errors'

export type EstaleOrderArgs = {
  prestataire_contact_id: string
  prestataire_nom: string
  objet: string
  description: string
  urgent: boolean
  code_acces?: string | null
}

export type EmettreOsDeps = {
  emitEstaleOrder: (args: EstaleOrderArgs) => Promise<{ taskID: string; eventID: string }>
}

type EmettreOsInput = Omit<OsEmettreInput, 'urgent'> & { urgent?: boolean }

export async function emettreOS(db: SupabaseClient, deps: EmettreOsDeps, input: EmettreOsInput): Promise<Os> {
  const { data: ticket, error: ticketError } = await db.from('venator_tickets').select('*').eq('id', input.ticket_id).maybeSingle()
  if (ticketError || !ticket) throw new VenatorError('not_found', 'Ticket introuvable')

  const { data: os, error: osError } = await db.from('venator_os').insert({
    ticket_id: input.ticket_id,
    copro_id: ticket.copro_id,
    prestataire_nom: input.prestataire_nom,
    objet: input.objet,
    statut: 'brouillon',
  }).select().single()
  if (osError || !os) throw new VenatorError('invalid', osError?.message ?? 'création OS impossible')

  try {
    const result = await deps.emitEstaleOrder({
      prestataire_contact_id: input.prestataire_contact_id,
      prestataire_nom: input.prestataire_nom,
      objet: input.objet,
      description: input.description,
      urgent: input.urgent ?? false,
      code_acces: input.code_acces ?? null,
    })
    const { data: updated, error: updateError } = await db.from('venator_os').update({
      estale_task_id: result.taskID,
      estale_event_id: result.eventID,
      statut: 'envoye',
      sent_at: new Date().toISOString(),
    }).eq('id', os.id).select().single()
    if (updateError || !updated) throw new VenatorError('invalid', updateError?.message ?? 'maj OS impossible')

    await db.from('venator_tickets').update({ statut: 'os_envoye' }).eq('id', input.ticket_id)
    await logJournal(db, { copro_id: ticket.copro_id, ticket_id: input.ticket_id, type_evenement: 'os_emis', contenu: `OS émis : ${input.objet}` })
    return updated
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erreur émission OS'
    await db.from('venator_os').update({ statut: 'erreur', erreur: message }).eq('id', os.id)
    await logJournal(db, { copro_id: ticket.copro_id, ticket_id: input.ticket_id, type_evenement: 'os_erreur', contenu: `Échec émission OS : ${message}` })
    throw new VenatorError('invalid', message)
  }
}

export async function listerOsParTicket(db: SupabaseClient, ticket_id: string): Promise<Os[]> {
  const { data } = await db.from('venator_os').select('*').eq('ticket_id', ticket_id).order('created_at', { ascending: false })
  return data ?? []
}
