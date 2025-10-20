import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'
import { 
  CreateArticleRequest, 
  ArticleFilters, 
  ArticleSortOptions,
  ArticleListResponse,
  isValidArticleStatus,
  isValidArticleCategory,
  validateArticle
} from '@/types/article'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/articles - Liste des articles avec filtres et pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 articles par page
    const offset = (page - 1) * limit

    // Paramètres de filtre
    const filters: ArticleFilters = {
      status: searchParams.get('status') as any || 'all',
      category: searchParams.get('category') as any || 'all',
      import_source: searchParams.get('import_source') as any || 'all',
      author_id: searchParams.get('author_id') || undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      published_after: searchParams.get('published_after') || undefined,
      published_before: searchParams.get('published_before') || undefined,
      facebook_status: searchParams.get('facebook_status') as any || 'all',
      linkedin_status: searchParams.get('linkedin_status') as any || 'all',
    }

    // Paramètres de tri
    const sort: ArticleSortOptions = {
      field: (searchParams.get('sort_field') as any) || 'created_at',
      direction: (searchParams.get('sort_direction') as any) || 'desc'
    }

    // Construction de la requête
    let query = supabaseAdmin
      .from('articles')
      .select(`
        *,
        author:profiles!author_id(
          id,
          full_name,
          email,
          avatar_url
        )
      `, { count: 'exact' })

    // Application des filtres
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    if (filters.import_source && filters.import_source !== 'all') {
      query = query.eq('import_source', filters.import_source)
    }

    if (filters.author_id) {
      query = query.eq('author_id', filters.author_id)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.published_after) {
      query = query.gte('published_at', filters.published_after)
    }

    if (filters.published_before) {
      query = query.lte('published_at', filters.published_before)
    }

    if (filters.facebook_status && filters.facebook_status !== 'all') {
      if (filters.facebook_status === 'published') {
        query = query.not('published_on_facebook', 'is', null)
      } else if (filters.facebook_status === 'not_published') {
        query = query.is('published_on_facebook', null)
      }
    }

    if (filters.linkedin_status && filters.linkedin_status !== 'all') {
      if (filters.linkedin_status === 'published') {
        query = query.not('published_on_linkedin', 'is', null)
      } else if (filters.linkedin_status === 'not_published') {
        query = query.is('published_on_linkedin', null)
      }
    }

    // Application du tri
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })

    // Application de la pagination
    query = query.range(offset, offset + limit - 1)

    const { data: articles, count, error } = await query

    if (error) {
      throw error
    }

    const totalPages = Math.ceil((count || 0) / limit)

    const response: ArticleListResponse = {
      articles: articles || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      filters,
      sort
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des articles' },
      { status: 500 }
    )
  }
}

// POST /api/articles - Création d'un nouvel article
export async function POST(request: NextRequest) {
  try {
    const body: CreateArticleRequest = await request.json()

    // Validation des données
    const validationErrors = validateArticle(body)
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationErrors },
        { status: 400 }
      )
    }

    // Générer le slug s'il n'est pas fourni
    let slug = body.slug
    if (!slug && body.title) {
      slug = slugify(body.title, {
        lower: true,
        strict: true,
        locale: 'fr'
      })
    }

    // Vérifier l'unicité du slug
    if (slug) {
      const { data: existingArticle } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingArticle) {
        // Ajouter un suffixe numérique si le slug existe déjà
        let counter = 1
        let newSlug = `${slug}-${counter}`
        
        while (true) {
          const { data: existing } = await supabaseAdmin
            .from('articles')
            .select('id')
            .eq('slug', newSlug)
            .single()

          if (!existing) {
            slug = newSlug
            break
          }
          
          counter++
          newSlug = `${slug}-${counter}`
          
          // Éviter les boucles infinies
          if (counter > 100) {
            throw new Error('Impossible de générer un slug unique')
          }
        }
      }
    }

    // Récupérer l'utilisateur actuel pour définir l'auteur si pas fourni
    let authorId = body.author_id
    if (!authorId) {
      const { data: currentUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()
      authorId = currentUser?.id
    }

    // Préparer les données d'insertion
    const articleData = {
      title: body.title,
      slug,
      meta_description: body.meta_description,
      content: body.content,
      excerpt: body.excerpt,
      featured_image_url: body.featured_image_url,
      author_id: authorId,
      category: body.category || 'general',
      tags: body.tags || [],
      status: body.status || 'draft',
      published_at: body.status === 'published' ? (body.published_at || new Date().toISOString()) : null,
      seo_title: body.seo_title,
      seo_keywords: body.seo_keywords
    }

    const { data: article, error } = await supabaseAdmin
      .from('articles')
      .insert(articleData)
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

    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'article' },
      { status: 500 }
    )
  }
}