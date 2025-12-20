// Types pour le Simulateur de Vote en Copropriété

// === CLÉS DE CHARGES ===

export const DEFAULT_CLE_ID = 'charges-generales'
export const MAX_CLES = 10

export interface CleDeCharges {
  id: string
  nom: string
  isDefault: boolean // true pour "Charges générales", non supprimable
}

// Crée la clé par défaut
export function createDefaultCle(): CleDeCharges {
  return {
    id: DEFAULT_CLE_ID,
    nom: 'Charges générales',
    isDefault: true,
  }
}

// === ENTITÉS DE BASE ===

export interface Lot {
  id: string
  numero: string // Numéro du lot (obligatoire)
  nom?: string // Nom du propriétaire (facultatif)
  tantièmesParCle: Record<string, number> // cleId -> tantièmes
}

// Helper pour obtenir les tantièmes d'un lot pour une clé donnée
export function getLotTantiemes(lot: Lot, cleId: string): number {
  return lot.tantièmesParCle[cleId] || 0
}

// Helper pour afficher l'identifiant complet d'un lot
export function getLotDisplayName(lot: Lot): string {
  if (lot.nom) {
    return `${lot.numero} - ${lot.nom}`
  }
  return lot.numero
}

export type PresenceStatus = 'absent' | 'present' | 'represente'

export interface LotPresence {
  lotId: string
  status: PresenceStatus
  representeParId?: string // ID du lot qui représente celui-ci (si status='represente')
}

export type VoteChoice = 'pour' | 'contre' | 'abstention' | null

export type MajorityType = 'art24' | 'art25' | 'art26' | 'unanimite'

// === REPRÉSENTATION ===

// Un lot présent peut représenter plusieurs lots absents
export interface Representation {
  representantId: string // Lot présent qui vote
  representesIds: string[] // Lots absents représentés par ce lot
}

// Alerte de dépassement de limite de mandats
export interface MandatWarning {
  lotId: string
  displayName: string // Nom affiché du lot
  mandatsCount: number
  totalTantiemes: number // Ses tantièmes + ceux des représentés
  percentageTotal: number // % du total
  exceeds3Mandats: boolean
  exceeds10Percent: boolean
}

// === RÉSULTATS DE CALCUL ===

export interface MajorityResult {
  type: MajorityType
  isAchievable: boolean // Peut-on atteindre cette majorité avec les présents ?
  isAchieved: boolean // Vote passé ?
  pourRequired: number // Tantièmes/lots requis pour passer
  pourActuel: number // Tantièmes/lots actuels pour
  lotsRequired?: number // Pour art. 26
  lotsPour?: number // Pour art. 26
  details: string // Explication textuelle
}

export interface PasserelleResult {
  applicable: boolean
  canTrigger: boolean
  nextMajority: MajorityType
  explanation: string
  newResult?: MajorityResult // Résultat si on applique la passerelle
}

export interface VoteResult {
  majority: MajorityResult
  passerelle25_1?: PasserelleResult
  passerelle26_1?: PasserelleResult
}

// === STATISTIQUES ===

export interface AGStats {
  totalLots: number
  totalTantiemes: number
  lotsPresents: number
  tantièmesPresents: number
  pourcentagePresence: number
  lotsRepresentes: number
  tantièmesRepresentes: number
  voixEffectives: Map<string, number> // Après réduction Art. 22
  mandatWarnings: MandatWarning[]
}

export interface VoteStats {
  exprimes: number // Tantièmes pour + contre (sans abstentions)
  pour: number // Tantièmes pour
  contre: number // Tantièmes contre
  abstention: number // Tantièmes abstention
  lotsPour: number
  lotsContre: number
  lotsAbstention: number
}

// === REPRÉSENTANTS EXTERNES ===

// Constante pour identifier un représentant externe
export const EXTERNAL_REPRESENTATIVE_ID = 'external-representative'

// === ÉTAT GLOBAL ===

export interface SimulateurState {
  // Tab 1 - Copropriété
  clesDeCharges: CleDeCharges[] // Clés de répartition (max 10)
  lots: Lot[]

