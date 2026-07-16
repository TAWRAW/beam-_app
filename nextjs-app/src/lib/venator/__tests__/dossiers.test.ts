// src/lib/venator/__tests__/dossiers.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerDossier, listerDossiers, detailDossier, majEtape, ajouterEtape, cloreDossier } from '../services/dossiers-service'

async function seedCopro(client: any) {
  const { data } = await client.from('venator_copros').insert({ estale_id: 'e1', reference: '00013', nom: 'BUC' }).select().single()
  return data
}

describe('dossiers-service', () => {
  it('crée un sinistre avec les 8 étapes du gabarit + entrée journal', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier, etapes } = await creerDossier(client, { copro_id: copro.id, type: 'sinistre', titre: 'DDE toiture', priorite: 1 })
    expect(dossier.statut).toBe('ouvert')
    expect(etapes).toHaveLength(8)
    expect(etapes[0].titre).toBe('Déclaration assureur')
    const { data: journal } = await client.from('venator_journal').select('*').eq('dossier_id', dossier.id)
    expect(journal).toHaveLength(1)
  })
  it('filtre par type et statut', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    await creerDossier(client, { copro_id: copro.id, type: 'sinistre', titre: 'A', priorite: 2 })
    await creerDossier(client, { copro_id: copro.id, type: 'mutation', titre: 'B', priorite: 2 })
    expect(await listerDossiers(client, { type: 'sinistre' })).toHaveLength(1)
    expect(await listerDossiers(client, { copro_id: copro.id })).toHaveLength(2)
  })
  it('étape fait ⇒ done_at + journal ; clore ⇒ closed_at', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier, etapes } = await creerDossier(client, { copro_id: copro.id, type: 'vie_copro', titre: 'Voisinage', priorite: 3 })
    const etape = await majEtape(client, etapes[0].id, { statut: 'fait' })
    expect(etape.done_at).toBeTruthy()
    const ajout = await ajouterEtape(client, dossier.id, 'Étape custom')
    expect(ajout.ordre).toBe(6)
    const clos = await cloreDossier(client, dossier.id)
    expect(clos.statut).toBe('clos')
    expect(clos.closed_at).toBeTruthy()
  })
  it('detail inexistant ⇒ VenatorError not_found', async () => {
    const { client } = createFakeDb()
    await expect(detailDossier(client, '00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({ code: 'not_found' })
  })
})
