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
import EmettreOsDialog from './EmettreOsDialog'

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

const TYPE_META: Record<string, { label: string; className: string }> = {
  sinistre: { label: 'Sinistre', className: 'bg-red-100 text-red-800 border-red-600' },
  travaux: { label: 'Travaux', className: 'bg-blue-100 text-blue-800 border-blue-600' },
  procedure: { label: 'Procédure', className: 'bg-purple-100 text-purple-800 border-purple-600' },
  mutation: { label: 'Mutation', className: 'bg-green-100 text-green-800 border-green-600' },
  ag: { label: 'AG', className: 'bg-yellow-100 text-yellow-900 border-yellow-700' },
  conseil_syndical: { label: 'Conseil syndical', className: 'bg-indigo-100 text-indigo-800 border-indigo-600' },
  vie_copro: { label: 'Vie copro', className: 'bg-teal-100 text-teal-800 border-teal-600' },
  intervention: { label: 'Intervention', className: 'bg-orange-100 text-orange-800 border-orange-600' },
  demande: { label: 'Demande', className: 'bg-slate-100 text-slate-800 border-slate-600' },
  signalement: { label: 'Signalement', className: 'bg-pink-100 text-pink-800 border-pink-600' },
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

export function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? { label: type, className: 'bg-white text-black border-black' }
  return (
    <span className={cn('inline-block text-xs font-bold px-2 py-0.5 rounded-full border-2', meta.className)}>
      {meta.label}
    </span>
  )
}

function PrioriteDots({ priorite }: { priorite: number | null }) {
  if (!priorite) return null
  // priorite 1 = urgent (3 pastilles pleines) ... 3 = basse (1 pastille pleine)
  const filled = 4 - priorite
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Priorité ${priorite}`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn('h-2 w-2 rounded-full border border-black', i <= filled ? 'bg-black' : 'bg-transparent')}
        />
      ))}
    </span>
  )
}

export default function DossierCard({
  item,
  onDelete,
  onOsEmis,
}: {
  item: ListItem
  onDelete?: (item: ListItem) => void
  onOsEmis?: () => void
}) {
  const [osOpen, setOsOpen] = useState(false)
  const isOsEnvoye = item.kind === 'ticket' && item.statut === 'os_envoye'

  return (
    <div className="relative border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition">
      <Link href={item.href as any} className="block p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge type={item.type} />
              {item.kind === 'ticket' && (
                <span className="text-[10px] font-bold uppercase text-neutral-500">Ticket</span>
              )}
            </div>
            <p className="font-bold text-sm truncate">{item.titre}</p>
            <p className="text-xs text-neutral-600 truncate">{item.coproNom}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 pr-5">
            <PrioriteDots priorite={item.priorite} />
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full border',
                isOsEnvoye ? 'bg-blue-100 text-blue-800 border-blue-600' : 'border-black bg-[#F2F1E6]'
              )}
            >
              {STATUT_LABELS[item.statut] ?? item.statut}
            </span>
          </div>
        </div>
      </Link>

      {(onDelete || item.kind === 'ticket') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Menu"
              className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full border-2 border-black bg-white text-sm font-bold leading-none shadow-[2px_2px_0px_0px_#000] hover:bg-[#F2F1E6]"
            >
              <MoreVertical className="h-3.5 w-3.5 mx-auto" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {item.kind === 'ticket' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setOsOpen(true)
                }}
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
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
