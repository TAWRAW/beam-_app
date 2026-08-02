'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { CheckCircle2, Mail, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fetcher } from '@/lib/venator/useVenator'
import {
  venatorButtonNeutral,
  venatorButtonPrimary,
  venatorMicroLabel,
} from '../../_components/venator-ui-classes'
import RattacherCoprosCard from '../_components/RattacherCoprosCard'
import ReglagesHeader from '../_components/ReglagesHeader'

interface Connexion {
  email: string
  scopes: string
  connected_at: string
  last_refresh_at: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('fr-FR')
}

function ConnexionsContenu() {
  const params = useSearchParams()
  const { data, isLoading, mutate } = useSWR<{ connexion: Connexion | null }>(
    '/api/venator/google',
    fetcher
  )
  const [pending, setPending] = useState(false)
  const connexion = data?.connexion ?? null

  // Le callback OAuth renvoie ici avec le résultat en query params : c'est le
  // navigateur qui revient de Google, pas un appel programmatique.
  const resultat = params.get('google')
  const detail = params.get('detail')

  async function deconnecter() {
    if (pending) return
    if (!window.confirm('Déconnecter le compte Google ? Les libellés liés resteront, mais plus aucun mail ne sera relevé.')) return
    setPending(true)
    try {
      await fetch('/api/venator/google', { method: 'DELETE' })
      await mutate()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ReglagesHeader
        titre="Connexions"
        description="Comptes externes reliés à Venator. Le jeton est chiffré et n'est jamais exposé à l'interface."
      />

      {resultat === 'ok' && (
        <div className="rounded-[var(--venator-radius-md)] bg-venator-surface-2 p-3 text-sm font-medium text-venator-fg">
          Compte Google relié.
        </div>
      )}
      {(resultat === 'erreur' || resultat === 'refuse') && (
        <div className="rounded-[var(--venator-radius-md)] border border-venator-danger/40 bg-venator-danger/10 p-3 text-sm font-medium text-venator-danger">
          {resultat === 'refuse' ? 'Consentement refusé.' : 'La connexion a échoué.'}
          {detail && <span className="font-normal"> — {detail}</span>}
        </div>
      )}

      <div className="flex max-w-2xl flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-venator-fg-faint" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-venator-fg">Google — Gmail et Drive</p>
              <p className="mt-0.5 text-[12px] text-venator-fg-muted">
                Lecture des libellés Gmail rattachés aux dossiers, et accès aux pièces Drive.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-8 w-28 animate-pulse rounded-[var(--venator-radius-btn)] bg-venator-surface-2" />
          ) : connexion ? (
            <Button
              type="button"
              variant="outline"
              onClick={deconnecter}
              disabled={pending}
              className={cn(venatorButtonNeutral, 'h-8 shrink-0 gap-1.5 px-3')}
            >
              <Unplug className="h-3.5 w-3.5" />
              Déconnecter
            </Button>
          ) : (
            // Lien plutôt que fetch : le flux OAuth est une navigation, pas un appel.
            <a href="/api/venator/google/connect" className="shrink-0">
              <span
                className={cn(
                  venatorButtonPrimary,
                  'inline-flex h-8 items-center gap-1.5 px-3.5'
                )}
              >
                Connecter
              </span>
            </a>
          )}
        </div>

        {connexion && (
          <dl className="flex flex-col gap-2 border-t border-venator-border pt-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-venator-accent" />
              <dt className={venatorMicroLabel}>Compte</dt>
              <dd className="text-[13px] text-venator-fg">{connexion.email}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className={cn(venatorMicroLabel, 'ml-[1.375rem]')}>Relié le</dt>
              <dd className="text-[13px] text-venator-fg-muted">{formatDate(connexion.connected_at)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className={cn(venatorMicroLabel, 'ml-[1.375rem]')}>Dernier jeton</dt>
              <dd className="text-[13px] text-venator-fg-muted">{formatDate(connexion.last_refresh_at)}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Sans compte relié, le rattachement échouerait à la première requête Drive. */}
      {connexion && <RattacherCoprosCard />}

      <p className="max-w-2xl text-[12px] text-venator-fg-faint">
        Venator ne demande que la lecture sur Gmail : aucun envoi, aucune modification de libellé.
        L&apos;accès Drive est en lecture et écriture, pour lister les pièces d&apos;un dossier et en
        déposer.
      </p>
    </div>
  )
}

export default function ReglagesConnexionsPage() {
  // useSearchParams impose une frontière Suspense (Next 14 App Router).
  return (
    <Suspense fallback={<div className="text-sm text-venator-fg-muted">Chargement…</div>}>
      <ConnexionsContenu />
    </Suspense>
  )
}
