// Facebook OAuth Callback Handler
// Endpoint: GET /api/auth/callback/facebook
// Date: 20 octobre 2025

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOAuthHandler } from '@/lib/oauth/factory'
import { verifyCSRFToken } from '@/lib/oauth/csrf'
import { encryptToken } from '@/lib/crypto/token-encryption'
import type { SocialIntegration } from '@/types/social-integration'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Gérer les erreurs OAuth (utilisateur refuse)
    if (error) {
      console.error('Facebook OAuth error:', error, errorDescription)

      const redirectUrl = new URL('/apps/settings/integrations', request.url)
      redirectUrl.searchParams.set('error', 'oauth_denied')
      redirectUrl.searchParams.set('platform', 'facebook')
      redirectUrl.searchParams.set('message', errorDescription || 'User denied access')

      return NextResponse.redirect(redirectUrl)
    }

    // Vérifier présence de code et state
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur connecté
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('No authenticated user for Facebook callback')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Vérifier le token CSRF
    const csrfState = await verifyCSRFToken(state, user.id, 'facebook')

    if (!csrfState) {
      console.error('Invalid or expired CSRF token for Facebook OAuth')

      const redirectUrl = new URL('/apps/settings/integrations', request.url)
      redirectUrl.searchParams.set('error', 'csrf_error')
      redirectUrl.searchParams.set('platform', 'facebook')
      redirectUrl.searchParams.set('message', 'Security check failed. Please try again.')

      return NextResponse.redirect(redirectUrl)
    }

    console.log(`✅ CSRF verified for user ${user.id} (Facebook)`)

    // Initialiser le handler OAuth Facebook
    const oauthHandler = getOAuthHandler('facebook')

    // Échanger le code contre un access token
    console.log('Exchanging code for Facebook access token...')
    const tokenResponse = await oauthHandler.exchangeCodeForToken(code)

    // Récupérer les informations utilisateur Facebook
    console.log('Fetching Facebook user info...')
    const userInfo = await oauthHandler.getUserInfo(tokenResponse.access_token)

    // Calculer la date d'expiration
    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : undefined

    // Chiffrer les tokens avant stockage
    const encryptedAccessToken = encryptToken(tokenResponse.access_token)
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : undefined

    // Préparer les données d'intégration
    const integrationData: Partial<SocialIntegration> = {
      user_id: user.id,
      platform: 'facebook',
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: expiresAt,
      platform_user_id: userInfo.id,
      platform_username: userInfo.username,
      platform_name: userInfo.name,
      platform_email: userInfo.email,
      scope: tokenResponse.scope?.split(' '),
      is_active: true,
      error_count: 0,
      last_error_message: undefined
    }

    // Upsert dans la table social_integrations
    const { data: integration, error: dbError } = await supabase
      .from('social_integrations')
      .upsert(integrationData, {
        onConflict: 'user_id,platform',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to save Facebook integration:', dbError)
      throw new Error('Failed to save integration to database')
    }

    console.log(`✅ Facebook integration saved for user ${user.id}`)
    console.log(`   - Platform user: ${userInfo.name} (${userInfo.id})`)
    console.log(`   - Expires at: ${expiresAt || 'N/A'}`)

    // Rediriger vers la page de paramètres avec succès
    const redirectUrl = new URL(
      csrfState.redirect_to || '/apps/settings/integrations',
      request.url
    )
    redirectUrl.searchParams.set('success', 'true')
    redirectUrl.searchParams.set('platform', 'facebook')

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Error in Facebook OAuth callback:', error)

    const redirectUrl = new URL('/apps/settings/integrations', request.url)
    redirectUrl.searchParams.set('error', 'oauth_error')
    redirectUrl.searchParams.set('platform', 'facebook')
    redirectUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.redirect(redirectUrl)
  }
}
