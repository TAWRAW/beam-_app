import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerDossier, supprimerDossier, detailDossier } from '../services/dossiers-service'
import { creerTicket, supprimerTicket, listerTickets } from '../services/tickets-service'
import { ajouterAuFil, listerFil } from '../services/fil-service'

async function seedCopro(c:any){ const {data}=await c.from('venator_copros').insert({estale_id:'e1',reference:'00013',nom:'BUC'}).select().single(); return data }

describe('suppression', () => {
  it('supprimer un dossier : purge le fil + journalise dossier_supprime, dossier introuvable ensuite', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type:'sinistre', titre:'X', priorite:2 })
    await ajouterAuFil(client, { parent_type:'dossier', parent_id: dossier.id, direction:'note', source:'manuel', contenu:'note' })
    await supprimerDossier(client, dossier.id)
    expect(await listerFil(client, 'dossier', dossier.id)).toHaveLength(0)
    const { data: j } = await client.from('venator_journal').select('*').eq('type_evenement','dossier_supprime')
    expect(j.length).toBe(1)
    await expect(detailDossier(client, dossier.id)).rejects.toMatchObject({ code:'not_found' })
  })
  it('supprimer un ticket : purge son fil + ticket retiré de la liste', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const t = await creerTicket(client, { copro_id: copro.id, type:'intervention', titre:'Fuite' })
    await ajouterAuFil(client, { parent_type:'ticket', parent_id: t.id, direction:'note', source:'manuel', contenu:'x' })
    await supprimerTicket(client, t.id)
    expect(await listerFil(client, 'ticket', t.id)).toHaveLength(0)
    expect(await listerTickets(client, { copro_id: copro.id })).toHaveLength(0)
  })
})
