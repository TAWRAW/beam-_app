import { NextRequest, NextResponse } from 'next/server'
import { getCondoContracts, isEstaleConfigured } from '@/lib/estale-api'
import { requireAdmin } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  // Données Estale : réservées au cabinet. La route est publique sur Internet,
  // le middleware ne couvrant que /apps/* — la garde doit être ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const condoId = request.nextUrl.searchParams.get('condoId')

  if (!condoId) {
    return NextResponse.json(
      { error: 'condoId requis', contracts: [] },
      { status: 400 }
    )
  }

  if (!isEstaleConfigured()) {
    return NextResponse.json(
      { error: 'API Estale non configurée', contracts: [] },
      { status: 200 }
    )
  }

  try {
    const contracts = await getCondoContracts(condoId)
    return NextResponse.json({ contracts })
  } catch (error) {
    console.error('Erreur récupération contrats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue', contracts: [] },
      { status: 500 }
    )
  }
}
