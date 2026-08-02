import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ArticleStats } from '@/types/article'
import { requireAdmin } from '@/lib/server-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/articles/stats - Statistiques globales des articles
export async function GET(request: NextRequest) {
  // Réservé au cabinet : le middleware ne filtre que /apps/*, une route API
  // reste joignable depuis Internet sans garde explicite ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    // Statistiques générales
    const { data: generalStats } = await supabaseAdmin
      .from('articles')
      .select('status, views_count, reading_time_minutes')

    if (!generalStats) {
      throw new Error('Impossible de récupérer les statistiques générales')
    }

    // Compter par statut
    const total = generalStats.length
    const published = generalStats.filter(a => a.status === 'published').length
    const drafts = generalStats.filter(a => a.status === 'draft').length
    const archived = generalStats.filter(a => a.status === 'archived').length

    // Calculs des moyennes
    const totalViews = generalStats.reduce((sum, a) => sum + (a.views_count || 0), 0)
    const averageReadingTime = total > 0 
      ? Math.round(generalStats.reduce((sum, a) => sum + (a.reading_time_minutes || 0), 0) / total)
      : 0

    // Statistiques des tags
    const { data: tagsData } = await supabaseAdmin
      .from('articles')
      .select('tags')
      .not('tags', 'is', null)

    const tagCounts: { [key: string]: number } = {}
    tagsData?.forEach(article => {
      article.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 tags

    // Statistiques des catégories
    const { data: categoriesData } = await supabaseAdmin
      .from('articles')
      .select('category')
      .not('category', 'is', null)

    const categoryCounts: { [key: string]: number } = {}
    categoriesData?.forEach(article => {
      const category = article.category
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      }
    })

    const categoriesCount = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category: category as any, count }))
      .sort((a, b) => b.count - a.count)

    const stats: ArticleStats = {
      total,
      published,
      drafts,
      archived,
      totalViews,
      averageReadingTime,
      popularTags,
      categoriesCount
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching article stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}