/*
 * Service worker Beamô — rend l'app « Visites d'immeuble » ouvrable hors-ligne.
 *
 * Principe de prudence (site vitrine en production) :
 *  - on n'intercepte QUE les navigations vers /apps/visites (réseau d'abord,
 *    cache en secours quand il n'y a pas de réseau) ;
 *  - on met en cache les assets statiques immuables (/_next/static, polices,
 *    images) en stale-while-revalidate ;
 *  - TOUT LE RESTE (pages vitrine, /api/*, etc.) n'est PAS intercepté : le
 *    navigateur fonctionne normalement, aucun risque de servir une page
 *    vitrine périmée ni de mettre en cache un appel Estale.
 *
 * La saisie de la visite (photos, commentaires) est déjà stockée en local
 * dans IndexedDB dès la capture, puis poussée vers Estale par le moteur de
 * synchro au retour du réseau. Ce service worker ne fait qu'ajouter la
 * capacité d'OUVRIR l'app sans réseau.
 */

const CACHE = 'beamo-visites-v1'
const APP_SCOPE = '/apps/visites'

self.addEventListener('install', () => {
  // Activation immédiate de la nouvelle version.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purge des anciennes versions de cache.
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|ico)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Ne JAMAIS intercepter les appels API (Estale, overflow, auth…).
  if (url.pathname.startsWith('/api/')) return

  // Navigation vers l'app visites : réseau d'abord, cache en secours.
  const isVisitesNav = req.mode === 'navigate' && url.pathname.startsWith(APP_SCOPE)
  if (isVisitesNav) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(CACHE)
          cache.put(req, fresh.clone())
          return fresh
        } catch {
          const cached = (await caches.match(req)) || (await caches.match(APP_SCOPE))
          return cached || Response.error()
        }
      })(),
    )
    return
  }

  // Assets statiques immuables : stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        const cached = await cache.match(req)
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || network
      })(),
    )
    return
  }

  // Tout le reste : pas d'interception (comportement navigateur par défaut).
})
