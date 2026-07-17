import { describe, it, expect } from 'vitest'
import { GABARITS, CHECKLIST_NOUVELLE_COPRO, instancierGabarit } from '../gabarits'
import { DOSSIER_TYPES } from '../types'

describe('gabarits', () => {
  it('couvre les 8 types de dossiers', () => {
    for (const t of DOSSIER_TYPES) expect(GABARITS[t].length).toBeGreaterThan(2)
    expect(GABARITS.autre.length).toBe(3)
  })
  it('instancie le gabarit sinistre avec ordres croissants et échéances calculées', () => {
    const etapes = instancierGabarit('sinistre', new Date('2026-07-16'))
    expect(etapes[0]).toEqual({ ordre: 1, titre: 'Déclaration assureur', echeance: '2026-07-21' })
    expect(etapes.map(e => e.ordre)).toEqual(etapes.map((_, i) => i + 1))
  })
  it('checklist nouvelle copro : 10 items, catégories non vides', () => {
    expect(CHECKLIST_NOUVELLE_COPRO).toHaveLength(10)
    for (const i of CHECKLIST_NOUVELLE_COPRO) expect(i.categorie.length).toBeGreaterThan(0)
  })
})
