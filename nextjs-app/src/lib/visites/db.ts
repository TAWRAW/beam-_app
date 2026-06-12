// src/lib/visites/db.ts
// Couche d'accès IndexedDB pour les visites — wrappers typés au-dessus d'idb.

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { v4 as uuid } from 'uuid'

import type {
  EstaleVisit,
  VisitCreateInput,
  VisitCommentCreateInput,
  VisitCommentUpdateInput,
} from '@/lib/estale-api'

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'

export interface VisitDraft {
  localId: string
  estaleVisitId: string | null
  condoId: string
  entete: VisitCreateInput
  syncStatus: SyncStatus
  createdAt: string
  lastSyncAttempt?: string
  syncError?: string
  syncAttempts?: number
}

export interface CommentDraft {
  localId: string
  visitLocalId: string
  estaleCommentId: string | null
  payload: VisitCommentCreateInput | VisitCommentUpdateInput
  syncStatus: SyncStatus
  createdAt: string
  lastSyncAttempt?: string
  syncError?: string
  syncAttempts?: number
}

export interface PhotoDraft {
  localId: string
  commentLocalId: string
  estaleFileId: string | null
  blob: Blob
  filename: string
  mimeType: string
  capturedAt: string
  syncStatus: SyncStatus
  lastSyncAttempt?: string
  syncError?: string
  syncAttempts?: number
}

interface BeamoVisitesDB extends DBSchema {
  visits_drafts: { key: string; value: VisitDraft }
  comments_drafts: { key: string; value: CommentDraft; indexes: { 'by-visit': string } }
  photos_drafts: { key: string; value: PhotoDraft; indexes: { 'by-comment': string } }
}

const DB_NAME = 'beamo-visites-v1'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<BeamoVisitesDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<BeamoVisitesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('visits_drafts')) {
          db.createObjectStore('visits_drafts', { keyPath: 'localId' })
        }
        if (!db.objectStoreNames.contains('comments_drafts')) {
          const c = db.createObjectStore('comments_drafts', { keyPath: 'localId' })
          c.createIndex('by-visit', 'visitLocalId')
        }
        if (!db.objectStoreNames.contains('photos_drafts')) {
          const p = db.createObjectStore('photos_drafts', { keyPath: 'localId' })
          p.createIndex('by-comment', 'commentLocalId')
        }
      },
    })
  }
  return dbPromise
}

// --- Visits ---

export async function addVisitDraft(
  condoId: string,
  entete: VisitCreateInput,
): Promise<VisitDraft> {
  const draft: VisitDraft = {
    localId: uuid(),
    estaleVisitId: null,
    condoId,
    entete,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  }
  const db = await getDB()
  await db.put('visits_drafts', draft)
  return draft
}

export async function getAllVisitDrafts(): Promise<VisitDraft[]> {
  const db = await getDB()
  return db.getAll('visits_drafts')
}

export async function updateVisitDraft(
  localId: string,
  patch: Partial<VisitDraft>,
): Promise<void> {
  const db = await getDB()
  const existing = await db.get('visits_drafts', localId)
  if (!existing) throw new Error(`VisitDraft ${localId} introuvable`)
  await db.put('visits_drafts', { ...existing, ...patch })
}

export async function getVisitDraft(localId: string): Promise<VisitDraft | undefined> {
  const db = await getDB()
  return db.get('visits_drafts', localId)
}

/**
 * Hydrate IndexedDB depuis une visite estale (remote) pour rendre ses comments
 * éditables en local. Si la visite est déjà hydratée (estaleVisitId trouvé),
 * retourne l'existante sans dupliquer.
 */
