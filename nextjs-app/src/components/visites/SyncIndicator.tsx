// src/components/visites/SyncIndicator.tsx
'use client'

import { useVisitesSync } from '@/hooks/useVisitesSync'

export function SyncIndicator() {
  const { pendingCount, oldestPendingAt, online } = useVisitesSync()

  if (!online) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
        📴 Hors-ligne
      </span>
    )
  }
  if (pendingCount === 0) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
        ✓ Sync
      </span>
    )
  }

  const oldHours = oldestPendingAt
    ? (Date.now() - new Date(oldestPendingAt).getTime()) / 3_600_000
    : 0
  const isLate = oldHours > 24
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        isLate ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {isLate ? '⚠️' : '⏳'} {pendingCount} en attente
    </span>
  )
}
