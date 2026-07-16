// src/lib/venator/__tests__/checklist.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerChecklist, etatChecklist, cocherItem } from '../services/checklist-service'

describe('checklist-service', () => {
  it('instancie 10 items, progression 0 → 10 %', async () => {
    const { client } = createFakeDb()
    const { data: copro } = await client.from('venator_copros').insert({ estale_id: 'e1', reference: '00013', nom: 'BUC' }).select().single()
    await creerChecklist(client, copro.id)
    let etat = await etatChecklist(client, copro.id)
    expect(etat!.items).toHaveLength(10)
    expect(etat!.progression).toBe(0)
    await cocherItem(client, etat!.items[0].id, true)
    etat = await etatChecklist(client, copro.id)
    expect(etat!.progression).toBe(10)
    expect(etat!.items[0].fait_at).toBeTruthy()
  })
  it('doublon ⇒ VenatorError conflict', async () => {
    const { client } = createFakeDb()
    const { data: copro } = await client.from('venator_copros').insert({ estale_id: 'e2', reference: '00014', nom: 'X' }).select().single()
    await creerChecklist(client, copro.id)
    await expect(creerChecklist(client, copro.id)).rejects.toMatchObject({ code: 'conflict' })
  })
})
