// src/lib/venator/estale-os.ts
// Adaptateur Estale pour l'émission d'OS Venator.
// Port FIDÈLE de estale-os-express/src/estale/{order-send.ts, queries.ts}, câblé sur estaleGraphQL.
// ⚠️ HORS services/ : ce module PEUT importer @/lib/estale-api (I/O réel Estale). Les services restent purs.
import { estaleGraphQL } from '@/lib/estale-api'

// --- Destinataires (copiés verbatim d'order-send.ts) ---
/** Un groupe de destinataires : copropriétaires (ID), fournisseurs (contactID), emails libres. */
export interface RecipientGroup { owners: string[]; suppliers: string[]; externals: string[] }
export interface MailRecipients { to: RecipientGroup; cc: RecipientGroup; bcc: RecipientGroup }
/** Programmation d'envoi du courriel. deferMinutes = fenêtre d'annulation (null = immédiat). */
export interface OrderSchedule { object: string; title: string; body: string; deferMinutes: number | null }

const emptyGroup = (): RecipientGroup => ({ owners: [], suppliers: [], externals: [] })
export const emptyRecipients = (): MailRecipients => ({ to: emptyGroup(), cc: emptyGroup(), bcc: emptyGroup() })

export interface EmitEstaleOrderArgs {
  condoEstaleId: string
  /** Libellé de la tâche kanban porteuse (souvent = title). */
  taskLabel: string
  title: string
  /** Corps de l'OS en HTML (le PDF est généré à partir de là). */
  description: string
  reference?: string
  urgent?: boolean
  digicode?: boolean
  /** Collaborateur à contacter (= me.collaborator.id). */
  managerID: string
  /** "me" | "noReply" | email custom. */
  sendAs?: string
  ownerIDs?: string[]
  /** Contacts fournisseurs destinataires de l'OS (chacun reçoit un PDF généré). */
  recipientContactIDs: string[]
  recipients: MailRecipients
  schedules: OrderSchedule[]
}

export interface EmitEstaleOrderResult { taskID: string; eventID: string }

/**
 * Émet un OS natif Estale = 2 mutations (port de `sendOrder`) :
 *   1) createKanbanTask(condoID,label) — quirk : $condoID:ID! / $label:String! NON-NULL.
 *   2) updateKanbanTask(taskID){ createEventOrder(input:$input) } — $input:KanbanEventOrderInput!.
 * Estale génère le PDF par destinataire, programme/envoie le courriel, suit les réponses.
 */
export async function emitEstaleOrder(args: EmitEstaleOrderArgs): Promise<EmitEstaleOrderResult> {
  // 1) tâche kanban porteuse ($condoID:ID!/$label:String! non-null — quirk Estale)
  const task = await estaleGraphQL<{ createKanbanTask: { id: string } }>(
    `mutation($condoID:ID!,$label:String!){ createKanbanTask(condoID:$condoID,label:$label){ id } }`,
    { condoID: args.condoEstaleId, label: args.taskLabel },
  )
  const taskID = task.createKanbanTask.id

  // 2) l'OS lui-même — Estale génère le PDF + programme le courriel
  const ev = await estaleGraphQL<{ updateKanbanTask: { createEventOrder: { id: string } } }>(
    `mutation($taskID:ID!,$input:KanbanEventOrderInput!){ updateKanbanTask(taskID:$taskID){ createEventOrder(input:$input){ id } } }`,
    {
      taskID,
      input: {
        title: args.title,
        description: args.description,
        reference: args.reference ?? '',
        urgent: args.urgent ?? false,
        digicode: args.digicode ?? false,
        managerID: args.managerID,
        sendAs: args.sendAs ?? 'me',
        ownerIDs: args.ownerIDs ?? [],
        files: [],
        recipientIDs: args.recipientContactIDs,
        recipients: args.recipients,
        schedules: args.schedules,
      },
    },
  )
  return { taskID, eventID: ev.updateKanbanTask.createEventOrder.id }
}

// --- Requêtes (copiées verbatim de queries.ts) ---
export interface EstaleSupplierContact { id: string; name: string; email: string | null; phone: string | null }
export interface EstaleCondoSupplier { id: string; name: string; contacts: EstaleSupplierContact[] }

/**
 * Fournisseurs (+ contacts) d'une copropriété. Port de `loadCondoSuppliers`.
 * $id:ID! obligatoire, $a:Boolean! obligatoire. Fournisseurs scopés PAR COPRO (pas establishment).
 */
export async function loadCondoSuppliers(condoEstaleId: string): Promise<EstaleCondoSupplier[]> {
  const d = await estaleGraphQL<{ condo: { suppliers: EstaleCondoSupplier[] } }>(
    `query($id:ID!,$a:Boolean!){ condo(id:$id){
      suppliers(archived:$a){ id name contacts(archived:$a){ id name email phone } } } }`,
    { id: condoEstaleId, a: false },
  )
  return d.condo?.suppliers ?? []
}

/**
 * TOUS les fournisseurs (+ contacts) du cabinet, via me.establishment.suppliers.
 * Vérifié en réel le 18/07/2026 : les contact ids sont bien résolus à ce niveau.
 * (Pas d'argument archived sur establishment.suppliers, contrairement à condo.suppliers.)
 */
export async function loadEstablishmentSuppliers(): Promise<EstaleCondoSupplier[]> {
  const d = await estaleGraphQL<{ me: { establishment: { suppliers: EstaleCondoSupplier[] } | null } }>(
    `query { me { establishment { suppliers { id name contacts { id name email phone } } } } }`,
    {},
  )
  return d.me?.establishment?.suppliers ?? []
}

/** Collaborateur connecté : managerID (= me.collaborator.id) + establishmentID. Port réduit de `loadMe`. */
export async function loadMeCollaborator(): Promise<{ managerID: string; establishmentID: string | null }> {
  const d = await estaleGraphQL<{
    me: { collaborator: { id: string } | null; establishment: { id: string } | null }
  }>(`query { me { id fullname collaborator { id fullname email } establishment { id name } } }`)
  const managerID = d.me?.collaborator?.id
  if (!managerID) throw new Error('Profil collaborateur Estale introuvable (me.collaborator.id manquant)')
  return { managerID, establishmentID: d.me.establishment?.id ?? null }
}
