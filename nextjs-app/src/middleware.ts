import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifySession } from '@/lib/auth/session'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function middleware(req: NextRequest) {
  // Only protect /apps/* paths
  if (!req.nextUrl.pathname.startsWith('/apps')) return NextResponse.next()

  const res = NextResponse.next()

  // Admin-only routes
  const adminRoutes = ['/apps/users', '/apps/mandats', '/apps/articles']
  const isAdminRoute = adminRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Check legacy auth first (session cookie)
  const legacyToken = req.cookies.get('app_session')?.value
  const legacySession = verifySession(legacyToken)
  
  if (legacySession) {
    // For admin routes, check user role
    if (isAdminRoute) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('email', legacySession.email)
          .single()
        
        const userRole = profile?.role
        if (userRole !== 'admin' && userRole !== 'employe') {
          // Not admin, redirect to dashboard
          const url = req.nextUrl.clone()
          url.pathname = '/apps'
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        const url = req.nextUrl.clone()
        url.pathname = '/apps'
        return NextResponse.redirect(url)
      }
    }
    return res
  }

  // Fallback to Supabase Auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // No Supabase config and no legacy session, redirect to login
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // For admin routes, check user role
  if (isAdminRoute) {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const userRole = profile?.role
      if (userRole !== 'admin' && userRole !== 'employe') {
        // Not admin, redirect to dashboard
        const url = req.nextUrl.clone()
        url.pathname = '/apps'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      const url = req.nextUrl.clone()
      url.pathname = '/apps'
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = { matcher: ['/apps/:path*'] }
