import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionEdge } from '@/lib/auth/edge'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Only protect /apps/* paths
  if (!req.nextUrl.pathname.startsWith('/apps')) {
    return res
  }
  const token = req.cookies.get('app_session')?.value
  const secret = process.env.SESSION_SECRET || ''
  const session = secret ? await verifySessionEdge(token, secret) : null
  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/apps/:path*'],
}
