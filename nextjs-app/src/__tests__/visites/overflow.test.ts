import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'

// Compression neutralisée (déterministe hors navigateur) : renvoie le blob tel quel.
vi.mock('@/lib/visites/image-compress', () => ({
  compressImage: async (b: Blob) => b,
}))

// Client Supabase navigateur mocké : uploadToSignedUrl succès.
vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        uploadToSignedUrl: vi.fn(async () => ({ data: { path: 'p' }, error: null })),
      }),
    },
  }),
}))

type DB = typeof import('@/lib/visites/db')
type Engine = typeof import('@/lib/visites/sync-engine')
type Overflow = typeof import('@/lib/visites/overflow')

let db: DB
let engine: Engine
let overflow: Overflow

function jsonRes(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response
}

async function seedSyncedComment() {
  const visit = await db.addVisitDraft('condo1', {} as never)
  await db.updateVisitDraft(visit.localId, { estaleVisitId: 'EV1', syncStatus: 'synced' })
  const comment = await db.addCommentDraft(visit.localId, { place: 'P', component: 'C' } as never)
  await db.updateCommentDraft(comment.localId, { estaleCommentId: 'EC1', syncStatus: 'synced' })
  return comment
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
  db = await import('@/lib/visites/db')
  engine = await import('@/lib/visites/sync-engine')
  overflow = await import('@/lib/visites/overflow')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('débordement photo', () => {
  it('bascule en overflowed quand l\'upload direct Estale échoue (!res.ok)', async () => {
    const comment = await seedSyncedComment()
    const photo = await db.addPhotoDraft(
      comment.localId,
      new Blob(['x'], { type: 'image/jpeg' }),
      'p.jpg',
    )

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/overflow/sign')) return jsonRes(200, { path: 'pid/p.jpg', token: 'tok' })
      if (url.includes('/overflow/drain')) return jsonRes(200, { done: [] })
      if (url.endsWith('/api/visites/overflow')) return jsonRes(201, { ok: true })
      if (url.includes('/files')) return jsonRes(500, { error: 'boom' })
      return jsonRes(404, {})
    }) as typeof fetch

    await engine.flushAll()

    const after = (await db.getPhotosForComment(comment.localId)).find((p) => p.localId === photo.localId)
    expect(after?.syncStatus).toBe('overflowed')
    expect(after?.overflowPath).toBe('pid/p.jpg')
  })

  it('déborde sans tenter Estale quand la photo dépasse OVERFLOW_SIZE_BYTES', async () => {
    const comment = await seedSyncedComment()
    const big = new Blob([new Uint8Array(overflow.OVERFLOW_SIZE_BYTES + 1)], { type: 'image/jpeg' })
    await db.addPhotoDraft(comment.localId, big, 'big.jpg')

    const f = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/overflow/sign')) return jsonRes(200, { path: 'pid/big.jpg', token: 'tok' })
      if (url.includes('/overflow/drain')) return jsonRes(200, { done: [] })
      if (url.endsWith('/api/visites/overflow')) return jsonRes(201, { ok: true })
      if (url.includes('/files')) return jsonRes(201, { file: { id: 'F1' } })
      return jsonRes(404, {})
    })
    global.fetch = f as unknown as typeof fetch

    await engine.flushAll()

    const calledUrls = f.mock.calls.map((c) => String(c[0]))
    expect(calledUrls.some((u) => u.includes('/files'))).toBe(false)
    expect(calledUrls.some((u) => u.includes('/overflow/sign'))).toBe(true)
  })

  it('drainOverflow supprime le HD local des photos confirmées sur Estale', async () => {
    const comment = await seedSyncedComment()
    const photo = await db.addPhotoDraft(
      comment.localId,
      new Blob(['x'], { type: 'image/jpeg' }),
      'p.jpg',
    )
    await db.updatePhotoDraft(photo.localId, { syncStatus: 'overflowed', overflowPath: 'pid/p.jpg' })

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/overflow/drain')) {
        return jsonRes(200, { done: [{ photoUuid: photo.localId, estaleFileId: 'F1' }] })
      }
      return jsonRes(404, {})
    }) as typeof fetch

    await overflow.drainOverflow()

    const gone = (await db.getPhotosForComment(comment.localId)).find((p) => p.localId === photo.localId)
    expect(gone).toBeUndefined()
  })

  it('drainOverflow est un no-op (aucun appel réseau) sans photo en débordement', async () => {
    const f = vi.fn(async () => jsonRes(200, { done: [] }))
    global.fetch = f as unknown as typeof fetch

    await overflow.drainOverflow()

    expect(f).not.toHaveBeenCalled()
  })

  it('getSyncStats compte les photos overflowed comme en transit', async () => {
    const comment = await seedSyncedComment()
    const photo = await db.addPhotoDraft(
      comment.localId,
      new Blob(['x'], { type: 'image/jpeg' }),
      'p.jpg',
    )
    await db.updatePhotoDraft(photo.localId, { syncStatus: 'overflowed', overflowPath: 'pid/p.jpg' })

    const stats = await db.getSyncStats()
    expect(stats.pendingCount).toBeGreaterThanOrEqual(1)
  })
})
