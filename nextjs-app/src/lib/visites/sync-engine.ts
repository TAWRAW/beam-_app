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
  type PhotoDraft,
} from './db'
import { compressImage } from './image-compress'
import { OVERFLOW_SIZE_BYTES, overflowPhoto, drainOverflow } from './overflow'

// Nombre max d'essais avant qu'un draft soit considéré "définitivement" en
// erreur. Au-delà, l'auto-healing (cf. autoHealStuckDrafts) prend le relais
// pour relancer périodiquement.
const MAX_SYNC_ATTEMPTS = 10

// Délai après lequel un draft en erreur est automatiquement re-tenté (reset
// du compteur d'essais). Empêche les drafts de rester bloqués indéfiniment
// après un pic d'erreurs (race condition, coupure réseau, 5xx temporaire).
const ERROR_RETRY_AFTER_MS = 5 * 60 * 1000 // 5 minutes

// Délai après lequel un draft figé en 'syncing' (envoi interrompu en plein vol :
// app passée en arrière-plan, écran verrouillé, coupure réseau pendant
// l'upload) est considéré bloqué et repassé en 'pending' pour être retenté.
// Assez long pour ne pas couper un upload réellement en cours (quelques s à
// quelques dizaines de s), assez court pour ne pas laisser une photo invisible.
const SYNCING_STUCK_AFTER_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Un draft doit-il être réveillé ? Vrai si :
 *  - 'error' depuis plus de ERROR_RETRY_AFTER_MS, ou
 *  - 'syncing' figé depuis plus de SYNCING_STUCK_AFTER_MS (ou sans horodatage).
 */
function needsRevive(
  status: string,
  lastSyncAttempt: string | undefined,
  errorCutoffIso: string,
  syncingCutoffIso: string,
): boolean {
  if (status === 'error') return !!lastSyncAttempt && lastSyncAttempt < errorCutoffIso
  if (status === 'syncing') return !lastSyncAttempt || lastSyncAttempt < syncingCutoffIso
  return false
}

