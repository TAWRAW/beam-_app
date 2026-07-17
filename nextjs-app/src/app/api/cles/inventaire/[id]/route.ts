// src/app/api/cles/inventaire/[id]/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server-auth'
import { createClesAdminClient } from '@/lib/cles/supabase-admin'
import { updateInventaire, deleteInventaire, CleError } from '@/lib/cles/cles-service'

const PatchBody = z.object({
  condo_ref: z.string().nullish(),
  type: z.enum(['badge', 'cle', 'telecommande', 'autre']).optional(),
  libelle: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  prix_unitaire_ht: z.number().min(0).optional(),
  taux_tva: z.number().min(0).max(100).optional(),
  actif: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const parsed = PatchBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const item = await updateInventaire(createClesAdminClient(), params.id, parsed.data)
    return NextResponse.json({ item })
  } catch (error) {
    console.error('PATCH /api/cles/inventaire/[id] :', error)
    return NextResponse.json(
      { error: error instanceof CleError ? error.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    await deleteInventaire(createClesAdminClient(), params.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/cles/inventaire/[id] :', error)
    // on delete restrict : clé déjà remise → message clair
    const msg = error instanceof CleError ? error.message : 'Erreur serveur'
    const isRestrict = /violat|restrict|foreign key/i.test(msg)
    return NextResponse.json(
      { error: isRestrict ? 'Cette clé a déjà été remise : impossible de la supprimer (désactivez-la).' : msg },
      { status: isRestrict ? 409 : 500 },
    )
  }
}
