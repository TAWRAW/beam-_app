'use client'

import { useState } from 'react'
import { Building2, Kanban, List, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useVenatorNavState } from './useVenatorNavState'
import CoproNavPanel from './CoproNavPanel'
import TypeNavPanel from './TypeNavPanel'
import type { DossierType } from '@/lib/venator/types'

interface VenatorMobileNavProps {
  typeCounts: Partial<Record<DossierType, number>>
  typeTotal: number
  typeProchaineAg?: number
}

type MobileSheet = 'copro' | 'type' | null

/**
 * Navigation basse (mobile, < md) : icônes Lucide uniquement, jamais d'émoji.
 * Remplace les 2 panneaux desktop par des Sheet plein-largeur en bas d'écran.
 */
export default function VenatorMobileNav({ typeCounts, typeTotal, typeProchaineAg = 0 }: VenatorMobileNavProps) {
  const { nav, setCoproId, setType, setVue } = useVenatorNavState()
  const [openSheet, setOpenSheet] = useState<MobileSheet>(null)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-venator-border bg-venator-surface md:hidden">
        <button
          type="button"
          onClick={() => setOpenSheet('copro')}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium',
            nav.coproId !== 'all' ? 'text-venator-accent' : 'text-venator-fg-muted'
          )}
        >
          <Building2 className="h-5 w-5" />
          Copropriété
        </button>
        <button
          type="button"
          onClick={() => setOpenSheet('type')}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium',
            nav.type !== 'all' ? 'text-venator-accent' : 'text-venator-fg-muted'
          )}
        >
          <Tag className="h-5 w-5" />
          Type
        </button>
        <button
          type="button"
          onClick={() => setVue(nav.vue === 'liste' ? 'board' : 'liste')}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-venator-fg-muted"
        >
          {nav.vue === 'liste' ? <List className="h-5 w-5" /> : <Kanban className="h-5 w-5" />}
          {nav.vue === 'liste' ? 'Liste' : 'Board'}
        </button>
      </nav>

      <Sheet open={openSheet === 'copro'} onOpenChange={(open) => setOpenSheet(open ? 'copro' : null)}>
        <SheetContent side="bottom" className="max-h-[80vh] border-venator-border bg-venator-surface text-venator-fg">
          <SheetHeader>
            <SheetTitle className="text-venator-fg">Copropriété</SheetTitle>
          </SheetHeader>
          <CoproNavPanel
            coproId={nav.coproId}
            onSelect={(id) => {
              setCoproId(id)
              setOpenSheet(null)
            }}
            className="mt-2"
          />
        </SheetContent>
      </Sheet>

      <Sheet open={openSheet === 'type'} onOpenChange={(open) => setOpenSheet(open ? 'type' : null)}>
        <SheetContent side="bottom" className="max-h-[80vh] border-venator-border bg-venator-surface text-venator-fg">
          <SheetHeader>
            <SheetTitle className="text-venator-fg">Type de dossier</SheetTitle>
          </SheetHeader>
          <TypeNavPanel
            type={nav.type}
            counts={typeCounts}
            total={typeTotal}
            prochaineAg={typeProchaineAg}
            onSelect={(t) => {
              setType(t)
              setOpenSheet(null)
            }}
            className="mt-2"
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
