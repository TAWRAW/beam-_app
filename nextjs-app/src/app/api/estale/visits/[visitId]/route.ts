// src/app/api/estale/visits/[visitId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server-auth'
import {
  getVisitDetail,
  updateVisit,
  isEstaleConfigured,
} from '@/lib/estale-api'

const UpdateBody = z.object({
  category: z.enum(['CONTRACTUAL', 'NON_CONTRACTUAL']),
  date: z.string(),
  period: z.number().int().positive(),
  object: z.string().min(1),
  collaboratorIDs: z.array(z.string()),
  ownerIDs: z.array(z.string()),
  message: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { visitId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  const condoId = request.nextUrl.searchParams.get('condoId')
  if (!condoId) {
    return NextResponse.json({ error: 'condoId requis' }, { status: 400 })
  }

  try {
    const visit = await getVisitDetail(condoId, params.visitId)
    if (!visit) {
      return NextResponse.json({ error: 'visite non trouvée' }, { status: 404 })
    }
    return NextResponse.json({ visit })
  } catch (error) {
    console.error(`GET /api/estale/visits/${params.visitId} :`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { visitId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  let body
  try {
    body = UpdateBody.parse(await request.json())
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  try {
    const visit = await updateVisit(params.visitId, body)
    return NextResponse.json({ visit })
  } catch (error) {
    console.error(`PATCH /api/estale/visits/${params.visitId} :`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
