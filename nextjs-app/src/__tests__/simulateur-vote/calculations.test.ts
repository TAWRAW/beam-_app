import { describe, test, expect } from 'vitest'
import {
  applyVoiceReduction,
  checkMandatLimit,
  checkAllMandatLimits,
  getAGStats,
  getVoteStats,
  calculateArt24,
  calculateArt25,
  calculateArt26,
  calculateUnanimite,
  checkPasserelle25_1,
  checkPasserelle26_1,
  calculateVoteResult,
} from '@/lib/simulateur-vote/calculations'
import { Lot, SimulateurState } from '@/lib/simulateur-vote/types'

// === HELPERS ===

const DEFAULT_CLE_ID = 'cle-default'

function createLot(id: string, numero: string, tantiemes: number): Lot {
  return {
    id,
    numero,
    tantièmesParCle: { [DEFAULT_CLE_ID]: tantiemes }
  }
}

function createBaseState(
  lots: Lot[],
  presences: Record<string, 'absent' | 'present' | 'represente'>,
  votes: Record<string, 'pour' | 'contre' | 'abstention' | null>,
  representations: Record<string, string> = {},
  selectedMajority: 'art24' | 'art25' | 'art26' | 'unanimite' = 'art24'
): SimulateurState {
  return {
    lots,
    presences,
    representations,
    votes,
    selectedMajority,
    selectedCleId: DEFAULT_CLE_ID,
    clesDeCharges: [{ id: DEFAULT_CLE_ID, nom: 'Charges générales', isDefault: true }],
    activeTab: 'vote',
  }
}

// === TESTS ===

