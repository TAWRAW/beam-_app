import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur courant est admin
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'employe'].includes(profile.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    // Récupérer tous les profils
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      throw profilesError
    }

    // Pour chaque profil, récupérer les détails auth avec les privilèges admin
    const usersWithProfiles = []
    
    for (const profile of profiles || []) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
        
        if (!authError && authUser.user) {
          usersWithProfiles.push({
            user: {
              id: authUser.user.id,
              email: authUser.user.email,
              created_at: authUser.user.created_at,
              email_confirmed_at: authUser.user.email_confirmed_at,
              last_sign_in_at: authUser.user.last_sign_in_at
            },
            profile
          })
        } else {
          // Utilisateur supprimé de auth mais profil encore présent
          usersWithProfiles.push({
            user: {
              id: profile.id,
              email: profile.email || '',
              created_at: profile.created_at,
              email_confirmed_at: null,
              last_sign_in_at: null
            },
            profile
          })
        }
      } catch (err) {
        console.warn('Error loading user details for', profile.id, err)
        // Ajouter quand même le profil sans les détails auth
        usersWithProfiles.push({
          user: {
            id: profile.id,
            email: profile.email || '',
            created_at: profile.created_at,
            email_confirmed_at: null,
            last_sign_in_at: null
          },
          profile
        })
      }
    }

    return NextResponse.json({ users: usersWithProfiles })
  } catch (error) {
    console.error('Error in /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}