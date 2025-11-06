/**
 * Gestion du consentement cookies conforme RGPD/CNIL
 *
 * Selon la réglementation française:
 * - Consentement obligatoire pour cookies non essentiels
 * - Durée maximum: 13 mois
 * - Refus aussi facile qu'acceptation
 * - Information claire sur les finalités
 */

export type CookieCategory = 'essential' | 'analytics' | 'marketing'

export interface CookieConsent {
  essential: boolean // Toujours true, pas de consentement nécessaire
  analytics: boolean // Google Analytics
  marketing: boolean // Futurs cookies marketing (Meta Pixel, etc.)
  timestamp: number
  version: string // Pour forcer un nouveau consentement si politique change
}

const CONSENT_KEY = 'cookie-consent'
const CONSENT_VERSION = '1.0'
const CONSENT_DURATION_MONTHS = 13

// Consentement par défaut (tout refusé sauf essentiels)
const DEFAULT_CONSENT: CookieConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: Date.now(),
  version: CONSENT_VERSION
}

/**
 * Récupère le consentement stocké
 */
export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) return null

    const consent: CookieConsent = JSON.parse(stored)

    // Vérifier si le consentement est expiré (13 mois)
    const expirationDate = new Date(consent.timestamp)
    expirationDate.setMonth(expirationDate.getMonth() + CONSENT_DURATION_MONTHS)

    if (new Date() > expirationDate) {
      // Consentement expiré
      localStorage.removeItem(CONSENT_KEY)
      return null
    }

    // Vérifier si la version a changé
    if (consent.version !== CONSENT_VERSION) {
      // Nouvelle politique, redemander le consentement
      localStorage.removeItem(CONSENT_KEY)
      return null
    }

    return consent
  } catch (error) {
    console.error('Error reading cookie consent:', error)
    return null
  }
}

/**
 * Enregistre le consentement
 */
export function saveConsent(consent: Partial<CookieConsent>): void {
  if (typeof window === 'undefined') return

  const fullConsent: CookieConsent = {
    essential: true, // Toujours vrai
    analytics: consent.analytics ?? false,
    marketing: consent.marketing ?? false,
    timestamp: Date.now(),
    version: CONSENT_VERSION
  }

  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent))

    // Émettre un événement pour informer les composants
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: fullConsent }))
  } catch (error) {
    console.error('Error saving cookie consent:', error)
  }
}

/**
 * Accepter tous les cookies
 */
export function acceptAllCookies(): void {
  saveConsent({
    analytics: true,
    marketing: true
  })
}

/**
 * Refuser tous les cookies non essentiels
 */
export function rejectAllCookies(): void {
  saveConsent({
    analytics: false,
    marketing: false
  })
}

/**
 * Réinitialiser le consentement (pour retester la bannière)
 */
export function resetConsent(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CONSENT_KEY)
  window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: null }))
}

/**
 * Vérifier si une catégorie spécifique est acceptée
 */
export function hasConsent(category: CookieCategory): boolean {
  const consent = getConsent()
  if (!consent) return category === 'essential'
  return consent[category]
}
