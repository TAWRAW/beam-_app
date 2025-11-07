/**
 * API ROUTE: On-Demand Revalidation
 *
 * Permet de revalider instantanément une page statique/ISR sans attendre
 * le délai de revalidation automatique ou un rebuild complet.
 *
 * USAGE:
 * POST /api/revalidate
 * Body: {
 *   "secret": "votre-secret-token",
 *   "path": "/ressources/slug-article"
 * }
 *
 * SÉCURITÉ:
 * - Token secret requis (REVALIDATION_TOKEN dans .env)
 * - Empêche les revalidations non autorisées
 *
 * DÉCLENCHEMENT:
 * - Webhook Supabase après modification d'article
 * - Workflow n8n automatisé
 * - Manuellement via curl/Postman pour debug
 */

import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, path } = body

    // Vérification du token secret
    if (!secret || secret !== process.env.REVALIDATION_TOKEN) {
      console.error('❌ Revalidation failed: Invalid or missing secret token')
      return NextResponse.json(
        {
          message: 'Invalid token',
          error: 'Unauthorized'
        },
        { status: 401 }
      )
    }

    // Vérification du path
    if (!path || typeof path !== 'string') {
      console.error('❌ Revalidation failed: Missing or invalid path')
      return NextResponse.json(
        {
          message: 'Path is required and must be a string',
          error: 'Bad Request'
        },
        { status: 400 }
      )
    }

    // Validation basique du format du path
    if (!path.startsWith('/')) {
      console.error('❌ Revalidation failed: Path must start with /')
      return NextResponse.json(
        {
          message: 'Path must start with /',
          error: 'Bad Request'
        },
        { status: 400 }
      )
    }

    // Revalidation de la page
    console.log(`🔄 Revalidating path: ${path}`)
    revalidatePath(path)

    console.log(`✅ Revalidation successful: ${path}`)
    return NextResponse.json(
      {
        revalidated: true,
        path,
        message: `Successfully revalidated ${path}`,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Revalidation error:', error)
    return NextResponse.json(
      {
        message: 'Error revalidating',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Support pour GET (debug/healthcheck)
export async function GET() {
  return NextResponse.json(
    {
      message: 'Revalidation API is active',
      usage: 'POST with { secret: string, path: string }',
      status: 'ready'
    },
    { status: 200 }
  )
}