  // Tab 2 - AG
  presences: Record<string, PresenceStatus> // lotId -> status
  representations: Record<string, string> // lotId (représenté) -> representantId (ou EXTERNAL_REPRESENTATIVE_ID)
  externalRepresentatives: Record<string, string> // lotId -> nom du représentant externe

  // Tab 3 - Vote
  selectedCleId: string // Clé de charges utilisée pour le vote
  selectedMajority: MajorityType
  votes: Record<string, VoteChoice> // lotId (votant) -> vote

  // UI
  activeTab: 'copropriete' | 'ag' | 'vote'
  editingLotId: string | null

  // Persistence
  lastSaved: string | null
}

// === ACTIONS REDUCER ===

export type SimulateurAction =
  // Clés de charges
  | { type: 'ADD_CLE'; payload: { nom: string } }
  | { type: 'UPDATE_CLE'; payload: { id: string; nom: string } }
  | { type: 'DELETE_CLE'; payload: string }
  | { type: 'SET_SELECTED_CLE'; payload: string }

  // Lots
  | { type: 'ADD_LOT'; payload: { numero: string; nom?: string; tantièmesParCle: Record<string, number> } }
  | { type: 'UPDATE_LOT'; payload: Lot }
  | { type: 'UPDATE_LOT_TANTIEMES'; payload: { lotId: string; cleId: string; tantiemes: number } }
  | { type: 'DELETE_LOT'; payload: string }
  | { type: 'RESET_LOTS' }
  | { type: 'IMPORT_DATA'; payload: ExportData }

  // Presences
  | { type: 'SET_PRESENCE'; payload: { lotId: string; status: PresenceStatus } }
  | { type: 'SET_REPRESENTATION'; payload: { lotId: string; representantId: string } }
  | { type: 'SET_EXTERNAL_REPRESENTATIVE'; payload: { lotId: string; name: string } }
  | { type: 'CLEAR_REPRESENTATION'; payload: string }
  | { type: 'RESET_PRESENCES' }

  // Votes
  | { type: 'SET_VOTE'; payload: { lotId: string; vote: VoteChoice } }
  | { type: 'SET_MAJORITY_TYPE'; payload: MajorityType }
  | { type: 'RESET_VOTES' }

  // Navigation
  | { type: 'SET_TAB'; payload: SimulateurState['activeTab'] }
  | { type: 'SET_EDITING_LOT'; payload: string | null }

  // Persistence
  | { type: 'LOAD_STATE'; payload: SimulateurState }
  | { type: 'MARK_SAVED' }

// === EXPORT/IMPORT ===

export interface ExportData {
  version: string
  exportedAt: string
  copropriete: {
    nom: string
    clesDeCharges: CleDeCharges[]
    lots: Lot[]
  }
  presences?: Record<string, PresenceStatus>
  representations?: Record<string, string>
  externalRepresentatives?: Record<string, string>
}

// === CONTEXTE ===

export interface SimulateurContextValue {
  state: SimulateurState
  dispatch: React.Dispatch<SimulateurAction>

  // Computed values
  totalTantiemes: number // Pour la clé sélectionnée
  agStats: AGStats | null
  voteStats: VoteStats | null
  voteResult: VoteResult | null

  // Helpers pour les clés
  getTotalTantièmesPourCle: (cleId: string) => number
  canAddCle: boolean // true si moins de 10 clés

  // Actions helpers - Clés
  addCle: (nom: string) => void
  updateCle: (id: string, nom: string) => void
  deleteCle: (id: string) => void
  setSelectedCle: (id: string) => void

  // Actions helpers - Lots
  addLot: (numero: string, tantièmesParCle: Record<string, number>, nom?: string) => void
  updateLot: (lot: Lot) => void
  updateLotTantiemes: (lotId: string, cleId: string, tantiemes: number) => void
  deleteLot: (id: string) => void

  // Actions helpers - AG/Vote
  setPresence: (lotId: string, status: PresenceStatus) => void
  setRepresentation: (lotId: string, representantId: string) => void
  setExternalRepresentative: (lotId: string, name: string) => void
  setVote: (lotId: string, vote: VoteChoice) => void

  // Actions helpers - Global
  resetAll: () => void
  exportData: () => ExportData
  importData: (data: ExportData) => boolean
}
