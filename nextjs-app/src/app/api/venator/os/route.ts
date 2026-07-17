import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { emettreOS, type EstaleOrderArgs } from '@/lib/venator/services/os-service'
import { osEmettreSchema } from '@/lib/venator/types'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'
import { emitEstaleOrder, emptyRecipients, loadMeCollaborator } from '@/lib/venator/estale-os'

/** Échappe le HTML minimal (texte → contenu de balise). */
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
/** Texte brut → HTML paragraphes (Estale attend du HTML pour la description de l'OS). Port du toHtml popup. */
const toHtml = (text: string): string => text.split(/\n/).map((l) => `<p>${esc(l)}</p>`).join('')

// POST /api/venator/os — émet un OS Estale depuis un ticket puis persiste (via emettreOS, service pur).
export async function POST(req: NextRequest) {
  const auth = await requireVenatorRole('gestionnaire')
  if (!auth.ok) return auth.response
  const parsed = osEmettreSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const db = createVenatorAdminClient()

  // Résoudre le condoID Estale du ticket : venator_tickets → venator_copros.estale_id.
  const { data: ticket } = await db.from('venator_tickets').select('copro_id').eq('id', parsed.data.ticket_id).maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 })
  const { data: copro } = await db.from('venator_copros').select('estale_id').eq('id', ticket.copro_id).maybeSingle()
  if (!copro?.estale_id) return NextResponse.json({ error: 'Copropriété Estale introuvable' }, { status: 404 })
  const condoEstaleId = copro.estale_id as string

  try {
    const { managerID } = await loadMeCollaborator()

    // deps.emitEstaleOrder : construit description HTML + recipients + schedule à partir des args du service.
    // ⚠️ Mapping recipients répliqué VERBATIM du popup estale-os-express (doSend) :
    //   recipientContactIDs = [contactID]  ET  recipients.bcc.suppliers = [contactID]
    //   (le contact fournisseur porte l'id à la fois dans recipientIDs — destinataire de l'OS — et dans bcc.suppliers).
    const deps = {
      emitEstaleOrder: async (a: EstaleOrderArgs) => {
        const descHtml = toHtml(a.description) + (a.code_acces ? `<p>Code d'accès : ${esc(a.code_acces)}</p>` : '')
        const object = a.objet
        const body = `<p>Bonjour,</p><p>Je vous prie de bien vouloir trouver ci-joint une demande d'intervention.</p><p>Cordialement,</p>`
        return emitEstaleOrder({
          condoEstaleId,
          taskLabel: a.objet,
          title: a.objet,
          description: descHtml,
          urgent: a.urgent,
          digicode: false,
          managerID,
          recipientContactIDs: [a.prestataire_contact_id],
          recipients: { ...emptyRecipients(), bcc: { owners: [], suppliers: [a.prestataire_contact_id], externals: [] } },
          schedules: [{ object, title: object, body, deferMinutes: 10 }],
        })
      },
    }

    const os = await emettreOS(db, deps, parsed.data)
    return NextResponse.json({ os })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur émission OS' }, { status: 500 })
  }
}
