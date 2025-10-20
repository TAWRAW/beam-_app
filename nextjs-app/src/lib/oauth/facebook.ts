// Facebook OAuth Handler
// Documentation: https://developers.facebook.com/docs/facebook-login/
// Date: 20 octobre 2025

import { OAuthHandler, type TokenResponse } from './base'
import type { OAuthConfig, PlatformUserInfo, SocialPlatform } from '@/types/social-integration'

export class FacebookOAuthHandler extends OAuthHandler {
  protected platform: SocialPlatform = 'facebook'
  protected config: OAuthConfig

  constructor() {
    super()

    const clientId = process.env.FACEBOOK_APP_ID
    const clientSecret = process.env.FACEBOOK_APP_SECRET
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/facebook`

    if (!clientId || !clientSecret) {
      throw new Error('Facebook OAuth credentials are not configured. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.')
    }

    this.config = {
      platform: 'facebook',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      authorization_url: 'https://www.facebook.com/v18.0/dialog/oauth',
      token_url: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: [
        'pages_manage_posts',      // Publier sur les pages
        'pages_read_engagement',   // Lire les statistiques
        'public_profile'           // Informations publiques
      ],
      user_info_url: 'https://graph.facebook.com/v18.0/me'
    }
  }

  /**
   * Parse les informations utilisateur Facebook
   */
  protected parseUserInfo(data: any): PlatformUserInfo {
    return {
      id: data.id,
      username: data.username,
      name: data.name,
      email: data.email,
      profile_url: `https://facebook.com/${data.id}`,
      avatar_url: data.picture?.data?.url
    }
  }

  /**
   * Convertit un short-lived token en long-lived token (60 jours)
   * Facebook recommande d'utiliser les long-lived tokens
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
      fb_exchange_token: shortLivedToken
    })

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Facebook long-lived token exchange failed:', errorText)
      throw new Error(`Failed to get long-lived token: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      access_token: data.access_token,
      token_type: 'Bearer',
      expires_in: data.expires_in || 5184000, // 60 jours par défaut
      scope: data.scope
    }
  }

  /**
   * Récupère les pages Facebook gérées par l'utilisateur
   * Nécessaire pour publier sur une page
   */
  async getUserPages(accessToken: string) {
    const response = await fetch(
      'https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,tasks',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get Facebook pages')
    }

    const data = await response.json()
    return data.data || []
  }

  /**
   * Révoque l'accès Facebook
   */
  async revokeAccess(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      return response.ok
    } catch (error) {
      console.error('Failed to revoke Facebook access:', error)
      return false
    }
  }

  /**
   * Paramètres supplémentaires pour OAuth
   */
  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      display: 'popup',
      auth_type: 'rerequest' // Force à redemander les permissions si refusées
    }
  }

  /**
   * Récupère les informations utilisateur avec des champs spécifiques
   */
  async getUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const fields = 'id,name,email,picture.type(large)'
    const response = await fetch(
      `${this.config.user_info_url}?fields=${fields}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get Facebook user info')
    }

    const data = await response.json()
    return this.parseUserInfo(data)
  }

  /**
   * Override pour gérer l'échange initial et convertir en long-lived token
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    // 1. Échanger le code contre un short-lived token
    const shortLivedToken = await super.exchangeCodeForToken(code)

    // 2. Convertir en long-lived token (60 jours)
    try {
      const longLivedToken = await this.exchangeForLongLivedToken(shortLivedToken.access_token)
      console.log('✅ Facebook long-lived token obtained (60 days)')
      return longLivedToken
    } catch (error) {
      console.error('Failed to get long-lived token, using short-lived:', error)
      // Fallback sur le short-lived si échec
      return shortLivedToken
    }
  }

  /**
   * Note: Facebook ne supporte pas les refresh tokens pour les tokens utilisateur
   * Mais les long-lived tokens durent 60 jours
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    throw new Error(
      'Facebook does not support refresh tokens for user access tokens. ' +
      'Please ask the user to re-authenticate.'
    )
  }
}
