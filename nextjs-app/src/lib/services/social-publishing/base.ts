// Classe abstraite de base pour les publishers de réseaux sociaux
// Date: 20 octobre 2025

import type {
  SocialIntegration,
  PublishResult,
  PublishParams,
  SocialPlatform
} from '@/types/social-integration'
import { decryptToken } from '@/lib/crypto/token-encryption'
import { isTokenExpired } from '@/types/social-integration'

export abstract class SocialPublisher {
  protected abstract platform: SocialPlatform

  /**
   * Publie un article sur la plateforme sociale
   *
   * @param params - Paramètres de publication (article, message, etc.)
   * @param integration - Intégration sociale de l'utilisateur (avec tokens)
   * @returns Résultat de la publication
   */
  abstract publish(
    params: PublishParams,
    integration: SocialIntegration
  ): Promise<PublishResult>

  /**
   * Rafraîchit le token d'accès si nécessaire
   *
   * @param integration - Intégration sociale
   * @returns Nouveau token ou null si pas de refresh nécessaire
   */
  abstract refreshToken(integration: SocialIntegration): Promise<string | null>

  /**
   * Teste si la publication est possible (token valide, permissions OK)
   *
   * @param integration - Intégration sociale
   * @returns true si publication possible
   */
  abstract canPublish(integration: SocialIntegration): Promise<boolean>

  /**
   * Déchiffre le token d'accès
   */
  protected getAccessToken(integration: SocialIntegration): string {
    try {
      return decryptToken(integration.access_token)
    } catch (error) {
      console.error(`Failed to decrypt ${this.platform} access token:`, error)
      throw new Error(`Invalid access token for ${this.platform}`)
    }
  }

  /**
   * Déchiffre le refresh token
   */
  protected getRefreshToken(integration: SocialIntegration): string | null {
    if (!integration.refresh_token) {
      return null
    }

    try {
      return decryptToken(integration.refresh_token)
    } catch (error) {
      console.error(`Failed to decrypt ${this.platform} refresh token:`, error)
      return null
    }
  }

  /**
   * Vérifie si le token est expiré
   */
  protected isTokenExpired(integration: SocialIntegration): boolean {
    return isTokenExpired(integration.token_expires_at)
  }

  /**
   * Vérifie si l'intégration est active
   */
  protected isIntegrationActive(integration: SocialIntegration): boolean {
    return integration.is_active && !this.isTokenExpired(integration)
  }

  /**
   * Construit l'URL complète de l'article
   */
  protected getArticleUrl(slug: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beamo-immobilier.fr'
    return `${baseUrl}/ressources/${slug}`
  }

  /**
   * Helper pour gérer les erreurs de publication
   */
  protected createErrorResult(error: Error | string): PublishResult {
    const errorMessage = error instanceof Error ? error.message : error

    return {
      success: false,
      platform: this.platform,
      error: errorMessage
    }
  }

  /**
   * Helper pour créer un résultat de succès
   */
  protected createSuccessResult(
    postId: string,
    postUrl?: string
  ): PublishResult {
    return {
      success: true,
      platform: this.platform,
      post_id: postId,
      post_url: postUrl,
      published_at: new Date().toISOString()
    }
  }

  /**
   * Valide les paramètres de publication
   */
  protected validatePublishParams(params: PublishParams): void {
    if (!params.article_title) {
      throw new Error('Article title is required')
    }

    if (!params.article_slug) {
      throw new Error('Article slug is required')
    }

    // Validation spécifique par plateforme peut être overridée
    this.validatePlatformSpecific(params)
  }

  /**
   * Validation spécifique à la plateforme
   * À overrider si nécessaire
   */
  protected validatePlatformSpecific(params: PublishParams): void {
    // Override dans les classes enfants si besoin
  }

  /**
   * Log une publication
   */
  protected logPublication(
    params: PublishParams,
    result: PublishResult
  ): void {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${this.platform} publication:`, {
      article_id: params.article_id,
      article_title: params.article_title,
      success: result.success,
      post_id: result.post_id,
      error: result.error
    })
  }

  /**
   * Getter pour la plateforme
   */
  getPlatform(): SocialPlatform {
    return this.platform
  }
}
