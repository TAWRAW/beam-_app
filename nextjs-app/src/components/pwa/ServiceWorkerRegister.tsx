'use client'

import { useEffect } from 'react'

// Enregistre le service worker (uniquement en production : en dev, le HMR de
// Next et un service worker font mauvais ménage). Ne rend rien à l'écran.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker: échec de l’enregistrement', err)
      })
    }

    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad)

    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
