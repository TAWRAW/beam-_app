/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'worthy-basketball-cc30a2b320.strapiapp.com',
      },
    ],
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
      // Generic: any ".html" → same path without extension
      { source: '/:path*.html', destination: '/:path*', permanent: true },
    ]
  }
}

module.exports = nextConfig
