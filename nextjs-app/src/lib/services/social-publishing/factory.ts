// Factory pour obtenir le bon Publisher selon la plateforme
// Date: 20 octobre 2025

import type { SocialPlatform } from '@/types/social-integration'
import { SocialPublisher } from './base'
import { FacebookPublisher } from './facebook'
import { LinkedInPublisher } from './linkedin'
import { InstagramPublisher } from './instagram'

/**
 * Récupère le publisher approprié pour une plateforme donnée
 *
 * @param platform - Platform social media (facebook, linkedin, instagram)
 * @returns Instance du publisher correspondant
 * @throws Error si la plateforme n'est pas supportée
 *
 * @example
 * const publisher = getPublisher('facebook')
 * const result = await publisher.publish(params, integration)
 */
export function getPublisher(platform: SocialPlatform): SocialPublisher {
  switch (platform) {
    case 'facebook':
      return new FacebookPublisher()

    case 'linkedin':
      return new LinkedInPublisher()

    case 'instagram':
      return new InstagramPublisher()

    default:
      // TypeScript devrait empêcher ceci, mais garde-fou runtime
      throw new Error(`Unsupported platform: ${platform}. Supported platforms are: facebook, linkedin, instagram`)
  }
}

/**
 * Récupère tous les publishers disponibles
 *
 * @returns Map des publishers par plateforme
 */
export function getAllPublishers(): Map<SocialPlatform, SocialPublisher> {
  const publishers = new Map<SocialPlatform, SocialPublisher>()

  const platforms: SocialPlatform[] = ['facebook', 'linkedin', 'instagram']

  for (const platform of platforms) {
    publishers.set(platform, getPublisher(platform))
  }

  return publishers
}

/**
 * Vérifie si une plateforme est supportée pour la publication
 *
 * @param platform - Nom de la plateforme à vérifier
 * @returns true si la plateforme est supportée
 */
export function isPlatformSupported(platform: string): platform is SocialPlatform {
  return ['facebook', 'linkedin', 'instagram'].includes(platform)
}
