'use client'

import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TICKET_TYPES, type Copro, type Dossier, type TicketType } from '@/lib/venator/types'

const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  intervention: 'Intervention',
  demande: 'Demande',
  signalement: 'Signalement',
}

export default function TicketExpressDialog({
  open,
  onOpenChange,
  copros,
  defaultCoproId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  copros: Copro[]
  defaultCoproId?: string
  onCreated?: () => void
}) {
  const [coproId, setCoproId] = useState(defaultCoproId ?? '')
  const [type, setType] = useState<TicketType>('intervention')
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [prestataireNom, setPrestataireNom] = useState('')
  const [dossierId, setDossierId] = useState('')
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDossiers = useCallback(async (id: string) => {
    if (!id) {
      setDossiers([])
      return
    }
    try {
      const res = await fetch(`/api/venator/dossiers?copro_id=${id}`)
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const { dossiers }: { dossiers: Dossier[] } = await res.json()
      setDossiers((dossiers ?? []).filter((d) => d.statut !== 'clos'))
    } catch {
      setDossiers([])
    }
  }, [])

  useEffect(() => {
    if (open) {
      const initial = defaultCoproId ?? ''
      setCoproId(initial)
      if (initial) loadDossiers(initial)
    } else {
      setCoproId('')
      setType('intervention')
      setTitre('')
      setDescription('')
      setPrestataireNom('')
      setDossierId('')
      setDossiers([])
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleCoproChange(id: string) {
    setCoproId(id)
    setDossierId('')
    loadDossiers(id)
  }

  const canSubmit = coproId.length > 0 && titre.trim().length > 0 && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copro_id: coproId,
          dossier_id: dossierId || undefined,
          type,
          titre: titre.trim(),
          description: description.trim() || undefined,
          prestataire_nom: prestataireNom.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      onOpenChange(false)
      onCreated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
        <DialogHeader>
          <DialogTitle>Ticket express</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-copro">Copropriété</Label>
            <Select value={coproId} onValueChange={handleCoproChange}>
              <SelectTrigger id="ticket-express-copro">
                <SelectValue placeholder="Choisir une copropriété" />
              </SelectTrigger>
              <SelectContent>
                {copros.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
              <SelectTrigger id="ticket-express-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TICKET_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-titre">Titre</Label>
            <Input
              id="ticket-express-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Fuite chaufferie"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-description">Description (optionnel)</Label>
            <Textarea
              id="ticket-express-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-prestataire">Prestataire</Label>
            <Input
              id="ticket-express-prestataire"
              value={prestataireNom}
              onChange={(e) => setPrestataireNom(e.target.value)}
              placeholder="Ex : Plomberie Martin"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-dossier">Dossier de rattachement (optionnel)</Label>
            <Select value={dossierId} onValueChange={setDossierId} disabled={!coproId}>
              <SelectTrigger id="ticket-express-dossier">
                <SelectValue placeholder={coproId ? 'Aucun' : 'Choisir une copropriété d’abord'} />
              </SelectTrigger>
              <SelectContent>
                {dossiers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.titre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        </div>
        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="rounded-full border-2 border-black bg-white font-semibold"
                  >
                    OS en un clic
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>V2</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#FFC300] border-2 border-black rounded-full font-bold shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] text-black hover:bg-[#FFC300]"
          >
            {submitting ? 'Création…' : 'Créer le ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
