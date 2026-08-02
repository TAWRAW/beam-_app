'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Building2, Layers, LayoutGrid, List, Search, Kanban } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useCopros } from '@/lib/venator/useVenator'
import { DOSSIER_TYPES, DOSSIER_TYPE_LABELS } from '@/lib/venator/labels'
import { DOSSIER_TYPE_ICONS } from '../type-icons'
import { venatorMicroLabel } from '../venator-ui-classes'
import { useVenatorNavState } from './useVenatorNavState'
import type { LucideIcon } from 'lucide-react'

interface PaletteItem {
  id: string
  section: string
  label: string
  /** Texte additionnel cherché mais affiché à droite — la référence Estale (« 00009 »). */
  hint?: string
  /** Raccourci direct équivalent, affiché pour le faire découvrir. */
  shortcut?: string
  Icon: LucideIcon
  run: () => void
}

/**
 * Palette de commandes du module (⌘K / Ctrl+K).
 *
 * Construite sur le Dialog Radix déjà présent plutôt que sur cmdk : le besoin se
 * limite à filtrer une liste et à gérer ↑/↓/Entrée, et une dépendance de plus
 * imposerait de re-surcharger ses styles à cause des tokens partagés invalides
 * du repo (cf. venator-theme.css).
 *
 * Le filtre porte sur le libellé ET sur la référence, pour que Tom puisse taper
 * « 00009 » aussi bien que « Maison ».
 */
export default function VenatorCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const { data } = useCopros()
  const { setCoproId, setType, setVue } = useVenatorNavState()

  const close = useCallback(() => {
    onOpenChange(false)
    setQuery('')
    setCursor(0)
  }, [onOpenChange])

  const items: PaletteItem[] = useMemo(() => {
    const copros = data?.copros ?? []
    return [
      {
        id: 'copro:all',
        section: 'Copropriétés',
        label: 'Toutes les copropriétés',
        Icon: Layers,
        run: () => setCoproId('all'),
      },
      ...copros.map((c) => ({
        id: `copro:${c.id}`,
        section: 'Copropriétés',
        label: c.nom,
        hint: c.reference ?? undefined,
        Icon: Building2,
        run: () => setCoproId(c.id),
      })),
      {
        id: 'type:all',
        section: 'Type de dossier',
        label: 'Tous les types',
        Icon: LayoutGrid,
        run: () => setType('all'),
      },
      ...DOSSIER_TYPES.map((t) => ({
        id: `type:${t}`,
        section: 'Type de dossier',
        label: DOSSIER_TYPE_LABELS[t],
        Icon: DOSSIER_TYPE_ICONS[t],
        run: () => setType(t),
      })),
      { id: 'vue:liste', section: 'Vue', label: 'Vue liste', shortcut: 'L', Icon: List, run: () => setVue('liste') },
      { id: 'vue:board', section: 'Vue', label: 'Vue board', shortcut: 'B', Icon: Kanban, run: () => setVue('board') },
    ]
  }, [data, setCoproId, setType, setVue])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q)
    )
  }, [items, query])

  // Le curseur doit rester dans les bornes quand la recherche réduit la liste.
  useEffect(() => setCursor(0), [query])

  const select = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) return
      item.run()
      close()
    },
    [close]
  )

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (filtered.length ? (c + 1) % filtered.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (filtered.length ? (c - 1 + filtered.length) % filtered.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select(filtered[cursor])
    }
  }

  // Garde l'élément survolé au clavier visible dans la zone scrollable.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor, filtered])

  let lastSection: string | null = null

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent
        className="top-[15%] max-w-xl translate-y-0 gap-0 overflow-hidden !bg-venator-surface p-0 border-venator-border [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Recherche rapide Venator</DialogTitle>

        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-venator-fg-faint" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Copropriété, numéro, type de dossier…"
            /* globals.css pose un outline jaune sur :focus-visible (accessibilité
               clavier, à conserver partout ailleurs). Ici le champ reçoit le focus
               d'office à l'ouverture : l'anneau signalerait un état qui n'est
               jamais autre, sans rien apprendre — le curseur texte suffit. */
            className="w-full bg-transparent text-[14px] text-venator-fg placeholder:text-venator-fg-faint outline-none focus-visible:outline-none"
          />
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-[13px] text-venator-fg-faint">Aucun résultat.</p>
          )}

          {filtered.map((item, index) => {
            const showSection = item.section !== lastSection
            lastSection = item.section
            const active = index === cursor
            return (
              <div key={item.id}>
                {showSection && <p className={cn(venatorMicroLabel, 'px-2 pb-1 pt-3')}>{item.section}</p>}
                <button
                  type="button"
                  data-active={active}
                  onMouseMove={() => setCursor(index)}
                  onClick={() => select(item)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[var(--venator-radius-btn)] px-2 py-2 text-left text-[13px] transition-colors',
                    active ? 'bg-venator-surface-hover text-venator-fg' : 'text-venator-fg-muted'
                  )}
                >
                  <item.Icon className="h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && (
                    <span className="shrink-0 tabular-nums text-[11px] text-venator-fg-faint">{item.hint}</span>
                  )}
                  {item.shortcut && (
                    <kbd className="shrink-0 rounded bg-venator-surface-2 px-1.5 py-0.5 font-sans text-[10.5px] text-venator-fg-faint">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 bg-venator-bg px-4 py-2 text-[11px] text-venator-fg-faint">
          <span>
            <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> naviguer
          </span>
          <span>
            <kbd className="font-sans">↵</kbd> ouvrir
          </span>
          <span>
            <kbd className="font-sans">esc</kbd> fermer
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
