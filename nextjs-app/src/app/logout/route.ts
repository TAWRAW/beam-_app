import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  clearSessionCookie()
  const url = new URL('/', req.url)
  return NextResponse.redirect(url)
}
