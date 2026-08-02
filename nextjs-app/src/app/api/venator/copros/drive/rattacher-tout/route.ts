import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { rattacherCoprosParReference } from '@/lib/venator/services/drive-service'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

// Une douzaine de mises à jour après un appel Drive : au-delà du délai par défaut.
export const maxDuration = 60

/** Rattache toutes les copropriétés à leur dossier Drive, par référence Estale. */
export async function POST(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parentId = typeof body?.parentId === 'string' ? body.parentId.trim() : ''
  if (!parentId) {
    return NextResponse.json({ error: 'Dossier Drive parent manquant.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await rattacherCoprosParReference(createVenatorAdminClient(), parentId))
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
