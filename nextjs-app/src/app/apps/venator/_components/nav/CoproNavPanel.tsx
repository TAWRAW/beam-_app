'use client'

import { useMemo, useState } from 'react'
import { Building2, Layers, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCopros } from '@/lib/venator/useVenator'
import { venatorMicroLabel, venatorNavItem } from '../venator-ui-classes'

interface CoproNavPanelProps {
  coproId: string
  onSelect: (coproId: string) => void
  className?: string
}

/**
 * Panneau de choix de copropriété — "Toutes les copropriétés" (vue globale)
 * épinglé en tête, puis liste recherchable. Utilisé tel quel en rail desktop
 * (venator/layout.tsx) et en plein écran dans le Sheet mobile (VenatorMobileNav).
 */
export default function CoproNavPanel({ coproId, onSelect, className }: CoproNavPanelProps) {
  const { data, isLoading } = useCopros()
  const [search, setSearch] = useState('')

  const copros = data?.copros ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return copros
    return copros.filter(
      (c) => c.nom.toLowerCase().includes(q) || c.reference?.toLowerCase().includes(q)
    )
  }, [copros, search])

  return (
    <div className={cn('flex flex-col gap-3 min-h-0', className)}>
      <p className={cn(venatorMicroLabel, 'px-3')}>Copropriété</p>

      <div className="relative px-3">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-venator-fg-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full rounded-[var(--venator-radius-btn)] bg-venator-surface py-1.5 pl-8 pr-2 text-[13px] text-venator-fg placeholder:text-venator-fg-faint outline-none transition-colors focus:bg-venator-surface-2"
        />
      </div>

      <nav className="flex flex-col gap-px overflow-y-auto px-3 pb-2">
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={cn(venatorNavItem(coproId === 'all'), 'flex items-center gap-2')}
        >
          <Layers className="h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
          <span className="truncate">Toutes les copropriétés</span>
        </button>

        {isLoading && (
          <div className="flex flex-col gap-1 py-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-6 rounded bg-venator-surface animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="px-3 py-1.5 text-xs text-venator-fg-faint">Aucune copropriété.</p>
        )}

        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(venatorNavItem(coproId === c.id), 'flex items-center gap-2')}
            title={c.nom}
          >
            <Building2 className="h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
            <span className="truncate">{c.nom}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
