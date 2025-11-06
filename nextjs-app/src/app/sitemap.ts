import type { MetadataRoute } from 'next'
import { getCitySlugs } from '@/lib/cities'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.xn--beam-yqa.fr'
  const now = new Date()

  // Dates de dernière modification par type de page
  const lastModDates = {
    home: new Date('2025-10-15'),
    commercial: new Date('2025-10-10'),
    info: new Date('2025-09-20'),
    legal: new Date('2025-09-01'),
    cities: new Date('2025-10-08')
  }

  // Villes principales avec priorité élevée
  const mainCities = ['vernon', 'evreux', 'les-andelys', 'gaillon', 'louviers']

  const entries: MetadataRoute.Sitemap = [
    // Page d'accueil - priorité maximale
    {
      url: `${base}/`,
      lastModified: lastModDates.home,
      changeFrequency: 'weekly',
      priority: 1.0
    },

    // Pages principales - haute priorité
    {
      url: `${base}/offres`,
      lastModified: lastModDates.commercial,
      changeFrequency: 'monthly',
      priority: 0.9
    },
    {
      url: `${base}/tarifs`,
      lastModified: lastModDates.commercial,
      changeFrequency: 'monthly',
      priority: 0.9 // Page commerciale critique
    },
    {
      url: `${base}/qui-sommes-nous`,
      lastModified: lastModDates.info,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${base}/ressources/contact`,
      lastModified: lastModDates.commercial,
      changeFrequency: 'monthly',
      priority: 0.95 // Très important pour conversion
    },
    {
      url: `${base}/ressources`,
      lastModified: lastModDates.info,
      changeFrequency: 'weekly',
      priority: 0.7
    },

    // Pages professionnelles - priorité moyenne-haute
    {
      url: `${base}/pro/etat-des-lieux`,
      lastModified: lastModDates.commercial,
      changeFrequency: 'monthly',
      priority: 0.7
    },

    // Pages légales - priorité basse mais importantes pour Google
    {
      url: `${base}/mentions-legales`,
      lastModified: lastModDates.legal,
      changeFrequency: 'yearly',
      priority: 0.4
    },
    {
      url: `${base}/politique-de-confidentialite`,
      lastModified: lastModDates.legal,
      changeFrequency: 'yearly',
      priority: 0.4
    },
    {
      url: `${base}/conditions-utilisation`,
      lastModified: lastModDates.legal,
      changeFrequency: 'yearly',
      priority: 0.4
    },
    {
      url: `${base}/sources`,
      lastModified: lastModDates.legal,
      changeFrequency: 'yearly',
      priority: 0.3
    },
  ]

  // Pages villes - priorité selon importance commerciale
  for (const slug of getCitySlugs()) {
    const isMainCity = mainCities.includes(slug)
    entries.push({
      url: `${base}/ville/${slug}`,
      lastModified: lastModDates.cities,
      changeFrequency: isMainCity ? 'weekly' : 'monthly',
      priority: isMainCity ? 0.85 : 0.6
    })
  }

  // Articles publiés - priorité haute pour le contenu
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (!error && articles) {
      for (const article of articles) {
        entries.push({
          url: `${base}/ressources/${article.slug}`,
          lastModified: new Date(article.updated_at || article.published_at),
          changeFrequency: 'monthly',
          priority: 0.8 // Priorité élevée pour le contenu éditorial
        })
      }
      console.log(`✅ Sitemap: Added ${articles.length} published articles`)
    } else {
      console.error('❌ Sitemap: Error fetching articles:', error)
    }
  } catch (error) {
    console.error('❌ Sitemap: Exception fetching articles:', error)
  }

  return entries
}
