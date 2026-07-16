import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'

describe('fake-db', () => {
  it('insert + select eq + update', async () => {
    const { client } = createFakeDb()
    const { data: inserted } = await client.from('venator_copros').insert({ estale_id: 'e1', reference: '00013', nom: 'BUC' }).select().single()
    expect(inserted.id).toBeTruthy()
    const { data: rows } = await client.from('venator_copros').select('*').eq('estale_id', 'e1')
    expect(rows).toHaveLength(1)
    await client.from('venator_copros').update({ nom: 'DOMAINE DU BUC' }).eq('id', inserted.id).select().single()
    const { data: one } = await client.from('venator_copros').select('*').eq('id', inserted.id).maybeSingle()
    expect(one.nom).toBe('DOMAINE DU BUC')
  })
})
