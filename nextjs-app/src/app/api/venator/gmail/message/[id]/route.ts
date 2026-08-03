import { NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { accessTokenGoogle } from '@/lib/venator/google/client'
import { extraireCorpsTexte, type PartieGmail } from '@/lib/venator/google/gmail-corps'
import { enTete, type MessageGmail } from '@/lib/venator/google/gmail-messages'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

/**
 * Corps d'un message, lu à la demande pour l'aperçu du fil.
 *
 * Rien n'est enregistré : Venator ne garde que l'extrait relevé, et le corps
 * complet reste chez Google. Cet appel n'existe que le temps d'un affichage.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  // Les identifiants Gmail sont hexadécimaux. Cette vérification empêche qu'un
  // identifiant fabriqué déborde du chemin de l'URL appelée juste en dessous.
  if (!/^[0-9a-f]{1,32}$/i.test(params.id)) {
    return NextResponse.json({ error: 'Identifiant de message invalide' }, { status: 400 })
  }

  try {
    const db = createVenatorAdminClient()
    const token = await accessTokenGoogle(db)

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(params.id)}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (res.status === 404) {
      throw new VenatorError('not_found', 'Ce message n’existe plus dans Gmail.')
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new VenatorError('invalid', `Gmail a refusé la requête (${res.status}) ${detail.slice(0, 200)}`)
    }

    const message = (await res.json()) as MessageGmail & { payload?: PartieGmail }

    return NextResponse.json({
      sujet: enTete(message, 'Subject'),
      from: enTete(message, 'From'),
      date: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
      corps: extraireCorpsTexte(message.payload),
    })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
