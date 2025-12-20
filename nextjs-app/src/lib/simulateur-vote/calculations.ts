import {
  Lot,
  PresenceStatus,
  VoteChoice,
  MajorityType,
  MajorityResult,
  PasserelleResult,
  VoteResult,
  AGStats,
  VoteStats,
  MandatWarning,
  SimulateurState,
  getLotDisplayName,
  getLotTantiemes,
} from './types'
import { MAX_MANDATS, MAX_PERCENTAGE } from './constants'

// === HELPER POUR OBTENIR LES TANTIÈMES D'UN LOT POUR LA CLÉ SÉLECTIONNÉE ===

/**
 * Obtient les tantièmes d'un lot pour la clé sélectionnée dans l'état
 */
function getTantiemesForSelectedCle(lot: Lot, state: SimulateurState): number {
  return getLotTantiemes(lot, state.selectedCleId)
}

/**
 * Calcule le total des tantièmes pour la clé sélectionnée
 */
function getTotalTantiemes(state: SimulateurState): number {
  return state.lots.reduce(
    (sum, lot) => sum + getTantiemesForSelectedCle(lot, state),
    0
  )
}

// === RÉDUCTION DES VOIX (ARTICLE 22) ===

/**
 * Applique la réduction des voix selon l'article 22 de la loi de 1965
 * Si un copropriétaire détient > 50% des tantièmes, ses voix sont réduites
 * à la somme des voix de TOUS les autres copropriétaires
 * Utilise les tantièmes de la clé sélectionnée
 */
export function applyVoiceReduction(state: SimulateurState): Map<string, number> {
  const total = getTotalTantiemes(state)
  const voixEffectives = new Map<string, number>()

  for (const lot of state.lots) {
    const tantiemes = getTantiemesForSelectedCle(lot, state)
    if (tantiemes > total / 2) {
      // Réduction : ses voix = somme des autres
      voixEffectives.set(lot.id, total - tantiemes)
    } else {
      voixEffectives.set(lot.id, tantiemes)
    }
  }

  return voixEffectives
}

// === VÉRIFICATION LIMITE DE MANDATS ===

/**
 * Vérifie si un représentant dépasse les limites légales de mandats
 * Règle : Max 3 mandats SAUF si total voix ≤ 10%
 * Utilise les tantièmes de la clé sélectionnée
 */
export function checkMandatLimit(
  representantId: string,
  state: SimulateurState
): MandatWarning | null {
  const { lots, representations } = state
  const representant = lots.find((l) => l.id === representantId)
  if (!representant) return null

  // Trouver tous les lots représentés par ce représentant
  const representesIds = Object.entries(representations)
    .filter(([, repId]) => repId === representantId)
    .map(([lotId]) => lotId)

  if (representesIds.length === 0) return null

  const representes = lots.filter((l) => representesIds.includes(l.id))
  const total = getTotalTantiemes(state)

  const totalVoix =
    getTantiemesForSelectedCle(representant, state) +
    representes.reduce((sum, l) => sum + getTantiemesForSelectedCle(l, state), 0)
  const percentage = total > 0 ? (totalVoix / total) * 100 : 0

  const exceeds3 = representesIds.length > MAX_MANDATS
  const exceeds10 = percentage > MAX_PERCENTAGE

  // Warning si > 3 mandats ET > 10%
  if (exceeds3 && exceeds10) {
    return {
      lotId: representantId,
      displayName: getLotDisplayName(representant),
      mandatsCount: representesIds.length,
      totalTantiemes: totalVoix,
      percentageTotal: percentage,
      exceeds3Mandats: true,
      exceeds10Percent: true,
    }
  }

  return null
}

/**
 * Vérifie les limites de mandats pour tous les représentants
 * Utilise les tantièmes de la clé sélectionnée
 */
export function checkAllMandatLimits(state: SimulateurState): MandatWarning[] {
  const warnings: MandatWarning[] = []
  const representants = new Set(Object.values(state.representations))

  for (const representantId of representants) {
    const warning = checkMandatLimit(representantId, state)
    if (warning) {
      warnings.push(warning)
    }
  }

  return warnings
}

// === STATISTIQUES AG ===

/**
 * Calcule les statistiques de présence pour l'AG
 * Utilise les tantièmes de la clé sélectionnée
 */
