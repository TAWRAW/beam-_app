import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { majTicket } from '@/lib/venator/services/tickets-service'
import { TICKET_STATUTS } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

const ticketPatchSchema = z.object({
  statut: z.enum(TICKET_STATUTS).optional(),
  dossier_id: z.string().uuid().nullish(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = ticketPatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const ticket = await majTicket(createVenatorAdminClient(), params.id, parsed.data)
    return NextResponse.json({ ticket })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
