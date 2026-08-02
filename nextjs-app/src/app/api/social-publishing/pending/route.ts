// API endpoint: GET /api/social-publishing/pending
// Description: Récupère les articles publiés mais non postés sur les réseaux sociaux
// Usage: Pour n8n automation workflow

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { GetPendingArticlesResponse, SocialPlatform } from '@/types/social-publishing'
import { requireAdmin } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Réservé au cabinet : le middleware ne filtre que /apps/*, une route API
  // reste joignable depuis Internet sans garde explicite ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    // Récupérer les paramètres de requête
    const searchParams = request.nextUrl.searchParams
    const platform = (searchParams.get('platform') || 'all') as SocialPlatform | 'all'
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Validation des paramètres
    if (!['facebook', 'linkedin', 'all'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be: facebook, linkedin, or all' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Authentification optionnelle (pour sécuriser l'endpoint en production)
    // Vous pouvez ajouter ici une vérification d'API key pour n8n
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.N8N_API_KEY

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      )
    }

    // Connexion à Supabase
    const supabase = createSupabaseServerClient()

    // Construire la requête Supabase
    let query = supabase
      .from('articles')
      .select('id, title, slug, excerpt, featured_image_url, published_at, published_on_facebook, published_on_linkedin')
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: true })
      .limit(limit)

    // Appliquer les filtres selon la plateforme
    if (platform === 'facebook') {
      query = query.is('published_on_facebook', null)
    } else if (platform === 'linkedin') {
      query = query.is('published_on_linkedin', null)
    } else {
      // Pour 'all', on veut les articles non publiés sur au moins un réseau
      query = query.or('published_on_facebook.is.null,published_on_linkedin.is.null')
    }

    const { data: articles, error } = await query

    if (error) {
      console.error('Error fetching pending articles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch articles', details: error.message },
        { status: 500 }
      )
    }

    // Construire la réponse
    const response: GetPendingArticlesResponse = {
      articles: articles || [],
      count: articles?.length || 0,
      platform
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Unexpected error in GET /api/social-publishing/pending:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
