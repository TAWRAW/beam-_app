export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { signSession } from '@/lib/auth/session'

function tsEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  try {
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const { email, password, redirect } = await req.json().catch(() => ({}))
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'Server auth not configured' }, { status: 500 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const emailOk = tsEqual(String(email).toLowerCase(), String(ADMIN_EMAIL).toLowerCase())
  const pwdOk = tsEqual(String(password), String(ADMIN_PASSWORD))
  if (!emailOk || !pwdOk) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signSession(ADMIN_EMAIL)
  const location = redirect && typeof redirect === 'string' ? redirect : '/apps'
  const res = NextResponse.json({ ok: true, redirect: location })
  // Set cookie explicitly on the response to ensure browsers store it
  res.cookies.set('app_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
