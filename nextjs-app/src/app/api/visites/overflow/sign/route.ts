// src/app/api/visites/overflow/sign/route.ts
// Mint une URL d'upload signée vers le bucket de débordement. Le client PUT
// ensuite le blob HD directement vers Supabase Storage (contourne la limite
// ~4,5 Mo des fonctions Vercel). Service-role : le client n'a pas besoin d'une
// session Supabase (l'URL signée porte l'autorisation).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server-auth'

export const runtime = 'nodejs'

const BUCKET = 'visite-photos-overflow'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function safeName(name: string): string {
  return (name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const body = await request.json().catch(() => null)
  const photoUuid: string | undefined = body?.photoUuid
  const filename: string | undefined = body?.filename
  if (!photoUuid) {
    return NextResponse.json({ error: 'photoUuid manquant' }, { status: 400 })
  }

  const path = `${photoUuid}/${safeName(filename || 'photo.jpg')}`
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true })
  if (error || !data) {
    console.error('overflow/sign:', error)
    return NextResponse.json({ error: error?.message || 'sign échoué' }, { status: 500 })
  }
  return NextResponse.json({ path: data.path, token: data.token, signedUrl: data.signedUrl })
}
