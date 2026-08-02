import { NextResponse } from 'next/server'
import { getCondos, isEstaleConfigured } from '@/lib/estale-api'
import { requireAdmin } from '@/lib/server-auth'

export async function GET() {
  // Données Estale : réservées au cabinet. La route est publique sur Internet,
  // le middleware ne couvrant que /apps/* — la garde doit être ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json(
      { error: 'API Estale non configurée', condos: [], gestionnaire: null },
      { status: 200 }
    )
  }

  try {
    const { condos, collaborator } = await getCondos()
    return NextResponse.json({
      condos,
      gestionnaire: collaborator || null,
    })
  } catch (error) {
    console.error('Erreur récupération condos:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue', condos: [], gestionnaire: null },
      { status: 500 }
    )
  }
}