export async function hydrateVisitFromRemote(
  remote: EstaleVisit,
  condoId: string,
): Promise<VisitDraft> {
  const db = await getDB()

  const all = await db.getAll('visits_drafts')
  const existing = all.find((v) => v.estaleVisitId === remote.id)
  if (existing) return existing

  const visitDraft: VisitDraft = {
    localId: uuid(),
    estaleVisitId: remote.id,
    condoId,
    entete: {
      category: remote.category,
      date: remote.date,
      period: remote.period,
      object: remote.object,
      condoID: remote.condoID,
      organiserID: remote.organiserID,
      collaboratorIDs: remote.collaborators.map((c) => c.id),
      ownerIDs: remote.owners.map((o) => o.id),
    },
    syncStatus: 'synced',
    createdAt: remote.date || new Date().toISOString(),
  }
  await db.put('visits_drafts', visitDraft)

  for (const c of remote.comments || []) {
    const commentDraft: CommentDraft = {
      localId: uuid(),
      visitLocalId: visitDraft.localId,
      estaleCommentId: c.id,
      payload: {
        place: c.place,
        component: c.component,
        content: c.content,
      },
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
    }
    await db.put('comments_drafts', commentDraft)
  }

  return visitDraft
}

// --- Comments ---

export async function addCommentDraft(
  visitLocalId: string,
  payload: VisitCommentCreateInput,
): Promise<CommentDraft> {
  const draft: CommentDraft = {
    localId: uuid(),
    visitLocalId,
    estaleCommentId: null,
    payload,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  }
  const db = await getDB()
  await db.put('comments_drafts', draft)
  return draft
}

export async function getCommentsForVisit(visitLocalId: string): Promise<CommentDraft[]> {
  const db = await getDB()
  return db.getAllFromIndex('comments_drafts', 'by-visit', visitLocalId)
}

export async function updateCommentDraft(
  localId: string,
  patch: Partial<CommentDraft>,
): Promise<void> {
  const db = await getDB()
  const existing = await db.get('comments_drafts', localId)
  if (!existing) throw new Error(`CommentDraft ${localId} introuvable`)
  await db.put('comments_drafts', { ...existing, ...patch })
}

// --- Photos ---

export async function addPhotoDraft(
  commentLocalId: string,
  blob: Blob,
  filename: string,
): Promise<PhotoDraft> {
  const draft: PhotoDraft = {
    localId: uuid(),
    commentLocalId,
    estaleFileId: null,
    blob,
    filename,
    mimeType: blob.type,
    capturedAt: new Date().toISOString(),
    syncStatus: 'pending',
  }
  const db = await getDB()
  await db.put('photos_drafts', draft)
  return draft
}

export async function getPhotosForComment(commentLocalId: string): Promise<PhotoDraft[]> {
  const db = await getDB()
  return db.getAllFromIndex('photos_drafts', 'by-comment', commentLocalId)
}

export async function updatePhotoDraft(
  localId: string,
  patch: Partial<PhotoDraft>,
): Promise<void> {
  const db = await getDB()
  const existing = await db.get('photos_drafts', localId)
  if (!existing) throw new Error(`PhotoDraft ${localId} introuvable`)
  await db.put('photos_drafts', { ...existing, ...patch })
}

// --- Diagnostic + cleanup d'une visite (debug et auto-réparation) ---

export interface VisiteDiagnosticReport {
  visits: VisitDraft[]
  comments: CommentDraft[]
  photos: PhotoDraft[]
  orphanComments: CommentDraft[]
  duplicateCommentsByEstaleId: Record<string, CommentDraft[]>
  duplicatePhotosByEstaleFileId: Record<string, PhotoDraft[]>
}

/**
 * Rapport complet de l'état IndexedDB pour une visite donnée
 * (cherche par estaleVisitId OU par localId).
 */
