import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://xn--beam-yqa.fr'
  const now = new Date()
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/offres`, lastModified: now },
    { url: `${base}/ressources/contact`, lastModified: now },
  ]
}

