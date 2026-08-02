import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { enregistrerConsentement } from '@/lib/venator/google/client'
import { GOOGLE_STATE_COOKIE } from '@/lib/venator/google/oauth-urls'

const RETOUR = '/apps/venator/reglages/connexions'

/** Renvoie vers l'écran Réglages en portant le résultat, plutôt qu'un JSON brut : ce
 *  callback est ouvert par le navigateur, pas par du code. */
function redirigerVers(req: NextRequest, params: Record<string, string>) {
  const url = new URL(RETOUR, req.nextUrl.origin)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = NextResponse.redirect(url)
  res.cookies.delete(GOOGLE_STATE_COOKIE)
  return res
}

export async function GET(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const erreurGoogle = req.nextUrl.searchParams.get('error')

  // L'utilisateur a refusé le consentement, ou Google l'a interrompu.
  if (erreurGoogle) return redirigerVers(req, { google: 'refuse', detail: erreurGoogle })
  if (!code) return redirigerVers(req, { google: 'erreur', detail: 'code absent' })

  // Anti-rejeu : le state renvoyé doit être celui déposé au départ.
  const attendu = req.cookies.get(GOOGLE_STATE_COOKIE)?.value
  if (!attendu || attendu !== state) {
    return redirigerVers(req, { google: 'erreur', detail: 'state invalide' })
  }

  try {
    await enregistrerConsentement(createVenatorAdminClient(), code)
    return redirigerVers(req, { google: 'ok' })
  } catch (e) {
    return redirigerVers(req, { google: 'erreur', detail: e instanceof Error ? e.message : 'inconnue' })
  }
}
