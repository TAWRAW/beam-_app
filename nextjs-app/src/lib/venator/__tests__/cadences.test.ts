// src/lib/venator/__tests__/cadences.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { lireCadences, remplacerCadence } from '../services/cadences-service'
import { DEFAULT_CADENCES } from '../relances'

async function seedCadences(client: any) {
  await client.from('venator_cadence_profils').insert({ profil: 'urgent', seuils_heures: [...DEFAULT_CADENCES.urgent] })
  await client.from('venator_cadence_profils').insert({ profil: 'normal', seuils_heures: [...DEFAULT_CADENCES.normal] })
}

describe('cadences-service', () => {
  it('lit les deux profils seedés', async () => {
    const { client } = createFakeDb()
    await seedCadences(client)
    const cadences = await lireCadences(client)
    expect(cadences.urgent).toEqual([48, 24, 12])
    expect(cadences.normal).toEqual([96])
  })

  it('table absente ⇒ retombe sur DEFAULT_CADENCES', async () => {
    const { client } = createFakeDb()
    // Table jamais seedée : le fake-db la traite comme vide, pas comme "absente"
    // (il n'y a pas d'erreur PGRST205 simulable) — mais lireCadences doit rendre
    // les défauts dans les deux cas : table absente OU table vide (migration pas
    // encore seedée à la main).
    const cadences = await lireCadences(client)
    expect(cadences).toEqual(DEFAULT_CADENCES)
  })

  it('remplace un seul profil, laisse l’autre inchangé', async () => {
    const { client } = createFakeDb()
    await seedCadences(client)
    const nouveaux = await remplacerCadence(client, 'urgent', [72, 36])
    expect(nouveaux).toEqual([72, 36])

    const cadences = await lireCadences(client)
    expect(cadences.urgent).toEqual([72, 36])
    expect(cadences.normal).toEqual([96])
  })
})
