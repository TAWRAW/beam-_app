import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import slugify from 'slugify'
import {
  NotionArticleImport,
  isValidArticleCategory,
  isValidArticleType,
  ArticleCategory,
  ArticleType
} from '@/types/article'
import { authenticateApiKey } from '@/lib/api-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Endpoint d'importation d'articles depuis Notion (via n8n)
 * POST /api/articles/import
 *
 * Headers requis:
 * - X-API-Key: Clé d'authentification API
 *
 * Body (JSON):
 * - titre: string (requis)
 * - slug: string (optionnel, généré automatiquement si absent)
 * - contenu: string (requis)
 * - extrait: string (optionnel)
 * - categorie: string (optionnel, défaut: "general")
 * - type: string (optionnel, défaut: "articles")
 * - tags: string (optionnel, format: "tag1, tag2, tag3")
 * - piece_jointe: string (optionnel, URL Google Drive)
 * - meta_description: string (optionnel)
 * - meta_title: string (optionnel)
 */
export async function POST(request: NextRequest) {
  // 1. Authentification
  const authResult = authenticateApiKey(request)
  if (!authResult.authenticated) {
    console.warn('[API Import] Tentative d\'accès non autorisée')
    return NextResponse.json(
      {
        success: false,
        error: authResult.error
      },
      { status: 401 }
    )
  }

  try {
    // 2. Récupération et validation des données
    const body: NotionArticleImport = await request.json()

    // Validation des champs requis
    if (!body.titre || body.titre.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Le champ "titre" est requis'
        },
        { status: 400 }
      )
    }

    if (!body.contenu || body.contenu.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Le champ "contenu" est requis'
        },
        { status: 400 }
      )
    }

    // 3. Génération du slug
    let slug = body.slug
    if (!slug || slug.trim() === '') {
      slug = slugify(body.titre, {
        lower: true,
        strict: true,
        locale: 'fr'
      })
    } else {
      slug = slugify(slug, {
        lower: true,
        strict: true,
        locale: 'fr'
      })
    }

    // 4. Vérifier l'unicité du slug et l'ajuster si nécessaire
    const { data: existingArticle } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingArticle) {
      // Ajouter un suffixe numérique
      let counter = 1
      let newSlug = `${slug}-${counter}`

      while (counter <= 100) {
        const { data: existing } = await supabaseAdmin
          .from('articles')
          .select('id')
          .eq('slug', newSlug)
          .maybeSingle()

        if (!existing) {
          slug = newSlug
          break
        }

        counter++
        newSlug = `${slug}-${counter}`
      }

      if (counter > 100) {
        return NextResponse.json(
          {
            success: false,
            error: 'Impossible de générer un slug unique. Veuillez fournir un slug personnalisé.'
          },
          { status: 400 }
        )
      }
    }

    // 5. Validation et normalisation de la catégorie
    let category: ArticleCategory = 'general'
    if (body.categorie && typeof body.categorie === 'string') {
      const normalizedCategory = body.categorie.toLowerCase().trim()
      if (isValidArticleCategory(normalizedCategory)) {
        category = normalizedCategory
      } else {
        console.warn(`[API Import] Catégorie invalide "${body.categorie}", utilisation de "general" par défaut`)
      }
    }

    // 6. Validation et normalisation du type
    let type: ArticleType = 'articles'
    if (body.type && typeof body.type === 'string') {
      const normalizedType = body.type.toLowerCase().trim()
      if (isValidArticleType(normalizedType)) {
        type = normalizedType
      } else {
        console.warn(`[API Import] Type invalide "${body.type}", utilisation de "articles" par défaut`)
      }
    }

    // 7. Traitement des tags
    let tags: string[] = []
    if (body.tags && body.tags.trim() !== '') {
      tags = body.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
    }

    // 8. Récupérer un auteur admin par défaut
    const { data: adminUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    if (!adminUser) {
      console.error('[API Import] Aucun utilisateur admin trouvé pour l\'attribution d\'auteur')
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration du serveur incorrecte: aucun auteur disponible'
        },
        { status: 500 }
      )
    }

    // 9. Préparer les données d'insertion
    const articleData = {
      title: body.titre.trim(),
      slug,
      content: body.contenu,
      excerpt: body.extrait?.trim() || '',
      category,
      type,
      tags,
      attachment_url: body.piece_jointe || null,
      meta_description: body.meta_description?.trim() || body.extrait?.trim() || '',
      seo_title: body.meta_title?.trim() || body.titre.trim(),
      author_id: adminUser.id,
      status: 'draft' as const, // Créé en brouillon par défaut
      featured_image_url: null,
      seo_keywords: tags.join(', '),
      published_at: null,
      import_source: 'notion' as const // Marquer l'article comme importé depuis Notion
    }

    // 10. Créer l'article dans Supabase
    const { data: article, error: insertError } = await supabaseAdmin
      .from('articles')
      .insert(articleData)
      .select(`
        id,
        title,
        slug,
        status,
        category,
        type,
        created_at
      `)
      .single()

    if (insertError) {
      console.error('[API Import] Erreur lors de la création de l\'article:', insertError)
      throw insertError
    }

    // 11. Logger le succès
    console.log(`[API Import] Article importé avec succès: ${article.id} - "${article.title}"`)

    // 12. Retourner la réponse
    const editUrl = `https://www.xn--beam-yqa.fr/apps/articles/edit/${article.id}`

    return NextResponse.json(
      {
        success: true,
        article_id: article.id,
        message: 'Article importé avec succès',
        url_edition: editUrl,
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          status: article.status,
          category: article.category,
          type: article.type,
          created_at: article.created_at
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[API Import] Erreur serveur lors de l\'importation:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur lors de la création de l\'article',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * Endpoint de health check pour vérifier que l'API est opérationnelle
 * GET /api/articles/import
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateApiKey(request)
  if (!authResult.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: authResult.error
      },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'API d\'importation opérationnelle',
    timestamp: new Date().toISOString(),
    endpoint: '/api/articles/import',
    methods: ['POST', 'GET']
  })
}
