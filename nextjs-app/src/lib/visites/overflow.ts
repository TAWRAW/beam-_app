// src/lib/visites/overflow.ts
// Seau de débordement : quand l'envoi direct d'une photo vers Estale ne peut
// pas aboutir (hors-ligne, fichier trop lourd > 4,5 Mo, upload interrompu), on
// dépose le blob HD dans Supabase Storage (durable), on l'inscrit dans l'outbox,
// puis on le draine vers Estale (gardien / source de vérité). Estale confirmé →
// le blob Supabase et le HD local sont supprimés.
// Voir spec docs/superpowers/specs/2026-06-16-visites-photos-fiabilisation-design.md

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { deletePhotoDraft, getOverflowedPhotos, updatePhotoDraft, type PhotoDraft } from './db'

const BUCKET = 'visite-photos-overflow'

// Au-delà de cette taille (octets), on saute l'envoi direct (limite ~4,5 Mo des
// fonctions Vercel) et on passe directement par le débordement.
export const OVERFLOW_SIZE_BYTES = 4_000_000

/**
 * Fait déborder une photo vers Supabase : URL signée → upload direct du HD →
 * inscription outbox → marquage local 'overflowed'. Jette en cas d'échec (le
 * caller décide alors de marquer 'error' pour re-tentative ultérieure).
 */
export async function overflowPhoto(
  photo: PhotoDraft,
  estaleVisitId: string,
  estaleCommentId: string,
): Promise<void> {
  // 1. URL d'upload signée (mintée côté serveur en service-role)
  const signRes = await fetch('/api/visites/overflow/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUuid: photo.localId, filename: photo.filename }),
  })
  if (!signRes.ok) throw new Error(`sign HTTP ${signRes.status}`)
  const { path, token } = (await signRes.json()) as { path?: string; token?: string }
  if (!path || !token) throw new Error('sign: réponse invalide')

  // 2. Upload direct du HD vers Supabase Storage (contourne la limite Vercel)
  const supabase = createSupabaseBrowserClient()
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(path, token, photo.blob, {
      contentType: photo.mimeType || 'application/octet-stream',
    })
  if (upErr) throw new Error(`storage: ${upErr.message}`)

  // 3. Inscription dans l'outbox (idempotent sur photo_uuid)
  const enqRes = await fetch('/api/visites/overflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photoUuid: photo.localId,
      estaleVisitId,
      estaleCommentId,
      commentLocalId: photo.commentLocalId,
      storagePath: path,
      filename: photo.filename,
      mimeType: photo.mimeType,
    }),
  })
  if (!enqRes.ok) throw new Error(`outbox HTTP ${enqRes.status}`)

  // 4. Marquage local : en débordement, en attente de drain
  await updatePhotoDraft(photo.localId, {
    syncStatus: 'overflowed',
    overflowPath: path,
    syncError: undefined,
    lastSyncAttempt: new Date().toISOString(),
  })
}

/**
 * Draine le seau : demande au serveur de pousser les photos en débordement vers
 * Estale, puis supprime localement (HD inclus, décision (i)) celles confirmées.
 * No-op s'il n'y a rien en débordement (évite un appel réseau inutile à chaque
 * tick de flush).
 */
export async function drainOverflow(): Promise<void> {
  const overflowed = await getOverflowedPhotos()
  if (overflowed.length === 0) return

  const res = await fetch('/api/visites/overflow/drain', { method: 'POST' })
  if (!res.ok) return // on retentera au prochain flush

  const { done } = (await res.json()) as { done?: Array<{ photoUuid: string }> }
  for (const d of done || []) {
    // Photo confirmée sur Estale (gardien) → on efface le HD local.
    await deletePhotoDraft(d.photoUuid)
  }
}
