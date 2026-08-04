'use client'

import Link from 'next/link'
import { useCadences, useDossiers } from '@/lib/venator/useVenator'
import { calculerRetard, DEFAULT_CADENCES } from '@/lib/venator/relances'
import type { Dossier } from '@/lib/venator/types'
import { cn } from '@/lib/utils'
import { venatorMicroLabel } from './venator-ui-classes'

/**
 * Les dossiers « entretien » ouverts avec une échéance, triés du plus urgent au
 * moins urgent — calculé à l'affichage, comme le badge de retard des étapes.
 * Aucune notification poussée : la pression vient d'ouvrir le dashboard, pas
 * d'un email ou d'un cron.
 */
export default function SuiviEntretienPanel({ coproId }: { coproId: string }) {
  const { data, isLoading } = useDossiers(`copro_id=${coproId}&type=entretien`)
  const { data: cadencesData } = useCadences()
  const cadences = cadencesData?.cadences ?? DEFAULT_CADENCES

  if (isLoading) {
    return <div className="h-16 rounded-[var(--venator-radius-lg)] bg-venator-surface-2 animate-pulse" />
  }

  const now = new Date()
  const suivi = (data?.dossiers ?? [])
    .filter((d) => d.statut !== 'clos' && d.echeance != null)
    .map((d) => ({ dossier: d, retard: calculerRetard({ echeance: d.echeance, priorite: d.priorite }, cadences, now) }))
    .filter((s): s is { dossier: Dossier; retard: NonNullable<ReturnType<typeof calculerRetard>> } => s.retard != null)
    .sort((a, b) => a.retard.heuresAvantEcheance - b.retard.heuresAvantEcheance)

  return (
    <div className="rounded-[var(--venator-radius-lg)] bg-venator-surface-2 px-4 py-3.5">
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className={venatorMicroLabel}>Suivi Entretien</span>
        {suivi.length > 0 && (
          <span className="text-[12px] font-medium tabular-nums text-venator-fg-muted">
            {suivi.length} {suivi.length > 1 ? 'dossiers' : 'dossier'}
          </span>
        )}
      </div>

      {suivi.length === 0 ? (
        <p className="text-[13px] text-venator-fg-muted">
          Aucun entretien avec échéance en cours de suivi.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {suivi.map(({ dossier, retard }) => (
            <li key={dossier.id}>
              <Link
                href={`/apps/venator/dossiers/${dossier.id}`}
                className="flex items-center gap-2 rounded-[var(--venator-radius-btn)] px-2 py-1.5 text-[13px] text-venator-fg transition-colors hover:bg-venator-surface-hover"
              >
                <span className="min-w-0 flex-1 truncate">{dossier.titre}</span>
                {/* L'urgence s'écrit, jamais en couleur seule (convention Venator). */}
                {retard.enRetard ? (
                  <span className={cn(venatorMicroLabel, 'shrink-0 text-venator-danger')}>· En retard</span>
                ) : retard.seuilFranchiHeures != null ? (
                  <span className={cn(venatorMicroLabel, 'shrink-0 text-venator-accent')}>· Alerte</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
