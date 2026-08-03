import { NextRequest, NextResponse } from 'next/server'
import { isEstaleConfigured } from '@/lib/estale-api'
import { getCondoConstatData } from '@/lib/estale/constat-queries'
import { requireAdmin } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  // Données Estale : réservées au cabinet. La route est publique sur Internet,
  // le middleware ne couvrant que /apps/* — la garde doit être ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const condoId = request.nextUrl.searchParams.get('condoId')

  if (!condoId) {
    return NextResponse.json(
      { error: 'condoId requis', condo: null },
      { status: 400 }
    )
  }

  if (!isEstaleConfigured()) {
    return NextResponse.json(
      { error: 'API Estale non configurée', condo: null },
      { status: 200 }
    )
  }

  try {
    const condo = await getCondoConstatData(condoId)
    return NextResponse.json({ condo })
  } catch (error) {
    console.error('Erreur récupération données constat:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue', condo: null },
      { status: 500 }
    )
  }
}