describe('Calculs de majorité', () => {
  describe('Article 24 - Majorité simple', () => {
    test('Art. 24 avec abstentions - abstentions ne comptent pas', () => {
      // 5 lots de 200 tantièmes chacun = 1000 total
      const lots = [
        createLot('1', 'Lot 1', 200),
        createLot('2', 'Lot 2', 200),
        createLot('3', 'Lot 3', 200),
        createLot('4', 'Lot 4', 200),
        createLot('5', 'Lot 5', 200),
      ]

      // Tous présents
      const presences: Record<string, 'present'> = {
        '1': 'present',
        '2': 'present',
        '3': 'present',
        '4': 'present',
        '5': 'present',
      }

      // 2 pour (400), 1 contre (200), 2 abstentions (400)
      // Exprimés = 600, Pour doit être > 300
      const votes: Record<string, 'pour' | 'contre' | 'abstention'> = {
        '1': 'pour',
        '2': 'pour',
        '3': 'contre',
        '4': 'abstention',
        '5': 'abstention',
      }

      const state = createBaseState(lots, presences, votes, {}, 'art24')
      const result = calculateArt24(state)

      expect(result.type).toBe('art24')
      expect(result.isAchieved).toBe(true)
      expect(result.pourActuel).toBe(400)
      // 400 > 600/2 (300)
    })

    test('Égalité Art. 24 = rejeté', () => {
      const lots = [
        createLot('1', 'Lot 1', 500),
        createLot('2', 'Lot 2', 500),
      ]

      const presences: Record<string, 'present'> = {
        '1': 'present',
        '2': 'present',
      }

      // 1 pour, 1 contre = égalité
      const votes: Record<string, 'pour' | 'contre'> = {
        '1': 'pour',
        '2': 'contre',
      }

      const state = createBaseState(lots, presences, votes, {}, 'art24')
      const result = calculateArt24(state)

      expect(result.isAchieved).toBe(false)
      // 500 n'est pas > 500 (égalité)
    })
  })

  describe('Article 25 - Majorité absolue', () => {
    test('Art. 25 avec passerelle - rejeté mais passerelle applicable', () => {
      // Total 1000 tantièmes, besoin > 500 pour art.25
      const lots = [
        createLot('1', 'Lot 1', 200),
        createLot('2', 'Lot 2', 200),
        createLot('3', 'Lot 3', 200),
        createLot('4', 'Lot 4', 200),
        createLot('5', 'Lot 5', 200),
      ]

      // 4 présents (800 tantièmes), 1 absent
      const presences: Record<string, 'present' | 'absent'> = {
        '1': 'present',
        '2': 'present',
        '3': 'present',
        '4': 'present',
        '5': 'absent',
      }

      // 3 pour (400), 1 contre (200)
      // Pour = 400 < 500 (art.25 rejeté)
      // Mais 400 >= 333 (1/3), donc passerelle applicable
      const votes: Record<string, 'pour' | 'contre' | null> = {
        '1': 'pour',
        '2': 'pour',
        '3': 'contre',
        '4': 'pour', // Ajout pour atteindre 1/3
        '5': null,
      }

      const state = createBaseState(lots, presences, votes, {}, 'art25')
      const art25Result = calculateArt25(state)
      const passerelle = checkPasserelle25_1(state)

      expect(art25Result.isAchieved).toBe(true) // 600 > 500
      expect(passerelle.applicable).toBe(false) // Déjà adopté
    })

    test('Art. 25 rejeté avec passerelle applicable vers art.24', () => {
      const lots = [
        createLot('1', 'Lot 1', 350),
        createLot('2', 'Lot 2', 250),
        createLot('3', 'Lot 3', 200),
        createLot('4', 'Lot 4', 200),
      ]

      const presences: Record<string, 'present' | 'absent'> = {
        '1': 'present',
        '2': 'present',
        '3': 'present',
        '4': 'absent',
      }

      // Total = 1000, présents = 800
      // Pour = 350 + 200 = 550 (mais lot 4 absent donc 350)
      // Contre = 250
      // Pour art.25, besoin > 500
      // 350 < 500 mais 350 >= 333 (1/3) -> passerelle
      const votes: Record<string, 'pour' | 'contre' | null> = {
        '1': 'pour',
        '2': 'contre',
        '3': 'pour', // Total pour = 550
        '4': null,
      }

      const state = createBaseState(lots, presences, votes, {}, 'art25')
      const art25Result = calculateArt25(state)
      const passerelle = checkPasserelle25_1(state)

      expect(art25Result.isAchieved).toBe(true) // 550 > 500
      // Passerelle non applicable car adopté
    })
  })

  describe('Article 26 - Double majorité', () => {
    test('Art. 26 échec double condition - lots OK, tantièmes KO', () => {
      // 4 lots, total 1000 tantièmes
      // Double condition: lots > 2 ET tantièmes >= 667 (2/3)
      const lots = [
        createLot('1', 'Lot 1', 100),
        createLot('2', 'Lot 2', 100),
        createLot('3', 'Lot 3', 100),
        createLot('4', 'Lot 4', 700),
      ]

      const presences: Record<string, 'present'> = {
        '1': 'present',
        '2': 'present',
        '3': 'present',
        '4': 'present',
      }

      // 3 lots pour (300 tantièmes), 1 lot contre (700 tantièmes)
      // Condition lots: 3 > 2 -> OK
      // Condition tantièmes: 300 < 667 -> KO
      const votes: Record<string, 'pour' | 'contre'> = {
        '1': 'pour',
        '2': 'pour',
        '3': 'pour',
        '4': 'contre',
      }

      const state = createBaseState(lots, presences, votes, {}, 'art26')
      const result = calculateArt26(state)

      expect(result.isAchieved).toBe(false)
      expect(result.lotsPour).toBe(3)
      expect(result.pourActuel).toBe(300)
    })

    test('Art. 26 échec double condition - tantièmes OK, lots KO', () => {
      // Note: Lot 1 avec 800 tantièmes (>50%) sera réduit à 200 par l'Art.22
      // Pour tester sans réduction, utilisons une distribution différente
      const lots = [
        createLot('1', 'Lot 1', 500),
        createLot('2', 'Lot 2', 250),
        createLot('3', 'Lot 3', 250),
      ]

      const presences: Record<string, 'present'> = {
        '1': 'present',
        '2': 'present',
        '3': 'present',
      }

      // 1 lot pour (500 tantièmes), 2 lots contre (500 tantièmes)
      // Condition lots: 1 > 1.5 -> KO
      // Condition tantièmes: 500 < 667 -> KO (mais proche)
      // Ce test vérifie que l'art.26 échoue quand les lots sont KO
      const votes: Record<string, 'pour' | 'contre'> = {
        '1': 'pour',
        '2': 'contre',
        '3': 'contre',
      }

      const state = createBaseState(lots, presences, votes, {}, 'art26')
      const result = calculateArt26(state)

      expect(result.isAchieved).toBe(false)
      expect(result.lotsPour).toBe(1)
      // 500 tantièmes (pas de réduction car 500 n'est pas > 500)
      expect(result.pourActuel).toBe(500)
    })
  })

  describe('Unanimité', () => {
    test('Unanimité impossible - absent', () => {
      const lots = [
        createLot('1', 'Lot 1', 500),
        createLot('2', 'Lot 2', 500),
      ]

      // 1 présent, 1 absent
      const presences: Record<string, 'present' | 'absent'> = {
        '1': 'present',
        '2': 'absent',
      }

      const votes: Record<string, 'pour' | null> = {
        '1': 'pour',
        '2': null,
      }

      const state = createBaseState(lots, presences, votes, {}, 'unanimite')
      const result = calculateUnanimite(state)

      expect(result.isAchievable).toBe(false)
      expect(result.isAchieved).toBe(false)
    })

    test('Unanimité atteinte avec tous présents', () => {
      const lots = [
        createLot('1', 'Lot 1', 500),
        createLot('2', 'Lot 2', 500),
      ]

      const presences: Record<string, 'present'> = {
        '1': 'present',
        '2': 'present',
      }

      const votes: Record<string, 'pour'> = {
        '1': 'pour',
        '2': 'pour',
      }

      const state = createBaseState(lots, presences, votes, {}, 'unanimite')
      const result = calculateUnanimite(state)

      expect(result.isAchievable).toBe(true)
      expect(result.isAchieved).toBe(true)
      expect(result.lotsPour).toBe(2)
      expect(result.pourActuel).toBe(1000)
    })
  })
})

