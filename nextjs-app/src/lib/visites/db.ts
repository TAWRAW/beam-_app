// src/lib/visites/db.ts
// Couche d'accès IndexedDB pour les visites — wrappers typés au-dessus d'idb.

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { v4 as uuid } from 'uuid'

import type {
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
      if (item.syncStatus === 'pending' || item.syncStatus === 'error') {
        pending++
        const ts = item.createdAt || item.capturedAt
        if (ts && (!oldest || ts < oldest)) oldest = ts
      }
    }
  }
  return { pendingCount: pending, oldestPendingAt: oldest }
}
