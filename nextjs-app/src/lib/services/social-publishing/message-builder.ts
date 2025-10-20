// Construction des messages pour les réseaux sociaux
// Supporte les templates et variables
// Date: 20 octobre 2025

import type {
  PublishParams,
  MessageTemplate,
  SocialPlatform
} from '@/types/social-integration'
import { MESSAGE_MAX_LENGTH, getDefaultMessageTemplate } from '@/types/social-integration'

/**
 * Construit le message à publier selon le template et les paramètres
 *
 * @param params - Paramètres de publication (article, etc.)
 * @param platform - Plateforme cible
 * @param template - Template personnalisé (optionnel)
 * @returns Message prêt à être publié
 */
export function buildMessage(
  params: PublishParams,
  platform: SocialPlatform,
  template?: MessageTemplate
): string {
  // Utiliser le custom message s'il est fourni
  if (params.custom_message) {
    return truncateMessage(params.custom_message, platform)
  }

  // Sinon utiliser le template
  const templateString = template?.template || getDefaultMessageTemplate(platform)

  // Remplacer les variables
  let message = templateString
    .replace(/\{\{title\}\}/g, params.article_title)
    .replace(/\{\{excerpt\}\}/g, params.article_excerpt || '')
    .replace(/\{\{url\}\}/g, getArticleUrl(params.article_slug))
    .replace(/\{\{slug\}\}/g, params.article_slug)

  // Ajouter les hashtags si activé
  if (template?.include_hashtags && params.tags && params.tags.length > 0) {
    const hashtags = buildHashtags(params.tags, platform)
    message += `\n\n${hashtags}`
  }

  // Nettoyer le message
  message = cleanMessage(message)

  // Tronquer si nécessaire
  message = truncateMessage(message, platform)

  return message
}

/**
 * Construit les hashtags à partir des tags
 */
function buildHashtags(tags: string[], platform: SocialPlatform): string {
  // Limiter le nombre de hashtags selon la plateforme
  const maxHashtags = platform === 'instagram' ? 30 : platform === 'linkedin' ? 5 : 10

  return tags
    .slice(0, maxHashtags)
    .map(tag => {
      // Nettoyer le tag et le convertir en hashtag
      const cleanTag = tag
        .replace(/[^\wÀ-ÿ\s-]/g, '') // Garder lettres, chiffres, accents, espaces, traits d'union
        .replace(/\s+/g, '') // Supprimer espaces
        .trim()

      return cleanTag ? `#${cleanTag}` : null
    })
    .filter(Boolean)
    .join(' ')
}

/**
 * Nettoie le message (supprime espaces multiples, lignes vides excessives)
 */
function cleanMessage(message: string): string {
  return message
    .replace(/\n{3,}/g, '\n\n') // Max 2 sauts de ligne consécutifs
    .replace(/ {2,}/g, ' ') // Max 1 espace consécutif
    .trim()
}

/**
 * Tronque le message selon les limites de la plateforme
 */
function truncateMessage(message: string, platform: SocialPlatform): string {
  const maxLength = MESSAGE_MAX_LENGTH[platform]

  if (message.length <= maxLength) {
    return message
  }

  // Tronquer en préservant les mots complets
  const truncated = message.substring(0, maxLength - 3) // -3 pour "..."

  // Chercher le dernier espace pour ne pas couper un mot
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    // Si l'espace est dans les derniers 20%, l'utiliser
    return truncated.substring(0, lastSpace) + '...'
  }

  return truncated + '...'
}

/**
 * Construit l'URL complète de l'article
 */
function getArticleUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beamo-immobilier.fr'
  return `${baseUrl}/ressources/${slug}`
}

/**
 * Prévisualise le message avant publication
 *
 * @param params - Paramètres de publication
 * @param platform - Plateforme cible
 * @param template - Template personnalisé (optionnel)
 * @returns Objet avec le message et des infos supplémentaires
 */
export function previewMessage(
  params: PublishParams,
  platform: SocialPlatform,
  template?: MessageTemplate
): {
  message: string
  length: number
  maxLength: number
  isTruncated: boolean
  hashtagsCount: number
} {
  const message = buildMessage(params, platform, template)
  const maxLength = MESSAGE_MAX_LENGTH[platform]

  // Compter les hashtags
  const hashtagsCount = (message.match(/#/g) || []).length

  return {
    message,
    length: message.length,
    maxLength,
    isTruncated: message.endsWith('...'),
    hashtagsCount
  }
}

/**
 * Valide un template
 *
 * @param template - Template à valider
 * @returns Liste des erreurs (vide si valide)
 */
export function validateTemplate(template: string): string[] {
  const errors: string[] = []

  // Vérifier les variables supportées
  const supportedVariables = ['{{title}}', '{{excerpt}}', '{{url}}', '{{slug}}']
  const usedVariables = template.match(/\{\{[^}]+\}\}/g) || []

  for (const variable of usedVariables) {
    if (!supportedVariables.includes(variable)) {
      errors.push(`Variable non supportée: ${variable}. Variables disponibles: ${supportedVariables.join(', ')}`)
    }
  }

  // Vérifier la longueur minimum
  if (template.length < 10) {
    errors.push('Le template doit contenir au moins 10 caractères')
  }

  // Vérifier qu'au moins une variable est utilisée
  if (!supportedVariables.some(v => template.includes(v))) {
    errors.push('Le template doit utiliser au moins une variable')
  }

  return errors
}

/**
 * Échappe les caractères spéciaux pour éviter les problèmes d'encodage
 */
export function escapeSpecialChars(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Extrait le premier lien d'un texte
 */
export function extractFirstLink(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/
  const match = text.match(urlRegex)
  return match ? match[0] : null
}