export function getAGStats(state: SimulateurState): AGStats {
  const { lots, presences } = state
  const totalLots = lots.length
  const totalTantiemes = getTotalTantiemes(state)

  // Lots présents (status = 'present')
  const lotsPresentsArray = lots.filter(
    (l) => presences[l.id] === 'present'
  )
  const lotsPresents = lotsPresentsArray.length
  const tantièmesPresents = lotsPresentsArray.reduce(
    (sum, l) => sum + getTantiemesForSelectedCle(l, state),
    0
  )

  // Lots représentés (status = 'represente')
  const lotsRepresentesArray = lots.filter(
    (l) => presences[l.id] === 'represente'
  )
  const lotsRepresentes = lotsRepresentesArray.length
  const tantièmesRepresentes = lotsRepresentesArray.reduce(
    (sum, l) => sum + getTantiemesForSelectedCle(l, state),
    0
  )

  // Total présents + représentés
  const totalPresentsRepresentes = tantièmesPresents + tantièmesRepresentes
  const pourcentagePresence =
    totalTantiemes > 0 ? (totalPresentsRepresentes / totalTantiemes) * 100 : 0

  // Voix effectives (après réduction Art. 22)
  const voixEffectives = applyVoiceReduction(state)

  // Warnings de mandats
  const mandatWarnings = checkAllMandatLimits(state)

  return {
    totalLots,
    totalTantiemes,
    lotsPresents,
    tantièmesPresents,
    pourcentagePresence,
    lotsRepresentes,
    tantièmesRepresentes,
    voixEffectives,
    mandatWarnings,
  }
}

// === STATISTIQUES DE VOTE ===

/**
 * Calcule les statistiques de vote
 * Prend en compte les représentations : le vote du représentant compte pour lui + ses représentés
 * Utilise les tantièmes de la clé sélectionnée
 */
export function getVoteStats(state: SimulateurState): VoteStats {
  const { lots, presences, representations, votes } = state
  const voixEffectives = applyVoiceReduction(state)

  let pour = 0
  let contre = 0
  let abstention = 0
  let lotsPour = 0
  let lotsContre = 0
  let lotsAbstention = 0

  // Pour chaque lot présent, compter son vote + les votes de ses représentés
  for (const lot of lots) {
    if (presences[lot.id] !== 'present') continue

    const vote = votes[lot.id]
    const voixLot = voixEffectives.get(lot.id) || getTantiemesForSelectedCle(lot, state)

    // Compter les tantièmes des lots représentés par ce lot
    const representesIds = Object.entries(representations)
      .filter(([, repId]) => repId === lot.id)
      .map(([lotId]) => lotId)

    let voixRepresentes = 0
    for (const repId of representesIds) {
      const repLot = lots.find((l) => l.id === repId)
      if (repLot) {
        voixRepresentes += voixEffectives.get(repId) || getTantiemesForSelectedCle(repLot, state)
      }
    }

    const totalVoix = voixLot + voixRepresentes
    const totalLots = 1 + representesIds.length

    if (vote === 'pour') {
      pour += totalVoix
      lotsPour += totalLots
    } else if (vote === 'contre') {
      contre += totalVoix
      lotsContre += totalLots
    } else if (vote === 'abstention') {
      abstention += totalVoix
      lotsAbstention += totalLots
    }
  }

  return {
    exprimes: pour + contre, // Abstentions non comptées
    pour,
    contre,
    abstention,
    lotsPour,
    lotsContre,
    lotsAbstention,
  }
}

// === CALCUL DES MAJORITÉS ===

/**
 * Article 24 - Majorité simple des voix exprimées
 * POUR > EXPRIMÉS / 2
 * Les abstentions ne comptent pas
 */
export function calculateArt24(state: SimulateurState): MajorityResult {
  const stats = getVoteStats(state)
  const { pour, exprimes } = stats

  const required = exprimes > 0 ? Math.floor(exprimes / 2) + 1 : 1

  return {
    type: 'art24',
    isAchievable: exprimes > 0,
    isAchieved: exprimes > 0 && pour > exprimes / 2,
    pourRequired: required,
    pourActuel: pour,
    details: `${pour} / ${exprimes} voix exprimées (${required} requises)`,
  }
}

/**
 * Article 25 - Majorité absolue de tous les tantièmes
 * POUR > TOTAL_TANTIÈMES / 2
 * Utilise les tantièmes de la clé sélectionnée
 */
