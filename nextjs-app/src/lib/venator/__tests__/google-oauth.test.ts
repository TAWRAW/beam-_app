import { describe, it, expect } from 'vitest'
import {
  GOOGLE_SCOPES,
  buildAuthUrl,
  buildRefreshBody,
  buildTokenExchangeBody,
  estExpire,
  scopesManquants,
} from '../google/oauth-urls'

const config = {
  clientId: 'id-test.apps.googleusercontent.com',
  clientSecret: 'secret-test',
  redirectUri: 'http://localhost:3000/api/venator/google/callback',
}

describe('google/oauth-urls', () => {
  it("demande un refresh token de façon fiable (offline + consent)", () => {
    const url = new URL(buildAuthUrl(config, 'etat-123'))
    // Sans ces deux paramètres, Google ne renvoie un refresh token qu'au tout
    // premier consentement : une reconnexion repartirait sans jeton.
    expect(url.searchParams.get('access_type')).toBe('offline')
    expect(url.searchParams.get('prompt')).toBe('consent')
    expect(url.searchParams.get('state')).toBe('etat-123')
    expect(url.searchParams.get('redirect_uri')).toBe(config.redirectUri)
  })

  it('ne demande que la lecture sur Gmail', () => {
    const scopes = new URL(buildAuthUrl(config, 's')).searchParams.get('scope') ?? ''
    expect(scopes).toContain('gmail.readonly')
    // Aucun scope d'écriture Gmail : Venator n'envoie rien et ne crée pas de libellé.
    expect(scopes).not.toMatch(/gmail\.(send|modify|compose|labels)/)
  })

  it('détecte un consentement partiel', () => {
    // Google laisse l'utilisateur décocher des autorisations : on peut recevoir un
    // jeton valide mais amputé de Drive.
    expect(scopesManquants(GOOGLE_SCOPES.join(' '))).toEqual([])
    expect(scopesManquants('https://www.googleapis.com/auth/gmail.readonly')).toEqual([
      'https://www.googleapis.com/auth/drive',
    ])
    expect(scopesManquants('')).toHaveLength(GOOGLE_SCOPES.length)
  })

  it('transmet le secret client dans les échanges de jetons', () => {
    const echange = new URLSearchParams(buildTokenExchangeBody(config, 'code-abc'))
    expect(echange.get('grant_type')).toBe('authorization_code')
    expect(echange.get('code')).toBe('code-abc')
    expect(echange.get('client_secret')).toBe(config.clientSecret)

    const refresh = new URLSearchParams(buildRefreshBody(config, 'refresh-xyz'))
    expect(refresh.get('grant_type')).toBe('refresh_token')
    expect(refresh.get('refresh_token')).toBe('refresh-xyz')
  })

  it('considère le jeton expiré une minute avant l’échéance', () => {
    const echeance = 1_000_000
    expect(estExpire(echeance, echeance - 120_000)).toBe(false)
    // Une requête partie à T-30 s arriverait avec un jeton périmé.
    expect(estExpire(echeance, echeance - 30_000)).toBe(true)
    expect(estExpire(echeance, echeance)).toBe(true)
  })
})
