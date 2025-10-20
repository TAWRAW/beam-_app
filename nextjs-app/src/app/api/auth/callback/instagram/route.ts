// Instagram OAuth Callback Handler
// Endpoint: GET /api/auth/callback/instagram
// Date: 20 octobre 2025

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOAuthHandler } from '@/lib/oauth/factory'
import { verifyCSRFToken } from '@/lib/oauth/csrf'
import { encryptToken } from '@/lib/crypto/token-encryption'
import type { SocialIntegration } from '@/types/social-integration'
import { InstagramOAuthHandler } from '@/lib/oauth/instagram'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorReason = searchParams.get('error_reason')
    const errorDescription = searchParams.get('error_description')

    // Gérer les erreurs OAuth
    if (error) {
      console.error('Instagram OAuth error:', error, errorReason, errorDescription)

      const redirectUrl = new URL('/apps/settings/integrations', request.url)
      redirectUrl.searchParams.set('error', 'oauth_denied')
      redirectUrl.searchParams.set('platform', 'instagram')
      redirectUrl.searchParams.set('message', errorDescription || errorReason || 'User denied access')

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
      console.error('No authenticated user for Instagram callback')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Vérifier le token CSRF
    const csrfState = await verifyCSRFToken(state, user.id, 'instagram')

    if (!csrfState) {
      console.error('Invalid or expired CSRF token for Instagram OAuth')

      const redirectUrl = new URL('/apps/settings/integrations', request.url)
      redirectUrl.searchParams.set('error', 'csrf_error')
      redirectUrl.searchParams.set('platform', 'instagram')
      redirectUrl.searchParams.set('message', 'Security check failed. Please try again.')

      return NextResponse.redirect(redirectUrl)
    }

    console.log(`✅ CSRF verified for user ${user.id} (Instagram)`)

    // Initialiser le handler OAuth Instagram
    const oauthHandler = getOAuthHandler('instagram') as InstagramOAuthHandler

    // Échanger le code contre un access token
    console.log('Exchanging code for Instagram access token...')
    const tokenResponse = await oauthHandler.exchangeCodeForToken(code)

    // Récupérer les informations utilisateur Instagram
    console.log('Fetching Instagram user info...')
    const userInfo = await oauthHandler.getUserInfo(tokenResponse.access_token)

    // Vérifier si c'est un compte Business/Creator (requis pour publier)
    const isBusinessAccount = await oauthHandler.isBusinessAccount(tokenResponse.access_token)

    if (!isBusinessAccount) {
      console.warn(`⚠️  Instagram account ${userInfo.id} is not a Business or Creator account`)

      const redirectUrl = new URL('/apps/settings/integrations', request.url)
      redirectUrl.searchParams.set('error', 'account_type')
      redirectUrl.searchParams.set('platform', 'instagram')
      redirectUrl.searchParams.set('message', 'Instagram publishing requires a Business or Creator account. Please convert your account in Instagram settings.')

      return NextResponse.redirect(redirectUrl)
    }

    // Calculer la date d'expiration
    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null

    // Chiffrer les tokens avant stockage
    const encryptedAccessToken = encryptToken(tokenResponse.access_token)
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : null

    // Préparer les données d'intégration
    const integrationData: Partial<SocialIntegration> = {
      user_id: user.id,
      platform: 'instagram',
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
      last_error_message: null
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
      console.error('Failed to save Instagram integration:', dbError)
      throw new Error('Failed to save integration to database')
    }

    console.log(`✅ Instagram integration saved for user ${user.id}`)
    console.log(`   - Platform user: @${userInfo.username} (${userInfo.id})`)
    console.log(`   - Expires at: ${expiresAt || 'N/A'}`)
    console.log(`   - Account type: Business/Creator`)

    // Rediriger vers la page de paramètres avec succès
    const redirectUrl = new URL(
      csrfState.redirect_to || '/apps/settings/integrations',
      request.url
    )
    redirectUrl.searchParams.set('success', 'true')
    redirectUrl.searchParams.set('platform', 'instagram')

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Error in Instagram OAuth callback:', error)

    const redirectUrl = new URL('/apps/settings/integrations', request.url)
    redirectUrl.searchParams.set('error', 'oauth_error')
    redirectUrl.searchParams.set('platform', 'instagram')
    redirectUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error')

    return NextResponse.redirect(redirectUrl)
  }
}
