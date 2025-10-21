"use client"

import { useState, useEffect } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { SocialIntegrationCard } from '@/components/integrations/SocialIntegrationCard'
import { TokenExpirationWarning } from '@/components/integrations/TokenExpirationWarning'
import { SocialPublishingPreferencesComponent } from '@/components/profile/SocialPublishingPreferences'
import type { SocialIntegration, SocialPlatform } from '@/types/social-integration'
import type { SocialPublishingPreferences } from '@/types/social-publishing'
import { getDefaultPreferences } from '@/types/social-publishing'
import Link from 'next/link'

const PLATFORMS: SocialPlatform[] = ['facebook', 'linkedin', 'instagram']

interface Profile {
  id: string
  metadata?: {
    social_publishing_preferences?: SocialPublishingPreferences
  }
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<SocialIntegration[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Gérer les messages de succès/erreur depuis les callbacks OAuth
  const callbackSuccess = searchParams.get('success')
  const callbackError = searchParams.get('error')
  const callbackPlatform = searchParams.get('platform')

  useEffect(() => {
    loadIntegrations()
  }, [])

  // Afficher les notifications de callback
  useEffect(() => {
    if (callbackSuccess && callbackPlatform) {
      alert(`✅ ${callbackPlatform} connecté avec succès !`)
      // Nettoyer l'URL
      router.replace('/apps/settings/integrations')
    } else if (callbackError && callbackPlatform) {
      alert(`❌ Erreur lors de la connexion à ${callbackPlatform}: ${callbackError}`)
      router.replace('/apps/settings/integrations')
    }
  }, [callbackSuccess, callbackError, callbackPlatform, router])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      setError(null)

      // ⚠️ BYPASS pour le développement et l'environnement dev
      // TODO: RETIRER CE BYPASS EN PRODUCTION
      const isDevEnvironment =
        process.env.NODE_ENV === 'development' ||
        (typeof window !== 'undefined' &&
          (window.location.hostname.includes('dev.beamo') ||
           window.location.hostname.includes('localhost')))

      if (isDevEnvironment) {
        console.log('🚧 DEV MODE: Using mock data for integrations page')
        setProfile({
          id: 'dev-user',
          metadata: {
            social_publishing_preferences: getDefaultPreferences()
          }
        })
        setIntegrations([])
        setLoading(false)
        return
      }

      // Récupérer l'utilisateur connecté
      const supabase = createSupabaseBrowserClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Récupérer le token d'accès
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Récupérer les intégrations via API
      const integrationsResponse = await fetch('/api/integrations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!integrationsResponse.ok) {
        throw new Error('Erreur lors du chargement des intégrations')
      }

      const integrationsData = await integrationsResponse.json()
      setIntegrations(integrationsData.integrations || [])

      // Récupérer le profil pour les préférences
      const profileResponse = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfile(profileData)
      }
    } catch (err) {
      console.error('Error loading integrations:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (platform: SocialPlatform) => {
    if (!confirm(`Êtes-vous sûr de vouloir déconnecter ${platform} ?`)) {
      return
    }

    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Session expirée')
        return
      }

      const response = await fetch(`/api/integrations/${platform}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la déconnexion')
      }

      // Recharger les intégrations
      await loadIntegrations()
      alert(`${platform} déconnecté avec succès`)
    } catch (err) {
      console.error('Error disconnecting:', err)
      alert('Erreur lors de la déconnexion')
    }
  }

  const handleRefreshToken = async (platform: SocialPlatform) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Session expirée')
        return
      }

      const response = await fetch(`/api/integrations/${platform}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du rafraîchissement du token')
      }

      await loadIntegrations()
      alert(`Token ${platform} rafraîchi avec succès`)
    } catch (err) {
      console.error('Error refreshing token:', err)
      alert('Erreur lors du rafraîchissement. Veuillez vous reconnecter.')
    }
  }

  const handleSavePreferences = async (preferences: SocialPublishingPreferences) => {
    if (!profile) return

    // ⚠️ BYPASS pour le développement et l'environnement dev
    // TODO: RETIRER CE BYPASS EN PRODUCTION
    const isDevEnvironment =
      process.env.NODE_ENV === 'development' ||
      (typeof window !== 'undefined' &&
        (window.location.hostname.includes('dev.beamo') ||
         window.location.hostname.includes('localhost')))

    if (isDevEnvironment) {
      console.log('🚧 DEV MODE: Bypassing auth for saving preferences', preferences)
      setProfile(prev => prev ? {
        ...prev,
        metadata: {
          ...prev.metadata,
          social_publishing_preferences: preferences
        }
      } : null)
      return
    }

    const supabase = createSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Session expirée')
    }

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        metadata: {
          ...profile.metadata,
          social_publishing_preferences: preferences
        }
      })
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la sauvegarde')
    }

    setProfile(prev => prev ? {
      ...prev,
      metadata: {
        ...prev.metadata,
        social_publishing_preferences: preferences
      }
    } : null)
  }

  // Trouver les intégrations expirées ou avec erreurs
  const expiringIntegrations = integrations.filter(integration => {
    if (!integration.token_expires_at) return false
    const expiresAt = new Date(integration.token_expires_at)
    const now = new Date()
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  })

  const errorIntegrations = integrations.filter(
    integration => integration.error_count > 0 || !integration.is_active
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/apps/profile"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au profil
        </Link>
        <h1 className="text-2xl font-semibold">Intégrations réseaux sociaux</h1>
        <p className="text-gray-600 mt-2">
          Connectez vos comptes de réseaux sociaux pour publier automatiquement vos articles.
        </p>
      </div>

      {/* Warnings */}
      {(expiringIntegrations.length > 0 || errorIntegrations.length > 0) && (
        <div className="mb-6 space-y-3">
          {expiringIntegrations.map(integration => (
            <TokenExpirationWarning
              key={integration.id}
              integration={integration}
              onRefresh={() => handleRefreshToken(integration.platform)}
            />
          ))}
          {errorIntegrations.map(integration => (
            <div
              key={integration.id}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <h3 className="font-medium text-red-900 mb-1">
                Erreur avec {integration.platform}
              </h3>
              <p className="text-sm text-red-700">
                {integration.last_error_message || 'Erreur inconnue'}
              </p>
              <button
                onClick={() => handleRefreshToken(integration.platform)}
                className="mt-2 text-sm text-red-700 underline hover:text-red-900"
              >
                Réessayer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900">{error}</p>
        </div>
      )}

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map(platform => {
          const integration = integrations.find(i => i.platform === platform)
          return (
            <SocialIntegrationCard
              key={platform}
              platform={platform}
              integration={integration}
              onConnect={() => {
                // La connexion sera gérée par le composant
              }}
              onDisconnect={handleDisconnect}
              onRefresh={handleRefreshToken}
            />
          )
        })}
      </div>

      {/* Publication automatique preferences */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Paramètres de publication automatique</h2>
        <SocialPublishingPreferencesComponent
          initialPreferences={profile?.metadata?.social_publishing_preferences || getDefaultPreferences()}
          onSave={handleSavePreferences}
        />
      </div>

      {/* Help text */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Comment ça marche ?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Connectez vos comptes de réseaux sociaux en cliquant sur "Connecter"</li>
          <li>• Configurez les horaires de publication automatique ci-dessus</li>
          <li>• Vos articles seront automatiquement publiés selon vos préférences</li>
          <li>• Les tokens expirent après un certain temps et doivent être rafraîchis</li>
        </ul>
      </div>
    </div>
  )
}
