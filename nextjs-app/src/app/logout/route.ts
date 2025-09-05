import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL('/', req.url)
  const res = NextResponse.redirect(url)
  const host = new URL(req.url).hostname
  const apex = host.replace(/^www\./, '')
  // Expire cookie for both host-only and apex domain
  res.cookies.set('app_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  res.cookies.set('app_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    domain: `.${apex}`,
    maxAge: 0,
  })
  return res
}
