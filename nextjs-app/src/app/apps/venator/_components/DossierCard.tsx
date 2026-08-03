'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreVertical, Send, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DOSSIER_TYPE_LABELS, TICKET_TYPE_LABELS } from '@/lib/venator/labels'
import type { DossierType, TicketType } from '@/lib/venator/types'
import EmettreOsDialog from './EmettreOsDialog'
import { couleurPourType, iconForType } from './type-icons'
import { venatorMicroLabel } from './venator-ui-classes'

export type ListItemKind = 'dossier' | 'ticket'

export interface ListItem {
  id: string
  kind: ListItemKind
  type: string
  titre: string
  statut: string
  priorite: number | null
  coproNom: string
  copro_id: string
  created_at: string
  href: string
}

const STATUT_LABELS: Record<string, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  en_attente: 'En attente',
  clos: 'Clos',
  nouveau: 'Nouveau',
  os_envoye: 'OS envoyé',
  planifie: 'Planifié',
  realise: 'Réalisé',
}

// DOSSIER_TYPE_LABELS et TICKET_TYPE_LABELS ont des clés disjointes (garanti par
// labels.test.ts) — un `type` de ListItem appartient forcément à l'un des deux
// enums selon son `kind`, donc ce lookup combiné est sans ambiguïté.
export function typeLabel(type: string) {
  return DOSSIER_TYPE_LABELS[type as DossierType] ?? TICKET_TYPE_LABELS[type as TicketType] ?? type
}

/** Conservé pour les en-têtes de fiche, où le type doit rester lisible seul. */
export function TypeBadge({ type }: { type: string }) {
  const Icon = iconForType(type)
  return (
    <span className={cn(venatorMicroLabel, 'inline-flex items-center gap-1.5')}>
      <Icon className="h-3 w-3" />
      {typeLabel(type)}
    </span>
  )
}

export default function DossierCard({
  item,
  onDelete,
  onOsEmis,
  onOuvrirTicket,
}: {
  item: ListItem
  onDelete?: (item: ListItem) => void
  onOsEmis?: () => void
  /** Ouvre le détail d'un ticket. Absent : la carte navigue vers son `href`. */
  onOuvrirTicket?: (ticketId: string) => void
}) {
  const [osOpen, setOsOpen] = useState(false)
  const isOsEnvoye = item.kind === 'ticket' && item.statut === 'os_envoye'
  // Seule l'exception est signalée : afficher un indicateur sur les trois
  // niveaux de priorité transformerait le signal en bruit de fond.
  const isUrgent = item.priorite === 1
  const TypeIcon = iconForType(item.type)
  // Les tickets gardent la couleur neutre : leur taxonomie est distincte de celle
  // des dossiers, les teinter suggérerait une correspondance qui n'existe pas.
  const couleurType = item.kind === 'dossier' ? couleurPourType(item.type) : 'text-venator-fg-faint'

  // Une carte de ticket ouvre le ticket, pas le dossier qui le porte : c'est
  // l'objet que la carte représente. Sans cela, un ticket non rattaché renvoyait
  // au tableau de bord — donc nulle part.
  const ouvreTicket = item.kind === 'ticket' && Boolean(onOuvrirTicket)
  const classesCorps = 'block w-full px-4 py-3.5 text-left'

  const corps = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <TypeIcon className={cn('h-3.5 w-3.5 shrink-0', couleurType)} />
          <span className={cn(venatorMicroLabel, 'truncate')}>
            {typeLabel(item.type)}
            {item.kind === 'ticket' && ' · Ticket'}
          </span>
          {/* L'urgence s'écrit, elle ne se devine pas à une teinte : le jaune sert
              aussi de couleur de type (vie copro), et une information portée par
              la seule couleur échappe à qui la distingue mal. */}
          {isUrgent && (
            <span className={cn(venatorMicroLabel, 'shrink-0 text-venator-accent')}>· Urgent</span>
          )}
        </div>
        <span
          className={cn(
            'shrink-0 pr-5 text-[11px] font-medium',
            isOsEnvoye ? 'text-venator-accent' : 'text-venator-fg-muted'
          )}
        >
          {STATUT_LABELS[item.statut] ?? item.statut}
        </span>
      </div>

      <p className="mt-1.5 truncate text-[14px] font-semibold leading-snug tracking-[-0.01em] text-venator-fg">
        {item.titre}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-venator-fg-muted">{item.coproNom}</p>
    </>
  )

  return (
    <div className="group relative overflow-hidden rounded-[var(--venator-radius-lg)] bg-venator-surface transition-colors hover:bg-venator-surface-2">
      {/* Repère de type dans l'angle : identifie la carte avant même de la lire.
          `currentColor` reprend la teinte du type, un dégradé évitant le pavé. */}
      {item.kind === 'dossier' && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-0 top-0 h-14 w-14 rounded-br-[3rem]',
            'bg-[radial-gradient(circle_at_top_left,currentColor_0%,transparent_70%)] opacity-[0.22]',
            couleurType
          )}
        />
      )}

      {ouvreTicket ? (
        <button type="button" onClick={() => onOuvrirTicket?.(item.id)} className={classesCorps}>
          {corps}
        </button>
      ) : (
        <Link href={item.href as any} className={classesCorps}>
          {corps}
        </Link>
      )}

      {(onDelete || item.kind === 'ticket') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Menu"
              className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-md text-venator-fg-faint opacity-0 transition hover:bg-venator-surface-hover hover:text-venator-fg group-hover:opacity-100 focus-visible:opacity-100"
            >
              <MoreVertical className="mx-auto h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
            className="border-venator-border bg-venator-surface text-venator-fg"
          >
            {item.kind === 'ticket' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setOsOpen(true)
                }}
                className="focus:bg-venator-surface-hover focus:text-venator-fg"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Émettre OS
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item)
                }}
                className="text-venator-danger focus:bg-venator-danger/10 focus:text-venator-danger"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {item.kind === 'ticket' && (
        <EmettreOsDialog
          ticket={{ id: item.id, copro_id: item.copro_id, titre: item.titre }}
          open={osOpen}
          onOpenChange={setOsOpen}
          onEmis={onOsEmis}
        />
      )}
    </div>
  )
}
