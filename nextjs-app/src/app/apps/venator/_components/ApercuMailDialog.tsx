'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fetcher } from '@/lib/venator/useVenator'
import { urlLibelleGmail } from '@/lib/venator/google/gmail-corps'
import { decouperCorps, nettoyerTexteBrut } from '@/lib/venator/google/gmail-lecture'
import { venatorButtonNeutral, venatorDialogContent, venatorMicroLabel } from './venator-ui-classes'

interface ApercuMail {
  sujet: string | null
  from: string | null
  date: string | null
  corps: string | null
}

/** « Tom LEMEILLE <tom@beamo.fr> » → « Tom LEMEILLE ». */
function nomAffiche(from: string | null): string | null {
  if (!from) return null
  const nom = from.replace(/<[^>]*>/, '').trim().replace(/^["']|["']$/g, '')
  return nom || from.replace(/[<>]/g, '').trim()
}

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString('fr-FR')
}

/** Dernier segment d'un chemin de libellé : « …/Travaux/Toiture » → « Toiture ». */
function dernierSegment(chemin: string): string {
  const segments = chemin.split('/')
  return segments[segments.length - 1] || chemin
}

/**
 * Bloc replié — signature ou fil cité.
 *
 * Rien n'est supprimé : ce qui encombre la lecture est mis de côté, et se
 * rouvre d'un clic. Le libellé dit ce qu'on ouvre, pas « voir plus ».
 */
function BlocReplie({ titre, contenu }: { titre: string; contenu: string }) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className={cn(
          venatorMicroLabel,
          'rounded-[var(--venator-radius-btn)] px-1.5 py-1 transition-colors hover:text-venator-fg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-venator-border-strong',
        )}
      >
        {ouvert ? `Masquer ${titre}` : titre}
      </button>
      {ouvert && (
        <p className="mt-2 whitespace-pre-wrap border-l-2 border-venator-border pl-3 text-[12.5px] font-normal leading-relaxed text-venator-fg-muted">
          {contenu}
        </p>
      )}
    </div>
  )
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
  const expediteur = nomAffiche(data?.from ?? fromConnu)
  const date = formatDate(data?.date ?? null)

  const corps = useMemo(
    () => (data?.corps ? decouperCorps(nettoyerTexteBrut(data.corps)) : null),
    [data?.corps],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(venatorDialogContent, 'max-w-2xl gap-0 overflow-hidden p-0')}>
        {/* En-tête posé sur une surface distincte : les blocs se séparent par le
            fond et l'espace, jamais par un trait (règle du module). */}
        <div className="bg-venator-surface-2 px-5 pb-4 pt-5">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-left text-[17px] font-semibold leading-snug text-venator-fg">
              {sujet || '(sans objet)'}
            </DialogTitle>
          </DialogHeader>
          {(expediteur || date) && (
            <div className={cn(venatorMicroLabel, 'mt-2 flex flex-wrap items-center gap-x-2 gap-y-1')}>
              {expediteur && (
                <span className="font-medium normal-case tracking-normal text-venator-fg-muted">
                  {expediteur}
                </span>
              )}
              {date && <span className="tabular-nums font-normal normal-case tracking-normal">{date}</span>}
            </div>
          )}
        </div>

        <div className="max-h-[58vh] overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex flex-col gap-2.5" aria-label="Chargement du message">
              {['w-11/12', 'w-full', 'w-4/6'].map((l) => (
                <div key={l} className={cn('h-3.5 rounded bg-venator-surface-2 animate-pulse', l)} />
              ))}
            </div>
          ) : error ? (
            <p className="text-[13px] text-venator-danger">
              Gmail n’a pas renvoyé ce message. Ouvrez le libellé pour le retrouver.
            </p>
          ) : corps?.message ? (
            <>
              {/* Mesure bornée : au-delà d'environ 80 caractères, l'œil perd la
                  ligne suivante en revenant à la marge. */}
              <p className="max-w-[68ch] whitespace-pre-wrap text-[13.5px] font-normal leading-[1.65] text-venator-fg">
                {corps.message}
              </p>
              {corps.signature && <BlocReplie titre="Signature" contenu={corps.signature} />}
              {corps.cite && <BlocReplie titre="Message cité" contenu={corps.cite} />}
            </>
          ) : (
            <p className="text-[13px] text-venator-fg-muted">
              Ce message n’a pas de texte affichable — ouvrez le libellé dans Gmail.
            </p>
          )}
        </div>

        {labelChemin && (
          <div className="flex items-center justify-between gap-3 bg-venator-surface-2 px-5 py-3">
            <span className={cn(venatorMicroLabel, 'min-w-0 truncate')} title={labelChemin}>
              {dernierSegment(labelChemin)}
            </span>
            <Button type="button" asChild className={cn(venatorButtonNeutral, 'h-8 shrink-0 px-3')}>
              <a href={urlLibelleGmail(labelChemin)} target="_blank" rel="noopener noreferrer">
                Ouvrir dans Gmail
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
