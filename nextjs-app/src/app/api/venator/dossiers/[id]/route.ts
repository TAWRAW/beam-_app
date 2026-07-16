import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { detailDossier, cloreDossier, majStatutDossier } from '@/lib/venator/services/dossiers-service'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

const patchSchema = z.object({ action: z.literal('clore') }).or(
  z.object({ statut: z.enum(['ouvert', 'en_cours', 'en_attente']) })
)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  try {
    const result = await detailDossier(createVenatorAdminClient(), params.id)
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const db = createVenatorAdminClient()
    const dossier = 'action' in parsed.data
      ? await cloreDossier(db, params.id)
      : await majStatutDossier(db, params.id, parsed.data.statut)
    return NextResponse.json({ dossier })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
