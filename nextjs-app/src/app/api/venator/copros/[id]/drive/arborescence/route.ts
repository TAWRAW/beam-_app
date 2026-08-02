import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { creerArborescenceCopro } from '@/lib/venator/services/drive-service'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

// Une quinzaine de créations Drive à la suite : au-delà du délai par défaut.
export const maxDuration = 60

/** Met en place l'arborescence type sous la copropriété. Idempotent. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  try {
    return NextResponse.json(await creerArborescenceCopro(createVenatorAdminClient(), params.id))
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
