// Middleware d'authentification API pour les endpoints externes
// Utilisé pour sécuriser les endpoints d'importation (n8n, webhooks, etc.)

import { NextRequest, NextResponse } from 'next/server'

export interface ApiAuthResult {
  authenticated: boolean
  error?: string
}

/**
 * Vérifie l'authentification API via la clé fournie dans le header X-API-Key
 * @param request NextRequest
 * @returns ApiAuthResult
 */
export function authenticateApiKey(request: NextRequest): ApiAuthResult {
  const apiKey = request.headers.get('X-API-Key')

  if (!apiKey) {
    return {
      authenticated: false,
      error: 'Clé API manquante. Veuillez fournir une clé API dans le header X-API-Key'
    }
  }

  const validApiKey = process.env.BEAMO_API_KEY

  if (!validApiKey) {
    console.error('[API Auth] BEAMO_API_KEY non configurée dans les variables d\'environnement')
    return {
      authenticated: false,
      error: 'Configuration du serveur incorrecte'
    }
  }

  if (apiKey !== validApiKey) {
    console.warn('[API Auth] Tentative d\'accès avec une clé API invalide')
    return {
      authenticated: false,
      error: 'Clé API invalide'
    }
  }

  return { authenticated: true }
}

/**
 * Middleware wrapper pour protéger les endpoints API
 * @param handler Handler de la route API
 * @returns Handler protégé
 */
export function withApiAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = authenticateApiKey(request)

    if (!authResult.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error
        },
        { status: 401 }
      )
    }

    return handler(request)
  }
}
