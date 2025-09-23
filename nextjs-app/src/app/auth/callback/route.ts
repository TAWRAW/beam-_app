import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/apps'

  console.log('=== AUTH CALLBACK DEBUG ===')
  console.log('URL:', req.url)
  console.log('Redirect param:', searchParams.get('redirect'))
  console.log('Final redirect:', redirect)

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(redirect, req.url))
}
