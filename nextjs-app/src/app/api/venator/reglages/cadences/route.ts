import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { lireCadences, remplacerCadence } from '@/lib/venator/services/cadences-service'
import { cadenceReglageUpdateSchema } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

export async function GET() {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const cadences = await lireCadences(createVenatorAdminClient())
  return NextResponse.json({ cadences })
}

export async function PUT(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = cadenceReglageUpdateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const seuilsHeures = await remplacerCadence(createVenatorAdminClient(), parsed.data.profil, parsed.data.seuilsHeures)
    return NextResponse.json({ profil: parsed.data.profil, seuilsHeures })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
