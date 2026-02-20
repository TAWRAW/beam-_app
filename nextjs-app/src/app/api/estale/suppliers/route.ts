import { NextResponse } from 'next/server'
import { getSuppliersByCondo, getSuppliersByCabinet, isEstaleConfigured } from '@/lib/estale-api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const condoId = searchParams.get('condoId')

  if (!isEstaleConfigured()) {
    return NextResponse.json(
      { error: 'API Estale non configurée', suppliers: [], fallback: true },
      { status: 200 }
    )
  }

  try {
    // Si un condoId est fourni, récupérer les prestataires de cette copropriété
    // Sinon, récupérer tous les prestataires du cabinet
    const suppliers = condoId
      ? await getSuppliersByCondo(condoId)
      : await getSuppliersByCabinet()

    return NextResponse.json({
      suppliers,
      fallback: suppliers.length === 0
    })
  } catch (error) {
    console.error('Erreur récupération prestataires:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue', suppliers: [], fallback: true },
      { status: 500 }
    )
  }
}
