// Factory pour obtenir le bon OAuth Handler selon la plateforme
// Date: 20 octobre 2025

import type { SocialPlatform } from '@/types/social-integration'
import { OAuthHandler } from './base'
import { FacebookOAuthHandler } from './facebook'
import { LinkedInOAuthHandler } from './linkedin'
import { InstagramOAuthHandler } from './instagram'

/**
 * Récupère le handler OAuth approprié pour une plateforme donnée
 *
 * @param platform - Platform social media (facebook, linkedin, instagram)
 * @returns Instance du handler OAuth correspondant
 * @throws Error si la plateforme n'est pas supportée
 *
 * @example
 * const handler = getOAuthHandler('facebook')
 * const authUrl = handler.getAuthorizationUrl(state)
 */
export function getOAuthHandler(platform: SocialPlatform): OAuthHandler {
  switch (platform) {
    case 'facebook':
      return new FacebookOAuthHandler()

    case 'linkedin':
      return new LinkedInOAuthHandler()

    case 'instagram':
      return new InstagramOAuthHandler()

    default:
      // TypeScript devrait empêcher ceci, mais garde-fou runtime
      throw new Error(`Unsupported platform: ${platform}. Supported platforms are: facebook, linkedin, instagram`)
  }
}

/**
 * Vérifie si une plateforme est supportée
 *
 * @param platform - Nom de la plateforme à vérifier
 * @returns true si la plateforme est supportée
 */
export function isSupportedPlatform(platform: string): platform is SocialPlatform {
  return ['facebook', 'linkedin', 'instagram'].includes(platform)
}

/**
 * Récupère tous les handlers OAuth disponibles
 *
 * @returns Map des handlers par plateforme
 */
export function getAllOAuthHandlers(): Map<SocialPlatform, OAuthHandler> {
  const handlers = new Map<SocialPlatform, OAuthHandler>()

  const platforms: SocialPlatform[] = ['facebook', 'linkedin', 'instagram']

  for (const platform of platforms) {
    try {
      handlers.set(platform, getOAuthHandler(platform))
    } catch (error) {
      console.warn(`Failed to initialize OAuth handler for ${platform}:`, error)
    }
  }

  return handlers
}

/**
 * Vérifie si les credentials OAuth sont configurés pour une plateforme
 *
 * @param platform - Plateforme à vérifier
 * @returns true si les credentials sont configurés
 */
export function areCredentialsConfigured(platform: SocialPlatform): boolean {
  try {
    getOAuthHandler(platform)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Récupère la liste des plateformes configurées
 *
 * @returns Array des plateformes avec credentials configurés
 */
export function getConfiguredPlatforms(): SocialPlatform[] {
  const platforms: SocialPlatform[] = ['facebook', 'linkedin', 'instagram']

  return platforms.filter(platform => areCredentialsConfigured(platform))
}
