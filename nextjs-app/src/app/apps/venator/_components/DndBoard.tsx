'use client'

import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import DossierCard, { type ListItem } from './DossierCard'
import { venatorMicroLabel } from './venator-ui-classes'
import { DOSSIER_STATUT_ICONS } from './type-icons'
import { DOSSIER_STATUTS, type DossierStatut } from '@/lib/venator/types'

const STATUT_LABELS: Record<DossierStatut, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  en_attente: 'En attente',
  clos: 'Clos',
}

interface DndBoardProps {
  /** Cartes dossier à répartir dans les colonnes de statut. */
  boardItems: ListItem[]
  /** Tickets one-shot non rattachés à un dossier — glisser sur une carte dossier pour les rattacher. */
  unassignedTickets: ListItem[]
  /** Un dossier est déposé sur une colonne de statut. */
  onDossierStatutChange: (dossierId: string, statut: DossierStatut) => void | Promise<void>
  /** Un ticket est déposé sur une carte dossier. */
  onTicketRattacher: (ticketId: string, dossierId: string) => void | Promise<void>
  /** Suppression d'un dossier ou ticket depuis le menu ⋮ de la carte. */
  onDelete?: (item: ListItem) => void
  /** OS émis depuis une carte ticket (menu ⋮). */
  onOsEmis?: () => void
  /** Ouvre le détail d'un ticket au clic sur sa carte. */
  onOuvrirTicket?: (ticketId: string) => void
}

function dragStyle(transform: { x: number; y: number } | null) {
  if (!transform) return undefined
  return { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
}

function DossierBoardCard({
  item,
  onDelete,
  onOsEmis,
}: {
  item: ListItem
  onDelete?: (item: ListItem) => void
  onOsEmis?: () => void
}) {
  const draggable = useDraggable({ id: `dossier:${item.id}` })
  const droppable = useDroppable({ id: `rattacher:${item.id}` })
  const setRefs = (node: HTMLElement | null) => {
    draggable.setNodeRef(node)
    droppable.setNodeRef(node)
  }
  return (
    <div
      ref={setRefs}
      style={dragStyle(draggable.transform)}
      {...draggable.listeners}
      {...draggable.attributes}
      className={cn(
        'touch-none rounded-[var(--venator-radius-lg)]',
        draggable.isDragging && 'opacity-40 relative z-50',
        droppable.isOver && 'ring-1 ring-venator-accent'
      )}
    >
      <DossierCard item={item} onDelete={onDelete} onOsEmis={onOsEmis} />
    </div>
  )
}

function TicketBoardCard({
  item,
  onDelete,
  onOsEmis,
  onOuvrirTicket,
}: {
  item: ListItem
  onDelete?: (item: ListItem) => void
  onOsEmis?: () => void
  onOuvrirTicket?: (ticketId: string) => void
}) {
  const draggable = useDraggable({ id: `ticket:${item.id}` })
  return (
    <div
      ref={draggable.setNodeRef}
      style={dragStyle(draggable.transform)}
      {...draggable.listeners}
      {...draggable.attributes}
      className={cn('touch-none', draggable.isDragging && 'opacity-40 relative z-50')}
    >
      <DossierCard item={item} onDelete={onDelete} onOsEmis={onOsEmis} onOuvrirTicket={onOuvrirTicket} />
    </div>
  )
}

function StatutColumn({ statut, children }: { statut: DossierStatut; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `statut:${statut}` })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[120px] flex-col gap-1.5 rounded-[var(--venator-radius-lg)] p-1.5 transition-colors',
        isOver ? 'bg-venator-accent/[0.06]' : 'bg-white/[0.015]'
      )}
    >
      {children}
    </div>
  )
}

export default function DndBoard({ boardItems, unassignedTickets, onDossierStatutChange, onTicketRattacher, onDelete, onOsEmis, onOuvrirTicket }: DndBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const columns = useMemo(
    () => DOSSIER_STATUTS.map((statut) => ({ statut, items: boardItems.filter((item) => item.statut === statut) })),
    [boardItems]
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith('dossier:') && overId.startsWith('statut:')) {
      const dossierId = activeId.slice('dossier:'.length)
      const statut = overId.slice('statut:'.length) as DossierStatut
      onDossierStatutChange(dossierId, statut)
      return
    }
    if (activeId.startsWith('ticket:') && overId.startsWith('rattacher:')) {
      const ticketId = activeId.slice('ticket:'.length)
      const dossierId = overId.slice('rattacher:'.length)
      onTicketRattacher(ticketId, dossierId)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {columns.map(({ statut, items }) => {
          const StatutIcon = DOSSIER_STATUT_ICONS[statut]
          return (
          <div key={statut} className="flex flex-col gap-2">
            <h2 className={cn(venatorMicroLabel, 'flex items-center gap-1.5 px-2')}>
              <StatutIcon className="h-3 w-3" />
              <span className="flex-1">{STATUT_LABELS[statut]}</span>
              <span className="tabular-nums">{items.length}</span>
            </h2>
            <StatutColumn statut={statut}>
              {items.map((item) => (
                <DossierBoardCard key={item.id} item={item} onDelete={onDelete} onOsEmis={onOsEmis} />
              ))}
            </StatutColumn>
          </div>
          )
        })}
      </div>

      {unassignedTickets.length > 0 && (
        <div className="mt-8 flex flex-col gap-2">
          <h2 className={cn(venatorMicroLabel, 'px-2')}>
            Tickets non rattachés — glisser sur une carte dossier pour rattacher
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {unassignedTickets.map((item) => (
              <div key={item.id} className="w-56">
                <TicketBoardCard
                  item={item}
                  onDelete={onDelete}
                  onOsEmis={onOsEmis}
                  onOuvrirTicket={onOuvrirTicket}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </DndContext>
  )
}
