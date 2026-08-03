'use client'

import { useEffect, useState } from 'react'
import { Building2, ChevronsUpDown, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCopros } from '@/lib/venator/useVenator'

/**
 * Déclencheur de la palette : affiche la copropriété courante et rappelle le
 * raccourci. Le raccourci lui-même est capté globalement par
 * VenatorCommandPalette — ce bouton est l'affordance visible pour ceux qui ne le
 * connaissent pas encore.
 */
export default function CoproSwitcher({ coproId, onOpen }: { coproId: string; onOpen: () => void }) {
  const { data } = useCopros()
  const copro = coproId !== 'all' ? data?.copros.find((c) => c.id === coproId) ?? null : null
  const [isMac, setIsMac] = useState(true)

  // navigator n'existe pas au rendu serveur : on résout après montage, en
  // partant de ⌘ (poste de Tom) pour éviter un clignotement du libellé.
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
  }, [])

  const Icon = copro ? Building2 : Layers

  return (
    <button
      type="button"
      onClick={onOpen}
      title="Changer de copropriété"
      className={cn(
        'group flex h-8 w-full items-center gap-2 rounded-[var(--venator-radius-btn)] bg-venator-surface px-2.5',
        'text-[13px] font-medium text-venator-fg transition-colors hover:bg-venator-surface-2 md:w-[228px]'
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
      <span className="flex-1 truncate text-left">{copro ? copro.nom : 'Toutes les copropriétés'}</span>
      {copro?.reference && (
        <span className="shrink-0 tabular-nums text-[11px] text-venator-fg-faint">{copro.reference}</span>
      )}
      <kbd className="shrink-0 font-sans text-[11px] text-venator-fg-faint">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      <ChevronsUpDown className="h-3 w-3 shrink-0 text-venator-fg-faint" />
    </button>
  )
}
