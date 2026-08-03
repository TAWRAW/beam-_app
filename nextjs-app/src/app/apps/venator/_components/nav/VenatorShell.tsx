'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVenatorNavState } from './useVenatorNavState'
import { useDossierTypeCounts } from './useDossierTypeCounts'
import { useVenatorHotkey } from './useVenatorHotkey'
import CoproSwitcher from './CoproSwitcher'
import TypeNavPanel from './TypeNavPanel'
import VenatorCommandPalette from './VenatorCommandPalette'
import VenatorMobileNav from './VenatorMobileNav'

/**
 * Coquille interne du module Venator.
 *
 * Le choix de la copropriété passe par la palette (⌘K) plutôt que par un rail
 * permanent : la liste dépasse la quinzaine d'entrées et n'est consultée qu'au
 * moment d'en changer — elle occupait donc en permanence une colonne pour un
 * usage ponctuel. Le filtre par type, lui, se lit en un coup d'œil et reste
 * affiché, en barre horizontale au-dessus du contenu qu'il filtre.
 *
 * Seul composant qui a besoin d'être sous un <Suspense> (via useSearchParams,
 * cf. venator/layout.tsx) — les pages enfants appellent elles-mêmes
 * useVenatorNavState() au besoin, sans prop drilling.
 */
export default function VenatorShell({ children }: { children: React.ReactNode }) {
  const { nav, setCoproId, setType, setVue } = useVenatorNavState()
  const { counts, total } = useDossierTypeCounts(nav.coproId)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = usePathname()
  const surReglages = pathname?.startsWith('/apps/venator/reglages') ?? false

  useVenatorHotkey('k', () => setPaletteOpen((v) => !v), { meta: true })
  useVenatorHotkey('l', () => setVue('liste'))
  useVenatorHotkey('b', () => setVue('board'))

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col">
      <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 px-10 pt-5 md:flex">
        <CoproSwitcher coproId={nav.coproId} onOpen={() => setPaletteOpen(true)} />
        <TypeNavPanel
          type={nav.type}
          onSelect={setType}
          counts={counts}
          total={total}
          orientation="horizontal"
          className="min-w-0 flex-1"
        />

        <Link
          href="/apps/venator/reglages"
          title="Réglages des étapes par type de dossier"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--venator-radius-btn)] transition-colors',
            surReglages
              ? 'bg-venator-surface text-venator-fg'
              : 'text-venator-fg-faint hover:bg-venator-surface hover:text-venator-fg'
          )}
        >
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">Réglages</span>
        </Link>
      </div>

      <main className="min-w-0 px-4 py-5 pb-24 md:px-10 md:pb-10 md:pt-4">{children}</main>

      <VenatorMobileNav typeCounts={counts} typeTotal={total} />
      <VenatorCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