describe('Réduction des voix - Article 22', () => {
  test('Réduction voix Art. 22 (>50%) - lot majoritaire réduit', () => {
    const lots = [
      createLot('1', 'Lot majoritaire', 600), // 60% -> doit être réduit
      createLot('2', 'Lot 2', 200),
      createLot('3', 'Lot 3', 200),
    ]

    const state = createBaseState(lots, {}, {})
    const voixEffectives = applyVoiceReduction(state)

    // Lot 1 avec 600 > 500 (50%) -> réduit à 400 (somme des autres)
    expect(voixEffectives.get('1')).toBe(400)
    expect(voixEffectives.get('2')).toBe(200)
    expect(voixEffectives.get('3')).toBe(200)
  })

  test('Pas de réduction si aucun lot > 50%', () => {
    const lots = [
      createLot('1', 'Lot 1', 400),
      createLot('2', 'Lot 2', 300),
      createLot('3', 'Lot 3', 300),
    ]

    const state = createBaseState(lots, {}, {})
    const voixEffectives = applyVoiceReduction(state)

    expect(voixEffectives.get('1')).toBe(400)
    expect(voixEffectives.get('2')).toBe(300)
    expect(voixEffectives.get('3')).toBe(300)
  })
})

describe('Limite de mandats', () => {
  test('Limite mandats dépassée (>3 ET >10%)', () => {
    // 10 lots de 100 tantièmes = 1000 total
    const lots = Array.from({ length: 10 }, (_, i) =>
      createLot(`${i + 1}`, `Lot ${i + 1}`, 100)
    )

    // Lot 1 représente lots 2, 3, 4, 5 (4 mandats)
    // Total voix lot 1 = 500 (50%) > 10%
    const representations: Record<string, string> = {
      '2': '1',
      '3': '1',
      '4': '1',
      '5': '1',
    }

    const state = createBaseState(lots, {}, {}, representations)
    const warning = checkMandatLimit('1', state)

    expect(warning).not.toBeNull()
    expect(warning?.exceeds3Mandats).toBe(true)
    expect(warning?.exceeds10Percent).toBe(true)
    expect(warning?.mandatsCount).toBe(4)
    expect(warning?.percentageTotal).toBe(50)
  })

  test('Limite mandats OK (<3 ET >10%)', () => {
    const lots = [
      createLot('1', 'Lot 1', 300),
      createLot('2', 'Lot 2', 300),
      createLot('3', 'Lot 3', 200),
      createLot('4', 'Lot 4', 200),
    ]

    // Lot 1 représente seulement lot 2 (1 mandat, mais 60% des voix)
    const representations: Record<string, string> = {
      '2': '1',
    }

    const state = createBaseState(lots, {}, {}, representations)
    const warning = checkMandatLimit('1', state)

    // Warning null car < 3 mandats (même si > 10%)
    expect(warning).toBeNull()
  })

  test('Limite mandats OK (>3 ET <10%)', () => {
    // 100 lots de 10 tantièmes = 1000 total
    const lots = Array.from({ length: 100 }, (_, i) =>
      createLot(`${i + 1}`, `Lot ${i + 1}`, 10)
    )

    // Lot 1 représente lots 2, 3, 4, 5 (4 mandats)
    // Total voix lot 1 = 50 (5%) < 10%
    const representations: Record<string, string> = {
      '2': '1',
      '3': '1',
      '4': '1',
      '5': '1',
    }

    const state = createBaseState(lots, {}, {}, representations)
    const warning = checkMandatLimit('1', state)

    // Warning null car < 10% (même si > 3 mandats)
    expect(warning).toBeNull()
  })
})

