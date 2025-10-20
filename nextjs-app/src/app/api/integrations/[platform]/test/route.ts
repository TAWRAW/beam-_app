// API endpoint pour tester une intégration
// POST: Teste si la connexion fonctionne

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SocialPlatform } from '@/types/social-integration'
import { getPublisher } from '@/lib/services/social-publishing/factory'
import { decryptToken } from '@/lib/crypto/token-encryption'

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

    // Décrypter le token
    const decryptedAccessToken = decryptToken(integration.access_token)
    const decryptedRefreshToken = integration.refresh_token
      ? decryptToken(integration.refresh_token)
      : undefined

    // Créer un objet intégration avec tokens décryptés
    const decryptedIntegration = {
      ...integration,
      access_token: decryptedAccessToken,
      refresh_token: decryptedRefreshToken
    }

    // Tester la connexion via le publisher
    const publisher = getPublisher(platform)
    const canPublish = await publisher.canPublish(decryptedIntegration)

    if (!canPublish) {
      // Incrémenter le compteur d'erreurs
      await supabase
        .from('social_integrations')
        .update({
          error_count: (integration.error_count || 0) + 1,
          last_error_message: 'Connection test failed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('platform', platform)

      return NextResponse.json({
        success: false,
        error: 'Connection test failed. Please try refreshing your token or reconnecting.'
      })
    }

    // Réinitialiser les erreurs si le test réussit
    await supabase
      .from('social_integrations')
      .update({
        error_count: 0,
        last_error_message: null,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('platform', platform)

    return NextResponse.json({
      success: true,
      message: `${platform} connection is working correctly`
    })
  } catch (error) {
    console.error('Error in POST /api/integrations/[platform]/test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
