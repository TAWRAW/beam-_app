// src/app/api/estale/visits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server-auth'
import {
  getCondoVisits,
  createVisit,
  isEstaleConfigured,
} from '@/lib/estale-api'

const CreateBody = z.object({
  category: z.enum(['CONTRACTUAL', 'NON_CONTRACTUAL']),
  date: z.string(),
  period: z.number().int().positive(),
  object: z.string().min(1),
  condoID: z.string().min(1),
  organiserID: z.string().min(1),
  collaboratorIDs: z.array(z.string()),
  ownerIDs: z.array(z.string()),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json(
      { configured: false, error: 'API Estale non configurée', visits: [] },
      { status: 200 },
    )
  }

  const condoId = request.nextUrl.searchParams.get('condoId')
  const archived = request.nextUrl.searchParams.get('archived') === 'true'
  if (!condoId) {
    return NextResponse.json({ error: 'condoId requis' }, { status: 400 })
  }

  try {
    const visits = await getCondoVisits(condoId, archived)
    return NextResponse.json({ configured: true, visits })
  } catch (error) {
    console.error('GET /api/estale/visits :', error)
    return NextResponse.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        visits: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  let body
  try {
    body = CreateBody.parse(await request.json())
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  try {
    const visit = await createVisit(body)
    return NextResponse.json({ visit }, { status: 201 })
  } catch (error) {
    console.error('POST /api/estale/visits :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
