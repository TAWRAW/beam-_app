import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User, Eye } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { ArticleWithAuthor } from '@/types/article'
import { MarkdownPreview } from '@/components/ui/MarkdownPreview'
import { getEffectiveFeaturedImage } from '@/lib/markdown-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    <main className="section">
      <div className="container max-w-4xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href="/ressources" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux ressources
          </Link>
        </div>

        {/* Header de l'article */}
        <header className="mb-8">
          {/* Image de couverture */}
          {effectiveFeaturedImage && (
            <img
              src={effectiveFeaturedImage}
              alt={article.title}
              className="w-full h-64 md:h-80 object-cover rounded-lg mb-8"
            />
          )}

          {/* Catégorie et métadonnées */}
          <div className="flex items-center gap-4 mb-4">
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {article.category}
            </span>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.reading_time_minutes} min de lecture
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.views_count + 1} vues
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>


          {/* Auteur */}
          {article.author && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {article.author.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author.full_name || 'Auteur'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {article.author.full_name || 'Auteur anonyme'}
                </p>
                <p className="text-sm text-gray-600">
                  Article publié le {formattedDate}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Contenu de l'article */}
        <article className="max-w-none">
          <MarkdownPreview content={article.content} />
        </article>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation vers d'autres articles */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <Link 
              href="/ressources" 
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Découvrir d'autres articles
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

