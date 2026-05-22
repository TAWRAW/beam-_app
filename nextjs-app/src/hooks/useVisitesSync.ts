// src/hooks/useVisitesSync.ts
'use client'

import { useEffect, useState } from 'react'
import { startSyncLoop, snapshotStats } from '@/lib/visites/sync-engine'

export interface SyncSnapshot {
  pendingCount: number
  oldestPendingAt: string | null
  online: boolean
}

export function useVisitesSync(): SyncSnapshot {
  // Valeur initiale strictement déterministe pour éviter un mismatch
  // d'hydratation SSR/CSR (cf. React #418/#425) : useState(() => ...) est
  // exécuté côté serveur ET côté client, donc `typeof navigator` produisait
  // un HTML différent. On met à jour avec la vraie valeur dans useEffect.
  const [snap, setSnap] = useState<SyncSnapshot>({
    pendingCount: 0,
    oldestPendingAt: null,
    online: true,
  })

  useEffect(() => {
    startSyncLoop()

    const tick = async () => {
      const stats = await snapshotStats()
      setSnap({
        pendingCount: stats.pendingCount,
        oldestPendingAt: stats.oldestPendingAt,
        online: navigator.onLine,
      })
    }
    const intv = setInterval(tick, 3_000)
    tick()

    const onOnline = () => setSnap((s) => ({ ...s, online: true }))
    const onOffline = () => setSnap((s) => ({ ...s, online: false }))
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      clearInterval(intv)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return snap
}
