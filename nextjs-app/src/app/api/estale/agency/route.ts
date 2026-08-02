import { NextResponse } from 'next/server'
import { getAgencyInfo, isEstaleConfigured } from '@/lib/estale-api'
import { requireAdmin } from '@/lib/server-auth'

export async function GET() {
  // Données Estale : réservées au cabinet. La route est publique sur Internet,
  // le middleware ne couvrant que /apps/* — la garde doit être ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json(
      {
        agency: null,
        error: 'API Estale non configurée',
        fallback: true
      },
      { status: 200 }
    )
  }

  try {
    const agency = await getAgencyInfo()

    if (!agency) {
      return NextResponse.json(
        {
          agency: null,
          error: 'Impossible de récupérer les infos agence',
          fallback: true
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ agency, fallback: false })
  } catch (error) {
    console.error('Erreur API agency:', error)
    return NextResponse.json(
      {
        agency: null,
        error: 'Erreur serveur',
        fallback: true
      },
      { status: 500 }
    )
  }
}
