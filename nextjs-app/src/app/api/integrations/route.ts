// API endpoint pour gérer les intégrations sociales
// GET: Récupère toutes les intégrations de l'utilisateur

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/crypto/token-encryption'

export async function GET(request: NextRequest) {
  try {
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

    // Récupérer toutes les intégrations de l'utilisateur
    const { data: integrations, error: integrationsError } = await supabase
      .from('social_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('platform', { ascending: true })

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError)
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    // Déchiffrer les tokens (optionnel - ne pas les envoyer au client par défaut)
    // On renvoie les intégrations sans les tokens décryptés pour des raisons de sécurité
    const sanitizedIntegrations = (integrations || []).map(integration => ({
      ...integration,
      access_token: '***ENCRYPTED***', // Ne jamais envoyer le token au client
      refresh_token: integration.refresh_token ? '***ENCRYPTED***' : undefined
    }))

    return NextResponse.json({
      integrations: sanitizedIntegrations
    })
  } catch (error) {
    console.error('Error in GET /api/integrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
