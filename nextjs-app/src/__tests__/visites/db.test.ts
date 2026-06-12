// Tests de la couche IndexedDB des visites (src/lib/visites/db.ts).
// Cible la garantie ANTI-PERTE de photos + les outils de réparation
// (diagnostic des doublons, cleanup, reset des drafts en erreur).
//
// On simule IndexedDB avec fake-indexeddb. db.ts met en cache sa connexion
// dans un singleton module (dbPromise), donc on réinitialise le module ET le
// global indexedDB avant chaque test pour repartir d'une base vierge.

import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, it, expect, vi } from 'vitest'

type DbModule = typeof import('@/lib/visites/db')
let db: DbModule

beforeEach(async () => {
  // Base fraîche + ré-évaluation du module (reset du singleton dbPromise).
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
  db = await import('@/lib/visites/db')
})

function jpeg(content = 'fake-bytes') {
  return new Blob([content], { type: 'image/jpeg' })
}

describe('addPhotoDraft — garantie anti-perte', () => {
  it('persiste le blob IMMÉDIATEMENT, statut pending, non encore synchronisé', async () => {
    const visit = await db.addVisitDraft('condo-1', {} as never)
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'fissure',
    } as never)

    const draft = await db.addPhotoDraft(comment.localId, jpeg(), 'photo.jpg')

    // Retour immédiat correctement formé
    expect(draft.localId).toBeTruthy()
    expect(draft.estaleFileId).toBeNull()
    expect(draft.syncStatus).toBe('pending')
    expect(draft.mimeType).toBe('image/jpeg')

    // Et surtout : réellement écrit dans IndexedDB (relecture indépendante)
    const reloaded = await db.getPhotosForComment(comment.localId)
    expect(reloaded).toHaveLength(1)
    expect(reloaded[0]!.filename).toBe('photo.jpg')
    expect(reloaded[0]!.blob.size).toBeGreaterThan(0)
  })

  it('conserve plusieurs photos pour la même ligne sans en écraser', async () => {
    const visit = await db.addVisitDraft('condo-1', {} as never)
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'ROOF',
      component: 'OTHER',
      content: 'x',
    } as never)

    await db.addPhotoDraft(comment.localId, jpeg('a'), 'a.jpg')
    await db.addPhotoDraft(comment.localId, jpeg('b'), 'b.jpg')
    await db.addPhotoDraft(comment.localId, jpeg('c'), 'c.jpg')

    const photos = await db.getPhotosForComment(comment.localId)
    expect(photos.map((p) => p.filename).sort()).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
  })
})

describe('getVisiteDiagnostic — détection des doublons', () => {
  it('repère deux PhotoDraft pour le même estaleFileId', async () => {
    const visit = await db.addVisitDraft('condo-1', {} as never)
    await db.updateVisitDraft(visit.localId, {
      estaleVisitId: 'V1',
      syncStatus: 'synced',
    })
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'x',
    } as never)
    await db.updateCommentDraft(comment.localId, {
      estaleCommentId: 'C1',
      syncStatus: 'synced',
    })

    const p1 = await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')
    const p2 = await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')
    // Doublon : même fichier Estale poussé deux fois (bug race condition pré-fix)
    await db.updatePhotoDraft(p1.localId, { estaleFileId: 'F1', syncStatus: 'synced' })
    await db.updatePhotoDraft(p2.localId, { estaleFileId: 'F1', syncStatus: 'synced' })

    const diag = await db.getVisiteDiagnostic('V1')
    expect(Object.keys(diag.duplicatePhotosByEstaleFileId)).toContain('F1')
    expect(diag.duplicatePhotosByEstaleFileId['F1']).toHaveLength(2)
  })

  it('ne signale pas de doublon quand les estaleFileId diffèrent', async () => {
    const visit = await db.addVisitDraft('condo-1', {} as never)
    await db.updateVisitDraft(visit.localId, { estaleVisitId: 'V1', syncStatus: 'synced' })
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'x',
    } as never)
    await db.updateCommentDraft(comment.localId, { estaleCommentId: 'C1', syncStatus: 'synced' })

    const p1 = await db.addPhotoDraft(comment.localId, jpeg(), 'a.jpg')
    const p2 = await db.addPhotoDraft(comment.localId, jpeg(), 'b.jpg')
    await db.updatePhotoDraft(p1.localId, { estaleFileId: 'F1', syncStatus: 'synced' })
    await db.updatePhotoDraft(p2.localId, { estaleFileId: 'F2', syncStatus: 'synced' })

    const diag = await db.getVisiteDiagnostic('V1')
    expect(Object.keys(diag.duplicatePhotosByEstaleFileId)).toHaveLength(0)
  })
})

