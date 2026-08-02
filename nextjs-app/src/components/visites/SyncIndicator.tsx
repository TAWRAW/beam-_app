// src/components/visites/SyncIndicator.tsx
'use client'

import { useState } from 'react'
import { useVisitesSync } from '@/hooks/useVisitesSync'
import { flushAll } from '@/lib/visites/sync-engine'

export function SyncIndicator() {
  const { pendingCount, oldestPendingAt, online } = useVisitesSync()
  const [busy, setBusy] = useState(false)

  const base =
    'text-xs font-semibold px-3 py-1 rounded-full border-2 border-app-border-strong shadow-[2px_2px_0px_0px_var(--app-border-strong)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_var(--app-border-strong)] transition disabled:opacity-60'

  // Le badge est cliquable : tap → force flushAll() pour pousser les drafts
  // pending sans attendre le tick de 30 s.
  async function handleForceSync() {
    if (busy) return
    setBusy(true)
    try {
      await flushAll()
    } finally {
      setBusy(false)
    }
  }

  if (!online) {
    return (
      <button
        type="button"
        onClick={handleForceSync}
        disabled
        className={`${base} bg-app-surface-2 text-app-fg`}
        aria-label="Hors-ligne"
        title="Hors-ligne — la sync redémarrera automatiquement au retour du réseau"
      >
        📴 Hors-ligne
      </button>
    )
  }

  if (pendingCount === 0) {
    return (
      <button
        type="button"
        onClick={handleForceSync}
        disabled={busy}
        className={`${base} bg-[#A8E6A1] text-app-accent-foreground`}
        aria-label="Forcer une resync"
        title="Tap pour forcer une resync"
      >
        {busy ? '⏳ Sync…' : '✓ Sync'}
      </button>
    )
  }

  const oldHours = oldestPendingAt
    ? (Date.now() - new Date(oldestPendingAt).getTime()) / 3_600_000
    : 0
  const isLate = oldHours > 24
  return (
    <button
      type="button"
      onClick={handleForceSync}
      disabled={busy}
      className={`${base} ${isLate ? 'bg-[#FF6B6B]' : 'bg-primary'} text-app-accent-foreground`}
      aria-label={`${pendingCount} en attente — tap pour forcer la sync`}
      title="Tap pour forcer la sync maintenant"
    >
      {busy ? '⏳ Sync…' : `${isLate ? '⚠️' : '⏳'} ${pendingCount} en attente`}
    </button>
  )
}
