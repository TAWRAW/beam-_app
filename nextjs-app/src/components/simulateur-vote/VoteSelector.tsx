'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useSimulateur } from './SimulateurProvider'
import { VoteChoice, getLotDisplayName, getLotTantiemes } from '@/lib/simulateur-vote/types'
import { VOTE_LABELS } from '@/lib/simulateur-vote/constants'

export function VoteSelector() {
  const { state, setVote } = useSimulateur()

  // Lots qui votent : présents uniquement (ils votent pour eux + leurs représentés)
  const lotsVotants = state.lots.filter(
    (lot) => state.presences[lot.id] === 'present'
  )

  // Calculer le nombre de représentés par votant
  const getRepresentesCount = (lotId: string): number => {
    return Object.entries(state.representations).filter(
      ([, repId]) => repId === lotId
    ).length
  }

  const getRepresentesNames = (lotId: string): string[] => {
    const representesIds = Object.entries(state.representations)
      .filter(([, repId]) => repId === lotId)
      .map(([id]) => id)

    return representesIds
      .map((id) => {
        const lot = state.lots.find((l) => l.id === id)
        return lot ? getLotDisplayName(lot) : undefined
      })
      .filter((name): name is string => !!name)
  }

  const handleVoteChange = (lotId: string, value: string) => {
    const vote = value as VoteChoice
    setVote(lotId, vote)
  }

  // Sélectionner tous les votes pour une option
  const handleSelectAll = (voteChoice: VoteChoice) => {
    lotsVotants.forEach((lot) => {
      setVote(lot.id, voteChoice)
    })
  }

  // Vérifier si tous les votes sont sur une option
  const areAllVotes = (voteChoice: VoteChoice): boolean => {
    if (lotsVotants.length === 0) return false
    return lotsVotants.every((lot) => state.votes[lot.id] === voteChoice)
  }

  if (lotsVotants.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        Aucun copropriétaire présent. Retournez à l'onglet "Simuler une AG".
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Vue desktop : tableau */}
      <div className="hidden lg:block">
        <div className="grid gap-4">
          <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center px-4 py-2 bg-muted rounded-lg font-medium text-sm">
            <span>Votant</span>
            <div className="flex items-center justify-center gap-2 w-24">
              <Checkbox
                id="select-all-pour"
                checked={areAllVotes('pour')}
                onCheckedChange={() => handleSelectAll('pour')}
                aria-label="Sélectionner tous pour"
              />
              <Label htmlFor="select-all-pour" className="cursor-pointer">Pour</Label>
            </div>
            <div className="flex items-center justify-center gap-2 w-24">
              <Checkbox
                id="select-all-contre"
                checked={areAllVotes('contre')}
                onCheckedChange={() => handleSelectAll('contre')}
                aria-label="Sélectionner tous contre"
              />
              <Label htmlFor="select-all-contre" className="cursor-pointer">Contre</Label>
            </div>
            <div className="flex items-center justify-center gap-2 w-24">
              <Checkbox
                id="select-all-abstention"
                checked={areAllVotes('abstention')}
                onCheckedChange={() => handleSelectAll('abstention')}
                aria-label="Sélectionner toutes abstentions"
              />
              <Label htmlFor="select-all-abstention" className="cursor-pointer">Abstention</Label>
            </div>
          </div>

          {lotsVotants.map((lot) => {
            const currentVote = state.votes[lot.id] || null
            const representesCount = getRepresentesCount(lot.id)
            const representesNames = getRepresentesNames(lot.id)
            // Calculer les tantièmes des représentés
            const representesIds = Object.entries(state.representations)
              .filter(([, repId]) => repId === lot.id)
              .map(([id]) => id)
            const totalTantiemes =
              getLotTantiemes(lot, state.selectedCleId) +
              representesIds.reduce((sum, repId) => {
                const repLot = state.lots.find((l) => l.id === repId)
                return sum + (repLot ? getLotTantiemes(repLot, state.selectedCleId) : 0)
              }, 0)

            return (
              <div
                key={lot.id}
                className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center px-4 py-3 border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{getLotDisplayName(lot)}</p>
                    {representesCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{representesCount} mandat{representesCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {totalTantiemes} tantièmes
                    {representesCount > 0 && (
                      <span className="ml-1">
                        (représente : {representesNames.join(', ')})
                      </span>
                    )}
                  </p>
                </div>

                <RadioGroup
                  value={currentVote || ''}
                  onValueChange={(value) => handleVoteChange(lot.id, value)}
                  className="contents"
                >
                  <div className="flex justify-center w-24">
                    <RadioGroupItem value="pour" id={`${lot.id}-pour`} />
                  </div>
                  <div className="flex justify-center w-24">
                    <RadioGroupItem value="contre" id={`${lot.id}-contre`} />
                  </div>
                  <div className="flex justify-center w-24">
                    <RadioGroupItem
                      value="abstention"
                      id={`${lot.id}-abstention`}
                    />
                  </div>
                </RadioGroup>
              </div>
            )
          })}
        </div>
      </div>

      {/* Vue mobile : cartes */}
      <div className="lg:hidden space-y-4">
        {/* Boutons de sélection rapide mobile */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            type="button"
            onClick={() => handleSelectAll('pour')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              areAllVotes('pour')
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Tous Pour
          </button>
          <button
            type="button"
            onClick={() => handleSelectAll('contre')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              areAllVotes('contre')
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Tous Contre
          </button>
          <button
            type="button"
            onClick={() => handleSelectAll('abstention')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              areAllVotes('abstention')
                ? 'bg-orange-100 border-orange-300 text-orange-700'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Toutes Abstentions
          </button>
        </div>

        {lotsVotants.map((lot) => {
          const currentVote = state.votes[lot.id] || null
          const representesCount = getRepresentesCount(lot.id)
          const representesNames = getRepresentesNames(lot.id)

          return (
            <div key={lot.id} className="p-4 border rounded-lg space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{getLotDisplayName(lot)}</p>
                  {representesCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{representesCount}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getLotTantiemes(lot, state.selectedCleId)} tantièmes
                </p>
                {representesCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Représente : {representesNames.join(', ')}
                  </p>
                )}
              </div>

              <RadioGroup
                value={currentVote || ''}
                onValueChange={(value) => handleVoteChange(lot.id, value)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pour" id={`m-${lot.id}-pour`} />
                  <Label htmlFor={`m-${lot.id}-pour`} className="text-sm">
                    {VOTE_LABELS.pour}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contre" id={`m-${lot.id}-contre`} />
                  <Label htmlFor={`m-${lot.id}-contre`} className="text-sm">
                    {VOTE_LABELS.contre}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="abstention"
                    id={`m-${lot.id}-abstention`}
                  />
                  <Label htmlFor={`m-${lot.id}-abstention`} className="text-sm">
                    {VOTE_LABELS.abstention}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )
        })}
      </div>
    </div>
  )
}
