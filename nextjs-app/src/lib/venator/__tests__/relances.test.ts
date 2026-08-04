import { describe, it, expect } from 'vitest'
import { DEFAULT_CADENCES, calculerRetard, profilPourPriorite } from '../relances'

describe('relances', () => {
  it("priorite 1 ⇒ profil urgent, priorite 2 ou 3 ⇒ profil normal", () => {
    expect(profilPourPriorite(1)).toBe('urgent')
    expect(profilPourPriorite(2)).toBe('normal')
    expect(profilPourPriorite(3)).toBe('normal')
  })

  it('pas d’échéance ⇒ null (rien à calculer)', () => {
    const retard = calculerRetard({ echeance: null, priorite: 1 }, DEFAULT_CADENCES, new Date('2026-08-06T10:00:00'))
    expect(retard).toBeNull()
  })

  it('échéance dans 3 jours, priorite urgente (seuils 48/24/12h) ⇒ aucun seuil franchi', () => {
    const retard = calculerRetard(
      { echeance: '2026-08-09', priorite: 1 },
      DEFAULT_CADENCES,
      new Date('2026-08-06T00:00:00')
    )
    expect(retard).not.toBeNull()
    expect(retard!.enRetard).toBe(false)
    expect(retard!.seuilFranchiHeures).toBeNull()
  })

  it('échéance dans 30h, priorite urgente ⇒ seuil de 48h franchi (le plus proche retenu)', () => {
    const retard = calculerRetard(
      { echeance: '2026-08-08', priorite: 1 },
      DEFAULT_CADENCES,
      new Date('2026-08-06T18:00:00')
    )
    expect(retard!.enRetard).toBe(false)
    expect(retard!.seuilFranchiHeures).toBe(48)
  })

  it('échéance dans 10h, priorite urgente ⇒ le seuil le plus serré franchi (12h) est retenu', () => {
    const retard = calculerRetard(
      { echeance: '2026-08-06', priorite: 1 },
      DEFAULT_CADENCES,
      new Date('2026-08-05T14:00:00')
    )
    expect(retard!.seuilFranchiHeures).toBe(12)
  })

  it('échéance dépassée ⇒ enRetard = true', () => {
    const retard = calculerRetard(
      { echeance: '2026-08-01', priorite: 2 },
      DEFAULT_CADENCES,
      new Date('2026-08-06T10:00:00')
    )
    expect(retard!.enRetard).toBe(true)
    expect(retard!.heuresAvantEcheance).toBeLessThan(0)
  })

  it('priorite normale (2 ou 3) ⇒ seuil unique à 96h', () => {
    const loin = calculerRetard({ echeance: '2026-08-11', priorite: 3 }, DEFAULT_CADENCES, new Date('2026-08-06T00:00:00'))
    expect(loin!.seuilFranchiHeures).toBeNull()

    const proche = calculerRetard({ echeance: '2026-08-09', priorite: 2 }, DEFAULT_CADENCES, new Date('2026-08-06T00:00:00'))
    expect(proche!.seuilFranchiHeures).toBe(96)
  })
})
