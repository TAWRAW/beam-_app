import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSessionFromCookies, verifySession as verifySessionToken } from '@/lib/auth/session'
import { NextRequest } from 'next/server'

export type AppRole = 'visiteur' | 'inscrit' | 'payant' | 'employe' | 'admin' | 'vip'

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  role: AppRole
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function getCurrentProfile() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  return profile ?? null
}

// For legacy auth system
export async function verifySession(request: NextRequest) {
  const cookieValue = request.cookies.get('app_session')?.value
  return verifySessionToken(cookieValue)
}

