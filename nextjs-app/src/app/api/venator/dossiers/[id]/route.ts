import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { detailDossier, cloreDossier, majDossier, majLabelGmail, majStatutDossier, majVoteStatut, supprimerDossier } from '@/lib/venator/services/dossiers-service'
import { DOSSIER_TYPES, VOTE_STATUTS } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

const patchSchema = z
  .object({ action: z.literal('clore') })
  .or(z.object({ statut: z.enum(['ouvert', 'en_cours', 'en_attente']) }))
  .or(z.object({ vote_statut: z.enum(VOTE_STATUTS) }))
  // Identité du dossier : au moins un champ, tous facultatifs.
  .or(
    z
      .object({
        titre: z.string().trim().min(1).max(200).optional(),
        type: z.enum(DOSSIER_TYPES).optional(),
        priorite: z.number().int().min(1).max(3).optional(),
      })
      .refine((o) => Object.keys(o).length > 0, 'aucun champ à modifier')
  )
  // Liaison Gmail : id + chemin ensemble, ou null/null pour détacher.
  .or(
    z.object({
      gmail_label_id: z.string().min(1).nullable(),
      gmail_label_chemin: z.string().min(1).nullable(),
    })
  )

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  try {
    const result = await detailDossier(createVenatorAdminClient(), params.id)
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response
  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const db = createVenatorAdminClient()
    let dossier
    if ('action' in parsed.data) dossier = await cloreDossier(db, params.id)
    else if ('vote_statut' in parsed.data) dossier = await majVoteStatut(db, params.id, parsed.data.vote_statut)
    else if ('gmail_label_id' in parsed.data)
      dossier = await majLabelGmail(db, params.id, parsed.data.gmail_label_id, parsed.data.gmail_label_chemin)
    else if ('statut' in parsed.data) dossier = await majStatutDossier(db, params.id, parsed.data.statut)
    // Reste l'identité du dossier : titre, type et/ou priorité.
    else dossier = await majDossier(db, params.id, parsed.data)
    return NextResponse.json({ dossier })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('gestionnaire')
  if (!auth.ok) return auth.response
  try {
    await supprimerDossier(createVenatorAdminClient(), params.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
