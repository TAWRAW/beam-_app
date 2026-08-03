import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { lireTousGabarits, remplacerGabarit } from '@/lib/venator/services/gabarits-service'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'
import { DOSSIER_TYPES } from '@/lib/venator/types'

const putSchema = z.object({
  type: z.enum(DOSSIER_TYPES),
  etapes: z
    .array(
      z.object({
        titre: z.string().trim().min(1).max(200),
        // Borné à ~2 ans : au-delà, c'est une faute de saisie plutôt qu'une échéance.
        echeanceOffsetJours: z.number().int().min(0).max(730).nullable().optional(),
      })
    )
    .max(50),
})

export async function GET() {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  try {
    const gabarits = await lireTousGabarits(createVenatorAdminClient())
    return NextResponse.json({ gabarits })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = putSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const etapes = await remplacerGabarit(
      createVenatorAdminClient(),
      parsed.data.type,
      parsed.data.etapes
    )
    return NextResponse.json({ type: parsed.data.type, etapes })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
