import { NextRequest, NextResponse } from 'next/server'
import { isEstaleConfigured } from '@/lib/estale-api'
import { requireAdmin } from '@/lib/server-auth'
import { getBudgetsOverview, getBudgetDetail } from '@/lib/estale/budget-queries'

// Suivi budgétaire Estale — lecture seule.
// GET               : vue d'ensemble (budget ordinaire de chaque copro, exercice courant).
// GET ?condoId=…    : détail d'une copro (postes agrégés + autres budgets).
// GET …&refresh=1   : contourne le cache (bouton « Actualiser » du panel).

export const dynamic = 'force-dynamic'

// Cache mémoire : Estale met ~5-10 s à agréger les budgets des 14 copros,
// inacceptable à chaque visite pour des chiffres qui bougent au rythme des
// saisies de factures. TTL 5 min + contournement explicite via ?refresh=1.
// (Mémoire de l'instance : suffisant en dev comme sur Vercel Fluid Compute,
// où les instances sont réutilisées entre requêtes.)
const CACHE_TTL_MS = 5 * 60_000
const cache = new Map<string, { at: number; data: unknown }>()

export async function GET(request: NextRequest) {
  // Données financières du cabinet : la route est publique sur Internet, le
  // middleware ne couvre que /apps/* — la garde doit être ici (post-incident 02/08).
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  const condoId = request.nextUrl.searchParams.get('condoId')
  const refresh = request.nextUrl.searchParams.get('refresh') === '1'
  const exercice = request.nextUrl.searchParams.get('exercice') === 'precedent' ? 'precedent' : 'courant'
  const cle = condoId ? `${condoId}:${exercice}` : '__overview__'

  const entree = cache.get(cle)
  if (!refresh && entree && Date.now() - entree.at < CACHE_TTL_MS) {
    return NextResponse.json(entree.data, { headers: { 'X-Budget-Cache': 'hit' } })
  }

  try {
    const data = condoId ? await getBudgetDetail(condoId, exercice) : { copros: await getBudgetsOverview() }
    cache.set(cle, { at: Date.now(), data })
    return NextResponse.json(data, { headers: { 'X-Budget-Cache': 'miss' } })
  } catch (error) {
    console.error('Suivi budgets — erreur de lecture:', error)
    // Panne Estale : mieux vaut des chiffres d'il y a quelques minutes qu'une erreur.
    if (entree) {
      return NextResponse.json(entree.data, { headers: { 'X-Budget-Cache': 'stale' } })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
