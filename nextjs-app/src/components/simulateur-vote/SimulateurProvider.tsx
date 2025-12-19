'use client'

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import {
  SimulateurState,
  SimulateurAction,
  SimulateurContextValue,
  Lot,
  PresenceStatus,
  VoteChoice,
  ExportData,
  AGStats,
  VoteStats,
  VoteResult,
  getLotTantiemes,
  MAX_CLES,
  DEFAULT_CLE_ID,
} from '@/lib/simulateur-vote/types'
import { simulateurReducer, initialState } from '@/lib/simulateur-vote/reducer'
import {
  getAGStats,
  getVoteStats,
  calculateVoteResult,
} from '@/lib/simulateur-vote/calculations'
import {
  loadState,
  saveState,
  clearState,
  generateExportData,
  exportToFile,
  validateImportData,
  mergeWithInitialState,
} from '@/lib/simulateur-vote/storage'

// Contexte
const SimulateurContext = createContext<SimulateurContextValue | null>(null)

// Hook pour utiliser le contexte
export function useSimulateur(): SimulateurContextValue {
  const context = useContext(SimulateurContext)
  if (!context) {
    throw new Error('useSimulateur must be used within a SimulateurProvider')
  }
  return context
}

// Provider Props
interface SimulateurProviderProps {
  children: React.ReactNode
}

// Provider Component
export function SimulateurProvider({ children }: SimulateurProviderProps) {
  const [state, dispatch] = useReducer(simulateurReducer, initialState)
  const [isHydrated, setIsHydrated] = React.useState(false)

  // Charger les données depuis localStorage au montage
  useEffect(() => {
    const loaded = loadState()
    if (loaded) {
      dispatch({
        type: 'LOAD_STATE',
        payload: mergeWithInitialState(loaded),
      })
    }
    setIsHydrated(true)
  }, [])

  // Auto-save quand les lots ou clés changent
  useEffect(() => {
    if (isHydrated && state.lots.length > 0) {
      saveState(state)
      dispatch({ type: 'MARK_SAVED' })
    }
  }, [state.lots, state.clesDeCharges, state.presences, state.representations, state.externalRepresentatives, isHydrated])

  // Helper pour calculer le total des tantièmes pour une clé donnée
  const getTotalTantièmesPourCle = useCallback(
    (cleId: string): number => {
      return state.lots.reduce(
        (sum, lot) => sum + getLotTantiemes(lot, cleId),
        0
      )
    },
    [state.lots]
  )

  // Total des tantièmes pour la clé sélectionnée
  const totalTantiemes = useMemo(
    () => getTotalTantièmesPourCle(state.selectedCleId),
    [getTotalTantièmesPourCle, state.selectedCleId]
  )

  // Peut-on ajouter une nouvelle clé ?
  const canAddCle = useMemo(
    () => state.clesDeCharges.length < MAX_CLES,
    [state.clesDeCharges.length]
  )

  const agStats: AGStats | null = useMemo(() => {
    if (state.lots.length === 0) return null
    return getAGStats(state)
  }, [state])

  const voteStats: VoteStats | null = useMemo(() => {
    if (state.lots.length === 0) return null
    const hasVotes = Object.values(state.votes).some((v) => v !== null)
    if (!hasVotes) return null
    return getVoteStats(state)
  }, [state])

  const voteResult: VoteResult | null = useMemo(() => {
    if (!voteStats) return null
    return calculateVoteResult(state)
  }, [state, voteStats])

  // === Actions helpers - Clés de charges ===
  const addCle = useCallback((nom: string) => {
    dispatch({
      type: 'ADD_CLE',
      payload: { nom },
    })
  }, [])

  const updateCle = useCallback((id: string, nom: string) => {
    dispatch({
      type: 'UPDATE_CLE',
      payload: { id, nom },
    })
  }, [])

  const deleteCle = useCallback((id: string) => {
    dispatch({
      type: 'DELETE_CLE',
      payload: id,
    })
  }, [])

  const setSelectedCle = useCallback((id: string) => {
    dispatch({
      type: 'SET_SELECTED_CLE',
      payload: id,
    })
  }, [])

  // === Actions helpers - Lots ===
  const addLot = useCallback(
    (numero: string, tantièmesParCle: Record<string, number>, nom?: string) => {
      dispatch({
        type: 'ADD_LOT',
        payload: { numero, nom, tantièmesParCle },
      })
    },
    []
  )

  const updateLot = useCallback((lot: Lot) => {
    dispatch({
      type: 'UPDATE_LOT',
      payload: lot,
    })
  }, [])

  const updateLotTantiemes = useCallback(
    (lotId: string, cleId: string, tantiemes: number) => {
      dispatch({
        type: 'UPDATE_LOT_TANTIEMES',
        payload: { lotId, cleId, tantiemes },
      })
    },
    []
  )

  const deleteLot = useCallback((id: string) => {
    dispatch({
      type: 'DELETE_LOT',
      payload: id,
    })
  }, [])

  const setPresence = useCallback((lotId: string, status: PresenceStatus) => {
    dispatch({
      type: 'SET_PRESENCE',
      payload: { lotId, status },
    })
  }, [])

  const setRepresentation = useCallback(
    (lotId: string, representantId: string) => {
      dispatch({
        type: 'SET_REPRESENTATION',
        payload: { lotId, representantId },
      })
    },
    []
  )

  const setExternalRepresentative = useCallback(
    (lotId: string, name: string) => {
      dispatch({
        type: 'SET_EXTERNAL_REPRESENTATIVE',
        payload: { lotId, name },
      })
    },
    []
  )

  const setVote = useCallback((lotId: string, vote: VoteChoice) => {
    dispatch({
      type: 'SET_VOTE',
      payload: { lotId, vote },
    })
  }, [])

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_LOTS' })
    clearState()
  }, [])

  const exportData = useCallback((): ExportData => {
    return generateExportData(state)
  }, [state])

  const importData = useCallback((data: ExportData): boolean => {
    const validated = validateImportData(data)
    if (!validated) return false

    dispatch({
      type: 'IMPORT_DATA',
      payload: validated,
    })
    return true
  }, [])

  // Valeur du contexte
  const contextValue: SimulateurContextValue = useMemo(
    () => ({
      state,
      dispatch,
      // Computed values
      totalTantiemes,
      agStats,
      voteStats,
      voteResult,
      // Helpers pour les clés
      getTotalTantièmesPourCle,
      canAddCle,
      // Actions helpers - Clés
      addCle,
      updateCle,
      deleteCle,
      setSelectedCle,
      // Actions helpers - Lots
      addLot,
      updateLot,
      updateLotTantiemes,
      deleteLot,
      // Actions helpers - AG/Vote
      setPresence,
      setRepresentation,
      setExternalRepresentative,
      setVote,
      // Actions helpers - Global
      resetAll,
      exportData,
      importData,
    }),
    [
      state,
      totalTantiemes,
      agStats,
      voteStats,
      voteResult,
      getTotalTantièmesPourCle,
      canAddCle,
      addCle,
      updateCle,
      deleteCle,
      setSelectedCle,
      addLot,
      updateLot,
      updateLotTantiemes,
      deleteLot,
      setPresence,
      setRepresentation,
      setExternalRepresentative,
      setVote,
      resetAll,
      exportData,
      importData,
    ]
  )

  // Afficher un skeleton pendant l'hydratation
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">
          Chargement...
        </div>
      </div>
    )
  }

  return (
    <SimulateurContext.Provider value={contextValue}>
      {children}
    </SimulateurContext.Provider>
  )
}

// Export du hook pour faciliter l'utilisation
export { SimulateurContext }
