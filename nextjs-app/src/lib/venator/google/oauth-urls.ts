// src/lib/venator/google/oauth-urls.ts — construction et validation du flux OAuth Google.
// AUCUN import next/* ni appel réseau : logique pure, testable en environnement node.

/**
 * Scopes demandés au consentement.
 *
 * `gmail.readonly` : lire les libellés et les métadonnées des messages. Aucun
 * scope d'écriture Gmail — Venator ne crée pas de libellé et n'envoie rien.
 *
 * `drive` (complet) plutôt que `drive.file` : ce dernier ne donne accès qu'aux
 * fichiers créés par l'application, l'arborescence existante du cabinet resterait
 * donc invisible. Et `drive.readonly` seul interdirait le dépôt, demandé.
 */
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive',
] as const

/** Cookie portant l'anti-rejeu du flux OAuth (déposé au départ, vérifié au retour).
 *  Défini ici et non dans une route : Next.js n'autorise que les handlers HTTP
 *  comme exports d'un fichier `route.ts`. */
export const GOOGLE_STATE_COOKIE = 'venator_google_state'

export const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
export const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke'

export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

/**
 * URL de consentement.
 *
 * `access_type=offline` ET `prompt=consent` : sans le second, Google ne renvoie
 * un refresh token qu'au tout premier consentement. Une reconnexion ultérieure
 * (changement de scopes, secret réinitialisé) repartirait alors sans jeton, et la
 * panne ne se verrait qu'une heure plus tard, à l'expiration de l'access token.
 */
export function buildAuthUrl(config: GoogleOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}

/** Corps de l'échange « code d'autorisation → jetons ». */
export function buildTokenExchangeBody(config: GoogleOAuthConfig, code: string): string {
  return new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  }).toString()
}

/** Corps de l'échange « refresh token → access token ». */
export function buildRefreshBody(config: GoogleOAuthConfig, refreshToken: string): string {
  return new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }).toString()
}

/**
 * Le consentement a-t-il accordé tout ce qui est nécessaire ?
 *
 * Google autorise l'utilisateur à décocher des autorisations : on peut recevoir un
 * jeton parfaitement valide mais amputé de Drive. Sans cette vérification, la panne
 * n'apparaîtrait qu'au premier dépôt de pièce, sous la forme d'un 403 opaque.
 */
export function scopesManquants(scopesAccordes: string): string[] {
  const accordes = new Set(scopesAccordes.split(/\s+/).filter(Boolean))
  return GOOGLE_SCOPES.filter((s) => !accordes.has(s))
}

/**
 * Un access token est considéré expiré 60 s avant l'heure réelle : une requête
 * partie juste avant l'échéance arriverait sinon avec un jeton périmé.
 */
export function estExpire(expiresAtMs: number, maintenantMs: number): boolean {
  return maintenantMs >= expiresAtMs - 60_000
}
