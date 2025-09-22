import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Récupérer tous les profils directement avec service_role
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      throw profilesError
    }

    // Pour chaque profil, récupérer les détails auth
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
    console.error('Error in /api/debug/users:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error },
      { status: 500 }
    )
  }
}