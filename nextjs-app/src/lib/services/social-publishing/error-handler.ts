// Error Handler avec retry logic et classification des erreurs
// Date: 20 octobre 2025

import type { PublishResult, SocialPlatform } from '@/types/social-integration'

/**
 * Types d'erreurs pour classification
 */
export enum ErrorType {
  TRANSIENT = 'transient',      // Erreur temporaire, retry possible
  PERMANENT = 'permanent',       // Erreur permanente, retry inutile
  RATE_LIMIT = 'rate_limit',     // Rate limit atteint, retry avec délai
  AUTH = 'auth',                 // Erreur d'authentification, reconnexion requise
  NETWORK = 'network'            // Erreur réseau, retry possible
}

/**
 * Structure d'une erreur classifiée
 */
export interface ClassifiedError {
  type: ErrorType
  message: string
  originalError: Error
  retryable: boolean
  retryAfter?: number  // Délai suggéré en millisecondes
  requiresReauth?: boolean
}

/**
 * Configuration du retry
 */
export interface RetryConfig {
  maxRetries: number
  baseDelay: number        // Délai de base en ms
  maxDelay: number         // Délai maximum en ms
  exponentialBase: number  // Base pour l'exponentiel (2 = doubler à chaque fois)
  jitter: boolean          // Ajouter du jitter pour éviter thundering herd
}

/**
 * Configuration par défaut
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 seconde
  maxDelay: 30000,      // 30 secondes
  exponentialBase: 2,
  jitter: true
}

/**
 * Classifie une erreur pour déterminer si elle est retryable
 *
 * @param error - L'erreur à classifier
 * @param platform - La plateforme concernée
 * @returns Erreur classifiée
 */
export function classifyError(
  error: Error,
  platform: SocialPlatform
): ClassifiedError {
  const errorMessage = error.message.toLowerCase()

  // Erreurs d'authentification
  if (
    errorMessage.includes('invalid token') ||
    errorMessage.includes('token expired') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('access denied')
  ) {
    return {
      type: ErrorType.AUTH,
      message: 'Authentication error - token may be expired or invalid',
      originalError: error,
      retryable: false,
      requiresReauth: true
    }
  }

  // Rate limiting
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('throttled')
  ) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: 'Rate limit exceeded',
      originalError: error,
      retryable: true,
      retryAfter: extractRetryAfter(error) || 60000 // 1 minute par défaut
    }
  }

  // Erreurs réseau
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('enotfound') ||
    errorMessage.includes('fetch failed')
  ) {
    return {
      type: ErrorType.NETWORK,
      message: 'Network error - connection issue',
      originalError: error,
      retryable: true
    }
  }

  // Erreurs transitoires spécifiques aux plateformes
  if (isTransientPlatformError(error, platform)) {
    return {
      type: ErrorType.TRANSIENT,
      message: 'Transient platform error',
      originalError: error,
      retryable: true
    }
  }

  // Erreurs permanentes par défaut
  return {
    type: ErrorType.PERMANENT,
    message: error.message || 'Unknown permanent error',
    originalError: error,
    retryable: false
  }
}

/**
 * Vérifie si une erreur est transitoire pour une plateforme donnée
 */
function isTransientPlatformError(
  error: Error,
  platform: SocialPlatform
): boolean {
  const errorMessage = error.message.toLowerCase()

  switch (platform) {
    case 'facebook':
    case 'instagram':
      return (
        errorMessage.includes('temporary') ||
        errorMessage.includes('try again later') ||
        errorMessage.includes('service temporarily unavailable')
      )

    case 'linkedin':
      return (
        errorMessage.includes('internal server error') ||
        errorMessage.includes('service unavailable')
      )

    default:
      return false
  }
}

/**
 * Extrait le délai de retry depuis l'erreur (header Retry-After)
 */
function extractRetryAfter(error: Error): number | null {
  // Tenter d'extraire depuis le message d'erreur
  const match = error.message.match(/retry[_\s]after[:\s]+(\d+)/i)
  if (match) {
    return parseInt(match[1], 10) * 1000 // Convertir secondes en ms
  }
  return null
}

