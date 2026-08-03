// src/lib/venator/__tests__/tickets.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerTicket, listerTickets, majTicket } from '../services/tickets-service'
import { creerDossier } from '../services/dossiers-service'

describe('tickets-service', () => {
  it('ticket one-shot puis rattaché à un dossier', async () => {
    const { client } = createFakeDb()
    const { data: copro } = await client.from('venator_copros').insert({ estale_id: 'e1', reference: '00013', nom: 'BUC' }).select().single()
    const ticket = await creerTicket(client, { copro_id: copro.id, type: 'intervention', titre: 'Fuite cave' })
    expect(ticket.dossier_id).toBeNull()
    expect(ticket.statut).toBe('nouveau')
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type: 'sinistre', titre: 'DDE', priorite: 1 })
    const rattache = await majTicket(client, ticket.id, { dossier_id: dossier.id })
    expect(rattache.dossier_id).toBe(dossier.id)
    expect(await listerTickets(client, { dossier_id: dossier.id })).toHaveLength(1)
    const clos = await majTicket(client, ticket.id, { statut: 'clos' })
    expect(clos.closed_at).toBeTruthy()
  })
})
