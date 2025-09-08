import type { MetadataRoute } from 'next'
import { getCitySlugs } from '@/lib/cities'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://xn--beam-yqa.fr'
  const now = new Date()
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/qui-sommes-nous`, lastModified: now },
    { url: `${base}/offres`, lastModified: now },
    { url: `${base}/ressources/contact`, lastModified: now },
  ]

  // Add city pages
  for (const slug of getCitySlugs()) {
    entries.push({ url: `${base}/ville/${slug}`, lastModified: now })
  }

  return entries
}
