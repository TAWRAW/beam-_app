import { describe, it, expect } from 'vitest'
import { resumerChangements } from '../dossier-diff'

const AVANT = { titre: 'Fuite chaufferie', type: 'sinistre' as const, priorite: 2 }

describe('dossier-diff', () => {
  it('ne journalise rien quand rien ne change', () => {
    // Rouvrir le formulaire et valider sans rien toucher ne doit pas laisser de
    // trace : le journal deviendrait illisible.
    expect(resumerChangements(AVANT, {})).toBeNull()
    expect(resumerChangements(AVANT, { titre: 'Fuite chaufferie', priorite: 2 })).toBeNull()
  })

  it('décrit un changement de titre avec l’ancienne valeur', () => {
    expect(resumerChangements(AVANT, { titre: 'Fuite chaufferie bât. B' })).toBe(
      'Dossier modifié : titre « Fuite chaufferie » → « Fuite chaufferie bât. B »'
    )
  })

  it('traduit type et priorité en langage lisible', () => {
    // Le journal se lit des mois plus tard : « priorité 2 → 1 » n'y dirait rien.
    expect(resumerChangements(AVANT, { type: 'travaux', priorite: 1 })).toBe(
      'Dossier modifié : type Sinistre → Travaux, priorité normal → urgent'
    )
  })

  it('cumule les changements en une seule entrée', () => {
    const r = resumerChangements(AVANT, { titre: 'Toiture', type: 'travaux', priorite: 3 })
    expect(r).toContain('titre')
    expect(r).toContain('type Sinistre → Travaux')
    expect(r).toContain('priorité normal → bas')
  })
})
