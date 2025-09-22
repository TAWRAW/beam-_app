import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { role } = await request.json()
    
    if (!role || !['visiteur', 'inscrit', 'payant', 'employe', 'admin', 'vip'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

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

    // Empêcher de se supprimer ses propres privilèges admin
    if (user.id === params.userId && profile.role === 'admin' && role !== 'admin') {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas retirer vos propres privilèges admin' 
      }, { status: 400 })
    }

    // Mettre à jour le rôle
    const { error: updateError } = await supabase
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