// src/app/api/estale/visits/[visitId]/comments/[commentId]/files/route.ts
// Upload multipart d'une photo attachée à une ligne de visite.
// Note : Vercel Functions limite le body à 4.5 MB par défaut. Photos iPhone full-res
// peuvent atteindre 3-5 MB → on est dans la limite haute. Si rejet en prod, prévoir
// une étape de compression côté client en V2.

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { uploadVisitCommentFile, isEstaleConfigured } from '@/lib/estale-api'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string; commentId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'multipart attendu' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'champ file manquant' }, { status: 400 })
  }

  try {
    const uploaded = await uploadVisitCommentFile(
      params.visitId,
      params.commentId,
      file as Blob,
      file.name,
    )
    return NextResponse.json({ file: uploaded }, { status: 201 })
  } catch (error) {
    console.error('POST file :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
