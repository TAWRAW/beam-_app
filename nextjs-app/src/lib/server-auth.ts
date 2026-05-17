// src/lib/server-auth.ts
// Garde côté serveur : exige que l'utilisateur courant ait le rôle 'admin'.
// Compatible avec les deux flows d'authentification de beam-app :
//   1. Legacy : cookie 'app_session' + verifySession → profiles.role via email
//   2. Supabase Auth : cookies SSR → profiles.role via id
//
// Pour les routes nécessitant un user_id Supabase Auth (ex. heartbeat),
// vérifier que `result.supabaseUserId` est défini.

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { verifySession } from '@/lib/auth/session'

export interface RequireAdminResult {
  ok: boolean
  email?: string
  supabaseUserId?: string  // défini uniquement si auth Supabase (pas legacy)
  authType?: 'legacy' | 'supabase'
  response?: NextResponse
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function requireAdmin(): Promise<RequireAdminResult> {
  const cookieStore = cookies()

  // 1) Tentative legacy
  const legacyToken = cookieStore.get('app_session')?.value
  if (legacyToken) {
    const session = verifySession(legacyToken)
    if (session) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('email', session.email)
        .single()
      if (profile?.role === 'admin') {
        return { ok: true, email: session.email, authType: 'legacy' }
      }
      return {
        ok: false,
        response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
      }
    }
  }

  // 2) Fallback Supabase Auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    }
  }
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    }
  }
  return {
    ok: true,
    email: user.email,
    supabaseUserId: user.id,
    authType: 'supabase',
  }
}
