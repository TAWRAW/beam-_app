import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { deposerPiece } from '@/lib/venator/services/drive-service'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

export const runtime = 'nodejs'
// Un dépôt de plusieurs mégaoctets dépasse le délai par défaut.
export const maxDuration = 60

/** Au-delà, il vaut mieux déposer directement dans Drive : la requête transite
 *  par la fonction serverless, qui n'est pas un tuyau de transfert de fichiers. */
const TAILLE_MAX = 25 * 1024 * 1024

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  try {
    const db = createVenatorAdminClient()

    // Le dossier Drive doit exister : on ne le crée pas implicitement ici, sinon
    // un glisser-déposer maladroit sèmerait des dossiers sans que Tom l'ait voulu.
    const { data: dossier } = await db
      .from('venator_dossiers')
      .select('drive_folder_id')
      .eq('id', params.id)
      .maybeSingle()
    if (!dossier?.drive_folder_id) {
      throw new VenatorError('invalid', "Aucun dossier Drive rattaché : le créer d'abord.")
    }

    const form = await req.formData()
    const fichier = form.get('fichier')
    if (!(fichier instanceof File)) {
      throw new VenatorError('invalid', 'Aucun fichier reçu.')
    }
    if (fichier.size > TAILLE_MAX) {
      throw new VenatorError(
        'invalid',
        `« ${fichier.name} » dépasse 25 Mo. Le déposer directement dans Drive.`
      )
    }

    const piece = await deposerPiece(db, dossier.drive_folder_id, {
      nom: fichier.name,
      type: fichier.type,
      contenu: await fichier.arrayBuffer(),
    })
    return NextResponse.json({ piece })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