async function pushVisit(localId: string): Promise<string | null> {
  const drafts = await getAllVisitDrafts()
  const draft = drafts.find((d) => d.localId === localId)
  if (!draft || draft.estaleVisitId) return draft?.estaleVisitId || null
  // Défense contre les appels concurrents (race condition double POST)
  if (draft.syncStatus === 'syncing') return null
  if ((draft.syncAttempts || 0) >= MAX_SYNC_ATTEMPTS) return null

  const attempts = (draft.syncAttempts || 0) + 1
  await updateVisitDraft(localId, {
    syncStatus: 'syncing',
    lastSyncAttempt: new Date().toISOString(),
    syncAttempts: attempts,
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
      syncError: `HTTP ${res.status} ${err.slice(0, 100)} (essai ${attempts}/${MAX_SYNC_ATTEMPTS})`,
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

  // Déjà synced et pas modifié localement → rien à faire
  if (draft.estaleCommentId && draft.syncStatus === 'synced') {
    return draft.estaleCommentId
  }
  // Défense contre les appels concurrents (race condition double POST/PATCH)
  if (draft.syncStatus === 'syncing') return null
  // Brouillon non finalisé (page new ligne fermée avant submit) : on garde
  // le draft + ses photos en IndexedDB mais on ne pousse pas vers Estale tant
  // que place/component ne sont pas renseignés.
  const payload = draft.payload as { place?: string; component?: string }
  if (!payload.place || !payload.component) return null

  const visitDraft = (await getAllVisitDrafts()).find((v) => v.localId === visitLocalId)
  if (!visitDraft?.estaleVisitId) return null // attendre que la visite soit synced
  if ((draft.syncAttempts || 0) >= MAX_SYNC_ATTEMPTS) return null

  const attempts = (draft.syncAttempts || 0) + 1
  await updateCommentDraft(commentLocalId, {
    syncStatus: 'syncing',
    lastSyncAttempt: new Date().toISOString(),
    syncAttempts: attempts,
  })

  // Si la ligne existe déjà sur estale, on PATCH ; sinon on POST.
  const isPatch = !!draft.estaleCommentId
  const url = isPatch
    ? `/api/estale/visits/${visitDraft.estaleVisitId}/comments/${draft.estaleCommentId}`
    : `/api/estale/visits/${visitDraft.estaleVisitId}/comments`
  const method = isPatch ? 'PATCH' : 'POST'

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft.payload),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await updateCommentDraft(commentLocalId, {
      syncStatus: 'error',
      syncError: `HTTP ${res.status} ${err.slice(0, 100)} (essai ${attempts}/${MAX_SYNC_ATTEMPTS})`,
    })
    return null
  }

  if (isPatch) {
    await updateCommentDraft(commentLocalId, {
      syncStatus: 'synced',
      syncError: undefined,
    })
    return draft.estaleCommentId!
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

/**
 * Bascule une photo vers le seau de débordement Supabase (durable), puis la
 * laissera drainer vers Estale. Si le débordement lui-même échoue, marque
 * 'error' (visible, ré-éveillé par l'auto-heal) plutôt que de perdre la photo.
 */
async function overflowOrError(
  photo: PhotoDraft,
  estaleVisitId: string,
  estaleCommentId: string,
  attempts: number,
  reason: string,
): Promise<void> {
  try {
    await overflowPhoto(photo, estaleVisitId, estaleCommentId)
  } catch (e) {
    await updatePhotoDraft(photo.localId, {
      syncStatus: 'error',
      syncError: `${reason} / débordement KO: ${e instanceof Error ? e.message : 'échec'} (essai ${attempts}/${MAX_SYNC_ATTEMPTS})`,
    })
  }
}

async function pushPhoto(commentLocalId: string, photoLocalId: string): Promise<void> {
  const photos = await getPhotosForComment(commentLocalId)
  const photo = photos.find((p) => p.localId === photoLocalId)
  if (!photo || photo.estaleFileId) return
  // Défense en profondeur : si un autre push concurrent est déjà en cours
  // sur cette photo (statut 'syncing'), on n'entre pas en double. Le mutex
  // global de flushAll() est le vrai garde-fou ; ce check sert si pushPhoto
  // est appelé en dehors du flush. 'overflowed' = déjà dans le seau Supabase,
  // c'est drainOverflow() qui s'en occupe, pas pushPhoto.
  if (photo.syncStatus === 'syncing' || photo.syncStatus === 'overflowed') return

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
  if ((photo.syncAttempts || 0) >= MAX_SYNC_ATTEMPTS) return

  const attempts = (photo.syncAttempts || 0) + 1
  await updatePhotoDraft(photoLocalId, {
    syncStatus: 'syncing',
    lastSyncAttempt: new Date().toISOString(),
    syncAttempts: attempts,
  })

  // On envoie une version compressée (sous la limite serveur), mais l'original
  // HD reste stocké en IndexedDB tant que la photo n'est pas confirmée.
  const toUpload = await compressImage(photo.blob)

  // Trop lourd même compressé → débordement direct : la route Vercel plafonne
  // ~4,5 Mo, alors que le serveur pousse le HD vers Estale sans cette limite.
  if (toUpload.size > OVERFLOW_SIZE_BYTES) {
    await overflowOrError(photo, estaleVisitId, estaleCommentId, attempts, 'photo trop lourde')
    return
  }

  const form = new FormData()
  form.append('file', toUpload, photo.filename)
  let res: Response
  try {
    res = await fetch(
      `/api/estale/visits/${estaleVisitId}/comments/${estaleCommentId}/files`,
      { method: 'POST', body: form },
    )
  } catch (e) {
    // Upload direct interrompu (coupure réseau, app backgroundée…) → bascule en
    // débordement Supabase (durable) plutôt que de laisser la photo figée :
    // elle sera drainée vers Estale dès que possible.
    await overflowOrError(
      photo,
      estaleVisitId,
      estaleCommentId,
      attempts,
      `réseau: ${e instanceof Error ? e.message : 'échec upload'}`,
    )
    return
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await overflowOrError(
      photo,
      estaleVisitId,
      estaleCommentId,
      attempts,
      `HTTP ${res.status} ${err.slice(0, 100)}`,
    )
    return
  }
  const json = await res.json()
  await updatePhotoDraft(photoLocalId, {
    estaleFileId: json.file?.id || null,
    syncStatus: 'synced',
    syncError: undefined,
  })
}

// Mutex global : empêche deux flushAll() concurrents qui produiraient des
// doublons côté Estale (ex: tick de 30 s qui se déclenche pendant un tap
// sur SyncIndicator, ou save() qui appelle flushAll() pendant un autre
// flush déjà en cours).
let isFlushing = false

/**
 * Réveille les drafts bloqués en 'error' depuis plus de ERROR_RETRY_AFTER_MS :
 * reset le compteur d'essais à 0 et repasse en 'pending'. Ainsi, plus aucun
 * draft ne reste prisonnier indéfiniment après un pic d'erreurs ; ils sont
 * automatiquement re-tentés à la prochaine sync.
 *
 * Combiné au mutex flushAll, garantit que les photos prises en mauvais
 * réseau finissent toujours par arriver sur Estale tant que l'utilisateur
 * ouvre l'app de temps en temps.
 */
async function autoHealStuckDrafts(): Promise<void> {
  const now = Date.now()
  const errorCutoffIso = new Date(now - ERROR_RETRY_AFTER_MS).toISOString()
  const syncingCutoffIso = new Date(now - SYNCING_STUCK_AFTER_MS).toISOString()
  const revive = { syncStatus: 'pending' as const, syncAttempts: 0, syncError: undefined }

  const visits = await getAllVisitDrafts()
  for (const v of visits) {
    if (needsRevive(v.syncStatus, v.lastSyncAttempt, errorCutoffIso, syncingCutoffIso)) {
      await updateVisitDraft(v.localId, revive)
    }
    const comments = await getCommentsForVisit(v.localId)
    for (const c of comments) {
      if (needsRevive(c.syncStatus, c.lastSyncAttempt, errorCutoffIso, syncingCutoffIso)) {
        await updateCommentDraft(c.localId, revive)
      }
      const photos = await getPhotosForComment(c.localId)
      for (const p of photos) {
        if (needsRevive(p.syncStatus, p.lastSyncAttempt, errorCutoffIso, syncingCutoffIso)) {
          await updatePhotoDraft(p.localId, revive)
        }
      }
    }
  }
}

/**
 * Pousse tous les drafts pending/error dans l'ordre topologique.
 * À appeler à chaque event "online", à chaque sauvegarde locale, et toutes les 30s.
 */
export async function flushAll(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  if (isFlushing) return
  isFlushing = true
  try {
    await autoHealStuckDrafts()
    await flushAllInternal()
  } finally {
    isFlushing = false
  }
}

async function flushAllInternal(): Promise<void> {
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
        // 'overflowed' est géré par drainOverflow() (étape 4), pas par pushPhoto.
        if (p.syncStatus !== 'synced' && p.syncStatus !== 'overflowed') {
          await pushPhoto(c.localId, p.localId).catch((e) =>
            console.error('pushPhoto:', e),
          )
        }
      }
    }
  }

  // 4. drain du seau de débordement : pousse vers Estale les photos déposées
  // dans Supabase (par pushPhoto en cas d'échec/trop lourd), no-op si vide.
  await drainOverflow().catch((e) => console.error('drainOverflow:', e))
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
