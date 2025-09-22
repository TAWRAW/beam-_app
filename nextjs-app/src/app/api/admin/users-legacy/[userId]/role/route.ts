import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { role } = await request.json()
    
    if (!role || !['visiteur', 'inscrit', 'payant', 'employe', 'admin', 'vip'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Vérifier l'authentification avec l'ancien système
    const session = await verifySession(request)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur actuel est admin dans la base Supabase
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', session.email)
      .single()

    if (profileError || !profile || !['admin', 'employe'].includes(profile.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    // Empêcher de se supprimer ses propres privilèges admin
    if (profile.id === params.userId && profile.role === 'admin' && role !== 'admin') {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas retirer vos propres privilèges admin' 
      }, { status: 400 })
    }

    // Mettre à jour le rôle en utilisant service_role pour bypasser RLS
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', params.userId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du rôle' },
      { status: 500 }
    )
  }
}