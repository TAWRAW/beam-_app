import { NextResponse } from 'next/server'
import { introspectAllTypeNames, introspectType, isEstaleConfigured } from '@/lib/estale-api'
import { requireAdmin } from '@/lib/server-auth'

export async function GET() {
  // Données Estale : réservées au cabinet. La route est publique sur Internet,
  // le middleware ne couvrant que /apps/* — la garde doit être ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

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
