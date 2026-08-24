import { NextRequest, NextResponse } from 'next/server'
import { isEstaleConfigured } from '@/lib/estale-api'
import { requireAdmin } from '@/lib/server-auth'
import { envoyerMailing, lireEtatMailing } from '@/lib/estale/mailing-queries'

// Envoi d'un mailing Estale. Route SÉPARÉE de la création du brouillon, volontairement :
// aucune requête de rédaction ne peut déclencher un envoi par effet de bord.
//
// Irréversible. Trois verrous :
//   1. requireAdmin()
//   2. `confirmer: true` obligatoire dans le corps
//   3. relecture de l'état côté Estale, qui refuse un mailing déjà parti ou sans destinataire

export const dynamic = 'force-dynamic'

interface Body {
  condoId?: string
  mailingId?: string
  confirmer?: boolean
}

/** GET : état d'un mailing, pour afficher le récapitulatif avant envoi. */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const mailingId = request.nextUrl.searchParams.get('mailingId')
  if (!mailingId) {
    return NextResponse.json({ error: 'mailingId requis' }, { status: 400 })
  }

  try {
    return NextResponse.json(await lireEtatMailing(mailingId))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { mailingId, confirmer } = body

  if (!mailingId) {
    return NextResponse.json({ error: 'mailingId requis' }, { status: 400 })
  }
  if (confirmer !== true) {
    return NextResponse.json(
      { error: 'Confirmation manquante : l’envoi n’a pas été déclenché.' },
      { status: 400 },
    )
  }

  try {
    const etat = await envoyerMailing(mailingId)
    console.info(
      `[mailing] envoi déclenché par ${guard.email ?? 'admin'} — mailing ${mailingId}, ${etat.nbRecipients} destinataires`,
    )
    return NextResponse.json(etat)
  } catch (error) {
    console.error('Mailing — échec de l’envoi:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
