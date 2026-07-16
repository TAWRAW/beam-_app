import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { ajouterAuFil, listerFil } from '@/lib/venator/services/fil-service'
import { filCreateSchema } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

const filQuerySchema = z.object({
  parent_type: z.enum(['dossier', 'ticket']),
  parent_id: z.string().uuid(),
})

export async function GET(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const sp = req.nextUrl.searchParams
  const parsed = filQuerySchema.safeParse({
    parent_type: sp.get('parent_type'),
    parent_id: sp.get('parent_id'),
  })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const messages = await listerFil(createVenatorAdminClient(), parsed.data.parent_type, parsed.data.parent_id)
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = filCreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const result = await ajouterAuFil(createVenatorAdminClient(), parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
