/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  experimental: {
    typedRoutes: true
  },
  async redirects() {
    return [
      // Legacy HTML URLs → new routes
      { source: '/ressources/contact.html', destination: '/ressources/contact', permanent: true },
      { source: '/offre/offres.html', destination: '/offres', permanent: true },
      { source: '/landing-page/index.html', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
    ]
  }
}

module.exports = nextConfig
