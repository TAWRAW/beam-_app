'use client'

import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DOSSIER_TYPES, DOSSIER_TYPE_LABELS } from '@/lib/venator/labels'
import type { DossierType } from '@/lib/venator/types'
import { venatorMicroLabel, venatorNavChip, venatorNavItem } from '../venator-ui-classes'
import { DOSSIER_TYPE_COULEURS_BARRE, DOSSIER_TYPE_ICONS } from '../type-icons'

interface TypeNavPanelProps {
  type: string
  onSelect: (type: string) => void
  /** Nombre de dossiers par type, calculés sur la copro sélectionnée (ou toutes) — non filtrés par type. */
  counts: Partial<Record<DossierType, number>>
  total: number
  /**
   * `horizontal` : barre de filtres posée au-dessus du contenu (desktop).
   * `vertical` : liste empilée, pour le Sheet mobile où la largeur est comptée
   * mais la hauteur non.
   */
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

/**
 * Panneau de choix de type de dossier — "Tous les types" (pas de filtre) épinglé
 * en tête avec le total, puis les 8 types avec leur compteur. Les compteurs sont
 * fournis par le parent (calculés sur la liste copro-only, cf. page.tsx Lot 3) :
 * ce composant reste purement présentationnel.
 */
export default function TypeNavPanel({
  type,
  onSelect,
  counts,
  total,
  orientation = 'vertical',
  className,
}: TypeNavPanelProps) {
  const horizontal = orientation === 'horizontal'
  const itemClass = horizontal ? venatorNavChip : venatorNavItem

  const entries = [
    { key: 'all', label: 'Tous les types', Icon: LayoutGrid, barre: '', count: total },
    ...DOSSIER_TYPES.map((t) => ({
      key: t,
      label: DOSSIER_TYPE_LABELS[t],
      Icon: DOSSIER_TYPE_ICONS[t],
      // Seul le trait de l'onglet actif porte la couleur : des icônes teintées
      // en permanence chargeaient la barre sans rien apprendre, le type étant
      // déjà écrit à côté.
      barre: DOSSIER_TYPE_COULEURS_BARRE[t],
      count: counts[t] ?? 0,
    })),
  ]

  const nav = (
    <nav
      className={cn(
        horizontal
          ? '-mx-1 flex items-center gap-0.5 overflow-x-auto px-1 pb-1'
          : 'flex flex-col gap-px overflow-y-auto px-3 pb-2'
      )}
    >
      {entries.map(({ key, label, Icon, barre, count }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={cn(itemClass(type === key), 'flex items-center gap-2', type === key && barre)}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
          <span className={cn('truncate', !horizontal && 'flex-1 text-left')}>{label}</span>
          {/* Un zéro n'apporte rien : on ne montre le compteur que s'il existe.
              "Tous les types" fait exception — son total situe l'ensemble. */}
          {(count > 0 || key === 'all') && (
            <span className="tabular-nums text-[11px] text-venator-fg-faint">{count}</span>
          )}
        </button>
      ))}
    </nav>
  )

  if (horizontal) return <div className={className}>{nav}</div>

  return (
    <div className={cn('flex flex-col gap-3 min-h-0', className)}>
      <p className={cn(venatorMicroLabel, 'px-3')}>Type de dossier</p>
      {nav}
    </div>
  )
}
