import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'
import { 
  UpdateArticleRequest,
  ArticleResponse,
  validateArticle
} from '@/types/article'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/articles/[id] - Récupérer un article spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      .eq('id', params.id)
      .single()

    if (error || !article) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    const response: ArticleResponse = {
      article
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'article' },
      { status: 500 }
    )
  }
}

// PUT /api/articles/[id] - Mettre à jour un article
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateArticleRequest = await request.json()

    // Validation des données
    const validationErrors = validateArticle(body)
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationErrors },
        { status: 400 }
      )
    }

    // Vérifier que l'article existe
    const { data: existingArticle } = await supabaseAdmin
      .from('articles')
      .select('id, slug, title, published_at, status')
      .eq('id', params.id)
      .single()

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    // Gérer le slug si le titre a changé
    let slug = body.slug
    if (body.title && body.title !== existingArticle.title) {
      if (!slug) {
        slug = slugify(body.title, {
          lower: true,
          strict: true,
          locale: 'fr'
        })
      }

      // Vérifier l'unicité du slug (en excluant l'article actuel)
      const { data: slugConflict } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .neq('id', params.id)
        .single()

      if (slugConflict) {
        // Ajouter un suffixe numérique si le slug existe déjà
        let counter = 1
        let newSlug = `${slug}-${counter}`
        
        while (true) {
          const { data: existing } = await supabaseAdmin
            .from('articles')
            .select('id')
            .eq('slug', newSlug)
            .neq('id', params.id)
            .single()

          if (!existing) {
            slug = newSlug
            break
          }
          
          counter++
          newSlug = `${slug}-${counter}`
          
          if (counter > 100) {
            throw new Error('Impossible de générer un slug unique')
          }
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (slug !== undefined) updateData.slug = slug
    if (body.meta_description !== undefined) updateData.meta_description = body.meta_description
    if (body.content !== undefined) updateData.content = body.content
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
    if (body.featured_image_url !== undefined) updateData.featured_image_url = body.featured_image_url
    if (body.author_id !== undefined) updateData.author_id = body.author_id
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.seo_title !== undefined) updateData.seo_title = body.seo_title
    if (body.seo_keywords !== undefined) updateData.seo_keywords = body.seo_keywords

    // Gérer le statut et la date de publication
    if (body.status !== undefined) {
      updateData.status = body.status
      
      if (body.status === 'published') {
        // Si on publie l'article et qu'il n'a pas de date de publication
        if (!existingArticle.published_at) {
          updateData.published_at = body.published_at || new Date().toISOString()
        } else if (body.published_at) {
          updateData.published_at = body.published_at
        }
      } else if (body.status === 'draft') {
        // Si on remet en brouillon, on peut optionnellement supprimer la date de publication
        if (body.published_at === null) {
          updateData.published_at = null
        }
      }
    }

    const { data: article, error } = await supabaseAdmin
      .from('articles')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        author:profiles!author_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single()

    if (error) {
      throw error
    }

    const response: ArticleResponse = {
      article
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'article' },
      { status: 500 }
    )
  }
}

// DELETE /api/articles/[id] - Supprimer un article
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que l'article existe
    const { data: existingArticle } = await supabaseAdmin
      .from('articles')
      .select('id, title')
      .eq('id', params.id)
      .single()

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      message: 'Article supprimé avec succès',
      deletedId: params.id 
    })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'article' },
      { status: 500 }
    )
  }
}