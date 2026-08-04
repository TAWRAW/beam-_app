'use client'

import { useMemo } from 'react'
import { useDossiers } from '@/lib/venator/useVenator'
import { VOTE_STATUTS_PROCHAINE_AG } from '@/lib/venator/types'
import type { Dossier, DossierType } from '@/lib/venator/types'

/**
 * Dossiers filtrés par copropriété SEULEMENT (jamais par type) + compteurs par
 * type dérivés en mémoire. Point d'entrée partagé par TypeNavPanel/VenatorMobileNav
 * (besoin des compteurs) ET par page.tsx (besoin de la liste, filtrée ensuite
 * côté client par nav.type) — un seul appel réseau grâce au cache SWR partagé
 * (même clé `keys.dossiers(query)` que le hook interne utilise déjà).
 */
export function useDossierTypeCounts(coproId: string): {
  dossiers: Dossier[]
  counts: Partial<Record<DossierType, number>>
  total: number
  /** Dossiers inscrits à la prochaine assemblée — un filtre, pas un type. */
  prochaineAg: number
  isLoading: boolean
} {
  const query = coproId !== 'all' ? `copro_id=${coproId}` : ''
  const { data, isLoading } = useDossiers(query)
  const dossiers = data?.dossiers ?? []

  const counts = useMemo(() => {
    const map: Partial<Record<DossierType, number>> = {}
    for (const d of dossiers) map[d.type] = (map[d.type] ?? 0) + 1
    return map
  }, [dossiers])

  const prochaineAg = useMemo(
    () => dossiers.filter((d) => VOTE_STATUTS_PROCHAINE_AG.includes(d.vote_statut)).length,
    [dossiers]
  )

  return { dossiers, counts, total: dossiers.length, prochaineAg, isLoading }
}
