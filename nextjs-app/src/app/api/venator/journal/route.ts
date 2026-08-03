import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { listerJournal, logJournal } from '@/lib/venator/services/journal-service'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

const journalQuerySchema = z.object({ copro_id: z.string().uuid() })

const journalCreateSchema = z.object({
  copro_id: z.string().uuid(),
  contenu: z.string().min(1).max(5000),
  dossier_id: z.string().uuid().nullish(),
  ticket_id: z.string().uuid().nullish(),
  type_evenement: z.string().default('note'),
})

export async function GET(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const sp = req.nextUrl.searchParams
  const parsed = journalQuerySchema.safeParse({ copro_id: sp.get('copro_id') })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const entries = await listerJournal(createVenatorAdminClient(), parsed.data.copro_id)
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = journalCreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    await logJournal(createVenatorAdminClient(), parsed.data)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
