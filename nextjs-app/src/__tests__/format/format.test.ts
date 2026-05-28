import { describe, it, expect } from 'vitest'
import {
  formatEur,
  formatEurDuoFromHT,
  formatEurDuoFromTTC,
  TVA_STANDARD,
} from '@/lib/format/currency'
import { arrondi2, arrondi4, arrondi2Sum } from '@/lib/format/round'

describe('format/currency', () => {
  it('formatEur formate en EUR fr-FR avec 2 décimales', () => {
    expect(formatEur(216)).toBe('216,00 €')
    expect(formatEur(180.5)).toBe('180,50 €')
    expect(formatEur(0)).toBe('0,00 €')
  })

  it('formatEur retourne "—" pour null/undefined', () => {
    expect(formatEur(null)).toBe('—')
    expect(formatEur(undefined)).toBe('—')
  })

  it('formatEurDuoFromHT calcule TTC depuis HT', () => {
    expect(formatEurDuoFromHT(180)).toBe('180,00 € HT soit 216,00 € TTC')
    expect(formatEurDuoFromHT(250)).toBe('250,00 € HT soit 300,00 € TTC')
  })

  it('formatEurDuoFromTTC calcule HT depuis TTC', () => {
    expect(formatEurDuoFromTTC(216)).toBe('180,00 € HT soit 216,00 € TTC')
    expect(formatEurDuoFromTTC(300)).toBe('250,00 € HT soit 300,00 € TTC')
  })

  it('TVA_STANDARD vaut 20', () => {
    expect(TVA_STANDARD).toBe(20)
  })
})

describe('format/round', () => {
  it('arrondi2 arrondit à 2 décimales', () => {
    expect(arrondi2(216.666)).toBe(216.67)
    expect(arrondi2(180.124)).toBe(180.12)
    expect(arrondi2(180)).toBe(180)
    // Cas TVA réaliste : 216 / 1.2 = 180 exact
    expect(arrondi2(216 / 1.2)).toBe(180)
    // 300 / 1.2 = 250 exact
    expect(arrondi2(300 / 1.2)).toBe(250)
  })

  it('arrondi4 arrondit à 4 décimales', () => {
    expect(arrondi4(216.66666)).toBe(216.6667)
    expect(arrondi4(180.12345)).toBe(180.1235)
  })

  it('arrondi2Sum somme et arrondit à 2 décimales', () => {
    expect(arrondi2Sum([])).toBe(0)
    expect(arrondi2Sum([180, 36])).toBe(216)
    expect(arrondi2Sum([100.1, 100.2, 100.3])).toBe(300.6)
  })
})
