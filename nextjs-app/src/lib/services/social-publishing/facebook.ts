// Facebook Publisher - Publication d'articles sur Facebook
// Documentation: https://developers.facebook.com/docs/graph-api/reference/v18.0/page/feed
// Date: 20 octobre 2025

import { SocialPublisher } from './base'
import { buildMessage } from './message-builder'
import type {
  PublishParams,
  PublishResult,
  SocialIntegration,
  SocialPlatform
} from '@/types/social-integration'

export class FacebookPublisher extends SocialPublisher {
  protected platform: SocialPlatform = 'facebook'

  /**
   * Publie un article sur Facebook
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
        return this.createErrorResult('Facebook integration is not active or token is expired')
      }

      // Récupérer le token
      const accessToken = this.getAccessToken(integration)

      // Construire le message
      const message = buildMessage(params, 'facebook')

      // Construire l'URL de l'article
      const articleUrl = this.getArticleUrl(params.article_slug)

      // Préparer les données de publication
      const postData = {
        message,
        link: articleUrl
      }

      // Ajouter l'image si disponible
      if (params.featured_image_url) {
        (postData as any).picture = params.featured_image_url
      }

      // Publier sur Facebook
      // Note: Utilise /me/feed pour publier sur le profil,
      // ou /{page_id}/feed pour publier sur une page
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...postData,
            access_token: accessToken
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Facebook API error:', errorData)
        throw new Error(errorData.error?.message || 'Facebook API error')
      }

      const data = await response.json()

      const result = this.createSuccessResult(
        data.id,
        `https://facebook.com/${data.id}`
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
   * Rafraîchit le token Facebook
   * Note: Facebook utilise des long-lived tokens (60 jours) sans refresh
   */
  async refreshToken(integration: SocialIntegration): Promise<string | null> {
    // Facebook ne supporte pas le refresh automatique pour les tokens utilisateur
    // Il faut demander à l'utilisateur de se reconnecter
    console.warn('Facebook tokens cannot be refreshed automatically. User must re-authenticate.')
    return null
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

      // Tester avec une requête simple
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
      )

      return response.ok
    } catch (error) {
      console.error('Failed to test Facebook connection:', error)
      return false
    }
  }

  /**
   * Récupère les pages Facebook de l'utilisateur
   * Utile pour sélectionner sur quelle page publier
   */
  async getUserPages(integration: SocialIntegration): Promise<any[]> {
    try {
      const accessToken = this.getAccessToken(integration)

      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,tasks&access_token=${accessToken}`
      )

      if (!response.ok) {
        throw new Error('Failed to get Facebook pages')
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Failed to get Facebook pages:', error)
      return []
    }
  }

  /**
   * Validation spécifique à Facebook
   */
  protected validatePlatformSpecific(params: PublishParams): void {
    // Facebook n'a pas de requirements spécifiques
  }
}
