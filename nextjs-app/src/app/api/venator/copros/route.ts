import { NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { listerCopros } from '@/lib/venator/services/copros-service'

export async function GET() {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const copros = await listerCopros(createVenatorAdminClient())
  return NextResponse.json({ copros })
}
