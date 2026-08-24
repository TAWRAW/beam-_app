import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/server-auth'
import { lireNote, majStatutsNote, rattacherNote } from '@/lib/mailing/notes-store'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { logJournal } from '@/lib/venator/services/journal-service'

// Détail d'une note envoyée : contenu, quand, qui a reçu, qui a échoué.
// ?refresh=1 relit le statut de chaque envoi auprès de Resend (delivered, bounced…)
// et le range dans la trace.
//
// ⚠️ La relecture des statuts exige une clé Resend autorisée EN LECTURE. La clé
// d'envoi restreinte (« restricted_api_key ») répond 401 sur emails.get : le
// rafraîchissement est alors sans effet, les statuts restent ceux de l'envoi.
//
// PATCH rattache la note à un dossier Venator après coup.

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const note = await lireNote(params.id)
  if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

  const refresh = request.nextUrl.searchParams.get('refresh') === '1'
  if (refresh && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const maj = await Promise.all(
      note.envois.map(async (e) => {
        if (!e.resend_id) return e
        try {
          const { data, error } = await resend.emails.get(e.resend_id)
          if (error || !data) return e
          return {
            ...e,
            statut: data.last_event ?? e.statut,
            maj_at: new Date().toISOString(),
          }
        } catch {
          return e
        }
      }),
    )
    note.envois = maj
    await majStatutsNote(note.id, maj)
    note.statuts_maj_at = new Date().toISOString()
  }

  return NextResponse.json({ note })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  let body: { dossierId?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const note = await lireNote(params.id)
  if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

  const dossierId = body.dossierId?.trim() || null
  const res = await rattacherNote(params.id, dossierId)
  if (!res.ok) return NextResponse.json({ error: res.erreur }, { status: 500 })

  // Le journal du dossier garde la trace du rattachement, comme il garde celle de l'envoi.
  if (dossierId) {
    try {
      const db = createVenatorAdminClient()
      const { data: dossier } = await db
        .from('venator_dossiers')
        .select('copro_id')
        .eq('id', dossierId)
        .maybeSingle()
      if (dossier) {
        const quand = new Date(note.created_at).toLocaleDateString('fr-FR', {
          timeZone: 'Europe/Paris',
        })
        await logJournal(db, {
          copro_id: dossier.copro_id,
          dossier_id: dossierId,
          type_evenement: 'mailing_envoye',
          contenu: `Note du ${quand} rattachée au dossier${note.cible ? ` (${note.cible})` : ''} : ${note.objet} — ${note.nb_destinataires} destinataire(s)`,
        })
      }
    } catch (e) {
      console.error('Journal Venator — rattachement non journalisé:', e)
    }
  }

  return NextResponse.json({ ok: true, dossierId })
}
