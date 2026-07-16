// src/lib/venator/__tests__/journal-copros.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { logJournal, listerJournal } from '../services/journal-service'
import { syncCopros, listerCopros } from '../services/copros-service'

describe('copros-service', () => {
  it('sync upsert par estale_id (pas de doublon au 2e sync)', async () => {
    const { client } = createFakeDb()
    const fetchCondos = async () => ({ condos: [{ id: 'e1', name: 'DOMAINE DU BUC', reference: '00013' }] as any[] })
    await syncCopros(client, fetchCondos)
    await syncCopros(client, fetchCondos)
    const copros = await listerCopros(client)
    expect(copros).toHaveLength(1)
    expect(copros[0].reference).toBe('00013')
  })
})

describe('journal-service', () => {
  it('écrit et relit un événement', async () => {
    const { client } = createFakeDb()
    await syncCopros(client, async () => ({ condos: [{ id: 'e1', name: 'BUC', reference: '00013' }] as any[] }))
    const [copro] = await listerCopros(client)
    await logJournal(client, { copro_id: copro.id, type_evenement: 'note', contenu: 'Test journal' })
    const entries = await listerJournal(client, copro.id)
    expect(entries).toHaveLength(1)
    expect(entries[0].acteur).toBe('tom')
  })
})
