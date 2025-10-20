"use client"

import { useState } from 'react'
import { Facebook, Linkedin, Instagram, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SocialIntegration, SocialPlatform } from '@/types/social-integration'
import { PlatformConnectionButton } from './PlatformConnectionButton'
import { TestConnectionModal } from './TestConnectionModal'

interface SocialIntegrationCardProps {
  platform: SocialPlatform
  integration?: SocialIntegration
  onConnect: () => void
  onDisconnect: (platform: SocialPlatform) => void
  onRefresh: (platform: SocialPlatform) => void
}

const PLATFORM_CONFIG = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Publiez vos articles sur votre profil ou page Facebook'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    description: 'Partagez vos articles professionnels sur LinkedIn'
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600',
    description: 'Publiez vos articles avec images sur Instagram'
  }
}

export function SocialIntegrationCard({
  platform,
  integration,
  onConnect,
  onDisconnect,
  onRefresh
}: SocialIntegrationCardProps) {
  const [showTestModal, setShowTestModal] = useState(false)
  const config = PLATFORM_CONFIG[platform]
  const Icon = config.icon

  const isConnected = !!integration
  const isActive = integration?.is_active ?? false
  const hasErrors = (integration?.error_count ?? 0) > 0

  // Calculer les jours avant expiration
  const getDaysUntilExpiry = () => {
    if (!integration?.token_expires_at) return null
    const expiresAt = new Date(integration.token_expires_at)
    const now = new Date()
    const days = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`${config.color} p-2 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">{config.name}</CardTitle>
                {isConnected && integration.platform_username && (
                  <p className="text-xs text-muted-foreground mt-1">@{integration.platform_username}</p>
                )}
              </div>
            </div>

            {/* Status badge */}
            {isConnected && (
              <div className="flex items-center gap-1">
                {isActive && !hasErrors ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground">{config.description}</p>

          {/* État de la connexion */}
          {isConnected && (
            <div className="space-y-2">
              {/* Informations */}
              <div className="text-sm space-y-1">
                {integration.platform_name && (
                  <p className="text-foreground">
                    <span className="font-medium">Compte:</span> {integration.platform_name}
                  </p>
                )}

                {daysUntilExpiry !== null && (
                  <p className={`${isExpiringSoon ? 'text-orange-600 font-medium' : 'text-foreground'}`}>
                    <span className="font-medium">Expire dans:</span> {daysUntilExpiry} jours
                  </p>
                )}

                {hasErrors && (
                  <p className="text-destructive text-xs">
                    ⚠️ {integration.error_count} erreur(s) récente(s)
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          {isConnected ? (
            <div className="flex flex-wrap gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTestModal(true)}
                className="flex-1"
              >
                Tester
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRefresh(platform)}
                title="Rafraîchir le token"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDisconnect(platform)}
                title="Déconnecter"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <PlatformConnectionButton
              platform={platform}
              onConnect={onConnect}
            />
          )}
        </CardFooter>
      </Card>

      {/* Modal de test */}
      {showTestModal && integration && (
        <TestConnectionModal
          integration={integration}
          onClose={() => setShowTestModal(false)}
        />
      )}
    </>
  )
}
