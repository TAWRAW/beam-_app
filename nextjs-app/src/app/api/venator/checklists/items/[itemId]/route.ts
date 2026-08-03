import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { cocherItem } from '@/lib/venator/services/checklist-service'
import { checklistItemUpdateSchema } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = checklistItemUpdateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const item = await cocherItem(createVenatorAdminClient(), params.itemId, parsed.data.fait)
    return NextResponse.json({ item })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