/**
 * Calcule le délai avant le prochain retry avec backoff exponentiel
 *
 * @param attemptNumber - Numéro de la tentative (commence à 1)
 * @param config - Configuration du retry
 * @returns Délai en millisecondes
 */
export function calculateBackoffDelay(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  // Calcul exponentiel: baseDelay * (exponentialBase ^ attemptNumber)
  let delay = config.baseDelay * Math.pow(config.exponentialBase, attemptNumber - 1)

  // Limiter au délai maximum
  delay = Math.min(delay, config.maxDelay)

  // Ajouter du jitter (±25% du délai)
  if (config.jitter) {
    const jitterAmount = delay * 0.25
    const jitter = Math.random() * jitterAmount * 2 - jitterAmount
    delay = Math.max(0, delay + jitter)
  }

  return Math.floor(delay)
}

/**
 * Exécute une fonction avec retry automatique
 *
 * @param fn - Fonction à exécuter
 * @param platform - Plateforme concernée
 * @param config - Configuration du retry
 * @returns Résultat de la fonction
 * @throws Dernière erreur si tous les retries échouent
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  platform: SocialPlatform,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: ClassifiedError | null = null

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const classified = classifyError(error as Error, platform)
      lastError = classified

      // Log l'erreur
      console.error(`[${platform}] Attempt ${attempt} failed:`, {
        type: classified.type,
        message: classified.message,
        retryable: classified.retryable
      })

      // Si non retryable ou dernière tentative, throw
      if (!classified.retryable || attempt > config.maxRetries) {
        throw classified
      }

      // Calculer le délai
      const delay = classified.retryAfter || calculateBackoffDelay(attempt, config)

      console.log(`[${platform}] Retrying in ${delay}ms...`)

      // Attendre avant le prochain retry
      await sleep(delay)
    }
  }

  // Ne devrait jamais arriver ici, mais TypeScript l'exige
  throw lastError!
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wrapper pour logger les erreurs de publication
 *
 * @param platform - Plateforme concernée
 * @param articleSlug - Slug de l'article
 * @param error - Erreur classifiée
 */
export function logPublicationError(
  platform: SocialPlatform,
  articleSlug: string,
  error: ClassifiedError
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    platform,
    article_slug: articleSlug,
    error_type: error.type,
    error_message: error.message,
    retryable: error.retryable,
    requires_reauth: error.requiresReauth,
    original_error: error.originalError.message
  }

  // En production, envoyer à un service de logging (Sentry, LogRocket, etc.)
  console.error('Publication error:', JSON.stringify(logData, null, 2))

  // TODO: Intégrer avec Sentry ou autre service de monitoring
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error.originalError, {
  //     tags: { platform, error_type: error.type },
  //     extra: logData
  //   })
  // }
}

/**
 * Vérifie si une erreur nécessite une réauthentification
 */
export function requiresReauth(error: ClassifiedError): boolean {
  return error.requiresReauth === true
}

/**
 * Convertit une ClassifiedError en PublishResult
 */
export function errorToPublishResult(
  error: ClassifiedError,
  platform: SocialPlatform
): PublishResult {
  return {
    success: false,
    error: error.message,
    platform,
    timestamp: new Date().toISOString()
  }
}

/**
 * Helper pour gérer les erreurs dans les publishers
 *
 * Usage:
 * ```typescript
 * try {
 *   const result = await withRetry(
 *     () => this.publishToAPI(params),
 *     this.platform
 *   )
 *   return result
 * } catch (error) {
 *   return handlePublisherError(error as ClassifiedError, this.platform, params.article_slug)
 * }
 * ```
 */
export function handlePublisherError(
  error: ClassifiedError | Error,
  platform: SocialPlatform,
  articleSlug: string
): PublishResult {
  const classified = error instanceof Error
    ? classifyError(error, platform)
    : error

  // Logger l'erreur
  logPublicationError(platform, articleSlug, classified)

  // Convertir en PublishResult
  return errorToPublishResult(classified, platform)
}
