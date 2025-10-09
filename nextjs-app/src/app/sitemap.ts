import type { MetadataRoute } from 'next'
import { getCitySlugs } from '@/lib/cities'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.xn--beam-yqa.fr'
  const now = new Date()

  // Villes principales avec priorité élevée
  const mainCities = ['vernon', 'evreux', 'les-andelys']

  const entries: MetadataRoute.Sitemap = [
    // Page d'accueil - priorité maximale
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0
    },

    // Pages principales - haute priorité
    {
      url: `${base}/offres`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${base}/qui-sommes-nous`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${base}/ressources/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${base}/ressources`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7
    },

    // Pages professionnelles - priorité moyenne-haute
    {
      url: `${base}/pro/etat-des-lieux`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    },

    // Pages légales - priorité moyenne
    {
      url: `${base}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${base}/politique-de-confidentialite`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${base}/conditions-utilisation`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    },
  ]

  // Pages villes - priorité selon importance
  for (const slug of getCitySlugs()) {
    const isMainCity = mainCities.includes(slug)
    entries.push({
      url: `${base}/ville/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: isMainCity ? 0.9 : 0.7
    })
  }

  return entries
}
