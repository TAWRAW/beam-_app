// Tests de résilience du moteur de sync — corrige le bug des photos figées
// en statut 'syncing' (envoi interrompu en plein vol sur mobile) qui restaient
// invisibles et jamais retentées.
//
// Trois comportements visés :
//  1. un upload qui JETTE doit finir en 'error' (pas figé en 'syncing')
//  2. getSyncStats doit compter les 'syncing' (badge honnête)
//  3. l'auto-réparation doit réveiller un 'syncing' resté bloqué trop longtemps,
//     SANS interrompre un envoi réellement en cours (syncing récent).

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

function jpeg() {
  return new Blob(['fake-bytes'], { type: 'image/jpeg' })
}
function resp(body: unknown, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as Response
}

/** Visite + ligne déjà synchronisées sur Estale, prêtes à recevoir une photo. */
async function seedSyncedComment() {
  const visit = await db.addVisitDraft('condo-1', {} as never)
  await db.updateVisitDraft(visit.localId, { estaleVisitId: 'V1', syncStatus: 'synced' })
  const comment = await db.addCommentDraft(visit.localId, {
    place: 'CELLARS',
    component: 'WALL',
    content: 'x',
  } as never)
  await db.updateCommentDraft(comment.localId, { estaleCommentId: 'C1', syncStatus: 'synced' })
  return comment
}

describe('Cause racine : upload qui jette', () => {
  it('marque la photo en erreur (pas figée en syncing) quand fetch lève une exception', async () => {
    const comment = await seedSyncedComment()
    await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')

    // fetch qui JETTE sur l'upload de fichier (ex: connexion coupée, body trop gros)
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (/\/files$/.test(String(input))) throw new TypeError('Load failed')
      return resp({})
    })

    await engine.flushAll()

    const [p] = await db.getPhotosForComment(comment.localId)
    expect(p!.syncStatus).toBe('error')
    expect(p!.syncStatus).not.toBe('syncing')
  })
})

describe('Visibilité : comptage des syncing', () => {
  it('compte une photo figée en syncing dans pendingCount', async () => {
    const comment = await seedSyncedComment()
    const photo = await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')
    await db.updatePhotoDraft(photo.localId, { syncStatus: 'syncing' })

    const stats = await engine.snapshotStats()
    expect(stats.pendingCount).toBe(1)
  })
})

describe('Récupération : auto-réveil des syncing bloqués', () => {
  it('réveille une photo figée en syncing depuis longtemps et la renvoie', async () => {
    const comment = await seedSyncedComment()
    const photo = await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    await db.updatePhotoDraft(photo.localId, {
      syncStatus: 'syncing',
      lastSyncAttempt: tenMinAgo,
      syncAttempts: 1,
    })

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (/\/files$/.test(String(input))) return resp({ file: { id: 'F1' } })
      return resp({})
    })

    await engine.flushAll()

    const [p] = await db.getPhotosForComment(comment.localId)
    expect(p!.syncStatus).toBe('synced')
    expect(p!.estaleFileId).toBe('F1')
  })

  it('NE touche PAS une photo en syncing récente (envoi réellement en cours)', async () => {
    const comment = await seedSyncedComment()
    const photo = await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')
    const tenSecAgo = new Date(Date.now() - 10 * 1000).toISOString()
    await db.updatePhotoDraft(photo.localId, {
      syncStatus: 'syncing',
      lastSyncAttempt: tenSecAgo,
      syncAttempts: 1,
    })

    const calls: string[] = []
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      calls.push(String(input))
      return resp({ file: { id: 'F1' } })
    })

    await engine.flushAll()

    const [p] = await db.getPhotosForComment(comment.localId)
    // Toujours en syncing (pas réveillée), et aucun nouvel upload tenté
    expect(p!.syncStatus).toBe('syncing')
    expect(calls.filter((u) => /\/files$/.test(u))).toHaveLength(0)
  })
})
