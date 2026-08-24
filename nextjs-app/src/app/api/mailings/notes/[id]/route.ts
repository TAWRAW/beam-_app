import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/server-auth'
import { lireNote, majStatutsNote } from '@/lib/mailing/notes-store'

// Détail d'une note envoyée : contenu, quand, qui a reçu, qui a échoué.
// ?refresh=1 relit le statut de chaque envoi auprès de Resend (delivered, bounced…)
// et le range dans la trace.

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
