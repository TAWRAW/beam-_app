// Envoi d'un Ordre de Service Estale.
// Porté depuis l'extension Chrome estale-os-express (src/estale/order-send.ts).
//
// OS natif Estale = un KanbanEventOrder porté par une tâche kanban.
// Tout l'OS = 2 mutations : createKanbanTask puis updateKanbanTask{ createEventOrder(input) }.
// Estale génère le PDF par destinataire, programme/envoie le courriel, suit les réponses.
import type { GqlFn } from './types'

/** Un groupe de destinataires email : copropriétaires (ID), fournisseurs (contactID), emails libres. */
export interface RecipientGroup {
  owners: string[]
  suppliers: string[]
  externals: string[]
}
export interface MailRecipients {
  to: RecipientGroup
  cc: RecipientGroup
  bcc: RecipientGroup
}

export interface OrderSchedule {
  object: string
  title: string
  body: string // HTML
  /** Délai d'envoi en minutes (fenêtre d'annulation). null = immédiat. */
  deferMinutes: number | null
}

export interface OrderTag {
  label: string
  color: string
}

export interface OrderSendInput {
  condoID: string
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
  /** Étiquettes optionnelles posées sur la tâche (best-effort). */
  tags?: OrderTag[]
}

export interface OrderSendResult {
  taskID: string
  eventID: string
}

const emptyGroup = (): RecipientGroup => ({ owners: [], suppliers: [], externals: [] })
export const emptyRecipients = (): MailRecipients => ({ to: emptyGroup(), cc: emptyGroup(), bcc: emptyGroup() })

export async function sendOrder(gqlFn: GqlFn, input: OrderSendInput): Promise<OrderSendResult> {
  // 1) tâche kanban porteuse ($condoID:ID!/$label:String! non-null — quirk Estale)
  const task = await gqlFn<{ createKanbanTask: { id: string } }>(
    `mutation($condoID:ID!,$label:String!){ createKanbanTask(condoID:$condoID,label:$label){ id } }`,
    { condoID: input.condoID, label: input.taskLabel },
  )
  const taskID = task.createKanbanTask.id

  // 2) étiquettes optionnelles (best-effort : un échec ne bloque pas l'OS)
  for (const tag of input.tags ?? []) {
    await gqlFn(
      `mutation($taskID:ID!,$input:KanbanTaskTagInput!){ updateKanbanTask(taskID:$taskID){ appendTag(input:$input){ id } } }`,
      { taskID, input: tag },
    ).catch(() => {})
  }

  // 3) l'OS lui-même — Estale génère le PDF + programme le courriel
  const ev = await gqlFn<{ updateKanbanTask: { createEventOrder: { id: string } } }>(
    `mutation($taskID:ID!,$input:KanbanEventOrderInput!){ updateKanbanTask(taskID:$taskID){ createEventOrder(input:$input){ id } } }`,
    {
      taskID,
      input: {
        title: input.title,
        description: input.description,
        reference: input.reference ?? '',
        urgent: input.urgent ?? false,
        digicode: input.digicode ?? false,
        managerID: input.managerID,
        sendAs: input.sendAs ?? 'me',
        ownerIDs: input.ownerIDs ?? [],
        files: [],
        recipientIDs: input.recipientContactIDs,
        recipients: input.recipients,
        schedules: input.schedules,
      },
    },
  )
  return { taskID, eventID: ev.updateKanbanTask.createEventOrder.id }
}
