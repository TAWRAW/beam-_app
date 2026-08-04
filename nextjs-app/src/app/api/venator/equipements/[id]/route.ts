import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { majEquipement, supprimerEquipement } from '@/lib/venator/services/equipements-service'
import { equipementUpdateSchema } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = equipementUpdateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const equipement = await majEquipement(createVenatorAdminClient(), params.id, parsed.data)
    return NextResponse.json({ equipement })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('gestionnaire')
  if (!auth.ok) return auth.response
  await supprimerEquipement(createVenatorAdminClient(), params.id)
  return NextResponse.json({ ok: true })
}
