'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Ticket } from '@/lib/venator/types'
import { TICKET_TYPE_LABELS } from '@/lib/venator/labels'
import FilPanel from './FilPanel'
import { iconForType } from './type-icons'
import { venatorDialogContent, venatorMicroLabel } from './venator-ui-classes'

const TICKET_STATUT_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  os_envoye: 'OS envoyé',
  planifie: 'Planifié',
  realise: 'Réalisé',
  clos: 'Clos',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR')
}

/**
 * Détail d'un ticket : ce qui a été saisi à la création (description,
 * prestataire) plus son fil.
 *
 * En dialog plutôt qu'en page dédiée : un ticket se consulte depuis le dossier
 * qui le porte ou depuis le board, et l'ouvrir en pleine page ferait perdre ce
 * contexte pour un objet qui tient en quelques lignes.
 */
export default function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!ticket) return null

  const Icon = iconForType(ticket.type)
  const isOsEnvoye = ticket.statut === 'os_envoye'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(venatorDialogContent, 'max-w-2xl')}>
        <DialogHeader>
          <div className={cn(venatorMicroLabel, 'flex flex-wrap items-center gap-x-2 gap-y-1')}>
            <Icon className="h-3 w-3" />
            <span>{TICKET_TYPE_LABELS[ticket.type] ?? ticket.type}</span>
            <span className="text-venator-fg-faint">·</span>
            <span className={cn(isOsEnvoye && 'text-venator-accent')}>
              {TICKET_STATUT_LABELS[ticket.statut] ?? ticket.statut}
            </span>
            <span className="text-venator-fg-faint">·</span>
            <span className="font-normal normal-case tracking-normal text-venator-fg-faint">
              {formatDate(ticket.created_at)}
            </span>
          </div>
          <DialogTitle className="text-left text-[18px] font-semibold leading-snug tracking-[-0.01em] text-venator-fg">
            {ticket.titre}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className={venatorMicroLabel}>Description</p>
            {ticket.description ? (
              <p className="whitespace-pre-wrap text-[13px] font-normal leading-relaxed text-venator-fg">
                {ticket.description}
              </p>
            ) : (
              <p className="text-[13px] text-venator-fg-faint">Aucune description.</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className={venatorMicroLabel}>Prestataire</p>
            <p className="text-[13px] text-venator-fg">
              {ticket.prestataire_nom || <span className="text-venator-fg-faint">Non renseigné.</span>}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className={venatorMicroLabel}>Fil</p>
            <FilPanel parentType="ticket" parentId={ticket.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
