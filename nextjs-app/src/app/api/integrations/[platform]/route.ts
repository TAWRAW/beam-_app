// API endpoint pour gérer une intégration spécifique
// DELETE: Déconnecte une intégration

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SocialPlatform } from '@/types/social-integration'
import { getOAuthHandler } from '@/lib/oauth/factory'
import { decryptToken } from '@/lib/crypto/token-encryption'

export async function DELETE(
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

    // Révoquer l'accès sur la plateforme (best effort)
    try {
      const oauthHandler = getOAuthHandler(platform)
      const decryptedToken = decryptToken(integration.access_token)
      await oauthHandler.revokeAccess(decryptedToken)
    } catch (error) {
      console.warn('Failed to revoke access on platform:', error)
      // Continue quand même avec la suppression locale
    }

    // Supprimer l'intégration
    const { error: deleteError } = await supabase
      .from('social_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform)

    if (deleteError) {
      console.error('Error deleting integration:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete integration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${platform} disconnected successfully`
    })
  } catch (error) {
    console.error('Error in DELETE /api/integrations/[platform]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
