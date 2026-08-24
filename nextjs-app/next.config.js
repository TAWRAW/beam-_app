/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'worthy-basketball-cc30a2b320.strapiapp.com',
      },
      {
        protocol: 'https',
        hostname: 'zhtstxdbersquchtlkzm.supabase.co',
      },
    ],
  },
  async rewrites() {
    return [
      // Landings scrollytelling « petites copropriétés » (HTML autonome dans public/landings/,
      // même mécanique que les pages Oignon ci-dessous). Formulaire branché sur /api/contact.
      { source: '/copropriete-eure', destination: '/landings/petites-coproprietes-eure.html' },
      { source: '/copropriete-eure/', destination: '/landings/petites-coproprietes-eure.html' },
      { source: '/copropriete-rouen', destination: '/landings/petites-coproprietes-rouen.html' },
      { source: '/copropriete-rouen/', destination: '/landings/petites-coproprietes-rouen.html' },
      // Pages standalone Oignon (HTML statique dans public/)
      { source: '/oignon', destination: '/oignon/index.html' },
      { source: '/oignon/', destination: '/oignon/index.html' },
      { source: '/oignon/rejoindre', destination: '/oignon/rejoindre/index.html' },
      { source: '/oignon/rejoindre/', destination: '/oignon/rejoindre/index.html' },
      { source: '/oignon/ressources', destination: '/oignon/ressources/index.html' },
      { source: '/oignon/ressources/', destination: '/oignon/ressources/index.html' },
      { source: '/oignon/ressources/mandat-syndic-histoire-jurisprudence', destination: '/oignon/ressources/mandat-syndic-histoire-jurisprudence/index.html' },
      { source: '/oignon/ressources/mandat-syndic-histoire-jurisprudence/', destination: '/oignon/ressources/mandat-syndic-histoire-jurisprudence/index.html' },
      { source: '/oignon/ressources/registre-des-mandats-loi-hoguet', destination: '/oignon/ressources/registre-des-mandats-loi-hoguet/index.html' },
      { source: '/oignon/ressources/registre-des-mandats-loi-hoguet/', destination: '/oignon/ressources/registre-des-mandats-loi-hoguet/index.html' },
      { source: '/oignon/ressources/facturation-electronique-2026', destination: '/oignon/ressources/facturation-electronique-2026/index.html' },
      { source: '/oignon/ressources/facturation-electronique-2026/', destination: '/oignon/ressources/facturation-electronique-2026/index.html' },
    ]
  },
  async redirects() {
    return [
      // Legacy HTML URLs → new routes
      { source: '/ressources/contact.html', destination: '/ressources/contact', permanent: true },
      { source: '/offre/offres.html', destination: '/offres', permanent: true },
      { source: '/offre/offres', destination: '/offres', permanent: true },
      { source: '/landing-page/index.html', destination: '/', permanent: true },
      { source: '/landing-page/index', destination: '/', permanent: true },
      { source: '/landing-page', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/index', destination: '/', permanent: true },
      // Old city pages → new dynamic city route
      { source: '/syndic/syndic-:slug', destination: '/ville/:slug', permanent: true },
      // Generic: any ".html" → same path without extension
      { source: '/:path*.html', destination: '/:path*', permanent: true },
    ]
  }
}

module.exports = nextConfig