export function calculateArt25(state: SimulateurState): MajorityResult {
  const stats = getVoteStats(state)
  const { pour } = stats
  const total = getTotalTantiemes(state)
  const required = Math.floor(total / 2) + 1

  // Calculer le maximum atteignable avec les présents
  const agStats = getAGStats(state)
  const maxAtteignable = agStats.tantièmesPresents + agStats.tantièmesRepresentes

  return {
    type: 'art25',
    isAchievable: maxAtteignable > total / 2,
    isAchieved: pour > total / 2,
    pourRequired: required,
    pourActuel: pour,
    details: `${pour} / ${total} tantièmes (${required} requises)`,
  }
}

/**
 * Article 26 - Double majorité
 * POUR_LOTS > TOTAL_LOTS / 2 ET POUR_TANTIÈMES >= 2/3 TOTAL
 * Utilise les tantièmes de la clé sélectionnée
 */
export function calculateArt26(state: SimulateurState): MajorityResult {
  const stats = getVoteStats(state)
  const { pour, lotsPour } = stats
  const totalLots = state.lots.length
  const totalTantiemes = getTotalTantiemes(state)

  const requiredLots = Math.floor(totalLots / 2) + 1
  const requiredTantiemes = Math.ceil((2 * totalTantiemes) / 3)

  const lotsOk = lotsPour > totalLots / 2
  const tantièmesOk = pour >= (2 * totalTantiemes) / 3

  // Calculer l'atteignabilité
  const agStats = getAGStats(state)
  const maxLots = agStats.lotsPresents + agStats.lotsRepresentes
  const maxTantiemes = agStats.tantièmesPresents + agStats.tantièmesRepresentes
  const isAchievable =
    maxLots > totalLots / 2 && maxTantiemes >= (2 * totalTantiemes) / 3

  return {
    type: 'art26',
    isAchievable,
    isAchieved: lotsOk && tantièmesOk,
    pourRequired: requiredTantiemes,
    pourActuel: pour,
    lotsRequired: requiredLots,
    lotsPour,
    details: `Lots: ${lotsPour}/${totalLots} (${requiredLots} requis) | Tantièmes: ${pour}/${totalTantiemes} (${requiredTantiemes} requis)`,
  }
}

/**
 * Unanimité - 100% des copropriétaires votent POUR
 * Utilise les tantièmes de la clé sélectionnée
 */
export function calculateUnanimite(state: SimulateurState): MajorityResult {
  const stats = getVoteStats(state)
  const { pour, lotsPour } = stats
  const totalLots = state.lots.length
  const totalTantiemes = getTotalTantiemes(state)

  // L'unanimité nécessite TOUS les lots, pas seulement les présents
  const agStats = getAGStats(state)
  const allPresent =
    agStats.lotsPresents + agStats.lotsRepresentes === totalLots

  return {
    type: 'unanimite',
    isAchievable: allPresent,
    isAchieved: lotsPour === totalLots && pour === totalTantiemes,
    pourRequired: totalTantiemes,
    pourActuel: pour,
    lotsRequired: totalLots,
    lotsPour,
    details: `${lotsPour}/${totalLots} lots et ${pour}/${totalTantiemes} tantièmes`,
  }
}

// === PASSERELLES ===

/**
 * Passerelle 25-1
 * Si art.25 rejeté et POUR >= 1/3 TOTAL → second vote à l'art.24
 * Utilise les tantièmes de la clé sélectionnée
 */
export function checkPasserelle25_1(state: SimulateurState): PasserelleResult {
  const art25 = calculateArt25(state)
  const stats = getVoteStats(state)
  const { pour } = stats
  const total = getTotalTantiemes(state)

  if (art25.isAchieved) {
    return {
      applicable: false,
      canTrigger: false,
      nextMajority: 'art24',
      explanation: 'La résolution a été adoptée à l\'article 25.',
    }
  }

  const threshold = Math.ceil(total / 3)
  const canTrigger = pour >= total / 3

  // Simuler le résultat avec l'art. 24
  const art24Result = calculateArt24(state)

  return {
    applicable: true,
    canTrigger,
    nextMajority: 'art24',
    explanation: canTrigger
      ? `Passerelle applicable : ${pour} ≥ ${threshold} tantièmes (1/3). Un second vote à l'article 24 est possible.`
      : `Passerelle non applicable : ${pour} < ${threshold} tantièmes (1/3 requis).`,
    newResult: canTrigger ? art24Result : undefined,
  }
}

