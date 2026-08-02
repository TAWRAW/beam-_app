import { NextRequest, NextResponse } from 'next/server'
import { getCondoDetails, isEstaleConfigured } from '@/lib/estale-api'
import { requireAdmin } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  // Données Estale : réservées au cabinet. La route est publique sur Internet,
  // le middleware ne couvrant que /apps/* — la garde doit être ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const condoId = request.nextUrl.searchParams.get('condoId')

  if (!condoId) {
    return NextResponse.json(
      { error: 'condoId requis', gestionnaire: null },
      { status: 400 }
    )
  }

  if (!isEstaleConfigured()) {
    return NextResponse.json(
      { error: 'API Estale non configurée', gestionnaire: null },
      { status: 200 }
    )
  }

  try {
    const details = await getCondoDetails(condoId)
    return NextResponse.json({
      gestionnaire: details?.gestionnaire || null,
    })
  } catch (error) {
    console.error('Erreur récupération détails copropriété:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue', gestionnaire: null },
      { status: 500 }
    )
  }
}