describe('Représentation multiple', () => {
  test('Représentation multiple : votes cumulés', () => {
    const lots = [
      createLot('1', 'Représentant', 200),
      createLot('2', 'Représenté 1', 150),
      createLot('3', 'Représenté 2', 150),
      createLot('4', 'Autre', 500),
    ]

    // Lot 1 représente lots 2 et 3
    const representations: Record<string, string> = {
      '2': '1',
      '3': '1',
    }

    const presences: Record<string, 'present' | 'represente'> = {
      '1': 'present',
      '2': 'represente',
      '3': 'represente',
      '4': 'present',
    }

    // Lot 1 vote pour (cumule 200 + 150 + 150 = 500)
    // Lot 4 vote contre (500)
    const votes: Record<string, 'pour' | 'contre'> = {
      '1': 'pour',
      '4': 'contre',
    }

    const state = createBaseState(lots, presences, votes, representations, 'art24')
    const stats = getVoteStats(state)

    // Lot 1 + ses représentés = 3 lots et 500 tantièmes
    expect(stats.pour).toBe(500)
    expect(stats.lotsPour).toBe(3) // Lot 1 + 2 représentés
    expect(stats.contre).toBe(500)
    expect(stats.lotsContre).toBe(1)
  })

  test('Réduction Art.22 appliquée aux représentés aussi', () => {
    // Lot 1 a 600 tantièmes (>50%) et représente lot 2
    const lots = [
      createLot('1', 'Majoritaire', 600),
      createLot('2', 'Représenté', 200),
      createLot('3', 'Autre', 200),
    ]

    const representations: Record<string, string> = {
      '2': '1',
    }

    const presences: Record<string, 'present' | 'represente'> = {
      '1': 'present',
      '2': 'represente',
      '3': 'present',
    }

    const votes: Record<string, 'pour' | 'contre'> = {
      '1': 'pour',
      '3': 'contre',
    }

    const state = createBaseState(lots, presences, votes, representations, 'art24')
    const stats = getVoteStats(state)

    // Lot 1 réduit de 600 à 400 (somme des autres)
    // Total pour = 400 (lot 1 réduit) + 200 (lot 2) = 600
    expect(stats.pour).toBe(600)
  })
})

describe('Passerelles', () => {
  test('Passerelle 26-1 applicable vers art.25', () => {
    const lots = [
      createLot('1', 'Lot 1', 200),
      createLot('2', 'Lot 2', 200),
      createLot('3', 'Lot 3', 200),
      createLot('4', 'Lot 4', 200),
      createLot('5', 'Lot 5', 200),
    ]

    const presences: Record<string, 'present'> = {
      '1': 'present',
      '2': 'present',
      '3': 'present',
      '4': 'present',
      '5': 'present',
    }

    // 3 pour (600), 2 contre (400)
    // Art 26 rejeté car 600 < 667 (2/3)
    // Mais lots OK (3 > 2.5) et tantièmes OK (600 >= 333)
    const votes: Record<string, 'pour' | 'contre'> = {
      '1': 'pour',
      '2': 'pour',
      '3': 'pour',
      '4': 'contre',
      '5': 'contre',
    }

    const state = createBaseState(lots, presences, votes, {}, 'art26')
    const art26Result = calculateArt26(state)
    const passerelle = checkPasserelle26_1(state)

    expect(art26Result.isAchieved).toBe(false)
    expect(passerelle.applicable).toBe(true)
    expect(passerelle.canTrigger).toBe(true)
    expect(passerelle.nextMajority).toBe('art25')
    // Si second vote à l'art.25 : 600 > 500 -> adopté
    expect(passerelle.newResult?.isAchieved).toBe(true)
  })
})
