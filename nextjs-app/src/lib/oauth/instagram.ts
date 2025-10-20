// Instagram OAuth Handler (via Facebook Graph API)
// Documentation: https://developers.facebook.com/docs/instagram-api/
// Date: 20 octobre 2025

import { OAuthHandler, type TokenResponse } from './base'
import type { OAuthConfig, PlatformUserInfo, SocialPlatform } from '@/types/social-integration'

export class InstagramOAuthHandler extends OAuthHandler {
  protected platform: SocialPlatform = 'instagram'
  protected config: OAuthConfig

  constructor() {
    super()

    // Instagram utilise les mêmes credentials Facebook
    const clientId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID
    const clientSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/instagram`

    if (!clientId || !clientSecret) {
      throw new Error('Instagram OAuth credentials are not configured. Please set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET (or use Facebook credentials).')
    }

    this.config = {
      platform: 'instagram',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      authorization_url: 'https://api.instagram.com/oauth/authorize',
      token_url: 'https://api.instagram.com/oauth/access_token',
      scopes: [
        'instagram_basic',            // Accès de base
        'instagram_content_publish'   // Publier du contenu
      ],
      user_info_url: 'https://graph.instagram.com/me'
    }
  }

  /**
   * Parse les informations utilisateur Instagram
   */
  protected parseUserInfo(data: any): PlatformUserInfo {
    return {
      id: data.id,
      username: data.username,
      name: data.name || data.username,
      email: undefined, // Instagram n'expose pas l'email via l'API
      profile_url: `https://instagram.com/${data.username}`,
      avatar_url: data.profile_picture_url
    }
  }

  /**
   * Convertit un short-lived token en long-lived token (60 jours)
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this.config.client_secret,
      access_token: shortLivedToken
    })

    const response = await fetch(
      `https://graph.instagram.com/access_token?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Instagram long-lived token exchange failed:', errorText)
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
   * Rafraîchit un long-lived token Instagram avant son expiration
   * Prolonge la durée de 60 jours supplémentaires
   */
  async refreshAccessToken(longLivedToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: longLivedToken
    })

    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Instagram token refresh failed:', errorText)
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      access_token: data.access_token,
      token_type: 'Bearer',
      expires_in: data.expires_in,
      scope: undefined
    }
  }

  /**
   * Récupère les informations utilisateur avec des champs spécifiques
   */
  async getUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const fields = 'id,username,account_type,media_count'
    const response = await fetch(
      `${this.config.user_info_url}?fields=${fields}&access_token=${accessToken}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get Instagram user info')
    }

    const data = await response.json()
    return this.parseUserInfo(data)
  }

  /**
   * Récupère l'ID du compte Instagram Business
   * Nécessaire pour publier via l'API
   */
  async getBusinessAccountId(accessToken: string, facebookPageId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${facebookPageId}?fields=instagram_business_account&access_token=${accessToken}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.instagram_business_account?.id || null
    } catch (error) {
      console.error('Error getting Instagram Business Account ID:', error)
      return null
    }
  }

  /**
   * Révoque l'accès Instagram
   */
  async revokeAccess(accessToken: string): Promise<boolean> {
    try {
      // Instagram utilise l'endpoint de révocation Facebook
      const response = await fetch(
        `https://graph.instagram.com/me/permissions`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      return response.ok
    } catch (error) {
      console.error('Failed to revoke Instagram access:', error)
      return false
    }
  }

  /**
   * Override pour gérer l'échange initial et convertir en long-lived token
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    // Note: Instagram OAuth nécessite POST avec form data
    const formData = new URLSearchParams({
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirect_uri,
      code: code
    })

    const response = await fetch(this.config.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Instagram token exchange failed:', errorText)
      throw new Error(`Failed to exchange code for token: ${response.statusText}`)
    }

    const data = await response.json()

    // 1. Token short-lived obtenu
    const shortLivedToken: TokenResponse = {
      access_token: data.access_token,
      token_type: 'Bearer',
      expires_in: 3600, // 1 heure
      scope: data.scope
    }

    // 2. Convertir en long-lived token (60 jours)
    try {
      const longLivedToken = await this.exchangeForLongLivedToken(shortLivedToken.access_token)
      console.log('✅ Instagram long-lived token obtained (60 days)')
      return longLivedToken
    } catch (error) {
      console.error('Failed to get Instagram long-lived token, using short-lived:', error)
      // Fallback sur le short-lived si échec
      return shortLivedToken
    }
  }

  /**
   * Paramètres supplémentaires pour OAuth
   */
  protected getAdditionalAuthParams(): Record<string, string> {
    return {
      response_type: 'code'
    }
  }

  /**
   * Vérifie si le compte est un compte Instagram Business
   * (requis pour publier via l'API)
   */
  async isBusinessAccount(accessToken: string): Promise<boolean> {
    try {
      const userInfo = await this.getUserInfo(accessToken)
      const response = await fetch(
        `https://graph.instagram.com/${userInfo.id}?fields=account_type&access_token=${accessToken}`
      )

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.account_type === 'BUSINESS' || data.account_type === 'CREATOR'
    } catch (error) {
      console.error('Error checking Instagram account type:', error)
      return false
    }
  }
}
