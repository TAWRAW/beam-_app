import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { creerEquipement, listerEquipements } from '@/lib/venator/services/equipements-service'
import { equipementCreateSchema } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

const listQuerySchema = z.object({ copro_id: z.string().uuid() })

export async function GET(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const sp = req.nextUrl.searchParams
  const parsed = listQuerySchema.safeParse({ copro_id: sp.get('copro_id') })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const equipements = await listerEquipements(createVenatorAdminClient(), parsed.data.copro_id)
  return NextResponse.json({ equipements })
}

export async function POST(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = equipementCreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const equipement = await creerEquipement(createVenatorAdminClient(), parsed.data)
    return NextResponse.json({ equipement }, { status: 201 })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
