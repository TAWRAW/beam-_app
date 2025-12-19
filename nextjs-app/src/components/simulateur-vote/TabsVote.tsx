'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSimulateur } from './SimulateurProvider'
import { VoteSelector } from './VoteSelector'
import { VoteResult } from './VoteResult'
import { MajorityType, getLotTantiemes } from '@/lib/simulateur-vote/types'
import {
  MAJORITY_LABELS,
  MAJORITY_NAMES,
  MAJORITY_DESCRIPTIONS,
} from '@/lib/simulateur-vote/constants'

export function TabsVote() {
  const { state, dispatch, agStats, voteResult, setSelectedCle, getTotalTantièmesPourCle } = useSimulateur()

  const hasLots = state.lots.length > 0
  const hasPresents = agStats && (agStats.lotsPresents + agStats.lotsRepresentes) > 0

  if (!hasLots) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            Ajoutez d'abord des lots dans l'onglet "Ma copropriété"
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!hasPresents) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            Définissez d'abord les présences dans l'onglet "Simuler une AG"
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleMajorityChange = (value: string) => {
    dispatch({
      type: 'SET_MAJORITY_TYPE',
      payload: value as MajorityType,
    })
  }

  const majorityTypes: MajorityType[] = ['art24', 'art25', 'art26', 'unanimite']

  const handleCleChange = (cleId: string) => {
    setSelectedCle(cleId)
  }

  // Trouver la clé sélectionnée
  const selectedCle = state.clesDeCharges.find((c) => c.id === state.selectedCleId)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-lg font-semibold">Simuler un vote</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez la clé de répartition, le type de majorité et simulez les votes
        </p>
      </div>

      {/* Sélection de la clé de charges */}
      {state.clesDeCharges.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clé de répartition</CardTitle>
            <CardDescription>
              Sélectionnez la clé de charges applicable à cette résolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={state.selectedCleId}
              onValueChange={handleCleChange}
            >
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.clesDeCharges.map((cle) => (
                  <SelectItem key={cle.id} value={cle.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">{cle.nom}</span>
                      <span className="text-muted-foreground text-sm">
                        {getTotalTantièmesPourCle(cle.id)} tantièmes
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCle && (
              <p className="mt-3 text-sm text-muted-foreground">
                Les calculs de majorité seront effectués sur la base de la clé « {selectedCle.nom} »
                ({getTotalTantièmesPourCle(selectedCle.id)} tantièmes au total).
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sélection du type de majorité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Type de majorité</CardTitle>
          <CardDescription>
            Sélectionnez la majorité requise pour cette résolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={state.selectedMajority}
            onValueChange={handleMajorityChange}
          >
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {majorityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {MAJORITY_LABELS[type]} - {MAJORITY_NAMES[type]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="mt-3 text-sm text-muted-foreground">
            {MAJORITY_DESCRIPTIONS[state.selectedMajority]}
          </p>
        </CardContent>
      </Card>

      {/* Sélection des votes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votes des copropriétaires</CardTitle>
          <CardDescription>
            Indiquez le vote de chaque copropriétaire présent.
            {state.selectedMajority !== 'art24' && (
              <span className="block mt-1 text-orange-600">
                Note : pour cette majorité, seuls les votes « Pour » sont comptabilisés. Les abstentions et votes « Contre » ne permettent pas d'atteindre le seuil.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoteSelector />
        </CardContent>
      </Card>

      {/* Résultat du vote */}
      {voteResult && <VoteResult />}
    </div>
  )
}
