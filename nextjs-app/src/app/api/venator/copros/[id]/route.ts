import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

// Seul le rattachement Drive est modifiable : le reste des copropriétés vient
// d'Estale par synchronisation, l'éditer ici créerait une divergence silencieuse.
const patchSchema = z.object({ drive_folder_id: z.string().min(1).nullable() })

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const { data, error } = await createVenatorAdminClient()
      .from('venator_copros')
      .update({ drive_folder_id: parsed.data.drive_folder_id })
      .eq('id', params.id)
      .select()
      .single()
    if (error || !data) throw new VenatorError('not_found', error?.message ?? 'Copropriété introuvable')
    return NextResponse.json({ copro: data })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
