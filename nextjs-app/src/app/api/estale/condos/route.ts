import { NextResponse } from 'next/server'
import { getCondos, isEstaleConfigured } from '@/lib/estale-api'

export async function GET() {
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
