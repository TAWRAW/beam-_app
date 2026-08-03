'use client'

import useSWR from 'swr'
import { ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fetcher } from '@/lib/venator/useVenator'
import { urlLibelleGmail } from '@/lib/venator/google/gmail-corps'
import { venatorButtonNeutral, venatorDialogContent, venatorMicroLabel } from './venator-ui-classes'

interface ApercuMail {
  sujet: string | null
  from: string | null
  date: string | null
  corps: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString('fr-FR')
}

/**
 * Aperçu d'un message du fil, chargé à l'ouverture et jamais conservé.
 *
 * Le corps est affiché en texte : le HTML d'origine n'est pas rendu (contenu
 * non fiable, cf. §10 de la spec). La mise en forme, les images et les pièces
 * jointes restent accessibles par le bouton vers Gmail — c'est le partage de
 * rôles retenu : Venator montre de quoi il s'agit, Gmail sert à y travailler.
 */
export default function ApercuMailDialog({
  open,
  onOpenChange,
  gmailMessageId,
  labelChemin,
  sujetConnu,
  fromConnu,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  gmailMessageId: string | null
  labelChemin: string | null
  sujetConnu: string | null
  fromConnu: string | null
}) {
  const { data, isLoading, error } = useSWR<ApercuMail>(
    // Rien n'est demandé à Gmail tant que l'aperçu n'est pas ouvert.
    open && gmailMessageId ? `/api/venator/gmail/message/${gmailMessageId}` : null,
    fetcher,
  )

  const sujet = data?.sujet ?? sujetConnu
  const from = data?.from ?? fromConnu
  const date = formatDate(data?.date ?? null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(venatorDialogContent, 'max-w-2xl gap-0 overflow-hidden p-0')}>
        <DialogHeader className="px-4 pb-2 pt-4">
          <DialogTitle className="text-left text-[16px] font-semibold text-venator-fg">
            {sujet || '(sans objet)'}
          </DialogTitle>
        </DialogHeader>

        <div className={cn(venatorMicroLabel, 'flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-venator-border px-4 pb-3')}>
          {from && <span className="font-normal normal-case tracking-normal text-venator-fg-faint">{from}</span>}
          {date && (
            <span className="tabular-nums font-normal normal-case tracking-normal text-venator-fg-faint">{date}</span>
          )}
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 rounded bg-venator-surface animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-venator-danger">Impossible de charger ce message depuis Gmail.</p>
          ) : data?.corps ? (
            <p className="whitespace-pre-wrap text-[13px] font-normal leading-relaxed text-venator-fg">
              {data.corps}
            </p>
          ) : (
            <p className="text-sm text-venator-fg-muted">
              Ce message ne contient pas de texte affichable — ouvrez-le dans Gmail.
            </p>
          )}
        </div>

        {labelChemin && (
          <div className="flex justify-end border-t border-venator-border px-4 py-3">
            <Button
              type="button"
              asChild
              className={cn(venatorButtonNeutral, 'h-8 px-3')}
            >
              <a href={urlLibelleGmail(labelChemin)} target="_blank" rel="noopener noreferrer">
                Ouvrir le libellé Gmail
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
