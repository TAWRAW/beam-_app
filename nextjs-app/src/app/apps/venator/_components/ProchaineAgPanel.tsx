'use client'

import Link from 'next/link'
import { useDossiers } from '@/lib/venator/useVenator'
import { VOTE_STATUT_LABELS, type Dossier } from '@/lib/venator/types'
import { cn } from '@/lib/utils'
import { venatorMicroLabel } from './venator-ui-classes'

/**
 * Les sujets qui attendent un vote dans cette copropriété.
 *
 * Ce n'est pas une liste tenue à la main : elle se remplit quand on marque un
 * dossier « à voter » et se vide d'elle-même après l'assemblée, chacun passant
 * à voté ou refusé. Un dossier reporté y reste — il repart dans l'assemblée
 * suivante sans que personne ait à l'y remettre.
 */
export default function ProchaineAgPanel({ coproId }: { coproId: string }) {
  const { data, isLoading } = useDossiers(`copro_id=${coproId}&prochaine_ag=1`)

  if (isLoading) {
    return <div className="h-16 rounded-[var(--venator-radius-lg)] bg-venator-surface-2 animate-pulse" />
  }

  const liste: Dossier[] = data?.dossiers ?? []

  return (
    <div className="rounded-[var(--venator-radius-lg)] bg-venator-surface-2 px-4 py-3.5">
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className={venatorMicroLabel}>Prochaine AG</span>
        {liste.length > 0 && (
          <span className="text-[12px] font-medium tabular-nums text-venator-fg-muted">
            {liste.length} {liste.length > 1 ? 'sujets' : 'sujet'}
          </span>
        )}
      </div>

      {liste.length === 0 ? (
        <p className="text-[13px] text-venator-fg-muted">
          Aucun sujet à voter. Marquez un dossier « À voter » pour l’inscrire ici.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {liste.map((d) => (
            <li key={d.id}>
              <Link
                href={`/apps/venator/dossiers/${d.id}`}
                className="flex items-center gap-2 rounded-[var(--venator-radius-btn)] px-2 py-1.5 text-[13px] text-venator-fg transition-colors hover:bg-venator-surface-hover"
              >
                <span className="min-w-0 flex-1 truncate">{d.titre}</span>
                {/* Seul le report se signale : « à voter » est l'état attendu ici,
                    le rappeler sur chaque ligne n'apprendrait rien. */}
                {d.vote_statut === 'reporte' && (
                  <span className={cn(venatorMicroLabel, 'shrink-0')}>
                    {VOTE_STATUT_LABELS.reporte}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
