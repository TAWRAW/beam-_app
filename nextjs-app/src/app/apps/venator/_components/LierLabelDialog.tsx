'use client'

import { useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { fetcher } from '@/lib/venator/useVenator'
import { filtrerLabels, type LabelArbre } from '@/lib/venator/google/labels'
import { venatorDialogContent, venatorMicroLabel } from './venator-ui-classes'

/**
 * Sélecteur de libellé Gmail à rattacher au dossier.
 *
 * L'entrée affichée est le dernier segment, le chemin complet servant de
 * contexte : « Toiture » existe sous plusieurs copropriétés, et rien ne les
 * distinguerait sans lui. La recherche porte sur le chemin entier, pour qu'un
 * nom de copropriété remonte tous ses sujets.
 */
export default function LierLabelDialog({
  open,
  onOpenChange,
  onChoisir,
  labelActuelId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChoisir: (label: LabelArbre) => void
  labelActuelId: string | null
}) {
  const { data, isLoading, error } = useSWR<{ labels: LabelArbre[] }>(
    // Ne charge les 247 libellés qu'à l'ouverture réelle du sélecteur.
    open ? '/api/venator/gmail/labels' : null,
    fetcher
  )
  const [requete, setRequete] = useState('')
  const listeRef = useRef<HTMLDivElement>(null)

  const resultats = useMemo(
    () => filtrerLabels(data?.labels ?? [], requete).slice(0, 200),
    [data, requete]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(venatorDialogContent, 'max-w-xl gap-0 overflow-hidden p-0')}>
        <DialogHeader className="px-4 pb-2 pt-4">
          <DialogTitle className="text-left text-[16px] font-semibold text-venator-fg">
            Lier un libellé Gmail
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2.5 border-b border-venator-border px-4 pb-3">
          <Search className="h-4 w-4 shrink-0 text-venator-fg-faint" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={requete}
            onChange={(e) => {
              setRequete(e.target.value)
              listeRef.current?.scrollTo({ top: 0 })
            }}
            placeholder="Copropriété, sujet…"
            className="w-full bg-transparent text-[14px] text-venator-fg placeholder:text-venator-fg-faint outline-none focus-visible:outline-none"
          />
        </div>

        <div ref={listeRef} className="max-h-[22rem] overflow-y-auto p-2">
          {isLoading && <p className="px-2 py-6 text-center text-[13px] text-venator-fg-faint">Chargement des libellés…</p>}

          {error && (
            <p className="px-2 py-6 text-center text-[13px] text-venator-danger">
              Lecture des libellés impossible. Vérifier la connexion Google dans Réglages.
            </p>
          )}

          {!isLoading && !error && resultats.length === 0 && (
            <p className="px-2 py-6 text-center text-[13px] text-venator-fg-faint">Aucun libellé trouvé.</p>
          )}

          {resultats.map((label) => {
            const actuel = label.id === labelActuelId
            // Le parent, pour situer la feuille sans afficher le chemin en entier.
            const parent = label.chemin.slice(0, label.chemin.length - label.feuille.length).replace(/\/$/, '')
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => {
                  onChoisir(label)
                  onOpenChange(false)
                }}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 rounded-[var(--venator-radius-btn)] px-2 py-2 text-left transition-colors',
                  actuel ? 'bg-venator-surface-hover' : 'hover:bg-venator-surface-2'
                )}
              >
                <span className="flex items-center gap-2 text-[13px] font-medium text-venator-fg">
                  {label.feuille}
                  {actuel && <span className="text-[11px] font-normal text-venator-accent">lié</span>}
                  {!label.estFeuille && (
                    <span className={cn(venatorMicroLabel, 'font-normal')}>contient des sous-libellés</span>
                  )}
                </span>
                {parent && <span className="text-[11px] text-venator-fg-faint">{parent}</span>}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
