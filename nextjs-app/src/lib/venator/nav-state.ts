// src/lib/venator/nav-state.ts — état de navigation Venator (copro, type, vue).
// AUCUN import next/* : logique pure, testable en environnement node.
//
// Ce triplet piloté par l'URL (?copro=&type=&vue=) est la seule source de vérité
// qui unifie les 3 vues demandées : copro='all' + type='all' = vue globale,
// type choisi = vue par type, copro choisie = vue par copropriété.

export type VenatorVue = 'liste' | 'board'

export interface VenatorNavState {
  coproId: string
  type: string
  vue: VenatorVue
}

export const DEFAULT_VENATOR_NAV: VenatorNavState = {
  coproId: 'all',
  type: 'all',
  vue: 'liste',
}

export function parseVenatorNav(searchParams: URLSearchParams): VenatorNavState {
  const vueParam = searchParams.get('vue')
  return {
    coproId: searchParams.get('copro') ?? DEFAULT_VENATOR_NAV.coproId,
    type: searchParams.get('type') ?? DEFAULT_VENATOR_NAV.type,
    vue: vueParam === 'board' ? 'board' : DEFAULT_VENATOR_NAV.vue,
  }
}

/**
 * Fusionne `patch` dans `current` et sérialise en query string, en omettant
 * les valeurs par défaut pour garder des URLs propres (`/apps/venator` plutôt
 * que `/apps/venator?copro=all&type=all&vue=liste`).
 */
export function buildVenatorSearch(current: VenatorNavState, patch: Partial<VenatorNavState>): string {
  const next: VenatorNavState = { ...current, ...patch }
  const params = new URLSearchParams()
  if (next.coproId !== DEFAULT_VENATOR_NAV.coproId) params.set('copro', next.coproId)
  if (next.type !== DEFAULT_VENATOR_NAV.type) params.set('type', next.type)
  if (next.vue !== DEFAULT_VENATOR_NAV.vue) params.set('vue', next.vue)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}
