// src/lib/visites/heartbeat-client.ts
// Envoie périodiquement l'état sync vers /api/visites/heartbeat
// afin que le cron quotidien sache si Tom a des items en retard.

import { snapshotStats } from './sync-engine'

let lastSent = ''
let intv: ReturnType<typeof setInterval> | null = null

async function pushHeartbeat() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  const stats = await snapshotStats()
  const signature = `${stats.pendingCount}|${stats.oldestPendingAt || ''}`
  if (signature === lastSent) return
  try {
    await fetch('/api/visites/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingCount: stats.pendingCount,
        oldestPendingAt: stats.oldestPendingAt,
      }),
    })
    lastSent = signature
  } catch (e) {
    console.warn('heartbeat failed', e)
  }
}

export function startHeartbeat(): void {
  if (intv) return
  if (typeof window === 'undefined') return
  intv = setInterval(pushHeartbeat, 60_000)
  pushHeartbeat()
}
