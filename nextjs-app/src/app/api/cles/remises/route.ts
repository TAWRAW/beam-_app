// src/app/api/cles/remises/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server-auth'
import { createClesAdminClient } from '@/lib/cles/supabase-admin'
import {
  listRemises,
  listRemisesNonFacturees,
  createRemise,
  CleError,
} from '@/lib/cles/cles-service'

const CreateBody = z.object({
  estale_condo_id: z.string().min(1),
  condo_ref: z.string().nullish(),
  cle_id: z.string().uuid(),
  cle_libelle: z.string().min(1),
  cle_type: z.enum(['badge', 'cle', 'telecommande', 'autre']),
  estale_owner_id: z.string().min(1),
  owner_ref: z.string().nullish(),
  owner_nom: z.string().min(1),
  quantite: z.number().int().positive(),
  date_remise: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const condoId = request.nextUrl.searchParams.get('condoId') || undefined
  const ownerId = request.nextUrl.searchParams.get('ownerId') || undefined
  const nonFacturees = request.nextUrl.searchParams.get('nonFacturees') === 'true'

  try {
    const db = createClesAdminClient()
    if (nonFacturees) {
      if (!condoId || !ownerId) {
        return NextResponse.json({ error: 'condoId et ownerId requis' }, { status: 400 })
      }
      const items = await listRemisesNonFacturees(db, condoId, ownerId)
      return NextResponse.json({ items })
    }
    const items = await listRemises(db, condoId)
    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/cles/remises :', error)
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
    const item = await createRemise(
      createClesAdminClient(),
      parsed.data,
      guard.supabaseUserId ?? null,
    )
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/cles/remises :', error)
    const msg = error instanceof CleError ? error.message : 'Erreur serveur'
    // Stock insuffisant = erreur métier → 409
    const isStock = /stock/i.test(msg)
    return NextResponse.json({ error: msg }, { status: isStock ? 409 : 500 })
  }
}
