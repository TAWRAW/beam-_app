import { NextResponse } from 'next/server'
import { introspectAllTypeNames, introspectType, isEstaleConfigured } from '@/lib/estale-api'

export async function GET() {
  if (!isEstaleConfigured()) {
    return NextResponse.json(
      { error: 'API Estale non configurée', types: {} },
      { status: 200 }
    )
  }

  try {
    const typeNames = await introspectAllTypeNames()

    const types: Record<string, { name: string; type: string; kind: string }[]> = {}
    for (const t of typeNames) {
      types[t.name] = await introspectType(t.name)
    }

    return NextResponse.json({ types })
  } catch (error) {
    console.error('Erreur introspection Estale:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue', types: {} },
      { status: 500 }
    )
  }
}
