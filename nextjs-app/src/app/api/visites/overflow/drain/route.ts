// src/app/api/visites/overflow/drain/route.ts
// Draine le seau : pour chaque photo en débordement (status pending/error),
// télécharge le blob HD depuis Supabase et le pousse vers Estale (gardien), sans
// la limite 4,5 Mo (appel serveur→Estale). Idempotent (garde estale_file_id) →
// 0 doublon même rejoué. Au succès : status=done + suppression du blob Supabase.
// Renvoie les photo_uuid confirmés pour que le client efface le HD local.
// S'exécute dans le contexte authentifié de l'utilisateur (requireAdmin) → la
// session Estale du cookie est utilisée par uploadVisitCommentFile.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server-auth'
import { uploadVisitCommentFile, isEstaleConfigured } from '@/lib/estale-api'

export const runtime = 'nodejs'
export const maxDuration = 60

const BUCKET = 'visite-photos-overflow'
const MAX_DRAIN_ATTEMPTS = 10
const BATCH = 25

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(_request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  const { data: rows, error } = await supabase
    .from('visite_photo_outbox')
    .select('*')
    .in('status', ['pending', 'error'])
    .lt('attempts', MAX_DRAIN_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(BATCH)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const done: Array<{ photoUuid: string; estaleFileId: string }> = []
  const errors: Array<{ photoUuid: string; error: string }> = []

  for (const row of rows || []) {
    // Idempotence : déjà poussé vers Estale → marquer done + purger le blob.
    if (row.estale_file_id) {
      await supabase.from('visite_photo_outbox').update({ status: 'done' }).eq('photo_uuid', row.photo_uuid)
      await supabase.storage.from(BUCKET).remove([row.storage_path])
      done.push({ photoUuid: row.photo_uuid, estaleFileId: row.estale_file_id })
      continue
    }

    await supabase
      .from('visite_photo_outbox')
      .update({ status: 'uploading', attempts: (row.attempts ?? 0) + 1 })
      .eq('photo_uuid', row.photo_uuid)

    try {
      const dl = await supabase.storage.from(BUCKET).download(row.storage_path)
      if (dl.error || !dl.data) throw new Error(dl.error?.message || 'blob introuvable')
      // Ne jamais pousser un blob vide vers Estale (sinon « Oupss » + faux 'done').
      // La photo reste récupérable depuis l'appareil (blob HD encore en local).
      if ((dl.data as Blob).size === 0) {
        throw new Error('blob vide (0 octet) dans le seau — à renvoyer depuis l’appareil')
      }

      const uploaded = await uploadVisitCommentFile(
        row.estale_visit_id,
        row.estale_comment_id,
        dl.data as Blob,
        row.filename,
      )

      await supabase
        .from('visite_photo_outbox')
        .update({ status: 'done', estale_file_id: uploaded.id, last_error: null })
        .eq('photo_uuid', row.photo_uuid)
      await supabase.storage.from(BUCKET).remove([row.storage_path])
      done.push({ photoUuid: row.photo_uuid, estaleFileId: uploaded.id })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'échec drain'
      await supabase
        .from('visite_photo_outbox')
        .update({ status: 'error', last_error: msg.slice(0, 300) })
        .eq('photo_uuid', row.photo_uuid)
      errors.push({ photoUuid: row.photo_uuid, error: msg })
    }
  }

  return NextResponse.json({ done, errors })
}
