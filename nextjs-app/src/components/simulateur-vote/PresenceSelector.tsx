'use client'

import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSimulateur } from './SimulateurProvider'
import { PresenceStatus, getLotDisplayName, getLotTantiemes, EXTERNAL_REPRESENTATIVE_ID } from '@/lib/simulateur-vote/types'
import { PRESENCE_LABELS } from '@/lib/simulateur-vote/constants'
import { UserPlus } from 'lucide-react'

export function PresenceSelector() {
  const { state, setPresence, setRepresentation, setExternalRepresentative, dispatch } = useSimulateur()

  // État pour le dialog du représentant externe
  const [externalRepDialogOpen, setExternalRepDialogOpen] = useState(false)
  const [externalRepLotId, setExternalRepLotId] = useState<string | null>(null)
  const [externalRepName, setExternalRepName] = useState('')

  // Lots qui peuvent être représentants (ceux qui sont présents)
  const lotsPresents = state.lots.filter(
    (lot) => state.presences[lot.id] === 'present'
  )

  const handlePresenceChange = (lotId: string, value: string) => {
    const status = value as PresenceStatus

    if (status === 'represente') {
      // Ne rien faire si on sélectionne "représenté" - attendre le choix du représentant
      setPresence(lotId, 'represente')
    } else {
      setPresence(lotId, status)
    }
  }

  const handleRepresentantChange = (lotId: string, representantId: string) => {
    if (representantId === EXTERNAL_REPRESENTATIVE_ID) {
      // Ouvrir le dialog pour saisir le nom du représentant externe
      setExternalRepLotId(lotId)
      setExternalRepName('')
      setExternalRepDialogOpen(true)
    } else if (representantId) {
      setRepresentation(lotId, representantId)
    } else {
      dispatch({ type: 'CLEAR_REPRESENTATION', payload: lotId })
    }
  }

  const handleExternalRepConfirm = () => {
    if (externalRepLotId) {
      setExternalRepresentative(externalRepLotId, externalRepName || 'Représentant extérieur')
      setExternalRepDialogOpen(false)
      setExternalRepLotId(null)
      setExternalRepName('')
    }
  }

  const handleExternalRepCancel = () => {
    // Annuler et remettre le lot en absent
    if (externalRepLotId) {
      dispatch({ type: 'CLEAR_REPRESENTATION', payload: externalRepLotId })
    }
    setExternalRepDialogOpen(false)
    setExternalRepLotId(null)
    setExternalRepName('')
  }

  const getRepresentant = (lotId: string) => {
    return state.representations[lotId] || ''
  }

  const getRepresentantDisplayName = (lotId: string) => {
    const representantId = state.representations[lotId]
    if (!representantId) return ''

    if (representantId === EXTERNAL_REPRESENTATIVE_ID) {
      return state.externalRepresentatives[lotId] || 'Représentant extérieur'
    }

    const lot = state.lots.find(l => l.id === representantId)
    return lot ? getLotDisplayName(lot) : ''
  }

  return (
    <div className="space-y-4">
      {/* Vue desktop : tableau */}
      <div className="hidden lg:block">
        <div className="grid gap-4">
          <div className="grid grid-cols-[1fr,auto,auto,auto,1fr] gap-4 items-center px-4 py-2 bg-muted rounded-lg font-medium text-sm">
            <span>Lot</span>
            <span className="text-center w-24">Absent</span>
            <span className="text-center w-24">Présent</span>
            <span className="text-center w-24">Représenté</span>
            <span>Représenté par</span>
          </div>

          {state.lots.map((lot) => {
            const currentStatus = state.presences[lot.id] || 'absent'
            const isRepresente = currentStatus === 'represente'
            const representantId = getRepresentant(lot.id)

            return (
              <div
                key={lot.id}
                className="grid grid-cols-[1fr,auto,auto,auto,1fr] gap-4 items-center px-4 py-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{getLotDisplayName(lot)}</p>
                  <p className="text-sm text-muted-foreground">
                    {getLotTantiemes(lot, state.selectedCleId)} tantièmes
                  </p>
                </div>

                <RadioGroup
                  value={currentStatus}
                  onValueChange={(value) => handlePresenceChange(lot.id, value)}
                  className="contents"
                >
                  <div className="flex justify-center w-24">
                    <RadioGroupItem value="absent" id={`${lot.id}-absent`} />
                  </div>
                  <div className="flex justify-center w-24">
                    <RadioGroupItem value="present" id={`${lot.id}-present`} />
                  </div>
                  <div className="flex justify-center w-24">
                    <RadioGroupItem
                      value="represente"
                      id={`${lot.id}-represente`}
                      disabled={lotsPresents.length === 0}
                    />
                  </div>
                </RadioGroup>

                <div className="min-w-[200px]">
                  {isRepresente && (
                    <Select
                      value={representantId}
                      onValueChange={(value) =>
                        handleRepresentantChange(lot.id, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir le représentant">
                          {representantId && getRepresentantDisplayName(lot.id)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {lotsPresents
                          .filter((l) => l.id !== lot.id)
                          .map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {getLotDisplayName(l)}
                            </SelectItem>
                          ))}
                        <SelectItem value={EXTERNAL_REPRESENTATIVE_ID} className="text-primary">
                          <span className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Représentant non copropriétaire
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Vue mobile : cartes */}
      <div className="lg:hidden space-y-4">
        {state.lots.map((lot) => {
          const currentStatus = state.presences[lot.id] || 'absent'
          const isRepresente = currentStatus === 'represente'
          const representantId = getRepresentant(lot.id)

          return (
            <div key={lot.id} className="p-4 border rounded-lg space-y-4">
              <div>
                <p className="font-medium">{getLotDisplayName(lot)}</p>
                <p className="text-sm text-muted-foreground">
                  {getLotTantiemes(lot, state.selectedCleId)} tantièmes
                </p>
              </div>

              <RadioGroup
                value={currentStatus}
                onValueChange={(value) => handlePresenceChange(lot.id, value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="absent" id={`m-${lot.id}-absent`} />
                  <Label htmlFor={`m-${lot.id}-absent`} className="text-sm">
                    {PRESENCE_LABELS.absent}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="present" id={`m-${lot.id}-present`} />
                  <Label htmlFor={`m-${lot.id}-present`} className="text-sm">
                    {PRESENCE_LABELS.present}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="represente"
                    id={`m-${lot.id}-represente`}
                    disabled={lotsPresents.length === 0}
                  />
                  <Label htmlFor={`m-${lot.id}-represente`} className="text-sm">
                    {PRESENCE_LABELS.represente}
                  </Label>
                </div>
              </RadioGroup>

              {isRepresente && (
                <Select
                  value={representantId}
                  onValueChange={(value) =>
                    handleRepresentantChange(lot.id, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Représenté par...">
                      {representantId && getRepresentantDisplayName(lot.id)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {lotsPresents
                      .filter((l) => l.id !== lot.id)
                      .map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {getLotDisplayName(l)}
                        </SelectItem>
                      ))}
                    <SelectItem value={EXTERNAL_REPRESENTATIVE_ID} className="text-primary">
                      <span className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Représentant non copropriétaire
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )
        })}
      </div>

      {/* Dialog pour saisir le nom du représentant externe */}
      <Dialog open={externalRepDialogOpen} onOpenChange={(open) => {
        if (!open) handleExternalRepCancel()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Représentant non copropriétaire</DialogTitle>
            <DialogDescription>
              Vous pouvez indiquer le nom du représentant externe (facultatif).
              Par défaut, il sera affiché comme &quot;Représentant extérieur&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="externalRepName" className="mb-2 block">
              Nom du représentant (facultatif)
            </Label>
            <Input
              id="externalRepName"
              value={externalRepName}
              onChange={(e) => setExternalRepName(e.target.value)}
              placeholder="Ex: Conjoint, Parent, Ami..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleExternalRepCancel}>
              Annuler
            </Button>
            <Button onClick={handleExternalRepConfirm}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
