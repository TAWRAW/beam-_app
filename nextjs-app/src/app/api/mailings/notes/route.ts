import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { listerNotes } from '@/lib/mailing/notes-store'

// Liste des notes envoyées (rapport). Filtres : ?copro=00008 et/ou ?dossier=<uuid>.

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const copro = request.nextUrl.searchParams.get('copro') ?? undefined
  const dossier = request.nextUrl.searchParams.get('dossier') ?? undefined

  const notes = await listerNotes({ copro_ref: copro, dossier_id: dossier })
  // La liste n'expose pas le corps ni les adresses : le détail les porte.
  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      created_at: n.created_at,
      copro_ref: n.copro_ref,
      copro_nom: n.copro_nom,
      cible: n.cible,
      type_note: n.type_note,
      objet: n.objet,
      dossier_id: n.dossier_id,
      nb_destinataires: n.nb_destinataires,
      nb_echecs: n.nb_echecs,
      statuts_maj_at: n.statuts_maj_at,
    })),
  })
}