/**
 * Passerelle 26-1
 * Si art.26 rejeté et POUR_LOTS >= PRÉSENTS/2 et POUR >= 1/3 TOTAL → second vote à l'art.25
 * Utilise les tantièmes de la clé sélectionnée
 */
export function checkPasserelle26_1(state: SimulateurState): PasserelleResult {
  const art26 = calculateArt26(state)
  const stats = getVoteStats(state)
  const agStats = getAGStats(state)
  const { pour, lotsPour } = stats
  const total = getTotalTantiemes(state)
  const lotsPresentsRepresentes = agStats.lotsPresents + agStats.lotsRepresentes

  if (art26.isAchieved) {
    return {
      applicable: false,
      canTrigger: false,
      nextMajority: 'art25',
      explanation: 'La résolution a été adoptée à l\'article 26.',
    }
  }

  const lotsCondition = lotsPour >= lotsPresentsRepresentes / 2
  const tantièmesCondition = pour >= total / 3
  const canTrigger = lotsCondition && tantièmesCondition

  // Simuler le résultat avec l'art. 25
  const art25Result = calculateArt25(state)

  const threshold = Math.ceil(total / 3)
  const lotsThreshold = Math.ceil(lotsPresentsRepresentes / 2)

  return {
    applicable: true,
    canTrigger,
    nextMajority: 'art25',
    explanation: canTrigger
      ? `Passerelle applicable : ${lotsPour} ≥ ${lotsThreshold} lots ET ${pour} ≥ ${threshold} tantièmes. Un second vote à l'article 25 est possible.`
      : `Passerelle non applicable : conditions non remplies (${lotsPour}/${lotsThreshold} lots, ${pour}/${threshold} tantièmes).`,
    newResult: canTrigger ? art25Result : undefined,
  }
}

// === CALCUL GLOBAL ===

/**
 * Calcule le résultat complet d'un vote avec les passerelles éventuelles
 */
export function calculateVoteResult(state: SimulateurState): VoteResult {
  const { selectedMajority } = state

  let majority: MajorityResult

  switch (selectedMajority) {
    case 'art24':
      majority = calculateArt24(state)
      break
    case 'art25':
      majority = calculateArt25(state)
      break
    case 'art26':
      majority = calculateArt26(state)
      break
    case 'unanimite':
      majority = calculateUnanimite(state)
      break
  }

  const result: VoteResult = { majority }

  // Vérifier les passerelles si la majorité n'est pas atteinte
  if (!majority.isAchieved) {
    if (selectedMajority === 'art25') {
      result.passerelle25_1 = checkPasserelle25_1(state)
    } else if (selectedMajority === 'art26') {
      result.passerelle26_1 = checkPasserelle26_1(state)
    }
  }

  return result
}

/**
 * Calcule l'atteignabilité de toutes les majorités pour l'affichage du dashboard AG
 * Utilise les tantièmes de la clé sélectionnée
 */
export function getAllMajoritiesStatus(
  state: SimulateurState
): Record<MajorityType, { isAchievable: boolean; status: 'yes' | 'limit' | 'no' }> {
  const agStats = getAGStats(state)
  const totalLots = state.lots.length
  const totalTantiemes = getTotalTantiemes(state)
  const maxTantiemes = agStats.tantièmesPresents + agStats.tantièmesRepresentes
  const maxLots = agStats.lotsPresents + agStats.lotsRepresentes

  const getStatus = (
    required: number,
    max: number
  ): 'yes' | 'limit' | 'no' => {
    if (max >= required * 1.1) return 'yes' // Marge de 10%
    if (max >= required) return 'limit'
    return 'no'
  }

  return {
    art24: {
      isAchievable: maxTantiemes > 0,
      status: maxTantiemes > 0 ? 'yes' : 'no',
    },
    art25: {
      isAchievable: maxTantiemes > totalTantiemes / 2,
      status: getStatus(Math.floor(totalTantiemes / 2) + 1, maxTantiemes),
    },
    art26: {
      isAchievable:
        maxLots > totalLots / 2 &&
        maxTantiemes >= (2 * totalTantiemes) / 3,
      status:
        maxLots > totalLots / 2 &&
        maxTantiemes >= (2 * totalTantiemes) / 3
          ? getStatus(
              Math.ceil((2 * totalTantiemes) / 3),
              maxTantiemes
            )
          : 'no',
    },
    unanimite: {
      isAchievable: maxLots === totalLots,
      status: maxLots === totalLots ? 'yes' : 'no',
    },
  }
}
