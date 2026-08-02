import { describe, it, expect } from 'vitest'
import { construireArbre, dernierSegment, filtrerLabels } from '../google/labels'

// Extrait réel de la boîte du cabinet (structure copro → catégorie → sujet).
const BRUTS = [
  { id: 'l1', name: "20 rue d'Albuféra 27200 Vernon" },
  { id: 'l2', name: "20 rue d'Albuféra 27200 Vernon/Travaux" },
  { id: 'l3', name: "20 rue d'Albuféra 27200 Vernon/Travaux/Toiture" },
  { id: 'l4', name: "20 rue d'Albuféra 27200 Vernon/Travaux/PPPT" },
  { id: 'l5', name: "20 rue d'Albuféra 27200 Vernon/Sinistre" },
  { id: 'l6', name: '75 rue d’Albufera - 27200 Vernon/Travaux/Toiture' },
  { id: 'sys', name: 'INBOX', type: 'system' },
  { id: 'sys2', name: 'CATEGORY_PROMOTIONS', type: 'system' },
]

describe('google/labels', () => {
  it('écarte les libellés système', () => {
    const noms = construireArbre(BRUTS).map((l) => l.chemin)
    expect(noms).not.toContain('INBOX')
    expect(noms).not.toContain('CATEGORY_PROMOTIONS')
    expect(noms).toHaveLength(6)
  })

  it("n'affiche que le dernier segment, mais conserve le chemin complet", () => {
    const arbre = construireArbre(BRUTS)
    const toiture = arbre.find((l) => l.id === 'l3')!
    expect(toiture.feuille).toBe('Toiture')
    // Le chemin reste indispensable : « Toiture » existe sous deux copropriétés.
    expect(toiture.chemin).toBe("20 rue d'Albuféra 27200 Vernon/Travaux/Toiture")
    expect(toiture.niveau).toBe(2)
  })

  it('distingue les branches des feuilles', () => {
    const arbre = construireArbre(BRUTS)
    const par = (id: string) => arbre.find((l) => l.id === id)!
    // « Travaux » porte des enfants : ce n'est pas une feuille.
    expect(par('l2').estFeuille).toBe(false)
    expect(par('l1').estFeuille).toBe(false)
    // « Sinistre » et « Toiture » n'en ont pas : rattachables à un dossier.
    expect(par('l5').estFeuille).toBe(true)
    expect(par('l3').estFeuille).toBe(true)
  })

  it('deux « Toiture » de copros différentes restent distincts', () => {
    const toitures = construireArbre(BRUTS).filter((l) => l.feuille === 'Toiture')
    expect(toitures).toHaveLength(2)
    expect(new Set(toitures.map((l) => l.id)).size).toBe(2)
  })

  it('la recherche porte sur le chemin entier, pas sur la seule feuille', () => {
    const arbre = construireArbre(BRUTS)
    // « Albuféra » n'apparaît que dans le segment racine.
    expect(filtrerLabels(arbre, 'Albuféra').length).toBeGreaterThan(1)
    expect(filtrerLabels(arbre, 'toiture').map((l) => l.feuille)).toEqual(['Toiture', 'Toiture'])
    expect(filtrerLabels(arbre, '')).toHaveLength(arbre.length)
  })

  it('la recherche ignore les accents', () => {
    const arbre = construireArbre(BRUTS)
    // Cas réel : le cabinet a « 20 rue d'Albuféra » ET « 75 rue d’Albufera ».
    // Sans normalisation, taper « albufera » n'en remontait qu'une des deux.
    const sansAccent = filtrerLabels(arbre, 'albufera')
    expect(sansAccent.some((l) => l.chemin.includes('Albuféra'))).toBe(true)
    expect(sansAccent.some((l) => l.chemin.includes('Albufera'))).toBe(true)
    // Et dans l'autre sens : la requête accentuée trouve la version sans accent.
    expect(filtrerLabels(arbre, 'ALBUFÉRA').length).toBe(sansAccent.length)
  })

  it('dernierSegment gère un libellé sans imbrication', () => {
    expect(dernierSegment('Sinistre')).toBe('Sinistre')
    expect(dernierSegment('a/b/c')).toBe('c')
  })
})