export async function getVisiteDiagnostic(
  visitIdOrEstaleId: string,
): Promise<VisiteDiagnosticReport> {
  const db = await getDB()
  const allVisits = await db.getAll('visits_drafts')
  const allComments = await db.getAll('comments_drafts')
  const allPhotos = await db.getAll('photos_drafts')

  const visits = allVisits.filter(
    (v) => v.localId === visitIdOrEstaleId || v.estaleVisitId === visitIdOrEstaleId,
  )
  const visitLocalIds = visits.map((v) => v.localId)

  const comments = allComments.filter((c) => visitLocalIds.includes(c.visitLocalId))
  // Orphelins : drafts dont le visitLocalId correspond directement à l'estaleVisitId
  // (= bug pré-fix e8e1684 où on stockait l'estaleVisitId par erreur)
  const orphanComments = allComments.filter((c) => c.visitLocalId === visitIdOrEstaleId)

  const commentLocalIds = new Set([
    ...comments.map((c) => c.localId),
    ...orphanComments.map((c) => c.localId),
  ])
  const photos = allPhotos.filter((p) => commentLocalIds.has(p.commentLocalId))

  // Doublons : plusieurs CommentDraft pour le même estaleCommentId
  const duplicateCommentsByEstaleId: Record<string, CommentDraft[]> = {}
  for (const c of [...comments, ...orphanComments]) {
    if (!c.estaleCommentId) continue
    if (!duplicateCommentsByEstaleId[c.estaleCommentId]) {
      duplicateCommentsByEstaleId[c.estaleCommentId] = []
    }
    duplicateCommentsByEstaleId[c.estaleCommentId]!.push(c)
  }
  for (const k of Object.keys(duplicateCommentsByEstaleId)) {
    if (duplicateCommentsByEstaleId[k]!.length < 2) delete duplicateCommentsByEstaleId[k]
  }

  // Doublons : plusieurs PhotoDraft pour le même estaleFileId
  const duplicatePhotosByEstaleFileId: Record<string, PhotoDraft[]> = {}
  for (const p of photos) {
    if (!p.estaleFileId) continue
    if (!duplicatePhotosByEstaleFileId[p.estaleFileId]) {
      duplicatePhotosByEstaleFileId[p.estaleFileId] = []
    }
    duplicatePhotosByEstaleFileId[p.estaleFileId]!.push(p)
  }
  for (const k of Object.keys(duplicatePhotosByEstaleFileId)) {
    if (duplicatePhotosByEstaleFileId[k]!.length < 2) delete duplicatePhotosByEstaleFileId[k]
  }

  return {
    visits,
    comments,
    photos,
    orphanComments,
    duplicateCommentsByEstaleId,
    duplicatePhotosByEstaleFileId,
  }
}

/**
 * Nettoie les doublons stricts (même estaleId) et les orphelins
 * pour une visite donnée. Garde le draft le plus ancien dans chaque cas
 * (= celui qui a probablement le bon estaleCommentId/estaleFileId).
 * Retourne le nombre d'éléments supprimés.
 */
