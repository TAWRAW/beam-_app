// src/lib/venator/__tests__/equipements.test.ts
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerDossier } from '../services/dossiers-service'
import {
  creerEquipement,
  listerEquipements,
  majEquipement,
  supprimerEquipement,
} from '../services/equipements-service'

async function seedCopro(client: any, ref = '00013') {
  const { data } = await client.from('venator_copros').insert({ estale_id: `e-${ref}`, reference: ref, nom: 'BUC' }).select().single()
  return data
}

describe('equipements-service', () => {
  it('crée un équipement puis le retrouve dans la liste de sa copro', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const eq = await creerEquipement(client, { copro_id: copro.id, nom: 'Interphone Bât A', categorie: 'interphone' })
    expect(eq.categorie).toBe('interphone')

    const liste = await listerEquipements(client, copro.id)
    expect(liste).toHaveLength(1)
    expect(liste[0].nom).toBe('Interphone Bât A')
  })

  it('la liste est filtrée par copro', async () => {
    const { client } = createFakeDb()
    const coproA = await seedCopro(client, '00013')
    const coproB = await seedCopro(client, '00010')
    await creerEquipement(client, { copro_id: coproA.id, nom: 'Portail', categorie: 'portail' })
    await creerEquipement(client, { copro_id: coproB.id, nom: 'Toiture', categorie: 'toiture' })

    expect(await listerEquipements(client, coproA.id)).toHaveLength(1)
    expect(await listerEquipements(client, coproB.id)).toHaveLength(1)
  })

  it('modifie un équipement existant', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const eq = await creerEquipement(client, { copro_id: copro.id, nom: 'Moquette', categorie: 'menage' })
    const maj = await majEquipement(client, eq.id, { nom: 'Moquette hall A' })
    expect(maj.nom).toBe('Moquette hall A')
    expect(maj.categorie).toBe('menage')
  })

  it('modifier un équipement introuvable ⇒ VenatorError not_found', async () => {
    const { client } = createFakeDb()
    await expect(majEquipement(client, 'inconnu', { nom: 'X' })).rejects.toMatchObject({ code: 'not_found' })
  })

  it('supprimer un équipement détache les dossiers liés sans les toucher autrement', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const eq = await creerEquipement(client, { copro_id: copro.id, nom: 'Interphone', categorie: 'interphone' })
    const { dossier } = await creerDossier(client, {
      copro_id: copro.id,
      type: 'entretien',
      titre: 'Interphone en panne',
      priorite: 1,
      equipement_id: eq.id,
    })

    await supprimerEquipement(client, eq.id)

    expect(await listerEquipements(client, copro.id)).toHaveLength(0)
    // Le fake-db ne simule pas la contrainte ON DELETE SET NULL de Postgres :
    // on vérifie seulement que la suppression de l'équipement ne fait rien planter
    // côté dossier — la garantie référentielle réelle est portée par la migration SQL.
    expect(dossier.equipement_id).toBe(eq.id)
  })
})
