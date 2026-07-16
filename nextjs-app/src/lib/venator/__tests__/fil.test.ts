import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { ajouterAuFil, listerFil } from '../services/fil-service'

const PARENT = { parent_type: 'dossier' as const, parent_id: '11111111-1111-1111-1111-111111111111' }

describe('fil-service', () => {
  it('ajoute une note et la relit dans l’ordre', async () => {
    const { client } = createFakeDb()
    await ajouterAuFil(client, { ...PARENT, direction: 'note', source: 'manuel', contenu: 'Premier message' })
    await ajouterAuFil(client, { ...PARENT, direction: 'note', source: 'manuel', contenu: 'Deuxième' })
    const fil = await listerFil(client, PARENT.parent_type, PARENT.parent_id)
    expect(fil.map(m => m.contenu)).toEqual(['Premier message', 'Deuxième'])
  })
  it('dédoublonne par gmail_message_id sans lever', async () => {
    const { client } = createFakeDb()
    const a = await ajouterAuFil(client, { ...PARENT, direction: 'entrant', source: 'gmail', contenu: 'Mail X', gmail_message_id: 'gm-1' })
    const b = await ajouterAuFil(client, { ...PARENT, direction: 'entrant', source: 'gmail', contenu: 'Mail X', gmail_message_id: 'gm-1' })
    expect(a.deduplicated).toBe(false)
    expect(b.deduplicated).toBe(true)
    expect(await listerFil(client, PARENT.parent_type, PARENT.parent_id)).toHaveLength(1)
  })
})
