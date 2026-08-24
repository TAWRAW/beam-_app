import { NextRequest, NextResponse } from 'next/server'
import { isEstaleConfigured } from '@/lib/estale-api'
import { requireAdmin } from '@/lib/server-auth'
import {
  getCoproprietes,
  getCiblage,
  creerBrouillonMailing,
  listerMailings,
} from '@/lib/estale/mailing-queries'

// Mailing ciblé Estale.
// GET  : ciblage (copropriétés, ou bâtiments/clés/copropriétaires d'une copropriété).
// POST : création d'un BROUILLON de mailing dans Estale. N'ENVOIE RIEN.
//        L'envoi reste un geste manuel dans l'interface Estale, après relecture.

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Données nominatives de copropriétaires : réservées au cabinet. La route est publique
  // sur Internet, le middleware ne couvrant que /apps/* — la garde doit être ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  const condoId = request.nextUrl.searchParams.get('condoId')

  try {
    if (!condoId) {
      const { establishmentID, condos } = await getCoproprietes()
      return NextResponse.json({ establishmentID, condos })
    }
    // Ciblage + mailings existants : permet de reprendre un brouillon d'une session précédente.
    // ⚠️ Séquentiel et non Promise.all : deux requêtes concurrentes sur un cookie Estale froid
    // déclenchent deux connexions simultanées, et l'une des deux échoue silencieusement.
    const ciblage = await getCiblage(condoId)
    const mailings = await listerMailings().catch((e) => {
      console.error('Mailing — liste indisponible:', e)
      return []
    })
    return NextResponse.json({ ...ciblage, mailings })
  } catch (error) {
    console.error('Mailing ciblé — erreur de lecture:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}

interface PostBody {
  condoId?: string
  establishmentID?: string
  ownerIDs?: string[]
  title?: string
  object?: string
  content?: string
  replyto?: string
  copieMoi?: boolean
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  let body: PostBody
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { condoId, establishmentID, ownerIDs, title, object, content, replyto, copieMoi } = body

  const manquants = [
    !condoId && 'condoId',
    !establishmentID && 'establishmentID',
    !title?.trim() && 'title',
    !object?.trim() && 'object',
    !content?.trim() && 'content',
  ].filter(Boolean)

  if (manquants.length > 0) {
    return NextResponse.json(
      { error: `Champs requis manquants : ${manquants.join(', ')}` },
      { status: 400 },
    )
  }

  if (!Array.isArray(ownerIDs) || ownerIDs.length === 0) {
    return NextResponse.json(
      { error: 'Aucun destinataire sélectionné : brouillon non créé.' },
      { status: 400 },
    )
  }

  try {
    // La mise en copie utilise l'identité Estale du collaborateur connecté,
    // jamais une adresse fournie par le client.
    const copie = copieMoi
      ? await getCoproprietes().then(({ collaborateur }) => ({
          name: collaborateur.fullname,
          email: collaborateur.email,
        }))
      : undefined

    const brouillon = await creerBrouillonMailing({
      establishmentID: establishmentID!,
      condoID: condoId!,
      title: title!.trim(),
      object: object!.trim(),
      content: content!,
      ownerIDs,
      ...(replyto?.trim() ? { replyto: replyto.trim() } : {}),
      ...(copie ? { copie } : {}),
    })

    // Garde-fou explicite : si Estale annonçait un envoi en cours, on le signale au lieu
    // de le taire. Ce module ne déclenche jamais d'envoi.
    return NextResponse.json({
      ...brouillon,
      envoye: brouillon.isSent || brouillon.isSending,
      message:
        'Brouillon créé dans Estale. Relisez-le puis envoyez-le depuis Estale : cet outil n’envoie rien.',
    })
  } catch (error) {
    console.error('Mailing ciblé — erreur de création du brouillon:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
