import Link from 'next/link'
import Image from 'next/image'
import { Route } from 'next'
import CategoryGallery from '@/components/ressources/CategoryGallery'
import { createClient } from '@supabase/supabase-js'
import { ArticleWithAuthor } from '@/types/article'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SearchBar } from '@/components/ressources/SearchBar'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const metadata = {
  title: 'Ressources — Beamô',
  description: "Actualités et contenus de Beamô",
  alternates: { canonical: '/ressources' },
}

// Revalidate every hour for ISR (better performance than force-dynamic)
export const revalidate = 3600

const ARTICLES_PER_PAGE = 12

export default async function RessourcesPage({
  searchParams
}: {
  searchParams: { cat?: string; type?: string; page?: string; q?: string }
}) {
  let articles: ArticleWithAuthor[] = []
  let totalCount = 0
  let error: string | null = null

  const currentPage = Math.max(1, parseInt(searchParams.page || '1'))
  const searchQuery = searchParams.q?.trim() || ''

  try {
    // Requête pour compter le total d'articles
    let countQuery = supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    // Requête principale avec pagination
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

    // Filtrer par catégorie si spécifiée
    if (searchParams.cat && searchParams.cat !== 'all') {
      query = query.eq('category', searchParams.cat)
      countQuery = countQuery.eq('category', searchParams.cat)
    }

    // Filtrer par type si spécifié
    if (searchParams.type && searchParams.type !== 'all') {
      query = query.eq('type', searchParams.type)
      countQuery = countQuery.eq('type', searchParams.type)
    }

    // Recherche par mots-clés
    if (searchQuery) {
      const searchFilter = `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`
      query = query.or(searchFilter)
      countQuery = countQuery.or(searchFilter)
    }

    // Compter le total
    const { count } = await countQuery
    totalCount = count || 0

    // Pagination
    const offset = (currentPage - 1) * ARTICLES_PER_PAGE
    query = query.range(offset, offset + ARTICLES_PER_PAGE - 1)

    const { data, error: supabaseError } = await query

    if (supabaseError) {
      throw supabaseError
    }

    articles = data || []
  } catch (e: any) {
    error = e?.message || 'Erreur lors du chargement des articles'
    console.error('Error loading articles:', e)
  }

  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE)

  // Construire les URLs de pagination
  const buildPageUrl = (page: number): Route => {
    const params = new URLSearchParams()
    if (searchParams.cat && searchParams.cat !== 'all') params.set('cat', searchParams.cat)
    if (searchParams.type && searchParams.type !== 'all') params.set('type', searchParams.type)
    if (searchQuery) params.set('q', searchQuery)
    if (page > 1) params.set('page', String(page))
    const queryString = params.toString()
    return `/ressources${queryString ? `?${queryString}` : ''}` as Route
  }

  return (
    <main className="section">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Ressources' }
          ]}
        />
        <h1 className="h1 mt-6">Ressources</h1>
        <p className="mt-2 text-muted-foreground">
          Explorez nos contenus par type et catégorie.
        </p>

        {/* Barre de recherche */}
        <div className="mt-6">
          <SearchBar
            defaultValue={searchQuery}
            placeholder="Rechercher un article..."
          />
        </div>

        {/* Filtres actifs */}
        {(searchQuery || (searchParams.cat && searchParams.cat !== 'all') || (searchParams.type && searchParams.type !== 'all')) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtres actifs :</span>
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                Recherche : "{searchQuery}"
              </span>
            )}
            {searchParams.cat && searchParams.cat !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                Catégorie : {searchParams.cat}
              </span>
            )}
            {searchParams.type && searchParams.type !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-secondary/10 text-secondary">
                Type : {searchParams.type}
              </span>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/ressources">Effacer les filtres</Link>
            </Button>
          </div>
        )}

        <CategoryGallery />
        
        {error ? (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Les articles seront disponibles une fois la base de données configurée.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            {/* Compteur de résultats */}
            {totalCount > 0 && (
              <div className="mb-4 text-sm text-muted-foreground">
                {totalCount} article{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
                {totalPages > 1 && ` • Page ${currentPage} sur ${totalPages}`}
              </div>
            )}

            {articles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Card key={article.id} className="bg-card p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-0">
                    {article.featured_image_url && (
                      <div className="relative w-full h-48 mb-4">
                        <Image
                          src={article.featured_image_url}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover rounded"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                        {article.category}
                      </span>
                      {article.type && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-secondary/10 text-secondary">
                          {article.type}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {article.reading_time_minutes} min de lecture
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-semibold mb-2">{article.title}</h2>

                    {article.excerpt && (
                      <p className="text-muted-foreground line-clamp-3 mb-4">{article.excerpt}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        {article.author?.avatar_url ? (
                          <div className="relative w-6 h-6 rounded-full overflow-hidden">
                            <Image
                              src={article.author.avatar_url}
                              alt={article.author.full_name || 'Auteur'}
                              fill
                              sizes="24px"
                              className="object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted"></div>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {article.author?.full_name || 'Anonyme'}
                        </span>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {new Date(article.published_at!).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                      <div className="mt-4 flex gap-2">
                        <Button asChild variant="default">
                          <Link href={`/ressources/${article.slug}`}>
                            Lire l'article
                          </Link>
                        </Button>
                        {article.attachment_url && (
                          <Button asChild variant="secondary">
                            <a
                              href={article.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Télécharger
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucun article trouvé
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? `Aucun article ne correspond à "${searchQuery}".`
                    : (searchParams.cat && searchParams.cat !== 'all') || (searchParams.type && searchParams.type !== 'all')
                      ? `Aucun article trouvé${searchParams.cat && searchParams.cat !== 'all' ? ` dans la catégorie "${searchParams.cat}"` : ''}${searchParams.type && searchParams.type !== 'all' ? ` de type "${searchParams.type}"` : ''}.`
                      : 'Aucun article n\'a encore été publié.'
                  }
                </p>
                {(searchQuery || (searchParams.cat && searchParams.cat !== 'all') || (searchParams.type && searchParams.type !== 'all')) && (
                  <Button asChild variant="outline">
                    <Link href="/ressources">
                      Voir tous les articles
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                {currentPage > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={buildPageUrl(currentPage - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                )}

                <div className="flex items-center gap-1">
                  {/* Première page */}
                  {currentPage > 3 && (
                    <>
                      <Button asChild variant={currentPage === 1 ? 'default' : 'ghost'} size="sm">
                        <Link href={buildPageUrl(1)}>1</Link>
                      </Button>
                      {currentPage > 4 && <span className="px-2 text-muted-foreground">...</span>}
                    </>
                  )}

                  {/* Pages autour de la page courante */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => page >= currentPage - 2 && page <= currentPage + 2)
                    .map((page) => (
                      <Button
                        key={page}
                        asChild={page !== currentPage}
                        variant={page === currentPage ? 'default' : 'ghost'}
                        size="sm"
                      >
                        {page === currentPage ? (
                          <span>{page}</span>
                        ) : (
                          <Link href={buildPageUrl(page)}>{page}</Link>
                        )}
                      </Button>
                    ))}

                  {/* Dernière page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                      <Button asChild variant={currentPage === totalPages ? 'default' : 'ghost'} size="sm">
                        <Link href={buildPageUrl(totalPages)}>{totalPages}</Link>
                      </Button>
                    </>
                  )}
                </div>

                {currentPage < totalPages ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={buildPageUrl(currentPage + 1)}>
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </nav>
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
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent text-accent-foreground hover:bg-accent/80 transition-colors cursor-pointer"
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
