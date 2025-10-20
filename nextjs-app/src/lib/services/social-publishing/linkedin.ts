// LinkedIn Publisher - Publication d'articles sur LinkedIn
// Documentation: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
// Date: 20 octobre 2025

import { SocialPublisher } from './base'
import { buildMessage } from './message-builder'
import type {
  PublishParams,
  PublishResult,
  SocialIntegration,
  SocialPlatform
} from '@/types/social-integration'

export class LinkedInPublisher extends SocialPublisher {
  protected platform: SocialPlatform = 'linkedin'

  /**
   * Publie un article sur LinkedIn via UGC Posts API
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
        return this.createErrorResult('LinkedIn integration is not active or token is expired')
      }

      // Récupérer le token
      const accessToken = this.getAccessToken(integration)

      // Construire le message
      const message = buildMessage(params, 'linkedin')

      // Construire l'URL de l'article
      const articleUrl = this.getArticleUrl(params.article_slug)

      // Récupérer l'URN de l'utilisateur
      const authorURN = `urn:li:person:${integration.platform_user_id}`

      // Préparer les données de publication (UGC Post)
      const postData = {
        author: authorURN,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: message
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                originalUrl: articleUrl,
                ...(params.featured_image_url && {
                  thumbnails: [{
                    url: params.featured_image_url
                  }]
                }),
                title: {
                  text: params.article_title
                },
                description: {
                  text: params.article_excerpt || ''
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      }

      // Publier sur LinkedIn
      const response = await fetch(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify(postData)
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('LinkedIn API error:', errorData)
        throw new Error(errorData.message || 'LinkedIn API error')
      }

      const data = await response.json()

      // Extraire l'ID du post depuis l'URN
      const postId = data.id?.split(':').pop() || data.id

      const result = this.createSuccessResult(
        postId,
        `https://www.linkedin.com/feed/update/${data.id || postId}`
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
   * Rafraîchit le token LinkedIn
   */
  async refreshToken(integration: SocialIntegration): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken(integration)

      if (!refreshToken) {
        console.warn('No refresh token available for LinkedIn')
        return null
      }

      const clientId = process.env.LINKEDIN_CLIENT_ID
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        throw new Error('LinkedIn credentials not configured')
      }

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      })

      const response = await fetch(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('LinkedIn token refresh failed:', errorData)
        return null
      }

      const data = await response.json()
      console.log('✅ LinkedIn token refreshed successfully')

      return data.access_token
    } catch (error) {
      console.error('Failed to refresh LinkedIn token:', error)
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

      // Tester avec une requête simple
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
      console.error('Failed to test LinkedIn connection:', error)
      return false
    }
  }

  /**
   * Validation spécifique à LinkedIn
   */
  protected validatePlatformSpecific(params: PublishParams): void {
    // LinkedIn a une limite de 3000 caractères
    const message = buildMessage(params, 'linkedin')
    if (message.length > 3000) {
      throw new Error('LinkedIn message exceeds 3000 character limit')
    }
  }
}
