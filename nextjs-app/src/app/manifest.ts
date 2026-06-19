import type { MetadataRoute } from 'next'

// Manifest PWA — permet d'installer l'app « Visites d'immeuble » sur l'écran
// d'accueil iPhone/iPad et de l'ouvrir hors-ligne. Le start_url et le scope
// pointent volontairement sur /apps/visites : c'est le seul périmètre rendu
// hors-ligne par le service worker (le site vitrine n'est pas concerné).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beamô — Visites d’immeuble',
    short_name: 'Beamô Visites',
    description:
      'Saisie des visites d’immeuble Beamô, utilisable hors-ligne. Les photos sont enregistrées sur l’appareil puis envoyées sur Estale au retour du réseau.',
    start_url: '/apps/visites',
    scope: '/apps/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F2F1E6',
    theme_color: '#FFC300',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
