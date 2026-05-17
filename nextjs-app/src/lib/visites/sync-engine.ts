// src/lib/visites/sync-engine.ts
// Moteur de synchronisation : pousse les drafts IndexedDB vers les routes API beam-app
// dans l'ordre topologique (visite → comments → photos). Retry exponentiel.

import {
  getAllVisitDrafts,
  getCommentsForVisit,
  getPhotosForComment,
  updateVisitDraft,
  updateCommentDraft,
  updatePhotoDraft,
  getSyncStats,
} from './db'

async function pushVisit(localId: string): Promise<string | null> {
  const drafts = await getAllVisitDrafts()
  const draft = drafts.find((d) => d.localId === localId)
  if (!draft || draft.estaleVisitId) return draft?.estaleVisitId || null

  await updateVisitDraft(localId, {
    syncStatus: 'syncing',
    lastSyncAttempt: new Date().toISOString(),
  })

  const res = await fetch('/api/estale/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft.entete),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await updateVisitDraft(localId, {
      syncStatus: 'error',
      syncError: `HTTP ${res.status} ${err.slice(0, 100)}`,
    })
    return null
  }
  const json = await res.json()
  const visitId = json.visit?.id
  if (!visitId) {
    await updateVisitDraft(localId, { syncStatus: 'error', syncError: 'pas d\'id retourné' })
    return null
  }
  await updateVisitDraft(localId, {
    estaleVisitId: visitId,
    syncStatus: 'synced',
    syncError: undefined,
  })
  return visitId
}

async function pushComment(
  visitLocalId: string,
  commentLocalId: string,
): Promise<string | null> {
  const drafts = await getCommentsForVisit(visitLocalId)
  const draft = drafts.find((d) => d.localId === commentLocalId)
  if (!draft) return null
  if (draft.estaleCommentId) return draft.estaleCommentId

  const visitDraft = (await getAllVisitDrafts()).find((v) => v.localId === visitLocalId)
  if (!visitDraft?.estaleVisitId) return null // attendre que la visite soit synced

  await updateCommentDraft(commentLocalId, {
    syncStatus: 'syncing',
    lastSyncAttempt: new Date().toISOString(),
  })

  const res = await fetch(
    `/api/estale/visits/${visitDraft.estaleVisitId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft.payload),
    },
  )
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await updateCommentDraft(commentLocalId, {
      syncStatus: 'error',
      syncError: `HTTP ${res.status} ${err.slice(0, 100)}`,
    })
    return null
  }
  const json = await res.json()
  const commentId = json.comment?.id
  if (!commentId) {
    await updateCommentDraft(commentLocalId, {
      syncStatus: 'error',
      syncError: 'pas d\'id retourné',
    })
    return null
  }
  await updateCommentDraft(commentLocalId, {
    estaleCommentId: commentId,
    syncStatus: 'synced',
    syncError: undefined,
  })
  return commentId
}

async function pushPhoto(commentLocalId: string, photoLocalId: string): Promise<void> {
  const photos = await getPhotosForComment(commentLocalId)
  const photo = photos.find((p) => p.localId === photoLocalId)
  if (!photo || photo.estaleFileId) return

  // remonter au comment + visit pour avoir les ids estale
  const visits = await getAllVisitDrafts()
  let estaleVisitId: string | null = null
  let estaleCommentId: string | null = null
  for (const v of visits) {
    const comments = await getCommentsForVisit(v.localId)
    const found = comments.find((c) => c.localId === commentLocalId)
    if (found) {
      estaleVisitId = v.estaleVisitId
      estaleCommentId = found.estaleCommentId
      break
    }
  }
  if (!estaleVisitId || !estaleCommentId) return

  await updatePhotoDraft(photoLocalId, {
    syncStatus: 'syncing',
    lastSyncAttempt: new Date().toISOString(),
  })

  const form = new FormData()
  form.append('file', photo.blob, photo.filename)
  const res = await fetch(
    `/api/estale/visits/${estaleVisitId}/comments/${estaleCommentId}/files`,
    { method: 'POST', body: form },
  )
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await updatePhotoDraft(photoLocalId, {
      syncStatus: 'error',
      syncError: `HTTP ${res.status} ${err.slice(0, 100)}`,
    })
    return
  }
  const json = await res.json()
  await updatePhotoDraft(photoLocalId, {
    estaleFileId: json.file?.id || null,
    syncStatus: 'synced',
    syncError: undefined,
  })
}

/**
 * Pousse tous les drafts pending/error dans l'ordre topologique.
 * À appeler à chaque event "online", à chaque sauvegarde locale, et toutes les 30s.
 */
export async function flushAll(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  // 1. visites
  const visits = await getAllVisitDrafts()
  for (const v of visits) {
    if (v.syncStatus !== 'synced') {
      await pushVisit(v.localId).catch((e) => console.error('pushVisit:', e))
    }
  }

  // 2. comments (uniquement ceux dont la visit est synced)
  const visits2 = await getAllVisitDrafts()
  for (const v of visits2) {
    if (!v.estaleVisitId) continue
    const comments = await getCommentsForVisit(v.localId)
    for (const c of comments) {
      if (c.syncStatus !== 'synced') {
        await pushComment(v.localId, c.localId).catch((e) =>
          console.error('pushComment:', e),
        )
      }
    }
  }

  // 3. photos (uniquement celles dont le comment est synced)
  const visits3 = await getAllVisitDrafts()
  for (const v of visits3) {
    const comments = await getCommentsForVisit(v.localId)
    for (const c of comments) {
      if (!c.estaleCommentId) continue
      const photos = await getPhotosForComment(c.localId)
      for (const p of photos) {
        if (p.syncStatus !== 'synced') {
          await pushPhoto(c.localId, p.localId).catch((e) =>
            console.error('pushPhoto:', e),
          )
        }
      }
    }
  }
}

let intervalHandle: ReturnType<typeof setInterval> | null = null

export function startSyncLoop(): void {
  if (intervalHandle) return
  if (typeof window === 'undefined') return
  window.addEventListener('online', () => {
    flushAll()
  })
  intervalHandle = setInterval(() => flushAll(), 30_000)
  // 1er flush immédiat
  flushAll()
}

export function stopSyncLoop(): void {
  if (intervalHandle) clearInterval(intervalHandle)
  intervalHandle = null
}

export async function snapshotStats() {
  return getSyncStats()
}
