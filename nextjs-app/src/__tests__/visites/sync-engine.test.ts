// Tests du moteur de synchronisation des visites (src/lib/visites/sync-engine.ts).
//
// Couvre les garde-fous qui ont causé les pertes/doublons de photos en prod :
//  - ordre topologique d'envoi (visite → ligne → photo)
//  - mutex anti-doublon (flushAll concurrents)
//  - photo prise AVANT finalisation de la ligne → conservée, jamais perdue
//  - retry après erreur réseau + auto-healing des drafts bloqués
//
// IndexedDB est simulé par fake-indexeddb ; fetch est mocké pour jouer le rôle
// des routes API beam-app (/api/estale/visits...).

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

/** Réponse fetch minimaliste compatible avec le code (ok/status/json/text). */
function resp(body: unknown, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

/**
 * Installe un mock de fetch qui route comme les vraies API beam-app et
 * enregistre chaque appel. `failFiles` permet de simuler une panne réseau sur
 * l'upload photo pour les N premiers POST /files.
 */
function installFetch({ failFiles = 0 } = {}) {
  const calls: Array<{ url: string; method: string }> = []
  let filesFailures = failFiles
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    calls.push({ url, method })

    if (url === '/api/estale/visits' && method === 'POST') {
      return resp({ visit: { id: 'V1' } })
    }
    if (/\/comments$/.test(url) && method === 'POST') {
      return resp({ comment: { id: 'C1' } })
    }
    if (/\/files$/.test(url) && method === 'POST') {
      if (filesFailures > 0) {
        filesFailures--
        return resp({ error: 'boom' }, { ok: false, status: 500 })
      }
      return resp({ file: { id: 'F1' } })
    }
    return resp({}, { ok: false, status: 404 })
  })
  globalThis.fetch = fetchMock as typeof fetch
  return { calls, fetchMock }
}

const postsTo = (calls: Array<{ url: string; method: string }>, re: RegExp) =>
  calls.filter((c) => c.method === 'POST' && re.test(c.url))

describe('flushAll — chemin nominal', () => {
  it('pousse visite → ligne → photo dans l\'ordre et renseigne les ids Estale', async () => {
    const { calls } = installFetch()

    const visit = await db.addVisitDraft('condo-1', { category: 'BUILDING_VISIT' } as never)
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'fissure',
    } as never)
    await db.addPhotoDraft(comment.localId, jpeg(), 'photo.jpg')

    await engine.flushAll()

    // ids remontés dans IndexedDB
    const [v] = await db.getAllVisitDrafts()
    expect(v!.estaleVisitId).toBe('V1')
    expect(v!.syncStatus).toBe('synced')

    const [c] = await db.getCommentsForVisit(visit.localId)
    expect(c!.estaleCommentId).toBe('C1')
    expect(c!.syncStatus).toBe('synced')

    const [p] = await db.getPhotosForComment(comment.localId)
    expect(p!.estaleFileId).toBe('F1')
    expect(p!.syncStatus).toBe('synced')

    // Ordre topologique respecté
    const order = calls.filter((c2) => c2.method === 'POST').map((c2) => c2.url)
    const iVisit = order.findIndex((u) => u === '/api/estale/visits')
    const iComment = order.findIndex((u) => /\/comments$/.test(u))
    const iFile = order.findIndex((u) => /\/files$/.test(u))
    expect(iVisit).toBeGreaterThanOrEqual(0)
    expect(iVisit).toBeLessThan(iComment)
    expect(iComment).toBeLessThan(iFile)
  })
})

