import Link from 'next/link'
import CategoryGallery from '@/components/ressources/CategoryGallery'
import { createClient } from '@supabase/supabase-js'
import { ArticleWithAuthor } from '@/types/article'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata = {
  title: 'Ressources — Beamô',
  description: "Actualités et contenus de Beamô",
  alternates: { canonical: '/ressources' },
}

// Force dynamic rendering for search params
export const dynamic = 'force-dynamic'

export default async function RessourcesPage({
  searchParams
}: {
  searchParams: { cat?: string }
}) {
  let articles: ArticleWithAuthor[] = []
  let error: string | null = null
  
  try {
    let query = supabase
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
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(12)

    // Filtrer par catégorie si spécifiée
    if (searchParams.cat && searchParams.cat !== 'all') {
      query = query.eq('category', searchParams.cat)
    }

    const { data, error: supabaseError } = await query

    if (supabaseError) {
      throw supabaseError
    }

    articles = data || []
  } catch (e: any) {
    error = e?.message || 'Erreur lors du chargement des articles'
    console.error('Error loading articles:', e)
  }

  return (
    <main className="section">
      <div className="container">
        <h1 className="h1">Ressources</h1>
        <p className="mt-2 text-gray-600">
          Explorez nos contenus par catégorie. {searchParams.cat && searchParams.cat !== 'all' && (
            <span className="text-primary font-medium">
              Catégorie: {searchParams.cat}
            </span>
          )}
        </p>
        <CategoryGallery />
        
        {error ? (
          <div className="mt-8 text-center">
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500 mt-2">
              Les articles seront disponibles une fois la base de données configurée.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            {articles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <article key={article.id} className="card p-6 hover:shadow-lg transition-shadow">
                    {article.featured_image_url && (
                      <img
                        src={article.featured_image_url}
                        alt={article.title}
                        className="w-full h-48 object-cover rounded mb-4"
                      />
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {article.reading_time_minutes} min de lecture
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
                    
                    {article.excerpt && (
                      <p className="text-gray-700 line-clamp-3 mb-4">{article.excerpt}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        {article.author?.avatar_url ? (
                          <img
                            src={article.author.avatar_url}
                            alt={article.author.full_name || 'Auteur'}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                        )}
                        <span className="text-sm text-gray-600">
                          {article.author?.full_name || 'Anonyme'}
                        </span>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {new Date(article.published_at!).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <Link 
                      href={`/ressources/${article.slug}`} 
                      className="mt-4 inline-block btn hover:bg-primary/90 transition-colors"
                    >
                      Lire l'article
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun article disponible
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchParams.cat && searchParams.cat !== 'all' 
                    ? `Aucun article trouvé dans la catégorie "${searchParams.cat}".`
                    : 'Aucun article n\'a encore été publié.'
                  }
                </p>
                {searchParams.cat && searchParams.cat !== 'all' && (
                  <Link href="/ressources" className="btn">
                    Voir tous les articles
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Tags populaires */}
        {articles.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4">Tags populaires</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(articles.flatMap(a => a.tags || []))).slice(0, 10).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
