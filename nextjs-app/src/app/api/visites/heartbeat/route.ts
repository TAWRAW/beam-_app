// src/app/api/visites/heartbeat/route.ts
// Reçoit le ping périodique du client beam-app et upserte la ligne user dans
// visite_sync_heartbeat. Le cron quotidien lit cette table pour décider d'envoyer
// une alerte email en cas de retard de sync.
//
// Note : ne fonctionne QUE pour les users authentifiés via Supabase Auth (legacy
// users → no-op silencieux car la table référence auth.users(id)).

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { requireAdmin } from '@/lib/server-auth'

const Body = z.object({
  pendingCount: z.number().int().min(0),
  oldestPendingAt: z.string().nullable(),
})

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  // Heartbeat ne fonctionne que pour Supabase Auth (FK vers auth.users)
  if (!guard.supabaseUserId) {
    return NextResponse.json(
      { skipped: true, reason: 'heartbeat indisponible en auth legacy' },
      { status: 200 },
    )
  }

  let body
  try {
    body = Body.parse(await request.json())
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  const cookieStore = cookies()
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

  const { error } = await supabase
    .from('visite_sync_heartbeat')
    .upsert({
      user_id: guard.supabaseUserId,
      pending_count: body.pendingCount,
      oldest_pending_at: body.oldestPendingAt,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('heartbeat upsert :', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
