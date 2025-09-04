import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/apps'

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(redirect, req.url))
}
