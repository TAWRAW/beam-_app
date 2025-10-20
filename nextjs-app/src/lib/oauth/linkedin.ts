// LinkedIn OAuth Handler
// Documentation: https://learn.microsoft.com/en-us/linkedin/shared/authentication/
// Date: 20 octobre 2025

import { OAuthHandler, type TokenResponse } from './base'
import type { OAuthConfig, PlatformUserInfo, SocialPlatform } from '@/types/social-integration'

export class LinkedInOAuthHandler extends OAuthHandler {
  protected platform: SocialPlatform = 'linkedin'
  protected config: OAuthConfig

  constructor() {
    super()

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/linkedin`

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn OAuth credentials are not configured. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.')
    }

    this.config = {
      platform: 'linkedin',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      authorization_url: 'https://www.linkedin.com/oauth/v2/authorization',
      token_url: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: [
        'w_member_social',  // Publier du contenu
        'r_liteprofile',    // Lire le profil de base
        'r_emailaddress'    // Lire l'email (optionnel)
      ],
      user_info_url: 'https://api.linkedin.com/v2/me'
    }
  }

  /**
   * Parse les informations utilisateur LinkedIn
   */
  protected parseUserInfo(data: any): PlatformUserInfo {
    // Construire le nom complet depuis le profil LinkedIn
    const firstName = data.localizedFirstName || data.firstName?.localized?.fr_FR || ''
    const lastName = data.localizedLastName || data.lastName?.localized?.fr_FR || ''
    const fullName = `${firstName} ${lastName}`.trim()

    return {
      id: data.id,
      username: undefined, // LinkedIn n'expose pas de username public
      name: fullName,
      email: undefined, // À récupérer séparément via /emailAddress
      profile_url: `https://www.linkedin.com/in/${data.vanityName || data.id}`,
      avatar_url: data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
    }
  }

  /**
   * Récupère l'email de l'utilisateur LinkedIn (endpoint séparé)
   */
  async getUserEmail(accessToken: string): Promise<string | undefined> {
    try {
      const response = await fetch(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.error('Failed to get LinkedIn email')
        return undefined
      }

      const data = await response.json()
      return data.elements?.[0]?.['handle~']?.emailAddress
    } catch (error) {
      console.error('Error fetching LinkedIn email:', error)
      return undefined
    }
  }

  /**
   * Récupère les informations utilisateur avec l'email
   */
  async getUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    // 1. Récupérer le profil de base
    const response = await fetch(
      this.config.user_info_url,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn user info')
    }

    const profileData = await response.json()
    const userInfo = this.parseUserInfo(profileData)

    // 2. Récupérer l'email (si autorisé)
    try {
      const email = await this.getUserEmail(accessToken)
      if (email) {
        userInfo.email = email
      }
    } catch (error) {
      console.warn('Could not fetch LinkedIn email:', error)
    }

    return userInfo
  }

  /**
   * Révoque l'accès LinkedIn
   */
  async revokeAccess(accessToken: string): Promise<boolean> {
    try {
      // LinkedIn OAuth 2.0 ne fournit pas d'endpoint de révocation standard
      // L'utilisateur doit révoquer manuellement depuis ses paramètres LinkedIn
      console.log('LinkedIn does not provide a revocation endpoint. User must revoke access manually from LinkedIn settings.')
      return true
    } catch (error) {
      console.error('Failed to revoke LinkedIn access:', error)
      return false
    }
  }

  /**
   * LinkedIn supporte les refresh tokens
   * Durée de validité: 60 jours pour l'access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    return super.refreshAccessToken(refreshToken)
  }

  /**
   * Teste si le token a la permission de publier
   */
  async canPublish(accessToken: string): Promise<boolean> {
    try {
      // Tester avec une requête introspection
      const response = await fetch(
        'https://api.linkedin.com/v2/me',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Récupère l'ID utilisateur pour l'API UGC Posts
   * Format: urn:li:person:{id}
   */
  async getUserURN(accessToken: string): Promise<string> {
    const userInfo = await this.getUserInfo(accessToken)
    return `urn:li:person:${userInfo.id}`
  }
}
