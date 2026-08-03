import { NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { syncCopros } from '@/lib/venator/services/copros-service'
import { getCondos } from '@/lib/estale-api'

export async function POST() {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const result = await syncCopros(createVenatorAdminClient(), getCondos)
  return NextResponse.json(result)
}