describe('cleanupVisitDuplicates — réparation', () => {
  it('supprime la photo en double (garde la plus ancienne), pas l\'unique', async () => {
    const visit = await db.addVisitDraft('condo-1', {} as never)
    await db.updateVisitDraft(visit.localId, { estaleVisitId: 'V1', syncStatus: 'synced' })
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'x',
    } as never)
    await db.updateCommentDraft(comment.localId, { estaleCommentId: 'C1', syncStatus: 'synced' })

    const oldP = await db.addPhotoDraft(comment.localId, jpeg('old'), 'a.jpg')
    const newP = await db.addPhotoDraft(comment.localId, jpeg('new'), 'a.jpg')
    await db.updatePhotoDraft(oldP.localId, {
      estaleFileId: 'F1',
      syncStatus: 'synced',
      capturedAt: '2020-01-01T00:00:00.000Z',
    })
    await db.updatePhotoDraft(newP.localId, {
      estaleFileId: 'F1',
      syncStatus: 'synced',
      capturedAt: '2025-01-01T00:00:00.000Z',
    })

    const res = await db.cleanupVisitDuplicates('V1')
    expect(res.removedPhotos).toBe(1)

    const remaining = await db.getPhotosForComment(comment.localId)
    expect(remaining).toHaveLength(1)
    // La plus ancienne est conservée
    expect(remaining[0]!.localId).toBe(oldP.localId)
  })
})

describe('resetFailedSyncForVisit — réveil des drafts bloqués', () => {
  it('repasse une photo en erreur à pending, sans toucher aux synced', async () => {
    const visit = await db.addVisitDraft('condo-1', {} as never)
    await db.updateVisitDraft(visit.localId, { estaleVisitId: 'V1', syncStatus: 'synced' })
    const comment = await db.addCommentDraft(visit.localId, {
      place: 'CELLARS',
      component: 'WALL',
      content: 'x',
    } as never)
    await db.updateCommentDraft(comment.localId, { estaleCommentId: 'C1', syncStatus: 'synced' })

    const stuck = await db.addPhotoDraft(comment.localId, jpeg(), 'stuck.jpg')
    const done = await db.addPhotoDraft(comment.localId, jpeg(), 'done.jpg')
    await db.updatePhotoDraft(stuck.localId, {
      syncStatus: 'error',
      syncAttempts: 10,
      syncError: 'HTTP 500',
    })
    await db.updatePhotoDraft(done.localId, { estaleFileId: 'F2', syncStatus: 'synced' })

    const res = await db.resetFailedSyncForVisit('V1')
    expect(res.resetPhotos).toBe(1)

    const photos = await db.getPhotosForComment(comment.localId)
    const reStuck = photos.find((p) => p.localId === stuck.localId)!
    const reDone = photos.find((p) => p.localId === done.localId)!
    expect(reStuck.syncStatus).toBe('pending')
    expect(reStuck.syncAttempts).toBe(0)
    // La photo déjà synced n'est pas réinitialisée
    expect(reDone.syncStatus).toBe('synced')
    expect(reDone.estaleFileId).toBe('F2')
  })
})
