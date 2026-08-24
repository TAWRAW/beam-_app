import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/server-auth'
import { rendreNote } from '@/lib/mailing/render-note'
import { enregistrerNote, type EnvoiNote } from '@/lib/mailing/notes-store'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { logJournal } from '@/lib/venator/services/journal-service'

// Envoi d'une « note d'information Beamô » via Resend (gabarit charte, HTML maîtrisé),
// avec trace pérenne dans `mailing_notes` et, si dossier fourni, entrée au journal Venator.
//
// Verrous : requireAdmin() + `confirmer: true` + liste de destinataires explicite.

export const dynamic = 'force-dynamic'

interface Body {
  to?: string[]
  coproEstaleId?: string
  coproRef?: string
  coproNom?: string
  coproAdresse?: string
  typeNote?: string
  cible?: string
  objet?: string
  corps?: string
  dossierId?: string
  confirmer?: boolean
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY non configurée' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const {
    to,
    coproEstaleId,
    coproRef,
    coproNom,
    coproAdresse,
    typeNote,
    cible,
    objet,
    corps,
    dossierId,
    confirmer,
  } = body

  if (confirmer !== true) {
    return NextResponse.json(
      { error: 'Confirmation manquante : rien n’a été envoyé.' },
      { status: 400 },
    )
  }
  if (
    !Array.isArray(to) ||
    to.length === 0 ||
    to.some((a) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a))
  ) {
    return NextResponse.json({ error: 'Liste de destinataires invalide' }, { status: 400 })
  }
  const manquants = [
    !coproNom?.trim() && 'coproNom',
    !coproAdresse?.trim() && 'coproAdresse',
    !typeNote?.trim() && 'typeNote',
    !objet?.trim() && 'objet',
    !corps?.trim() && 'corps',
  ].filter(Boolean)
  if (manquants.length > 0) {
    return NextResponse.json(
      { error: `Champs requis manquants : ${manquants.join(', ')}` },
      { status: 400 },
    )
  }

  const dests = [...new Set(to.map((a) => a.trim().toLowerCase()))]
  const date = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
  const html = rendreNote({
    coproNom: coproNom!,
    coproAdresse: coproAdresse!,
    typeNote: typeNote!,
    cible,
    objet: objet!,
    corps: corps!,
    date,
  })

  try {
    const resend = new Resend(apiKey)
    // Un envoi PAR destinataire : chacun ne voit que sa propre adresse.
    const envois: EnvoiNote[] = []
    for (const dest of dests) {
      const { data, error } = await resend.emails.send({
        from: 'Beamô <contact@xn--beam-yqa.fr>',
        to: [dest],
        replyTo: 'tom.lemeille@xn--beam-yqa.fr',
        subject: objet!,
        html,
      })
      envois.push({
        email: dest,
        resend_id: data?.id,
        statut: error ? 'failed' : 'sent',
        ...(error ? { erreur: error.message } : {}),
      })
    }

    const echecs = envois.filter((e) => e.erreur)

    // Trace pérenne — n'empêche jamais de rendre le résultat de l'envoi.
    const trace = await enregistrerNote({
      copro_estale_id: coproEstaleId ?? '',
      copro_ref: coproRef ?? '',
      copro_nom: coproNom!,
      cible,
      type_note: typeNote!,
      objet: objet!,
      corps: corps!,
      dossier_id: dossierId ?? null,
      envois,
    })

    // Entrée au journal du dossier Venator, pour retrouver le mailing depuis le dossier.
    if (dossierId) {
      try {
        const db = createVenatorAdminClient()
        const { data: dossier } = await db
          .from('venator_dossiers')
          .select('copro_id')
          .eq('id', dossierId)
          .maybeSingle()
        if (dossier) {
          await logJournal(db, {
            copro_id: dossier.copro_id,
            dossier_id: dossierId,
            type_evenement: 'mailing_envoye',
            contenu: `Note envoyée${cible ? ` (${cible})` : ''} : ${objet} — ${dests.length} destinataire(s), ${echecs.length} échec(s)`,
          })
        }
      } catch (e) {
        console.error('Journal Venator — entrée mailing impossible:', e)
      }
    }

    console.info(
      `[note-resend] ${guard.email ?? 'admin'} — ${coproNom} — ${dests.length} dest., ${echecs.length} échec(s), trace=${trace.id ?? 'NON'}`,
    )
    return NextResponse.json({
      envoyes: envois.length - echecs.length,
      echecs,
      noteId: trace.id,
      ...(trace.warning ? { warning: trace.warning } : {}),
    })
  } catch (error) {
    console.error('Note Resend — échec:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
