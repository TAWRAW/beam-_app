import { MajorityType, PresenceStatus } from './types'

// Version pour la compatibilité des exports
export const EXPORT_VERSION = '1.0.0'

// Valeur par défaut pour le total des tantièmes (pour warning)
export const DEFAULT_TANTIEMES_TOTAL = 1000

// Limites de représentation
export const MAX_MANDATS = 3
export const MAX_PERCENTAGE = 10

// Labels pour les statuts de présence
export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  absent: 'Absent',
  present: 'Présent',
  represente: 'Représenté',
}

export const PRESENCE_DESCRIPTIONS: Record<PresenceStatus, string> = {
  absent: 'Le copropriétaire n\'est pas présent et n\'a donné aucun pouvoir',
  present: 'Le copropriétaire est présent ou participe à distance',
  represente: 'Le copropriétaire a donné pouvoir à un autre copropriétaire',
}

// Labels pour les types de majorité
export const MAJORITY_LABELS: Record<MajorityType, string> = {
  art24: 'Article 24',
  art25: 'Article 25',
  art26: 'Article 26',
  unanimite: 'Unanimité',
}

export const MAJORITY_NAMES: Record<MajorityType, string> = {
  art24: 'Majorité simple',
  art25: 'Majorité absolue',
  art26: 'Double majorité',
  unanimite: 'Unanimité',
}

export const MAJORITY_DESCRIPTIONS: Record<MajorityType, string> = {
  art24: 'Majorité des voix exprimées des copropriétaires présents ou représentés. Les abstentions ne comptent pas.',
  art25: 'Majorité des voix de tous les copropriétaires (présents, représentés et absents).',
  art26: 'Majorité en nombre des copropriétaires (>50%) ET au moins 2/3 des tantièmes totaux.',
  unanimite: 'Accord de tous les copropriétaires sans exception.',
}

export const MAJORITY_EXAMPLES: Record<MajorityType, string[]> = {
  art24: [
    'Approbation des comptes',
    'Budget prévisionnel',
    'Travaux d\'entretien courant',
    'Règlement intérieur',
  ],
  art25: [
    'Désignation ou révocation du syndic',
    'Travaux d\'amélioration',
    'Installation de compteurs individuels',
    'Modification du règlement de copropriété',
  ],
  art26: [
    'Aliénation des parties communes',
    'Modification de la destination de l\'immeuble',
    'Suppression du service de gardiennage',
  ],
  unanimite: [
    'Aliénation d\'une partie commune nécessaire au respect de la destination de l\'immeuble',
    'Modification de la répartition des charges',
  ],
}

// Labels pour les votes
export const VOTE_LABELS = {
  pour: 'Pour',
  contre: 'Contre',
  abstention: 'Abstention',
} as const

// Messages d'erreur
export const ERROR_MESSAGES = {
  localStorage_unavailable: 'Votre navigateur ne permet pas de sauvegarder les données. Vos saisies seront perdues à la fermeture de la page.',
  import_invalid: 'Le fichier importé n\'est pas valide. Vérifiez qu\'il s\'agit bien d\'un export du simulateur Beamô.',
  import_version_mismatch: 'La version du fichier importé n\'est pas compatible avec cette version du simulateur.',
  no_lots: 'Ajoutez au moins un lot pour commencer la simulation.',
  no_presents: 'Cochez au moins un lot présent ou représenté pour simuler un vote.',
  no_votes: 'Indiquez au moins un vote pour calculer le résultat.',
  lot_identifiant_empty: 'L\'identifiant du lot ne peut pas être vide.',
  lot_tantiemes_invalid: 'Les tantièmes doivent être un nombre entier positif.',
  lot_tantiemes_zero: 'Les tantièmes doivent être supérieurs à 0.',
} as const

// Messages d'avertissement
export const WARNING_MESSAGES = {
  tantiemes_not_1000: (total: number) =>
    `Le total des tantièmes est de ${total}. La valeur habituelle est de 1000.`,
  mandat_limit_exceeded: (count: number, percentage: number) =>
    `Attention : ${count} mandats représentant ${percentage.toFixed(1)}% des voix. La loi limite généralement à 3 mandats ou 10% des voix.`,
  voice_reduction_applied: (lotId: string, original: number, reduced: number) =>
    `Réduction des voix appliquée (Art. 22) : ${original} → ${reduced} tantièmes`,
} as const

// Textes pour les résultats
export const RESULT_TEXTS = {
  adopted: 'RÉSOLUTION ADOPTÉE',
  rejected: 'RÉSOLUTION REJETÉE',
  achievable: 'Atteignable',
  limit: 'Limite',
  not_achievable: 'Non atteignable',
  passerelle_applicable: 'Passerelle applicable',
  passerelle_not_applicable: 'Passerelle non applicable',
} as const

// Couleurs sémantiques (classes Tailwind)
export const STATUS_COLORS = {
  success: 'text-green-600 bg-green-50 border-green-200',
  warning: 'text-orange-600 bg-orange-50 border-orange-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  neutral: 'text-gray-600 bg-gray-50 border-gray-200',
} as const

// Liens vers les articles explicatifs
export const HELP_LINKS = {
  notice: '/outils/simulateur-vote/notice',
  majorites: '/ressources/majorites-assemblee-generale-copropriete',
  art22: '/ressources/majorites-assemblee-generale-copropriete#reduction-voix',
  passerelles: '/ressources/majorites-assemblee-generale-copropriete#passerelles',
} as const