export async function cleanupVisitDuplicates(
  visitIdOrEstaleId: string,
): Promise<{ removedComments: number; removedPhotos: number; removedOrphans: number }> {
  const db = await getDB()
  const diag = await getVisiteDiagnostic(visitIdOrEstaleId)
  let removedComments = 0
  let removedPhotos = 0
  let removedOrphans = 0

  // 1. Doublons de comments : garde le plus ancien, supprime les autres
  for (const dupes of Object.values(diag.duplicateCommentsByEstaleId)) {
    const sorted = [...dupes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const toRemove = sorted.slice(1)
    for (const c of toRemove) {
      await db.delete('comments_drafts', c.localId)
      removedComments++
      // Et ses photos
      const orphanPhotos = diag.photos.filter((p) => p.commentLocalId === c.localId)
      for (const p of orphanPhotos) {
        await db.delete('photos_drafts', p.localId)
        removedPhotos++
      }
    }
  }

  // 2. Doublons de photos : garde la plus ancienne
  for (const dupes of Object.values(diag.duplicatePhotosByEstaleFileId)) {
    const sorted = [...dupes].sort((a, b) =>
      (a.capturedAt || '').localeCompare(b.capturedAt || ''),
    )
    for (const p of sorted.slice(1)) {
      await db.delete('photos_drafts', p.localId)
      removedPhotos++
    }
  }

  // 3. Orphelins : drafts avec visitLocalId = estaleVisitId (ancien bug)
  for (const c of diag.orphanComments) {
    await db.delete('comments_drafts', c.localId)
    removedOrphans++
    const orphanPhotos = diag.photos.filter((p) => p.commentLocalId === c.localId)
    for (const p of orphanPhotos) {
      await db.delete('photos_drafts', p.localId)
      removedPhotos++
    }
  }

  return { removedComments, removedPhotos, removedOrphans }
}

/**
 * Reset les drafts en erreur (ou ayant atteint MAX_SYNC_ATTEMPTS) pour qu'ils
 * soient retentés au prochain flush. Utile quand une race condition ou un
 * bug a empêché la sync et qu'on veut "réveiller" les drafts bloqués.
 * Ne touche QUE les drafts non-synced (visit/comment/photo avec
 * syncStatus !== 'synced').
 */
export async function resetFailedSyncForVisit(
  visitIdOrEstaleId: string,
): Promise<{ resetVisits: number; resetComments: number; resetPhotos: number }> {
  const db = await getDB()
  const diag = await getVisiteDiagnostic(visitIdOrEstaleId)
  let resetVisits = 0
  let resetComments = 0
  let resetPhotos = 0

  for (const v of diag.visits) {
    if (v.syncStatus !== 'synced') {
      await db.put('visits_drafts', {
        ...v,
        syncStatus: 'pending',
        syncAttempts: 0,
        syncError: undefined,
      })
      resetVisits++
    }
  }

  for (const c of [...diag.comments, ...diag.orphanComments]) {
    if (c.syncStatus !== 'synced') {
      await db.put('comments_drafts', {
        ...c,
        syncStatus: 'pending',
        syncAttempts: 0,
        syncError: undefined,
      })
      resetComments++
    }
  }

  for (const p of diag.photos) {
    if (p.syncStatus !== 'synced') {
      await db.put('photos_drafts', {
        ...p,
        syncStatus: 'pending',
        syncAttempts: 0,
        syncError: undefined,
      })
      resetPhotos++
    }
  }

  return { resetVisits, resetComments, resetPhotos }
}

// --- Cleanup ---

export async function purgeSyncedOlderThan(hours: number): Promise<number> {
  const db = await getDB()
  const cutoff = Date.now() - hours * 3600_000
  let deleted = 0

  for (const store of ['visits_drafts', 'comments_drafts', 'photos_drafts'] as const) {
    const all = (await db.getAll(store as any)) as Array<{
      localId: string
      syncStatus: SyncStatus
      createdAt?: string
      capturedAt?: string
    }>
    for (const item of all) {
      if (item.syncStatus !== 'synced') continue
      const ts = item.createdAt || item.capturedAt
      if (!ts) continue
      if (new Date(ts).getTime() < cutoff) {
        await db.delete(store as any, item.localId)
        deleted++
      }
    }
  }
  return deleted
}

// --- Stats pour heartbeat ---

export async function getSyncStats(): Promise<{
  pendingCount: number
  oldestPendingAt: string | null
}> {
  const db = await getDB()
  let pending = 0
  let oldest: string | null = null
  for (const store of ['visits_drafts', 'comments_drafts', 'photos_drafts'] as const) {
    const all = (await db.getAll(store as any)) as Array<{
      syncStatus: SyncStatus
      createdAt?: string
      capturedAt?: string
    }>
    for (const item of all) {
      // 'syncing' est compté : un envoi interrompu en plein vol peut rester
      // figé dans ce statut. L'ignorer rendait le badge vert alors que des
      // photos n'étaient jamais arrivées (cf. auto-réveil dans le sync-engine).
      if (
        item.syncStatus === 'pending' ||
        item.syncStatus === 'error' ||
        item.syncStatus === 'syncing'
      ) {
        pending++
        const ts = item.createdAt || item.capturedAt
        if (ts && (!oldest || ts < oldest)) oldest = ts
      }
    }
  }
  return { pendingCount: pending, oldestPendingAt: oldest }
}
