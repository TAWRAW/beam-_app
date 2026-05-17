// src/components/visites/SyncIndicator.tsx
'use client'

import { useVisitesSync } from '@/hooks/useVisitesSync'

export function SyncIndicator() {
  const { pendingCount, oldestPendingAt, online } = useVisitesSync()

  const base =
    'text-xs font-semibold px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]'

  if (!online) {
    return <span className={`${base} bg-gray-200 text-black`}>📴 Hors-ligne</span>
  }
  if (pendingCount === 0) {
    return <span className={`${base} bg-[#A8E6A1] text-black`}>✓ Sync</span>
  }

  const oldHours = oldestPendingAt
    ? (Date.now() - new Date(oldestPendingAt).getTime()) / 3_600_000
    : 0
  const isLate = oldHours > 24
  return (
    <span
      className={`${base} ${
        isLate ? 'bg-[#FF6B6B] text-black' : 'bg-primary text-black'
      }`}
    >
      {isLate ? '⚠️' : '⏳'} {pendingCount} en attente
    </span>
  )
}
