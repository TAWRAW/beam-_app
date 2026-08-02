import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Réservé au cabinet : le middleware ne filtre que /apps/*, une route API
  // reste joignable depuis Internet sans garde explicite ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    const { role } = await request.json()
    
    if (!role || !['visiteur', 'inscrit', 'payant', 'employe', 'admin', 'vip'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Mettre à jour le rôle directement avec service_role
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