// API endpoint: POST /api/social-publishing/mark-published
// Description: Marque un article comme publié sur un réseau social spécifique
// Usage: Appelé par n8n après publication réussie sur Facebook/LinkedIn

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { MarkPublishedRequest, MarkPublishedResponse } from '@/types/social-publishing'
import { requireAdmin } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Réservé au cabinet : le middleware ne filtre que /apps/*, une route API
  // reste joignable depuis Internet sans garde explicite ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    // Authentification API key (recommandé pour sécuriser l'endpoint)
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.N8N_API_KEY

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      )
    }

    // Parser le body de la requête
    const body: MarkPublishedRequest = await request.json()
    const { article_id, platform } = body

    // Validation des paramètres
    if (!article_id) {
      return NextResponse.json(
        { error: 'Missing required field: article_id' },
        { status: 400 }
      )
    }

    if (!platform || !['facebook', 'linkedin'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be: facebook or linkedin' },
        { status: 400 }
      )
    }

    // Connexion à Supabase
    const supabase = createSupabaseServerClient()

    // Déterminer la colonne à mettre à jour
    const columnName = platform === 'facebook' ? 'published_on_facebook' : 'published_on_linkedin'
    const now = new Date().toISOString()

    // Mettre à jour l'article
    const { data, error } = await supabase
      .from('articles')
      .update({ [columnName]: now })
      .eq('id', article_id)
      .is(columnName, null) // Seulement si pas déjà publié
      .select('id, title, published_on_facebook, published_on_linkedin')
      .single()

    if (error) {
      console.error(`Error marking article ${article_id} as published on ${platform}:`, error)

      // Vérifier si l'article existe
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found or already published on this platform' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to update article', details: error.message },
        { status: 500 }
      )
    }

    // Construire la réponse
    const response: MarkPublishedResponse = {
      success: true,
      article_id: data.id,
      platform,
      published_at: now,
      message: `Article successfully marked as published on ${platform}`
    }

    console.log(`✅ Article "${data.title}" (${data.id}) published on ${platform}`)

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in POST /api/social-publishing/mark-published:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
