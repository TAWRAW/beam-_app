// src/app/api/estale/graphql/route.ts
// Proxy générique pour exécuter une query/mutation GraphQL libre sur Estale.
// Usage admin-only (mêmes garde-fous que les autres routes /api/estale/*).
// À utiliser pour les opérations Estale non couvertes par les routes dédiées.
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { estaleGraphQL, isEstaleConfigured } from '@/lib/estale-api'

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }
  let body: { query?: string; variables?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'payload invalide' }, { status: 400 })
  }
  if (!body.query) {
    return NextResponse.json({ error: 'query manquante' }, { status: 400 })
  }
  try {
    const data = await estaleGraphQL(body.query, body.variables || {})
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur GraphQL Estale' },
      { status: 500 },
    )
  }
}
