import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { ajouterEtape, majEtape } from '@/lib/venator/services/dossiers-service'
import { etapeUpdateSchema } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

const etapeCreateSchema = z.object({ titre: z.string().min(1).max(200) })
const etapePatchSchema = etapeUpdateSchema.extend({ etape_id: z.string().uuid() })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = etapeCreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const etape = await ajouterEtape(createVenatorAdminClient(), params.id, parsed.data.titre)
    return NextResponse.json({ etape }, { status: 201 })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = etapePatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const { etape_id, ...patch } = parsed.data
    const etape = await majEtape(createVenatorAdminClient(), etape_id, patch)
    return NextResponse.json({ etape })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
