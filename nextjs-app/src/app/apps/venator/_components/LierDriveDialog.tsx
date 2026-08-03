'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ChevronRight, Folder, Home, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fetcher } from '@/lib/venator/useVenator'
import { venatorButtonPrimary, venatorDialogContent, venatorMicroLabel } from './venator-ui-classes'

interface DossierDrive {
  id: string
  nom: string
}

/** Un cran du fil d'Ariane. `null` en tête = racine du Drive. */
interface Cran {
  id: string | null
  nom: string
}

/**
 * Choix du dossier Drive d'une copropriété.
 *
 * Navigation plutôt que simple recherche : la recherche Drive balaie tout le
 * disque et remonte des homonymes sans rapport (« Photos compteurs - albufera »
 * pour « Albuf »). Descendre dans l'arborescence lève l'ambiguïté, et la
 * recherche reste disponible pour aller vite.
 */
export default function LierDriveDialog({
  open,
  onOpenChange,
  onChoisir,
  titre = 'Dossier Drive de la copropriété',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChoisir: (dossier: DossierDrive) => void
  titre?: string
}) {
  const [chemin, setChemin] = useState<Cran[]>([{ id: null, nom: 'Mon Drive' }])
  const [requete, setRequete] = useState('')
  const courant = chemin[chemin.length - 1]

  const url = requete.trim()
    ? `/api/venator/drive/folders?q=${encodeURIComponent(requete.trim())}`
    : `/api/venator/drive/folders${courant.id ? `?parent=${courant.id}` : ''}`

  const { data, isLoading, error } = useSWR<{ dossiers: DossierDrive[] }>(open ? url : null, fetcher)

  function entrer(d: DossierDrive) {
    setRequete('')
    setChemin((c) => [...c, { id: d.id, nom: d.nom.trim() }])
  }

  function remonter(index: number) {
    setRequete('')
    setChemin((c) => c.slice(0, index + 1))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(venatorDialogContent, 'max-w-xl gap-0 overflow-hidden p-0')}>
        <DialogHeader className="px-4 pb-2 pt-4">
          <DialogTitle className="text-left text-[16px] font-semibold text-venator-fg">{titre}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2.5 px-4 pb-3">
          <Search className="h-4 w-4 shrink-0 text-venator-fg-faint" />
          <input
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Rechercher dans tout le Drive…"
            className="w-full bg-transparent text-[14px] text-venator-fg placeholder:text-venator-fg-faint outline-none focus-visible:outline-none"
          />
        </div>

        {/* Fil d'Ariane masqué en recherche : les résultats viennent de partout,
            afficher un chemin y serait trompeur. */}
        {!requete.trim() && (
          <div className="flex flex-wrap items-center gap-0.5 border-t border-venator-border px-4 py-2 text-[12px]">
            {chemin.map((cran, i) => (
              <span key={`${cran.id ?? 'root'}-${i}`} className="flex items-center gap-0.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-venator-fg-faint" />}
                <button
                  type="button"
                  onClick={() => remonter(i)}
                  className={cn(
                    'rounded px-1 py-0.5 transition-colors',
                    i === chemin.length - 1
                      ? 'font-medium text-venator-fg'
                      : 'text-venator-fg-muted hover:text-venator-fg'
                  )}
                >
                  {i === 0 ? <Home className="h-3 w-3" /> : cran.nom}
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="max-h-[20rem] overflow-y-auto border-t border-venator-border p-2">
          {isLoading && <p className="px-2 py-6 text-center text-[13px] text-venator-fg-faint">Chargement…</p>}
          {error && (
            <p className="px-2 py-6 text-center text-[13px] text-venator-danger">
              Lecture du Drive impossible. Vérifier la connexion Google dans Réglages.
            </p>
          )}
          {!isLoading && !error && (data?.dossiers.length ?? 0) === 0 && (
            <p className="px-2 py-6 text-center text-[13px] text-venator-fg-faint">Aucun dossier ici.</p>
          )}

          {data?.dossiers.map((d) => (
            <div key={d.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => entrer(d)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--venator-radius-btn)] px-2 py-2 text-left transition-colors hover:bg-venator-surface-2"
              >
                <Folder className="h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
                <span className="truncate text-[13px] text-venator-fg">{d.nom.trim()}</span>
              </button>
              <Button
                type="button"
                onClick={() => {
                  onChoisir({ ...d, nom: d.nom.trim() })
                  onOpenChange(false)
                }}
                className={cn(venatorButtonPrimary, 'h-7 shrink-0 px-2.5 text-[12px]')}
              >
                Choisir
              </Button>
            </div>
          ))}
        </div>

        <p className={cn(venatorMicroLabel, 'border-t border-venator-border px-4 py-2')}>
          Cliquer un dossier pour l&apos;ouvrir · « Choisir » pour le rattacher
        </p>
      </DialogContent>
    </Dialog>
  )
}
