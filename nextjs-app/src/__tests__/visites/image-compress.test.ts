// Tests du calcul de redimensionnement pour la compression avant upload.
// (La compression canvas elle-même est testée en navigateur ; ici on verrouille
// la logique pure des dimensions, qui détermine le ratio et le plafond.)

import { describe, it, expect } from 'vitest'
import { computeResizeDimensions } from '@/lib/visites/image-compress'

describe('computeResizeDimensions', () => {
  it('ne touche pas une image déjà sous le plafond', () => {
    expect(computeResizeDimensions(1200, 900, 2048)).toEqual({
      width: 1200,
      height: 900,
      scaled: false,
    })
  })

  it('réduit une photo paysage en respectant le ratio (grand côté = plafond)', () => {
    // 4032x3024 (4:3) plafonné à 2048 sur le grand côté
    const r = computeResizeDimensions(4032, 3024, 2048)
    expect(r.scaled).toBe(true)
    expect(r.width).toBe(2048)
    expect(r.height).toBe(1536) // 3024 * 2048/4032
  })

  it('réduit une photo portrait en respectant le ratio (grand côté = plafond)', () => {
    const r = computeResizeDimensions(3024, 4032, 2048)
    expect(r.scaled).toBe(true)
    expect(r.height).toBe(2048)
    expect(r.width).toBe(1536)
  })

  it('gère le carré pile au plafond', () => {
    expect(computeResizeDimensions(2048, 2048, 2048)).toEqual({
      width: 2048,
      height: 2048,
      scaled: false,
    })
  })
})
