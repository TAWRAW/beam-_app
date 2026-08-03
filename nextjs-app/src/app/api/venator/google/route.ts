import { NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { deconnecter, lireConnexion } from '@/lib/venator/google/client'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

/** État de la connexion Google. Ne renvoie jamais de jeton. */
export async function GET() {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const connexion = await lireConnexion(createVenatorAdminClient())
  return NextResponse.json({ connexion })
}

/** Déconnexion : révocation côté Google puis purge locale. */
export async function DELETE() {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  try {
    await deconnecter(createVenatorAdminClient())
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
