export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession, SessionCookieName } from '@/lib/auth/session'

export async function GET(_req: NextRequest) {
  try {
    const jar = cookies()
    const token = jar.get(SessionCookieName)?.value
    const hasCookie = Boolean(token)
    const sess = verifySession(token)
    if (!sess) {
      return NextResponse.json({ ok: false, hasCookie, verified: false }, { status: 401 })
    }
    return NextResponse.json({ ok: true, hasCookie, verified: true, email: sess.email }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}

