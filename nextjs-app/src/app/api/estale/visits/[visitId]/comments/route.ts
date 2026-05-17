// src/app/api/estale/visits/[visitId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server-auth'
import {
  createVisitComment,
  isEstaleConfigured,
  type VisitCommentCreateInput,
} from '@/lib/estale-api'

const Body = z.object({
  place: z.string().min(1),
  component: z.string().min(1),
  content: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  let body: VisitCommentCreateInput
  try {
    body = Body.parse(await request.json()) as VisitCommentCreateInput
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  try {
    const comment = await createVisitComment(params.visitId, body)
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('POST comments :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
