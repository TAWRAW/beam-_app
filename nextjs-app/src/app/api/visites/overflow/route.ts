// src/app/api/visites/overflow/route.ts
// Inscrit (upsert idempotent sur photo_uuid) une photo en débordement dans
// l'outbox, une fois son blob HD déposé dans le bucket Supabase. Le drain la
// poussera ensuite vers Estale.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server-auth'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const b = await request.json().catch(() => null)
  if (!b?.photoUuid || !b?.estaleVisitId || !b?.estaleCommentId || !b?.storagePath) {
    return NextResponse.json({ error: 'champs manquants' }, { status: 400 })
  }

  const { error } = await supabase.from('visite_photo_outbox').upsert(
    {
      photo_uuid: b.photoUuid,
      estale_visit_id: b.estaleVisitId,
      estale_comment_id: b.estaleCommentId,
      comment_local_id: b.commentLocalId ?? null,
      storage_path: b.storagePath,
      filename: b.filename ?? 'photo.jpg',
      mime_type: b.mimeType ?? null,
      status: 'pending',
      last_error: null,
    },
    { onConflict: 'photo_uuid' },
  )
  if (error) {
    console.error('overflow upsert:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
