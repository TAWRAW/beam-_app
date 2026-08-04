// src/lib/venator/__tests__/dossiers.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerDossier, listerDossiers, detailDossier, majEtape, ajouterEtape, cloreDossier, majStatutDossier, majVoteStatut } from '../services/dossiers-service'
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
  it('l’état de vote se pose sur n’importe quel type de dossier', async () => {
    // Un contrat se vote aussi bien qu'un marché de travaux : l'état de vote
    // n'est plus réservé aux travaux, contrairement au booléen qu'il remplace.
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type: 'contrat', titre: 'Assurance', priorite: 2 })
    expect(dossier.vote_statut).toBe('sans_objet')

    const aVoter = await majVoteStatut(client, dossier.id, 'a_voter')
    expect(aVoter.vote_statut).toBe('a_voter')
  })

  it('un dossier reporté reste à voter, sans manipulation', async () => {
    // Le report est l'intérêt du modèle : la vue « Prochaine AG » se vide seule
    // après l'assemblée, mais un sujet reporté doit y revenir de lui-même.
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type: 'travaux', titre: 'Toiture', priorite: 2 })
    await majVoteStatut(client, dossier.id, 'a_voter')
    await majVoteStatut(client, dossier.id, 'reporte')

    const aVoter = await listerDossiers(client, { copro_id: copro.id, prochaine_ag: true })
    expect(aVoter.map((d) => d.id)).toContain(dossier.id)
  })

  it('la vue « Prochaine AG » ne retient que les dossiers à voter', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier: aVoter } = await creerDossier(client, { copro_id: copro.id, type: 'travaux', titre: 'Ravalement', priorite: 2 })
    const { dossier: vote } = await creerDossier(client, { copro_id: copro.id, type: 'travaux', titre: 'Portail', priorite: 2 })
    const { dossier: neutre } = await creerDossier(client, { copro_id: copro.id, type: 'sinistre', titre: 'Dégât des eaux', priorite: 2 })
    await majVoteStatut(client, aVoter.id, 'a_voter')
    await majVoteStatut(client, vote.id, 'vote')

    const liste = await listerDossiers(client, { copro_id: copro.id, prochaine_ag: true })
    const ids = liste.map((d) => d.id)
    expect(ids).toContain(aVoter.id)
    expect(ids).not.toContain(vote.id)
    expect(ids).not.toContain(neutre.id)
  })

  it('chaque changement d’état de vote est journalisé', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type: 'travaux', titre: 'Ravalement', priorite: 2 })

    const vote = await majVoteStatut(client, dossier.id, 'a_voter')
    expect(vote.vote_statut).toBe('a_voter')
    const projet = await majVoteStatut(client, dossier.id, 'sans_objet')
    expect(projet.vote_statut).toBe('sans_objet')

    const { data: journal } = await client.from('venator_journal').select('*').eq('dossier_id', dossier.id)
    // 1 création + 2 changements d'état
    expect(journal).toHaveLength(3)
    const votes = journal.filter((j: any) => j.type_evenement === 'vote_statut')
    expect(votes).toHaveLength(2)
    // Le journal doit dire l'état atteint : « inscrit à l'ordre du jour » ne se
    // relit pas dans six mois si l'entrée ne nomme pas le dossier concerné.
    expect(votes[0].contenu).toContain('Ravalement')
  })

  it('un dossier entretien persiste equipement_id/echeance et applique son gabarit', async () => {
    // Rien de spécifique à coder pour 'entretien' : le spread `...input` de
    // creerDossier porte déjà ces deux champs, comme pour n'importe quel type.
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { data: equipement } = await client
      .from('venator_equipements')
      .insert({ copro_id: copro.id, nom: 'Interphone Bât A', categorie: 'interphone' })
      .select()
      .single()
    await remplacerGabarit(client, 'entretien', [
      { titre: 'Signalement' },
      { titre: 'Devis / RDV' },
      { titre: 'Réalisation' },
      { titre: 'Clôture' },
    ])

    const { dossier, etapes } = await creerDossier(client, {
      copro_id: copro.id,
      type: 'entretien',
      titre: 'Interphone en panne',
      priorite: 1,
      equipement_id: equipement.id,
      echeance: '2026-08-15',
    })

    expect(dossier.equipement_id).toBe(equipement.id)
    expect(dossier.echeance).toBe('2026-08-15')
    expect(etapes.map((e) => e.titre)).toEqual(['Signalement', 'Devis / RDV', 'Réalisation', 'Clôture'])
  })

  it('un dossier sans equipement_id/echeance les porte à null (comme les autres types)', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type: 'sinistre', titre: 'DDE', priorite: 2 })
    expect(dossier.equipement_id).toBeNull()
    expect(dossier.echeance).toBeNull()
  })
})
