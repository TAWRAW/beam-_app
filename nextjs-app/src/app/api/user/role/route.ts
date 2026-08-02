import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { verifySession } from '@/lib/auth/session'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Checking user role ===')
    
    // Check legacy auth first (session cookie)
    const legacyToken = request.cookies.get('app_session')?.value
    console.log('Legacy token found:', !!legacyToken)
    
    if (legacyToken) {
      const legacySession = verifySession(legacyToken)
      console.log('Legacy session valid:', !!legacySession)
      console.log('Legacy session email:', legacySession?.email)
      
      if (legacySession) {
        // For legacy auth, get user from email
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('email', legacySession.email)
          .single()
        
        console.log('Profile found:', profile)
        console.log('Profile error:', error)
        
        const userRole = profile?.role || 'visiteur'
        console.log('Final role:', userRole)
        
        return NextResponse.json({ 
          role: userRole,
          debug: {
            authType: 'legacy',
            email: legacySession.email,
            profile
          }
        })
      }
    }

    // Fallback to Supabase Auth
    console.log('Checking Supabase Auth...')
    const res = NextResponse.next()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            res.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Supabase user found:', !!user)
    console.log('Supabase user email:', user?.email)
    console.log('Supabase error:', userError)
    
    if (user) {
      // Get profile by user ID
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      console.log('Supabase profile found:', profile)
      console.log('Supabase profile error:', profileError)
      
      const userRole = profile?.role || 'visiteur'
      console.log('Final Supabase role:', userRole)
      
      return NextResponse.json({ 
        role: userRole,
        debug: {
          authType: 'supabase',
          email: user.email,
          userId: user.id,
          profile
        }
      })
    }

    // If no valid auth found, return visiteur
    console.log('No valid auth found, returning visiteur')
    return NextResponse.json({ 
      role: 'visiteur',
      debug: {
        authType: 'none'
      }
    })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ 
      role: 'visiteur',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}