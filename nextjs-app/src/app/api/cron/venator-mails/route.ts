import { NextResponse } from 'next/server'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { releverLibellesGmail } from '@/lib/venator/services/releve-gmail-service'
import { requireVenatorRole } from '@/lib/venator/auth-guard'

export const runtime = 'nodejs'
// La relève parcourt N dossiers : au-delà du défaut, mais loin des 300 s permises.
export const maxDuration = 60

/**
 * Relève les libellés Gmail liés aux dossiers et alimente leur fil.
 *
 * Deux appelants : le cron Vercel (en-tête Bearer CRON_SECRET) et Tom depuis
 * l'interface (session admin), pour ne pas attendre le prochain passage.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const viaCron = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!viaCron) {
    const auth = await requireVenatorRole('admin')
    if (!auth.ok) return auth.response
  }

  try {
    const resultat = await releverLibellesGmail(createVenatorAdminClient())
    return NextResponse.json(resultat)
  } catch (e) {
    // Une relève en échec ne doit pas faire échouer le cron en boucle : on rend
    // 200 avec le motif, que Vercel n'interprète pas comme une panne à réessayer.
    return NextResponse.json(
      { erreur: e instanceof Error ? e.message : 'erreur inconnue', dossiers: 0, nouveaux: 0 },
      { status: 200 }
    )
  }
}
