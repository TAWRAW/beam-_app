// src/app/api/cles/factures/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server-auth'
import { createClesAdminClient } from '@/lib/cles/supabase-admin'
import { listFactures, createFacture, CleError } from '@/lib/cles/cles-service'

const CreateBody = z
  .object({
    estale_condo_id: z.string().min(1),
    condo_ref: z.string().nullish(),
    estale_owner_id: z.string().min(1),
    owner_ref: z.string().nullish(),
    owner_nom: z.string().optional(),
    owner_snapshot: z.record(z.unknown()),
    cabinet_snapshot: z.record(z.unknown()),
    remise_ids: z.array(z.string().uuid()).optional(),
    new_lignes: z
      .array(z.object({ cle_id: z.string().uuid(), quantite: z.number().int().positive() }))
      .optional(),
    taux_tva: z.number().min(0).max(100).optional(),
  })
  .refine((d) => (d.remise_ids?.length ?? 0) > 0 || (d.new_lignes?.length ?? 0) > 0, {
    message: 'Sélectionnez au moins une clé à facturer',
  })

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    const items = await listFactures(createClesAdminClient())
    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/cles/factures :', error)
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
    const facture = await createFacture(
      createClesAdminClient(),
      parsed.data,
      guard.supabaseUserId ?? null,
    )
    return NextResponse.json({ facture }, { status: 201 })
  } catch (error) {
    console.error('POST /api/cles/factures :', error)
    const msg = error instanceof CleError ? error.message : 'Erreur serveur'
    const isBusiness = /facturée|introuvable|correspond|sélection/i.test(msg)
    return NextResponse.json({ error: msg }, { status: isBusiness ? 409 : 500 })
  }
}
