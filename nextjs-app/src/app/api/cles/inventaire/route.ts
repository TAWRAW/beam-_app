// src/app/api/cles/inventaire/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server-auth'
import { createClesAdminClient } from '@/lib/cles/supabase-admin'
import { listInventaire, createInventaire, CleError } from '@/lib/cles/cles-service'

const CreateBody = z.object({
  estale_condo_id: z.string().min(1),
  condo_ref: z.string().nullish(),
  type: z.enum(['badge', 'cle', 'telecommande', 'autre']),
  libelle: z.string().min(1),
  stock: z.number().int().min(0),
  prix_unitaire_ht: z.number().min(0),
  taux_tva: z.number().min(0).max(100).optional(),
  actif: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const condoId = request.nextUrl.searchParams.get('condoId')
  if (!condoId) {
    return NextResponse.json({ error: 'condoId requis' }, { status: 400 })
  }

  try {
    const items = await listInventaire(createClesAdminClient(), condoId)
    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/cles/inventaire :', error)
    return NextResponse.json(
      { error: error instanceof CleError ? error.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const parsed = CreateBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const item = await createInventaire(
      createClesAdminClient(),
      parsed.data,
      guard.supabaseUserId ?? null,
    )
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/cles/inventaire :', error)
    return NextResponse.json(
      { error: error instanceof CleError ? error.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
