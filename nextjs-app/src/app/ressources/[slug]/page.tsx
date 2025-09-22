import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User, Eye } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { ArticleWithAuthor } from '@/types/article'

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
      .select('title, meta_description, seo_title, featured_image_url')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (!article) {
      return {
        title: 'Article non trouvé — Beamô',
      }
    }

    return {
      title: article.seo_title || `${article.title} — Beamô`,
      description: article.meta_description || undefined,
      openGraph: {
        title: article.title,
        description: article.meta_description || undefined,
        images: article.featured_image_url ? [article.featured_image_url] : undefined,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: article.meta_description || undefined,
        images: article.featured_image_url ? [article.featured_image_url] : undefined,
      },
    }
  } catch {
    return {
      title: 'Article non trouvé — Beamô',
    }
  }
}

// Fonction pour le rendu markdown simple
function renderMarkdown(content: string): string {
  return content
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 mt-8">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-4 mt-6">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-3 mt-5">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br>')
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
    await supabase
      .from('articles')
      .update({ views_count: article.views_count + 1 })
      .eq('id', article.id)

  } catch (error) {
    console.error('Error loading article:', error)
    notFound()
  }

  if (!article) notFound()

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
          {article.featured_image_url && (
            <img
              src={article.featured_image_url}
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

          {/* Extrait */}
          {article.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              {article.excerpt}
            </p>
          )}

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
        <article className="prose prose-lg prose-gray max-w-none">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: `<p class="mb-4">${renderMarkdown(article.content)}</p>` 
            }} 
          />
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