describe('Photo prise avant finalisation de la ligne — JAMAIS perdue', () => {
  it('garde la photo en local quand la ligne est incomplète, puis l\'envoie une fois finalisée', async () => {
    const { calls } = installFetch()

    // Simule la page "nouvelle ligne" : la photo crée un commentDraft VIDE
    // (place/component non encore renseignés) pour persister la photo de suite.
    const visit = await db.addVisitDraft('condo-1', {} as never)
    const draft = await db.addCommentDraft(visit.localId, {
      place: '',
      component: '',
      content: '',
    } as never)
    await db.addPhotoDraft(draft.localId, jpeg(), 'avant-submit.jpg')

    // 1er flush : la visite part, mais la ligne incomplète est ignorée
    await engine.flushAll()

    expect(postsTo(calls, /\/comments$/)).toHaveLength(0)
    expect(postsTo(calls, /\/files$/)).toHaveLength(0)

    // La photo est TOUJOURS là, intacte
    const photosAfter1 = await db.getPhotosForComment(draft.localId)
    expect(photosAfter1).toHaveLength(1)
    expect(photosAfter1[0]!.estaleFileId).toBeNull()
    expect(photosAfter1[0]!.blob.size).toBeGreaterThan(0)

    // L'utilisateur finalise la ligne (submit) → place/component renseignés
    await db.updateCommentDraft(draft.localId, {
      payload: { place: 'CELLARS', component: 'WALL', content: 'ok' },
      syncStatus: 'pending',
      syncAttempts: 0,
    })

    // 2e flush : la ligne puis la photo partent
    await engine.flushAll()

    const [c] = await db.getCommentsForVisit(visit.localId)
    expect(c!.estaleCommentId).toBe('C1')
    const [p] = await db.getPhotosForComment(draft.localId)
    expect(p!.estaleFileId).toBe('F1')
    expect(p!.syncStatus).toBe('synced')
  })
})

describe('Mutex anti-doublon', () => {
  it('deux flushAll concurrents ne créent pas de doublon de visite', async () => {
    const { calls } = installFetch()
    await db.addVisitDraft('condo-1', {} as never)

    // Lancés sans await intermédiaire → le 2e doit court-circuiter (isFlushing)
    await Promise.all([engine.flushAll(), engine.flushAll()])

    expect(postsTo(calls, /^\/api\/estale\/visits$/)).toHaveLength(1)
  })

  it('une ligne déjà synchronisée n\'est pas repoussée', async () => {
    const { calls } = installFetch()

    const visit = await db.addVisitDraft('condo-1', {} as never)
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'x',
    } as never)
    await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')

    await engine.flushAll()
    const postsAfterFirst = postsTo(calls, /\/comments$/).length

    // Re-flush : tout est déjà synced → aucun nouveau POST de ligne ni de photo
    await engine.flushAll()
    expect(postsTo(calls, /\/comments$/)).toHaveLength(postsAfterFirst)
    expect(postsTo(calls, /\/files$/)).toHaveLength(1)
  })
})

describe('Résilience réseau', () => {
  it('réessaie une photo après un échec et finit par l\'envoyer', async () => {
    const { calls } = installFetch({ failFiles: 1 }) // 1er upload photo → 500

    const visit = await db.addVisitDraft('condo-1', {} as never)
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'x',
    } as never)
    const photo = await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')

    // 1er flush : visite + ligne OK, photo échoue (500)
    await engine.flushAll()
    let [p] = await db.getPhotosForComment(comment.localId)
    expect(p!.syncStatus).toBe('error')
    expect(p!.estaleFileId).toBeNull()
    expect(p!.syncError).toContain('500')

    // 2e flush : la photo repart et passe
    await engine.flushAll()
    ;[p] = await db.getPhotosForComment(comment.localId)
    expect(p!.syncStatus).toBe('synced')
    expect(p!.estaleFileId).toBe('F1')
    expect(postsTo(calls, /\/files$/)).toHaveLength(2) // 1 échec + 1 succès
    void photo
  })

  it('auto-healing : une photo bloquée (max essais, vieille) est réveillée puis envoyée', async () => {
    const { calls } = installFetch()

    const visit = await db.addVisitDraft('condo-1', {} as never)
    await db.updateVisitDraft(visit.localId, { estaleVisitId: 'V1', syncStatus: 'synced' })
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'x',
    } as never)
    await db.updateCommentDraft(comment.localId, {
      estaleCommentId: 'C1',
      syncStatus: 'synced',
    })
    const photo = await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')
    // Photo coincée : 10 essais atteints, dernier essai il y a 10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    await db.updatePhotoDraft(photo.localId, {
      syncStatus: 'error',
      syncAttempts: 10,
      lastSyncAttempt: tenMinAgo,
      syncError: 'HTTP 500',
    })

    await engine.flushAll()

    const [p] = await db.getPhotosForComment(comment.localId)
    expect(p!.syncStatus).toBe('synced')
    expect(p!.estaleFileId).toBe('F1')
    expect(postsTo(calls, /\/files$/)).toHaveLength(1)
  })
})
