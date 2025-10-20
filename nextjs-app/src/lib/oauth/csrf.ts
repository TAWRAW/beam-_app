// Gestion des tokens CSRF (state) pour OAuth
// Protection contre les attaques CSRF lors du flow OAuth
// Date: 20 octobre 2025

import crypto from 'crypto'
import type { CSRFState, SocialPlatform } from '@/types/social-integration'

// Durée de validité du state token: 10 minutes
const STATE_TOKEN_TTL = 10 * 60 * 1000 // 10 minutes en millisecondes

// Store en mémoire pour le développement
// En production, utiliser Redis ou une base de données
const stateStore = new Map<string, CSRFState>()

// Nettoyage automatique des tokens expirés toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [token, state] of stateStore.entries()) {
      if (state.expires_at < now) {
        stateStore.delete(token)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Génère un token CSRF (state) sécurisé pour OAuth
 *
 * @param userId - ID de l'utilisateur
 * @param platform - Plateforme social media
 * @param redirectTo - URL de redirection après succès (optionnel)
 * @returns Token CSRF unique
 *
 * @example
 * const state = await generateCSRFToken(userId, 'facebook', '/apps/settings')
 */
export async function generateCSRFToken(
  userId: string,
  platform: SocialPlatform,
  redirectTo?: string
): Promise<string> {
  // Générer un token aléatoire sécurisé
  const token = crypto.randomBytes(32).toString('hex')

  const now = Date.now()
  const state: CSRFState = {
    token,
    user_id: userId,
    platform,
    redirect_to: redirectTo,
    created_at: now,
    expires_at: now + STATE_TOKEN_TTL
  }

  // Stocker le state
  stateStore.set(token, state)

  console.log(`✅ CSRF token generated for user ${userId} (${platform})`)

  return token
}

/**
 * Vérifie et consomme un token CSRF
 *
 * @param token - Token CSRF à vérifier
 * @param userId - ID de l'utilisateur attendu
 * @param platform - Plateforme attendue
 * @returns State object si valide, null sinon
 *
 * @example
 * const state = await verifyCSRFToken(token, userId, 'facebook')
 * if (!state) {
 *   throw new Error('Invalid or expired CSRF token')
 * }
 */
export async function verifyCSRFToken(
  token: string,
  userId: string,
  platform: SocialPlatform
): Promise<CSRFState | null> {
  const state = stateStore.get(token)

  if (!state) {
    console.error('❌ CSRF token not found:', token)
    return null
  }

  // Vérifier expiration
  if (state.expires_at < Date.now()) {
    console.error('❌ CSRF token expired:', token)
    stateStore.delete(token)
    return null
  }

  // Vérifier user_id
  if (state.user_id !== userId) {
    console.error('❌ CSRF token user_id mismatch:', {
      expected: userId,
      actual: state.user_id
    })
    return null
  }

  // Vérifier platform
  if (state.platform !== platform) {
    console.error('❌ CSRF token platform mismatch:', {
      expected: platform,
      actual: state.platform
    })
    return null
  }

  // Token valide, le consommer (one-time use)
  stateStore.delete(token)

  console.log(`✅ CSRF token verified and consumed for user ${userId} (${platform})`)

  return state
}

/**
 * Invalide un token CSRF (par exemple si l'utilisateur annule)
 *
 * @param token - Token à invalider
 */
export async function invalidateCSRFToken(token: string): Promise<void> {
  stateStore.delete(token)
  console.log(`🗑️  CSRF token invalidated: ${token}`)
}

/**
 * Invalide tous les tokens CSRF d'un utilisateur
 *
 * @param userId - ID de l'utilisateur
 */
export async function invalidateUserCSRFTokens(userId: string): Promise<void> {
  let count = 0

  for (const [token, state] of stateStore.entries()) {
    if (state.user_id === userId) {
      stateStore.delete(token)
      count++
    }
  }

  if (count > 0) {
    console.log(`🗑️  ${count} CSRF token(s) invalidated for user ${userId}`)
  }
}

/**
 * Récupère les statistiques du store CSRF
 * Utile pour monitoring et debugging
 */
export function getCSRFStoreStats(): {
  total: number
  expired: number
  valid: number
  byPlatform: Record<SocialPlatform, number>
} {
  const now = Date.now()
  let total = 0
  let expired = 0
  let valid = 0
  const byPlatform: Record<SocialPlatform, number> = {
    facebook: 0,
    linkedin: 0,
    instagram: 0
  }

  for (const state of stateStore.values()) {
    total++
    if (state.expires_at < now) {
      expired++
    } else {
      valid++
      byPlatform[state.platform]++
    }
  }

  return { total, expired, valid, byPlatform }
}

/**
 * Nettoie manuellement les tokens expirés
 * Appelée automatiquement, mais peut être utilisée pour forcer un nettoyage
 */
export function cleanupExpiredTokens(): number {
  const now = Date.now()
  let cleaned = 0

  for (const [token, state] of stateStore.entries()) {
    if (state.expires_at < now) {
      stateStore.delete(token)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired CSRF token(s)`)
  }

  return cleaned
}

// Version pour production avec Redis (à implémenter si besoin)
/*
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export async function generateCSRFToken(
  userId: string,
  platform: SocialPlatform,
  redirectTo?: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')

  const state: CSRFState = {
    token,
    user_id: userId,
    platform,
    redirect_to: redirectTo,
    created_at: Date.now(),
    expires_at: Date.now() + STATE_TOKEN_TTL
  }

  // Stocker dans Redis avec TTL
  await redis.setex(
    `oauth:state:${token}`,
    600, // 10 minutes
    JSON.stringify(state)
  )

  return token
}

export async function verifyCSRFToken(
  token: string,
  userId: string,
  platform: SocialPlatform
): Promise<CSRFState | null> {
  const data = await redis.get(`oauth:state:${token}`)

  if (!data) {
    return null
  }

  const state: CSRFState = JSON.parse(data as string)

  // Vérifications...
  if (state.user_id !== userId || state.platform !== platform) {
    return null
  }

  // Consommer le token
  await redis.del(`oauth:state:${token}`)

  return state
}
*/
