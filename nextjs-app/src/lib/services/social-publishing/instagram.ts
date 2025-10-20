// Instagram Publisher - Publication d'articles sur Instagram
// Documentation: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
// Date: 20 octobre 2025

import { SocialPublisher } from './base'
import { buildMessage } from './message-builder'
import type {
  PublishParams,
  PublishResult,
  SocialIntegration,
  SocialPlatform
} from '@/types/social-integration'

export class InstagramPublisher extends SocialPublisher {
  protected platform: SocialPlatform = 'instagram'

  /**
   * Publie un article sur Instagram
   * Note: Instagram nécessite une image obligatoirement
   */
  async publish(
    params: PublishParams,
    integration: SocialIntegration
  ): Promise<PublishResult> {
    try {
      // Valider les paramètres
      this.validatePublishParams(params)

      // Vérifier que l'intégration est active
      if (!this.isIntegrationActive(integration)) {
        return this.createErrorResult('Instagram integration is not active or token is expired')
      }

      // Récupérer le token
      const accessToken = this.getAccessToken(integration)

      // Construire le message
      const caption = buildMessage(params, 'instagram')

      // L'ID Instagram Business Account
      const igUserId = integration.platform_user_id

      // Étape 1: Créer le container de média
      const containerId = await this.createMediaContainer(
        igUserId,
        params.featured_image_url!,
        caption,
        accessToken
      )

      // Étape 2: Attendre que le container soit prêt
      await this.waitForContainerReady(igUserId, containerId, accessToken)

      // Étape 3: Publier le container
      const postId = await this.publishMediaContainer(
        igUserId,
        containerId,
        accessToken
      )

      const result = this.createSuccessResult(
        postId,
        `https://www.instagram.com/p/${postId}`
      )

      this.logPublication(params, result)

      return result
    } catch (error) {
      const result = this.createErrorResult(error as Error)
      this.logPublication(params, result)
      return result
    }
  }

  /**
   * Crée un container de média Instagram
   */
  private async createMediaContainer(
    igUserId: string,
    imageUrl: string,
    caption: string,
    accessToken: string
  ): Promise<string> {
    const params = new URLSearchParams({
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken
    })

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        method: 'POST',
        body: params
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Instagram media container creation failed:', errorData)
      throw new Error(errorData.error?.message || 'Failed to create media container')
    }

    const data = await response.json()
    return data.id
  }

  /**
   * Attend que le container soit prêt pour publication
   */
  private async waitForContainerReady(
    igUserId: string,
    containerId: string,
    accessToken: string,
    maxRetries: number = 10
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`
      )

      if (!response.ok) {
        throw new Error('Failed to check container status')
      }

      const data = await response.json()

      if (data.status_code === 'FINISHED') {
        return
      }

      if (data.status_code === 'ERROR') {
        throw new Error('Media container processing failed')
      }

      // Attendre 2 secondes avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    throw new Error('Media container took too long to process')
  }

  /**
   * Publie le container de média
   */
  private async publishMediaContainer(
    igUserId: string,
    containerId: string,
    accessToken: string
  ): Promise<string> {
    const params = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken
    })

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        body: params
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Instagram media publish failed:', errorData)
      throw new Error(errorData.error?.message || 'Failed to publish media')
    }

    const data = await response.json()
    return data.id
  }

  /**
   * Rafraîchit le token Instagram
   */
  async refreshToken(integration: SocialIntegration): Promise<string | null> {
    try {
      const currentToken = this.getAccessToken(integration)

      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: currentToken
      })

      const response = await fetch(
        `https://graph.instagram.com/refresh_access_token?${params.toString()}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Instagram token refresh failed:', errorData)
        return null
      }

      const data = await response.json()
      console.log('✅ Instagram token refreshed successfully')

      return data.access_token
    } catch (error) {
      console.error('Failed to refresh Instagram token:', error)
      return null
    }
  }

  /**
   * Teste si la publication est possible
   */
  async canPublish(integration: SocialIntegration): Promise<boolean> {
    try {
      if (!this.isIntegrationActive(integration)) {
        return false
      }

      const accessToken = this.getAccessToken(integration)
      const igUserId = integration.platform_user_id

      // Tester avec une requête simple
      const response = await fetch(
        `https://graph.instagram.com/${igUserId}?fields=id,username&access_token=${accessToken}`
      )

      return response.ok
    } catch (error) {
      console.error('Failed to test Instagram connection:', error)
      return false
    }
  }

  /**
   * Validation spécifique à Instagram
   */
  protected validatePlatformSpecific(params: PublishParams): void {
    // Instagram nécessite une image obligatoirement
    if (!params.featured_image_url) {
      throw new Error('Instagram requires a featured image. Please add an image to your article.')
    }

    // Vérifier que l'URL de l'image est valide
    try {
      new URL(params.featured_image_url)
    } catch {
      throw new Error('Invalid featured image URL')
    }

    // Instagram a une limite de 2200 caractères
    const caption = buildMessage(params, 'instagram')
    if (caption.length > 2200) {
      throw new Error('Instagram caption exceeds 2200 character limit')
    }
  }
}
