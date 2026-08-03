import { NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { loadMeCollaborator } from '@/lib/venator/estale-os'

// GET /api/venator/estale/me → { managerID } (lecture seule, pour préremplir l'émetteur de l'OS).
export async function GET() {
  const auth = await requireVenatorRole('gestionnaire')
  if (!auth.ok) return auth.response
  try {
    const { managerID } = await loadMeCollaborator()
    return NextResponse.json({ managerID })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur Estale' }, { status: 502 })
  }
}
