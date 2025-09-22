import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return NextResponse.json({ error: error.message }, { status: 401 })

  if (!user) return NextResponse.json({ user: null, profile: null })

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (pErr) return NextResponse.json({ user, error: pErr.message }, { status: 500 })

  return NextResponse.json({ user, profile })
}

