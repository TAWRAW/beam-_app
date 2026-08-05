import { describe, it, expect } from 'vitest'
import { DOSSIER_TYPES, TICKET_TYPES, DOSSIER_TYPE_LABELS, TICKET_TYPE_LABELS, CADENCE_PROFIL_LABELS, EQUIPEMENT_CATEGORIE_SUGGESTIONS } from '../labels'
import { CADENCE_PROFILS } from '../types'

describe('labels', () => {
  it("DOSSIER_TYPE_LABELS couvre exactement les 10 DOSSIER_TYPES, y compris 'autre'", () => {
    for (const t of DOSSIER_TYPES) {
      expect(DOSSIER_TYPE_LABELS[t]).toBeTruthy()
    }
    expect(Object.keys(DOSSIER_TYPE_LABELS).sort()).toEqual([...DOSSIER_TYPES].sort())
    expect(DOSSIER_TYPE_LABELS.autre).toBe('Autre')
  })

  it('TICKET_TYPE_LABELS couvre exactement les 3 TICKET_TYPES', () => {
    for (const t of TICKET_TYPES) {
      expect(TICKET_TYPE_LABELS[t]).toBeTruthy()
    }
    expect(Object.keys(TICKET_TYPE_LABELS).sort()).toEqual([...TICKET_TYPES].sort())
  })

  it('les deux Records restent disjoints (pas de mélange dossier/ticket)', () => {
    const dossierKeys = new Set(Object.keys(DOSSIER_TYPE_LABELS))
    const ticketKeys = new Set(Object.keys(TICKET_TYPE_LABELS))
    for (const k of ticketKeys) expect(dossierKeys.has(k)).toBe(false)
  })

  it('CADENCE_PROFIL_LABELS couvre exactement les 2 CADENCE_PROFILS', () => {
    expect(Object.keys(CADENCE_PROFIL_LABELS).sort()).toEqual([...CADENCE_PROFILS].sort())
  })

  // categorie est du texte libre (plus de liste fermée) : seule garantie utile,
  // les suggestions ne sont pas vides.
  it('EQUIPEMENT_CATEGORIE_SUGGESTIONS propose au moins quelques valeurs', () => {
    expect(EQUIPEMENT_CATEGORIE_SUGGESTIONS.length).toBeGreaterThan(0)
  })
})
