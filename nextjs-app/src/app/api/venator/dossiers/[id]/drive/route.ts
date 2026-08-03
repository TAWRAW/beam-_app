import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { assurerDossierDrive, listerPieces } from '@/lib/venator/services/drive-service'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

/** Pièces du dossier Drive rattaché. Liste vide tant qu'aucun n'est créé. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  try {
    const db = createVenatorAdminClient()
    const { data: dossier } = await db
      .from('venator_dossiers')
      .select('drive_folder_id')
      .eq('id', params.id)
      .maybeSingle()

    if (!dossier?.drive_folder_id) return NextResponse.json({ pieces: [] })
    return NextResponse.json({ pieces: await listerPieces(db, dossier.drive_folder_id) })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}

/**
 * Crée le dossier Drive du dossier, à l'emplacement Copro / Type / Titre.
 *
 * Idempotent : un dossier déjà rattaché est renvoyé tel quel, et un dossier Drive
 * de même nom est réutilisé plutôt que dupliqué.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  // Nom facultatif : le titre d'un dossier Venator fait parfois deux lignes.
  const body = await req.json().catch(() => null)
  const nom = typeof body?.nom === 'string' ? body.nom : undefined
  // `sousDossier: false` rattache directement au dossier de type — les PV se
  // rangent à plat sous « Procès Verbaux », sans un dossier par assemblée.
  const sousDossier = body?.sousDossier !== false

  try {
    const resultat = await assurerDossierDrive(createVenatorAdminClient(), params.id, nom, sousDossier)
    return NextResponse.json(resultat)
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
