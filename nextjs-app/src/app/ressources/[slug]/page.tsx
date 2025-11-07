import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ArticleWithAuthor } from '@/types/article'
import { getEffectiveFeaturedImage } from '@/lib/markdown-utils'
import { ArticleContent } from './ArticleContent'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Revalider la page toutes les heures (3600 secondes)
// Permet d'afficher automatiquement les modifications d'articles sans redéploiement
export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const { data: articles } = await supabase
      .from('articles')
      .select('slug')
      .eq('status', 'published')
    
    return articles?.map((article) => ({ slug: article.slug })) || []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const { data: article } = await supabase
      .from('articles')
      .select('title, meta_description, seo_title, featured_image_url, content')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (!article) {
      return {
        title: 'Article non trouvé — Beamô',
      }
    }

    // Obtenir l'image effective (featured_image_url ou première image du contenu)
    const effectiveImage = getEffectiveFeaturedImage(article.featured_image_url, article.content)

    return {
      title: article.seo_title || `${article.title} — Beamô`,
      description: article.meta_description || undefined,
      alternates: {
        canonical: `/ressources/${params.slug}`
      },
      openGraph: {
        title: article.title,
        description: article.meta_description || undefined,
        images: effectiveImage ? [effectiveImage] : undefined,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: article.meta_description || undefined,
        images: effectiveImage ? [effectiveImage] : undefined,
      },
    }
  } catch {
    return {
      title: 'Article non trouvé — Beamô',
    }
  }
}


export default async function ArticlePage({ params }: { params: { slug: string } }) {
  let article: ArticleWithAuthor | null = null

  try {
    const { data, error } = await supabase
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

    if (error || !data) {
      notFound()
    }

    article = data

    // Incrémenter le compteur de vues côté serveur
    if (article) {
      await supabase
        .from('articles')
        .update({ views_count: article.views_count + 1 })
        .eq('id', article.id)
    }

  } catch (error) {
    console.error('Error loading article:', error)
    notFound()
  }

  if (!article) notFound()

  // Obtenir l'image effective pour l'affichage
  const effectiveFeaturedImage = getEffectiveFeaturedImage(article.featured_image_url, article.content)

  const formattedDate = new Date(article.published_at!).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <ArticleContent
      article={article}
      effectiveFeaturedImage={effectiveFeaturedImage}
      formattedDate={formattedDate}
    />
  )
}

