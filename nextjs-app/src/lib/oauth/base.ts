// Classe abstraite de base pour les handlers OAuth
// Date: 20 octobre 2025

import type {
  OAuthConfig,
  PlatformUserInfo,
  SocialPlatform
} from '@/types/social-integration'

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
}

export abstract class OAuthHandler {
  protected abstract platform: SocialPlatform
  protected abstract config: OAuthConfig

  /**
   * Génère l'URL d'autorisation OAuth pour rediriger l'utilisateur
   *
   * @param state - Token CSRF pour sécuriser la requête
   * @returns URL complète d'autorisation
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.client_id,
      redirect_uri: this.config.redirect_uri,
      state,
      scope: this.config.scopes.join(' '),
      response_type: 'code'
    })

    // Ajouter des paramètres supplémentaires spécifiques à la plateforme
    const additionalParams = this.getAdditionalAuthParams()
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value)
    })

    return `${this.config.authorization_url}?${params.toString()}`
  }

  /**
   * Échange le code d'autorisation contre un access token
   *
   * @param code - Code d'autorisation reçu du callback
   * @returns Objet contenant le token d'accès et métadonnées
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
      code,
      redirect_uri: this.config.redirect_uri,
      grant_type: 'authorization_code'
    })

    // Ajouter des paramètres supplémentaires si nécessaire
    const additionalParams = this.getAdditionalTokenParams()
    Object.entries(additionalParams).forEach(([key, value]) => {
      body.set(key, value)
    })

    const response = await fetch(this.config.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${this.platform} token exchange failed:`, errorText)
      throw new Error(`Failed to exchange code for token: ${response.statusText}`)
    }

    const data = await response.json()

    return this.parseTokenResponse(data)
  }

  /**
   * Rafraîchit un access token expiré
   *
   * @param refreshToken - Refresh token
   * @returns Nouvel access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })

    const response = await fetch(this.config.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${this.platform} token refresh failed:`, errorText)
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    const data = await response.json()
    return this.parseTokenResponse(data)
  }

  /**
   * Récupère les informations de l'utilisateur depuis la plateforme
   *
   * @param accessToken - Access token valide
   * @returns Informations de l'utilisateur
   */
  async getUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const response = await fetch(this.config.user_info_url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${this.platform} user info fetch failed:`, errorText)
      throw new Error(`Failed to get user info: ${response.statusText}`)
    }

    const data = await response.json()
    return this.parseUserInfo(data)
  }

  /**
   * Révoque l'accès OAuth (déconnexion)
   *
   * @param accessToken - Token à révoquer
   * @returns true si succès
   */
  abstract revokeAccess(accessToken: string): Promise<boolean>

  /**
   * Parse la réponse token de la plateforme
   * Peut être overridé par les implémentations spécifiques
   */
  protected parseTokenResponse(data: any): TokenResponse {
    return {
      access_token: data.access_token,
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      scope: data.scope
    }
  }

  /**
   * Parse les informations utilisateur de la plateforme
   * Doit être implémenté par chaque plateforme
   */
  protected abstract parseUserInfo(data: any): PlatformUserInfo

  /**
   * Paramètres supplémentaires pour l'URL d'autorisation
   * Peut être overridé par les implémentations spécifiques
   */
  protected getAdditionalAuthParams(): Record<string, string> {
    return {}
  }

  /**
   * Paramètres supplémentaires pour l'échange de token
   * Peut être overridé par les implémentations spécifiques
   */
  protected getAdditionalTokenParams(): Record<string, string> {
    return {}
  }

  /**
   * Calcule la date d'expiration du token
   *
   * @param expiresIn - Durée en secondes
   * @returns Date d'expiration ISO string
   */
  protected calculateExpirationDate(expiresIn: number): string {
    const now = new Date()
    now.setSeconds(now.getSeconds() + expiresIn)
    return now.toISOString()
  }

  /**
   * Valide les scopes accordés par l'utilisateur
   *
   * @param grantedScopes - Scopes accordés
   * @returns true si tous les scopes requis sont présents
   */
  validateScopes(grantedScopes: string): boolean {
    const granted = grantedScopes.split(' ').filter(Boolean)
    const required = this.config.scopes

    return required.every(scope => granted.includes(scope))
  }

  /**
   * Getter pour la plateforme
   */
  getPlatform(): SocialPlatform {
    return this.platform
  }
}
