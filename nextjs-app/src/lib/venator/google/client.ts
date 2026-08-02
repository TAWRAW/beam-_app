// src/lib/venator/google/client.ts — accès Google côté serveur (jamais côté client).
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptToken, decryptToken } from '@/lib/crypto/token-encryption'
import { VenatorError } from '../services/errors'
import {
  GOOGLE_REVOKE_ENDPOINT,
  GOOGLE_TOKEN_ENDPOINT,
  buildRefreshBody,
  buildTokenExchangeBody,
  estExpire,
  scopesManquants,
  type GoogleOAuthConfig,
} from './oauth-urls'

export function googleConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new VenatorError('invalid', 'Connexion Google non configurée (variables GOOGLE_* absentes).')
  }
  return { clientId, clientSecret, redirectUri }
}

export interface ConnexionGoogle {
  email: string
  scopes: string
  connected_at: string
  last_refresh_at: string | null
}

/** État de la connexion, pour l'écran Réglages. Ne renvoie jamais le jeton. */
export async function lireConnexion(db: SupabaseClient): Promise<ConnexionGoogle | null> {
  const { data, error } = await db
    .from('venator_google_oauth')
    .select('email, scopes, connected_at, last_refresh_at')
    .maybeSingle()
  // Table absente (migration non appliquée) : pas connecté, plutôt qu'une erreur.
  if (error) return null
  return data
}

/**
 * Finalise le consentement : échange le code, contrôle les scopes, chiffre et stocke.
 *
 * Le refresh token est la seule pièce durable ; l'access token n'est pas conservé.
 */
export async function enregistrerConsentement(db: SupabaseClient, code: string): Promise<ConnexionGoogle> {
  const config = googleConfig()

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildTokenExchangeBody(config, code),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) {
    throw new VenatorError('invalid', `Échange du code refusé par Google : ${body?.error_description ?? res.status}`)
  }

  const { refresh_token: refreshToken, access_token: accessToken, scope } = body
  if (!refreshToken) {
    // Arrive quand un consentement antérieur existe et que prompt=consent a sauté.
    throw new VenatorError(
      'invalid',
      "Google n'a pas renvoyé de refresh token. Révoquer l'accès dans le compte Google, puis reconnecter."
    )
  }

  const manquants = scopesManquants(scope ?? '')
  if (manquants.length > 0) {
    throw new VenatorError('invalid', `Autorisations incomplètes — manquant : ${manquants.join(', ')}`)
  }

  const email = await lireEmailCompte(accessToken)

  const { data, error } = await db
    .from('venator_google_oauth')
    .upsert(
      {
        email,
        refresh_token_chiffre: encryptToken(refreshToken),
        scopes: scope,
        connected_at: new Date().toISOString(),
        last_refresh_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select('email, scopes, connected_at, last_refresh_at')
    .single()

  if (error || !data) throw new VenatorError('invalid', error?.message ?? 'Enregistrement de la connexion impossible')
  return data
}

/** Adresse du compte relié — sert de libellé dans l'UI et de clé d'unicité. */
async function lireEmailCompte(accessToken: string): Promise<string> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new VenatorError('invalid', 'Impossible de lire le profil Gmail du compte relié.')
  const { emailAddress } = await res.json()
  return emailAddress
}

/**
 * Access token valide, en mémoire du processus.
 *
 * Google en émet un par heure ; le redemander à chaque appel gaspillerait un
 * aller-retour par requête, notamment pendant une relève qui parcourt N dossiers.
 * Le cache est volontairement en mémoire : sa perte au redéploiement est sans
 * conséquence, et un jeton d'une heure n'a pas à être écrit en base.
 */
let cache: { token: string; expiresAtMs: number } | null = null

export async function accessTokenGoogle(db: SupabaseClient): Promise<string> {
  if (cache && !estExpire(cache.expiresAtMs, Date.now())) return cache.token

  const { data, error } = await db
    .from('venator_google_oauth')
    .select('email, refresh_token_chiffre')
    .maybeSingle()
  if (error || !data) throw new VenatorError('invalid', 'Aucun compte Google relié.')

  const config = googleConfig()
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildRefreshBody(config, decryptToken(data.refresh_token_chiffre)),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.access_token) {
    // invalid_grant = jeton révoqué ou expiré : reconnexion nécessaire, et le dire.
    const motif = body?.error === 'invalid_grant' ? 'accès révoqué côté Google' : (body?.error ?? res.status)
    throw new VenatorError('invalid', `Rafraîchissement du jeton Google impossible (${motif}). Reconnecter le compte.`)
  }

  cache = { token: body.access_token, expiresAtMs: Date.now() + body.expires_in * 1000 }
  await db
    .from('venator_google_oauth')
    .update({ last_refresh_at: new Date().toISOString() })
    .eq('email', data.email)
  return cache.token
}

/** Déconnexion : révocation côté Google puis purge locale. */
export async function deconnecter(db: SupabaseClient): Promise<void> {
  const { data } = await db.from('venator_google_oauth').select('refresh_token_chiffre').maybeSingle()
  if (data?.refresh_token_chiffre) {
    await fetch(GOOGLE_REVOKE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: decryptToken(data.refresh_token_chiffre) }).toString(),
      // Une révocation refusée (jeton déjà mort) ne doit pas empêcher la purge locale.
    }).catch(() => null)
  }
  cache = null
  await db.from('venator_google_oauth').delete().neq('email', '')
}
