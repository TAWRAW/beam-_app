import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { estaleGraphQL, isEstaleConfigured } from '@/lib/estale-api'

export const dynamic = 'force-dynamic'

interface MeResponse {
  me?: {
    collaborator?: {
      id: string
      fullname?: string | null
      email?: string | null
    } | null
  } | null
}

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  try {
    const data = await estaleGraphQL<MeResponse>(`
      { me { collaborator { id fullname email } } }
    `)
    const c = data.me?.collaborator
    if (!c?.id) {
      return NextResponse.json(
        { error: 'Collaborator estale introuvable pour cet utilisateur' },
        { status: 404 },
      )
    }
    return NextResponse.json({
      collaborator: { id: c.id, fullname: c.fullname || null, email: c.email || null },
    })
  } catch (error) {
    console.error('GET /api/estale/me :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
