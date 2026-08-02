'use client'

import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TICKET_TYPES, type Copro, type Dossier, type Ticket, type TicketType } from '@/lib/venator/types'
import { TICKET_TYPE_LABELS } from '@/lib/venator/labels'
import {
  venatorButtonPrimary,
  venatorButtonSecondary,
  venatorDialogContent,
  venatorInput,
  venatorLabel,
  venatorSelectContent,
  venatorSelectItem,
  venatorSelectTrigger,
} from './venator-ui-classes'
import { cn } from '@/lib/utils'

export default function TicketExpressDialog({
  open,
  onOpenChange,
  copros,
  defaultCoproId,
  onCreated,
  onCreatedForOs,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  copros: Copro[]
  defaultCoproId?: string
  onCreated?: () => void
  /** Ticket créé via « OS en un clic » — le parent ouvre EmettreOsDialog pour ce ticket. */
  onCreatedForOs?: (ticket: Ticket) => void
}) {
  const [coproId, setCoproId] = useState(defaultCoproId ?? '')
  const [type, setType] = useState<TicketType>('intervention')
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [prestataireNom, setPrestataireNom] = useState('')
  const [dossierId, setDossierId] = useState('')
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submittingOs, setSubmittingOs] = useState(false)
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

  const canSubmit = coproId.length > 0 && titre.trim().length > 0 && !submitting && !submittingOs

  async function postTicket(): Promise<Ticket> {
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
    const { ticket }: { ticket: Ticket } = await res.json()
    return ticket
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await postTicket()
      onOpenChange(false)
      onCreated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitWithOs() {
    if (!canSubmit) return
    setSubmittingOs(true)
    setError(null)
    try {
      const ticket = await postTicket()
      onOpenChange(false)
      onCreatedForOs?.(ticket)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmittingOs(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={venatorDialogContent}>
        <DialogHeader>
          <DialogTitle className="text-venator-fg">Ticket express</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-copro" className={venatorLabel}>Copropriété</Label>
            <Select value={coproId} onValueChange={handleCoproChange}>
              <SelectTrigger id="ticket-express-copro" className={venatorSelectTrigger}>
                <SelectValue placeholder="Choisir une copropriété" />
              </SelectTrigger>
              <SelectContent className={venatorSelectContent}>
                {copros.map((c) => (
                  <SelectItem key={c.id} value={c.id} className={venatorSelectItem}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-type" className={venatorLabel}>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
              <SelectTrigger id="ticket-express-type" className={venatorSelectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={venatorSelectContent}>
                {TICKET_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className={venatorSelectItem}>
                    {TICKET_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-titre" className={venatorLabel}>Titre</Label>
            <Input
              id="ticket-express-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Fuite chaufferie"
              maxLength={200}
              className={venatorInput}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-description" className={venatorLabel}>Description (optionnel)</Label>
            <Textarea
              id="ticket-express-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              className={venatorInput}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-prestataire" className={venatorLabel}>Prestataire</Label>
            <Input
              id="ticket-express-prestataire"
              value={prestataireNom}
              onChange={(e) => setPrestataireNom(e.target.value)}
              placeholder="Ex : Plomberie Martin"
              maxLength={200}
              className={venatorInput}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-express-dossier" className={venatorLabel}>Dossier de rattachement (optionnel)</Label>
            <Select value={dossierId} onValueChange={setDossierId} disabled={!coproId}>
              <SelectTrigger id="ticket-express-dossier" className={venatorSelectTrigger}>
                <SelectValue placeholder={coproId ? 'Aucun' : 'Choisir une copropriété d’abord'} />
              </SelectTrigger>
              <SelectContent className={venatorSelectContent}>
                {dossiers.map((d) => (
                  <SelectItem key={d.id} value={d.id} className={venatorSelectItem}>
                    {d.titre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm font-medium text-venator-danger">{error}</p>}
        </div>
        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmitWithOs}
            disabled={!canSubmit}
            className={cn(venatorButtonSecondary, 'border-0')}
          >
            {submittingOs ? 'Création…' : 'OS en un clic'}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit} className={venatorButtonPrimary}>
            {submitting ? 'Création…' : 'Créer le ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
