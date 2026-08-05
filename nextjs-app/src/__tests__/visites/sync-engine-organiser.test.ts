// L'organisateur d'un brouillon de visite est figé au moment de la création, dans
// IndexedDB. S'il devient invalide — identifiant de collaborateur périmé, capture
// d'une session précédente — Estale refuse la création avec
// « path: createVisit.input.organiserID », le brouillon réessaie jusqu'à épuisement
// et TOUTES ses photos restent bloquées avec lui. C'est ce qui a immobilisé une
// visite entière (constaté le 04/08/2026 : 100 échecs de lignes sur une visite
// qui n'existait pas dans Estale).
//
// Le moteur doit donc estampiller l'organisateur au moment de l'envoi, pas à la
// saisie : c'est la seule valeur dont on sait qu'elle est valide maintenant.

import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'

type DbModule = typeof import('@/lib/visites/db')
type EngineModule = typeof import('@/lib/visites/sync-engine')

let db: DbModule
let engine: EngineModule

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
  db = await import('@/lib/visites/db')
  engine = await import('@/lib/visites/sync-engine')
})

afterEach(() => {
  vi.restoreAllMocks()
})

function resp(body: unknown, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as Response
}

const ENTETE = {
  category: 'CONTROLE',
  date: '2026-08-07T18:00:00.000Z',
  period: 'PM',
  object: 'Visite copro',
  condoID: 'condo-1',
  organiserID: 'ORGANISATEUR-PERIME',
  collaboratorIDs: [],
  ownerIDs: [],
}

describe('sync-engine — organisateur estampillé à l’envoi', () => {
  it('remplace un organiserID périmé par le collaborateur courant', async () => {
    await db.addVisitDraft('condo-1', { ...ENTETE } as never)

    const envois: Record<string, unknown>[] = []
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/estale/me')) {
        return resp({ collaborator: { id: 'ORGANISATEUR-COURANT', fullname: 'Tom' } })
      }
      if (url.endsWith('/api/estale/visits')) {
        envois.push(JSON.parse(String(init?.body)))
        return resp({ visit: { id: 'EV-1' } })
      }
      return resp({}, { ok: false, status: 404 })
    }) as typeof fetch

    await engine.flushAll()

    expect(envois).toHaveLength(1)
    expect(envois[0].organiserID).toBe('ORGANISATEUR-COURANT')
  })

  it('retombe sur la valeur enregistrée si le collaborateur est injoignable', async () => {
    // Hors-ligne ou Estale muet : on tente quand même avec ce qu'on a, plutôt que
    // de bloquer une visite dont l'organisateur était peut-être valide.
    await db.addVisitDraft('condo-1', { ...ENTETE, organiserID: 'ORG-ENREGISTRE' } as never)

    const envois: Record<string, unknown>[] = []
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/estale/me')) return resp({}, { ok: false, status: 503 })
      if (url.endsWith('/api/estale/visits')) {
        envois.push(JSON.parse(String(init?.body)))
        return resp({ visit: { id: 'EV-1' } })
      }
      return resp({}, { ok: false, status: 404 })
    }) as typeof fetch

    await engine.flushAll()

    expect(envois).toHaveLength(1)
    expect(envois[0].organiserID).toBe('ORG-ENREGISTRE')
  })
})
