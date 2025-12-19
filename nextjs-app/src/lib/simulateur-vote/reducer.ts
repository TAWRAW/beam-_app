import {
  SimulateurState,
  SimulateurAction,
  Lot,
  CleDeCharges,
  createDefaultCle,
  DEFAULT_CLE_ID,
  MAX_CLES,
  EXTERNAL_REPRESENTATIVE_ID,
} from './types'

// État initial avec la clé par défaut
export const initialState: SimulateurState = {
  clesDeCharges: [createDefaultCle()],
  lots: [],
  presences: {},
  representations: {},
  externalRepresentatives: {},
  selectedCleId: DEFAULT_CLE_ID,
  selectedMajority: 'art24',
  votes: {},
  activeTab: 'copropriete',
  editingLotId: null,
  lastSaved: null,
}

// Générateur d'ID unique pour les lots
function generateLotId(): string {
  return `lot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Générateur d'ID unique pour les clés
function generateCleId(): string {
  return `cle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Reducer principal
export function simulateurReducer(
  state: SimulateurState,
  action: SimulateurAction
): SimulateurState {
  switch (action.type) {
    // === GESTION DES CLÉS DE CHARGES ===

    case 'ADD_CLE': {
      if (state.clesDeCharges.length >= MAX_CLES) {
        return state // Max 10 clés
      }
      const newCle: CleDeCharges = {
        id: generateCleId(),
        nom: action.payload.nom,
        isDefault: false,
      }
      return {
        ...state,
        clesDeCharges: [...state.clesDeCharges, newCle],
      }
    }

    case 'UPDATE_CLE': {
      const { id, nom } = action.payload
      return {
        ...state,
        clesDeCharges: state.clesDeCharges.map((cle) =>
          cle.id === id && !cle.isDefault ? { ...cle, nom } : cle
        ),
      }
    }

    case 'DELETE_CLE': {
      const cleId = action.payload
      // Ne pas supprimer la clé par défaut
      const cleToDelete = state.clesDeCharges.find((c) => c.id === cleId)
      if (!cleToDelete || cleToDelete.isDefault) {
        return state
      }

      // Supprimer les tantièmes de cette clé dans tous les lots
      const updatedLots = state.lots.map((lot) => {
        const { [cleId]: _, ...restTantiemes } = lot.tantièmesParCle
        return { ...lot, tantièmesParCle: restTantiemes }
      })

      // Si la clé supprimée était sélectionnée, revenir à la clé par défaut
      const newSelectedCleId =
        state.selectedCleId === cleId ? DEFAULT_CLE_ID : state.selectedCleId

      return {
        ...state,
        clesDeCharges: state.clesDeCharges.filter((c) => c.id !== cleId),
        lots: updatedLots,
        selectedCleId: newSelectedCleId,
      }
    }

    case 'SET_SELECTED_CLE': {
      return {
        ...state,
        selectedCleId: action.payload,
        // On conserve les votes pour permettre de comparer les résultats selon les clés
      }
    }

    // === GESTION DES LOTS ===

    case 'ADD_LOT': {
      const newLot: Lot = {
        id: generateLotId(),
        numero: action.payload.numero,
        nom: action.payload.nom,
        tantièmesParCle: action.payload.tantièmesParCle,
      }
      return {
        ...state,
        lots: [...state.lots, newLot],
      }
    }

    case 'UPDATE_LOT': {
      return {
        ...state,
        lots: state.lots.map((lot) =>
          lot.id === action.payload.id ? action.payload : lot
        ),
      }
    }

    case 'UPDATE_LOT_TANTIEMES': {
      const { lotId, cleId, tantiemes } = action.payload
      return {
        ...state,
        lots: state.lots.map((lot) =>
          lot.id === lotId
            ? {
                ...lot,
                tantièmesParCle: {
                  ...lot.tantièmesParCle,
                  [cleId]: tantiemes,
                },
              }
            : lot
        ),
      }
    }

    case 'DELETE_LOT': {
      const lotId = action.payload
      // Supprimer aussi les présences, représentations et votes associés
      const newPresences = { ...state.presences }
      delete newPresences[lotId]

      const newRepresentations = { ...state.representations }
      delete newRepresentations[lotId]
      // Supprimer aussi si ce lot était représentant
      for (const key of Object.keys(newRepresentations)) {
        if (newRepresentations[key] === lotId) {
          delete newRepresentations[key]
        }
      }

      const newVotes = { ...state.votes }
      delete newVotes[lotId]

      return {
        ...state,
        lots: state.lots.filter((lot) => lot.id !== lotId),
        presences: newPresences,
        representations: newRepresentations,
        votes: newVotes,
        editingLotId: state.editingLotId === lotId ? null : state.editingLotId,
      }
    }

    case 'RESET_LOTS': {
      return {
        ...initialState,
        activeTab: state.activeTab,
      }
    }

    case 'IMPORT_DATA': {
      const { copropriete, presences, representations, externalRepresentatives } = action.payload
      return {
        ...state,
        clesDeCharges: copropriete.clesDeCharges || [createDefaultCle()],
        lots: copropriete.lots,
        presences: presences || {},
        representations: representations || {},
        externalRepresentatives: externalRepresentatives || {},
        selectedCleId: DEFAULT_CLE_ID,
        votes: {},
        editingLotId: null,
      }
    }

    // === GESTION DES PRÉSENCES ===

    case 'SET_PRESENCE': {
      const { lotId, status } = action.payload
      const newPresences = { ...state.presences, [lotId]: status }

      // Si le lot passe à 'present' ou 'absent', supprimer sa représentation
      const newRepresentations = { ...state.representations }
      if (status !== 'represente') {
        delete newRepresentations[lotId]
      }

      // Si le lot passe à 'absent' ou 'represente', supprimer son vote
      const newVotes = { ...state.votes }
      if (status !== 'present') {
        delete newVotes[lotId]
        // Supprimer aussi les lots qu'il représentait
        for (const key of Object.keys(newRepresentations)) {
          if (newRepresentations[key] === lotId) {
            delete newRepresentations[key]
            // Remettre ces lots en absent
            newPresences[key] = 'absent'
          }
        }
      }

      return {
        ...state,
        presences: newPresences,
        representations: newRepresentations,
        votes: newVotes,
      }
    }

    case 'SET_REPRESENTATION': {
      const { lotId, representantId } = action.payload
      // Si c'était un représentant externe avant, supprimer le nom
      const newExternalReps = { ...state.externalRepresentatives }
      if (representantId !== EXTERNAL_REPRESENTATIVE_ID) {
        delete newExternalReps[lotId]
      }
      return {
        ...state,
        presences: { ...state.presences, [lotId]: 'represente' },
        representations: { ...state.representations, [lotId]: representantId },
        externalRepresentatives: newExternalReps,
      }
    }

    case 'SET_EXTERNAL_REPRESENTATIVE': {
      const { lotId, name } = action.payload
      return {
        ...state,
        presences: { ...state.presences, [lotId]: 'represente' },
        representations: { ...state.representations, [lotId]: EXTERNAL_REPRESENTATIVE_ID },
        externalRepresentatives: { ...state.externalRepresentatives, [lotId]: name || 'Représentant extérieur' },
      }
    }

    case 'CLEAR_REPRESENTATION': {
      const lotId = action.payload
      const newRepresentations = { ...state.representations }
      delete newRepresentations[lotId]
      const newExternalReps = { ...state.externalRepresentatives }
      delete newExternalReps[lotId]
      return {
        ...state,
        presences: { ...state.presences, [lotId]: 'absent' },
        representations: newRepresentations,
        externalRepresentatives: newExternalReps,
      }
    }

    case 'RESET_PRESENCES': {
      return {
        ...state,
        presences: {},
        representations: {},
        externalRepresentatives: {},
        votes: {},
      }
    }

    // === GESTION DES VOTES ===

    case 'SET_VOTE': {
      const { lotId, vote } = action.payload
      return {
        ...state,
        votes: { ...state.votes, [lotId]: vote },
      }
    }

    case 'SET_MAJORITY_TYPE': {
      return {
        ...state,
        selectedMajority: action.payload,
        // Reset les votes lors du changement de majorité
        votes: {},
      }
    }

    case 'RESET_VOTES': {
      return {
        ...state,
        votes: {},
      }
    }

    // === NAVIGATION ===

    case 'SET_TAB': {
      return {
        ...state,
        activeTab: action.payload,
        editingLotId: null,
      }
    }

    case 'SET_EDITING_LOT': {
      return {
        ...state,
        editingLotId: action.payload,
      }
    }

    // === PERSISTENCE ===

    case 'LOAD_STATE': {
      return {
        ...action.payload,
        activeTab: state.activeTab, // Garder le tab actuel
      }
    }

    case 'MARK_SAVED': {
      return {
        ...state,
        lastSaved: new Date().toISOString(),
      }
    }

    default:
      return state
  }
}
