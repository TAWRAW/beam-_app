// API endpoint pour rafraîchir le token d'une intégration
// POST: Rafraîchit le token d'accès

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SocialPlatform } from '@/types/social-integration'
import { getPublisher } from '@/lib/services/social-publishing/factory'
import { decryptToken, encryptToken } from '@/lib/crypto/token-encryption'

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform as SocialPlatform

    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabase = await createSupabaseServerClient()

    // Vérifier le token et récupérer l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Récupérer l'intégration
    const { data: integration, error: fetchError } = await supabase
      .from('social_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Décrypter les tokens
    const decryptedAccessToken = decryptToken(integration.access_token)
    const decryptedRefreshToken = integration.refresh_token
      ? decryptToken(integration.refresh_token)
      : undefined

    // Créer un objet intégration avec tokens décryptés pour le publisher
    const decryptedIntegration = {
      ...integration,
      access_token: decryptedAccessToken,
      refresh_token: decryptedRefreshToken
    }

    // Rafraîchir le token via le publisher
    const publisher = getPublisher(platform)
    const newAccessToken = await publisher.refreshToken(decryptedIntegration)

    if (!newAccessToken) {
      return NextResponse.json(
        { error: 'Failed to refresh token. Please reconnect your account.' },
        { status: 400 }
      )
    }

    // Chiffrer le nouveau token
    const encryptedNewToken = encryptToken(newAccessToken)

    // Mettre à jour l'intégration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60) // 60 jours par défaut

    const { error: updateError } = await supabase
      .from('social_integrations')
      .update({
        access_token: encryptedNewToken,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        error_count: 0,
        last_error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('platform', platform)

    if (updateError) {
      console.error('Error updating integration:', updateError)
      return NextResponse.json(
        { error: 'Failed to update integration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expires_at: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Error in POST /api/integrations/[platform]/refresh:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
