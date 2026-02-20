import { NextResponse } from 'next/server'
import { getAgencyInfo, isEstaleConfigured } from '@/lib/estale-api'

export async function GET() {
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
