import { describe, it, expect } from 'vitest'
import { CHECKLIST_NOUVELLE_COPRO, instancierGabarit } from '../gabarits'

describe('gabarits', () => {
  it('instancie un gabarit avec ordres croissants et échéances calculées', () => {
    const etapes = instancierGabarit(
      [
        { titre: 'Déclaration assureur', echeanceOffsetJours: 5 },
        { titre: 'Mesures conservatoires' },
        { titre: 'Expertise', echeanceOffsetJours: 30 },
      ],
      new Date('2026-07-16')
    )
    expect(etapes[0]).toEqual({ ordre: 1, titre: 'Déclaration assureur', echeance: '2026-07-21' })
    expect(etapes[1].echeance).toBeNull()
    expect(etapes[2].echeance).toBe('2026-08-15')
    expect(etapes.map((e) => e.ordre)).toEqual([1, 2, 3])
  })

  // Garde-fou du changement du 31/07/2026 : plus aucune étape imposée par le code.
  it('gabarit vide ⇒ aucune étape', () => {
    expect(instancierGabarit([], new Date('2026-07-16'))).toEqual([])
  })

  it('checklist nouvelle copro : 10 items, catégories non vides', () => {
    expect(CHECKLIST_NOUVELLE_COPRO).toHaveLength(10)
    for (const i of CHECKLIST_NOUVELLE_COPRO) expect(i.categorie.length).toBeGreaterThan(0)
  })
})
