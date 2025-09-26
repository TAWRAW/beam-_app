import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const redirect = searchParams.get('redirect') || '/apps'

  console.log('=== AUTH CALLBACK DEBUG ===')
  console.log('URL:', req.url)
  console.log('Code:', code)
  console.log('Error:', error)
  console.log('Redirect param:', searchParams.get('redirect'))
  console.log('Final redirect:', redirect)

  // Si il y a une erreur, rediriger vers login avec le message d'erreur
  if (error) {
    console.log('OAuth error detected:', error)
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('error', error)
    loginUrl.searchParams.set('redirect', redirect)
    return NextResponse.redirect(loginUrl)
  }

  // Si il y a un code, échanger contre une session
  if (code) {
    console.log('Exchanging code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('error', 'auth_callback_error')
      loginUrl.searchParams.set('redirect', redirect)
      return NextResponse.redirect(loginUrl)
    }

    if (data.session) {
      console.log('Session created successfully for user:', data.user?.email)
    }
  }

  console.log('Redirecting to:', redirect)
  return NextResponse.redirect(new URL(redirect, req.url))
}
