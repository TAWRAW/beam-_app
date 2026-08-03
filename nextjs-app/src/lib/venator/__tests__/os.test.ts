import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerTicket, listerTickets } from '../services/tickets-service'
import { emettreOS, listerOsParTicket } from '../services/os-service'
async function seed(c:any){const{data}=await c.from('venator_copros').insert({estale_id:'e1',reference:'00013',nom:'BUC'}).select().single();return data}
describe('os-service',()=>{
  it('émission OK : os envoyé, ticket os_envoye, journal os_emis',async()=>{
    const{client}=createFakeDb();const copro=await seed(client)
    const t=await creerTicket(client,{copro_id:copro.id,type:'intervention',titre:'Fuite'})
    const deps={emitEstaleOrder:async()=>({taskID:'k1',eventID:'ev1'})}
    const os=await emettreOS(client,deps,{ticket_id:t.id,prestataire_contact_id:'c1',prestataire_nom:'Plomberie X',objet:'Fuite',description:'<p>Intervenir</p>',urgent:true})
    expect(os.statut).toBe('envoye');expect(os.estale_event_id).toBe('ev1')
    const[t2]=await listerTickets(client,{copro_id:copro.id});expect(t2.statut).toBe('os_envoye')
    const{data:j}=await client.from('venator_journal').select('*').eq('type_evenement','os_emis');expect(j.length).toBe(1)
  })
  it('émission KO : os erreur, ticket inchangé, journal os_erreur',async()=>{
    const{client}=createFakeDb();const copro=await seed(client)
    const t=await creerTicket(client,{copro_id:copro.id,type:'intervention',titre:'Fuite'})
    const deps={emitEstaleOrder:async()=>{throw new Error('estale down')}}
    await expect(emettreOS(client,deps,{ticket_id:t.id,prestataire_contact_id:'c1',prestataire_nom:'X',objet:'o',description:'<p>x</p>'})).rejects.toMatchObject({code:'invalid'})
    const list=await listerOsParTicket(client,t.id);expect(list[0].statut).toBe('erreur')
    const[t2]=await listerTickets(client,{copro_id:copro.id});expect(t2.statut).toBe('nouveau')
  })
})
