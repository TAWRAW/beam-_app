'use client'

import { AlertTriangle } from 'lucide-react'
import { MandatWarning } from '@/lib/simulateur-vote/types'

interface MandatWarningBannerProps {
  warnings: MandatWarning[]
}

export function MandatWarningBanner({ warnings }: MandatWarningBannerProps) {
  if (warnings.length === 0) return null

  return (
    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-medium text-orange-800">
            Attention : limite de mandats potentiellement dépassée
          </p>
          <ul className="text-sm text-orange-700 space-y-1">
            {warnings.map((warning) => (
              <li key={warning.lotId}>
                <strong>{warning.displayName}</strong> représente{' '}
                {warning.mandatsCount} lot{warning.mandatsCount > 1 ? 's' : ''} et
                détient {warning.percentageTotal.toFixed(1)}% des voix (
                {warning.totalTantiemes} tantièmes).
              </li>
            ))}
          </ul>
          <p className="text-xs text-orange-600">
            La loi limite généralement à 3 mandats ou 10% des voix totales.
            Cette alerte est indicative et n'empêche pas la simulation.
          </p>
        </div>
      </div>
    </div>
  )
}
