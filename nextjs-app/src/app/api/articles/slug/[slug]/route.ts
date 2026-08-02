import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ArticleResponse } from '@/types/article'
import { requireAdmin } from '@/lib/server-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/articles/slug/[slug] - Récupérer un article par son slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Réservé au cabinet : le middleware ne filtre que /apps/*, une route API
  // reste joignable depuis Internet sans garde explicite ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    // Récupérer l'article par slug (seulement les articles publiés pour le public)
    const { data: article, error } = await supabaseAdmin
      .from('articles')
      .select(`
        *,
        author:profiles!author_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article non trouvé ou non publié' },
        { status: 404 }
      )
    }

    // Incrémenter le compteur de vues
    await supabaseAdmin
      .from('articles')
      .update({ views_count: article.views_count + 1 })
      .eq('id', article.id)

    // Mettre à jour l'objet article avec le nouveau compteur
    article.views_count += 1

    const response: ArticleResponse = {
      article
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching article by slug:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'article' },
      { status: 500 }
    )
  }
}

// PATCH /api/articles/slug/[slug] - Incrémenter les vues (pour les appels côté client)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Réservé au cabinet : le middleware ne filtre que /apps/*, une route API
  // reste joignable depuis Internet sans garde explicite ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    const { data: article } = await supabaseAdmin
      .from('articles')
      .select('id, views_count')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (!article) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('articles')
      .update({ views_count: article.views_count + 1 })
      .eq('id', article.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      message: 'Vue comptabilisée',
      views_count: article.views_count + 1
    })
  } catch (error) {
    console.error('Error incrementing article views:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la comptabilisation de la vue' },
      { status: 500 }
    )
  }
}