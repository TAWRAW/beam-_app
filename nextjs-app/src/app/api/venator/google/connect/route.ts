import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { googleConfig } from '@/lib/venator/google/client'
import { GOOGLE_STATE_COOKIE, buildAuthUrl } from '@/lib/venator/google/oauth-urls'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

export async function GET() {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  try {
    // `state` aléatoire déposé en cookie httpOnly et renvoyé par Google : au retour,
    // le callback vérifie la correspondance. Sans ce contrôle, un tiers pourrait
    // faire aboutir un consentement de son choix sur cette installation.
    const state = crypto.randomBytes(32).toString('hex')
    const url = buildAuthUrl(googleConfig(), state)

    const response = NextResponse.redirect(url)
    response.cookies.set(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 'strict' bloquerait le cookie au retour depuis Google
      path: '/',
      maxAge: 600, // 10 min : le temps d'un consentement, pas davantage
    })
    return response
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
