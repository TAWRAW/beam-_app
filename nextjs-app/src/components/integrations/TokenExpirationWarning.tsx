"use client"

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SocialIntegration } from '@/types/social-integration'

interface TokenExpirationWarningProps {
  integration: SocialIntegration
  onRefresh: () => void
}

export function TokenExpirationWarning({
  integration,
  onRefresh
}: TokenExpirationWarningProps) {
  if (!integration.token_expires_at) return null

  const expiresAt = new Date(integration.token_expires_at)
  const now = new Date()
  const daysUntilExpiry = Math.floor(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Ne rien afficher si le token n'expire pas bientôt
  if (daysUntilExpiry > 7 || daysUntilExpiry < 0) return null

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium text-orange-900 mb-1">
          Token {integration.platform} expire bientôt
        </h3>
        <p className="text-sm text-orange-800">
          Votre token expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}.
          Rafraîchissez-le maintenant pour continuer à publier automatiquement.
        </p>
        <Button
          onClick={onRefresh}
          size="sm"
          className="mt-2 bg-orange-600 hover:bg-orange-700"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir maintenant
        </Button>
      </div>
    </div>
  )
}
