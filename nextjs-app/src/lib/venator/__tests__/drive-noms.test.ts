import { describe, it, expect } from 'vitest'
import {
  memeNomDossier,
  nomDossierDepuisTitre,
  normaliserNomDossier,
  trouverDossierParNom,
  trouverDossierParReference,
} from '../google/drive-noms'

// Noms réellement présents dans le Drive du cabinet (espaces de fin comprises).
const SOUS_DOSSIERS = [
  { id: '1', nom: "Carnet d'entretien " },
  { id: '2', nom: 'Convocations AG ' },
  { id: '3', nom: 'Devis ' },
  { id: '4', nom: 'Diagnostics ' },
  { id: '5', nom: 'nouveau SYNDIC' },
  { id: '6', nom: 'PV AG ' },
]

describe('google/drive-noms', () => {
  it('apparie malgré les espaces de fin', () => {
    // Cas réel : les dossiers du cabinet s'appellent « Devis » avec une espace.
    // Sans normalisation, Venator créerait un doublon juste à côté.
    expect(trouverDossierParNom(SOUS_DOSSIERS, 'Devis')?.id).toBe('3')
    expect(trouverDossierParNom(SOUS_DOSSIERS, 'PV AG')?.id).toBe('6')
  })

  it('apparie malgré la casse', () => {
    expect(trouverDossierParNom(SOUS_DOSSIERS, 'Nouveau Syndic')?.id).toBe('5')
  })

  it('apparie malgré les accents', () => {
    expect(memeNomDossier('Procédure', 'PROCEDURE')).toBe(true)
    expect(memeNomDossier("Carnet d'entretien", "CARNET D'ENTRETIEN ")).toBe(true)
  })

  it('ne rapproche pas deux dossiers réellement différents', () => {
    expect(trouverDossierParNom(SOUS_DOSSIERS, 'Sinistre')).toBeUndefined()
    expect(memeNomDossier('Devis', 'Devis 2026')).toBe(false)
  })

  it('normalise les espaces multiples', () => {
    expect(normaliserNomDossier('  PV   AG  ')).toBe('pv ag')
  })

  it('rend un titre utilisable comme nom de dossier Drive', () => {
    // « / » désigne une séparation de chemin : le laisser créerait une
    // arborescence fantôme.
    expect(nomDossierDepuisTitre('Toiture / Étanchéité')).toBe('Toiture - Étanchéité')
    expect(nomDossierDepuisTitre('  202607 -  DDE  Bât E ')).toBe('202607 - DDE Bât E')
  })

  it('apparie une copropriété par sa référence Estale', () => {
    // Noms réels du Drive après le renommage du 02/08/2026.
    const copros = [
      { id: 'a', nom: '00001 — SDC SARAH — 25 rue Samson, 27200 Vernon' },
      { id: 'b', nom: '00010 — SDC 12 rue du Général Leclerc — 12 rue du Général Leclerc, 27950 Saint-Marcel' },
      { id: 'c', nom: '00013 — DOMAINE DU BUC (ASL) — Le Buc, 27950 Saint-Marcel' },
    ]
    expect(trouverDossierParReference(copros, '00001')?.id).toBe('a')
    expect(trouverDossierParReference(copros, '00013')?.id).toBe('c')
    // 00011 n'a pas de dossier Drive : ne rien inventer vaut mieux qu'un faux positif.
    expect(trouverDossierParReference(copros, '00011')).toBeUndefined()
  })

  it('exige un séparateur après la référence', () => {
    // Sans cette garde, « 0001 » rattraperait « 00010 » — et 00001 comme 00010
    // existent tous deux au portefeuille.
    const copros = [{ id: 'b', nom: '00010 — SDC 12 rue du Général Leclerc' }]
    expect(trouverDossierParReference(copros, '0001')).toBeUndefined()
    expect(trouverDossierParReference(copros, '00010')?.id).toBe('b')
    expect(trouverDossierParReference(copros, '')).toBeUndefined()
  })

  it('borne les titres trop longs', () => {
    // Certains titres font deux lignes et donneraient un nom illisible dans Drive.
    const long = 'A'.repeat(300)
    const nom = nomDossierDepuisTitre(long)
    expect(nom.length).toBeLessThanOrEqual(120)
    expect(nom.endsWith('…')).toBe(true)
  })
})
