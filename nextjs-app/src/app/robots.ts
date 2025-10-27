import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = 'https://www.xn--beam-yqa.fr'
  return {
    rules: [
      // Bloquer pages admin et utilitaires (crawl budget optimization)
      { userAgent: '*', disallow: '/apps/' },
      { userAgent: '*', disallow: '/auth/' },
      { userAgent: '*', disallow: '/login' },
      { userAgent: '*', disallow: '/logout' },
      { userAgent: '*', disallow: '/403' },
      { userAgent: '*', disallow: '/merci' },
      { userAgent: '*', disallow: '/en-cours' },

      // Autoriser le reste
      { userAgent: '*', allow: '/' },
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      { userAgent: 'DuckDuckBot', allow: '/' },

      // Autoriser les bots IA à explorer (si souhaité)
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    host: base,
    sitemap: `${base}/sitemap.xml`,
  }
}

