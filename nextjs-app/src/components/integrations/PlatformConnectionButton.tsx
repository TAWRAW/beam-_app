"use client"

import { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SocialPlatform } from '@/types/social-integration'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { generateCSRFToken } from '@/lib/oauth/csrf'

interface PlatformConnectionButtonProps {
  platform: SocialPlatform
  onConnect: () => void
}

const OAUTH_CONFIG = {
  facebook: {
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,publish_to_groups'
  },
  linkedin: {
    clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scope: 'openid profile email w_member_social'
  },
  instagram: {
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '', // Instagram utilise Facebook App
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'instagram_basic,instagram_content_publish,pages_show_list'
  }
}

export function PlatformConnectionButton({
  platform,
  onConnect
}: PlatformConnectionButtonProps) {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    try {
      setConnecting(true)

      // Récupérer l'utilisateur connecté
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Vous devez être connecté')
        return
      }

      // Générer un token CSRF
      const state = await generateCSRFToken(
        user.id,
        platform,
        '/apps/settings/integrations'
      )

      // Construire l'URL d'autorisation OAuth
      const config = OAUTH_CONFIG[platform]
      const redirectUri = `${window.location.origin}/api/auth/callback/${platform}`

      const authParams = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        scope: config.scope,
        response_type: 'code',
        state: state
      })

      // Rediriger vers la page d'autorisation
      const authUrl = `${config.authUrl}?${authParams.toString()}`
      window.location.href = authUrl
    } catch (error) {
      console.error('Error initiating OAuth:', error)
      alert('Erreur lors de la connexion')
      setConnecting(false)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      className="w-full"
    >
      {connecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connexion en cours...
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          Connecter {platform}
        </>
      )}
    </Button>
  )
}
