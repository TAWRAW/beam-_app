'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  buildVenatorSearch,
  parseVenatorNav,
  type VenatorNavState,
  type VenatorVue,
} from '@/lib/venator/nav-state'

/**
 * État de navigation Venator (copro, type, vue) piloté par l'URL — partageable,
 * rechargeable. Wrapper client autour de la logique pure de nav-state.ts.
 */
/** Écran de liste du module — cible des rails de navigation. */
const VENATOR_DASHBOARD = '/apps/venator'

export function useVenatorNavState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const nav = useMemo(() => parseVenatorNav(searchParams), [searchParams])

  const patch = useCallback(
    (next: Partial<VenatorNavState>, { toDashboard = false } = {}) => {
      const base = toDashboard ? VENATOR_DASHBOARD : pathname
      router.push(`${base}${buildVenatorSearch(nav, next)}` as any, { scroll: false })
    },
    [router, pathname, nav]
  )

  // Les rails copro/type sont la navigation globale du module : depuis une fiche
  // dossier, les y appliquer sur place n'aurait aucun effet visible (la fiche
  // n'est pas une liste filtrable) — on ramène donc à l'écran de liste.
  const setCoproId = useCallback((coproId: string) => patch({ coproId }, { toDashboard: true }), [patch])
  const setType = useCallback((type: string) => patch({ type }, { toDashboard: true }), [patch])
  // La bascule Liste/Board n'existe que sur l'écran de liste : pathname suffit.
  const setVue = useCallback((vue: VenatorVue) => patch({ vue }), [patch])

  return { nav, setCoproId, setType, setVue }
}
