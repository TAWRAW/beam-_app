// src/lib/venator/__tests__/dossiers.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerDossier, listerDossiers, detailDossier, majEtape, ajouterEtape, cloreDossier, majStatutDossier, majVoteTravaux } from '../services/dossiers-service'
import { remplacerGabarit } from '../services/gabarits-service'

async function seedCopro(client: any) {
  const { data } = await client.from('venator_copros').insert({ estale_id: 'e1', reference: '00013', nom: 'BUC' }).select().single()
  return data
}

describe('dossiers-service', () => {
  it('crée un dossier SANS étape quand aucun gabarit n’est réglé', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier, etapes } = await creerDossier(client, { copro_id: copro.id, type: 'sinistre', titre: 'DDE toiture', priorite: 1 })
    expect(dossier.statut).toBe('ouvert')
    expect(etapes).toHaveLength(0)
    const { data: journal } = await client.from('venator_journal').select('*').eq('dossier_id', dossier.id)
    expect(journal).toHaveLength(1)
  })
  it('applique le gabarit réglé pour le type, et lui seul', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    await remplacerGabarit(client, 'sinistre', [
      { titre: 'Déclaration assureur', echeanceOffsetJours: 5 },
      { titre: 'Expertise' },
    ])
    const { etapes } = await creerDossier(client, { copro_id: copro.id, type: 'sinistre', titre: 'DDE', priorite: 1 })
    expect(etapes.map((e) => e.titre)).toEqual(['Déclaration assureur', 'Expertise'])
    // Un autre type n'hérite de rien.
    const autre = await creerDossier(client, { copro_id: copro.id, type: 'travaux', titre: 'Ravalement', priorite: 2 })
    expect(autre.etapes).toHaveLength(0)
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
    await remplacerGabarit(client, 'vie_copro', [{ titre: 'Signalement' }, { titre: 'Suivi' }])
    const { dossier, etapes } = await creerDossier(client, { copro_id: copro.id, type: 'vie_copro', titre: 'Voisinage', priorite: 3 })
    const etape = await majEtape(client, etapes[0].id, { statut: 'fait' })
    expect(etape.done_at).toBeTruthy()
    const ajout = await ajouterEtape(client, dossier.id, 'Étape custom')
    expect(ajout.ordre).toBe(3)
    const clos = await cloreDossier(client, dossier.id)
    expect(clos.statut).toBe('clos')
    expect(clos.closed_at).toBeTruthy()
  })
  it('detail inexistant ⇒ VenatorError not_found', async () => {
    const { client } = createFakeDb()
    await expect(detailDossier(client, '00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({ code: 'not_found' })
  })
  it('majStatutDossier change le statut sans clore', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type: 'travaux', titre: 'Ravalement', priorite: 2 })
    const maj = await majStatutDossier(client, dossier.id, 'en_cours')
    expect(maj.statut).toBe('en_cours')
    expect(maj.closed_at).toBeNull()
  })
  it('travaux : bascule projet ⇄ voté, journalisée dans les deux sens', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type: 'travaux', titre: 'Ravalement', priorite: 2 })
    expect(dossier.travaux_vote).toBe(false)

    const vote = await majVoteTravaux(client, dossier.id, true)
    expect(vote.travaux_vote).toBe(true)
    const projet = await majVoteTravaux(client, dossier.id, false)
    expect(projet.travaux_vote).toBe(false)

    const { data: journal } = await client.from('venator_journal').select('*').eq('dossier_id', dossier.id)
    // 1 création + 2 bascules
    expect(journal).toHaveLength(3)
    expect(journal.map((j: any) => j.type_evenement)).toContain('travaux_vote')
    expect(journal.map((j: any) => j.type_evenement)).toContain('travaux_projet')
  })
})
