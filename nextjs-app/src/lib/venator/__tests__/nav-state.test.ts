import { describe, it, expect } from 'vitest'
import { DEFAULT_VENATOR_NAV, buildVenatorSearch, parseVenatorNav } from '../nav-state'

describe('nav-state', () => {
  it('parseVenatorNav retombe sur les valeurs par défaut si aucun param', () => {
    expect(parseVenatorNav(new URLSearchParams(''))).toEqual(DEFAULT_VENATOR_NAV)
  })

  it('parseVenatorNav lit copro/type/vue', () => {
    const sp = new URLSearchParams('copro=abc-123&type=sinistre&vue=board')
    expect(parseVenatorNav(sp)).toEqual({ coproId: 'abc-123', type: 'sinistre', vue: 'board' })
  })

  it("parseVenatorNav ignore une valeur de vue invalide (retombe sur 'liste')", () => {
    const sp = new URLSearchParams('vue=n-importe-quoi')
    expect(parseVenatorNav(sp).vue).toBe('liste')
  })

  it('buildVenatorSearch omet les valeurs par défaut (URL propre)', () => {
    expect(buildVenatorSearch(DEFAULT_VENATOR_NAV, {})).toBe('')
    expect(buildVenatorSearch(DEFAULT_VENATOR_NAV, { coproId: 'all', type: 'all', vue: 'liste' })).toBe('')
  })

  it('buildVenatorSearch sérialise uniquement les valeurs non-défaut', () => {
    expect(buildVenatorSearch(DEFAULT_VENATOR_NAV, { coproId: 'xyz' })).toBe('?copro=xyz')
    expect(buildVenatorSearch(DEFAULT_VENATOR_NAV, { type: 'travaux' })).toBe('?type=travaux')
    expect(buildVenatorSearch(DEFAULT_VENATOR_NAV, { vue: 'board' })).toBe('?vue=board')
  })

  it('buildVenatorSearch round-trip avec parseVenatorNav', () => {
    const state = { coproId: 'xyz', type: 'travaux', vue: 'board' as const }
    const qs = buildVenatorSearch(DEFAULT_VENATOR_NAV, state)
    const roundTripped = parseVenatorNav(new URLSearchParams(qs.replace(/^\?/, '')))
    expect(roundTripped).toEqual(state)
  })

  it('buildVenatorSearch fusionne un patch partiel sur un état courant non-défaut', () => {
    const current = { coproId: 'xyz', type: 'all', vue: 'liste' as const }
    expect(buildVenatorSearch(current, { type: 'sinistre' })).toBe('?copro=xyz&type=sinistre')
  })
})
