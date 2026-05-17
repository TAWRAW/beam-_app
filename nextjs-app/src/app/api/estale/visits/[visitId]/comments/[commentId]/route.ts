// src/app/api/estale/visits/[visitId]/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server-auth'
import {
  updateVisitComment,
  deleteVisitComment,
  isEstaleConfigured,
  type VisitCommentUpdateInput,
} from '@/lib/estale-api'

const Body = z.object({
  place: z.string().min(1),
  component: z.string().min(1),
  content: z.string().min(1),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { visitId: string; commentId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  let body: VisitCommentUpdateInput
  try {
    body = Body.parse(await request.json()) as VisitCommentUpdateInput
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  try {
    const comment = await updateVisitComment(params.visitId, params.commentId, body)
    return NextResponse.json({ comment })
  } catch (error) {
    console.error('PATCH comment :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { visitId: string; commentId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  try {
    await deleteVisitComment(params.visitId, params.commentId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE comment :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
