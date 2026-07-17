'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TypeBadge } from '../../_components/DossierCard'
import EtapesTimeline from '../../_components/EtapesTimeline'
import FilPanel from '../../_components/FilPanel'
import { TICKET_TYPES, type Dossier, type Etape, type Ticket, type TicketType } from '@/lib/venator/types'

const DOSSIER_STATUT_LABELS: Record<string, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  en_attente: 'En attente',
  clos: 'Clos',
}

const PRIORITE_LABELS: Record<number, string> = {
  1: '1 — Urgent',
  2: '2 — Normal',
  3: '3 — Bas',
}

const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  intervention: 'Intervention',
  demande: 'Demande',
  signalement: 'Signalement',
}

const TICKET_STATUT_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  os_envoye: 'OS envoyé',
  planifie: 'Planifié',
  realise: 'Réalisé',
  clos: 'Clos',
}

export default function DossierPage({ params }: { params: { id: string } }) {
  const dossierId = params.id
  const router = useRouter()

  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [createTicketOpen, setCreateTicketOpen] = useState(false)

  const loadDossier = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/dossiers/${dossierId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      const { dossier, etapes }: { dossier: Dossier; etapes: Etape[] } = await res.json()
      setDossier(dossier)
      setEtapes(etapes ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setDossier(null)
      setEtapes([])
    } finally {
      setLoading(false)
    }
  }, [dossierId])

  const loadTickets = useCallback(async () => {
    if (!dossier) return
    try {
      const res = await fetch(`/api/venator/tickets?copro_id=${dossier.copro_id}&dossier_id=${dossierId}`)
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const { tickets }: { tickets: Ticket[] } = await res.json()
      setTickets(tickets ?? [])
    } catch {
      setTickets([])
    }
  }, [dossier, dossierId])

  useEffect(() => {
    loadDossier()
  }, [loadDossier])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  async function handleClore() {
    if (!dossier || dossier.statut === 'clos') return
    if (!window.confirm('Clore ce dossier ?')) return
    setClosing(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clore' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      await loadDossier()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setClosing(false)
    }
  }

  async function handleSupprimer() {
    if (!dossier) return
    if (!window.confirm('Supprimer définitivement ce dossier ? Cette action est irréversible.')) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/dossiers/${dossierId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      router.push('/apps/venator')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setDeleting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-600">Chargement…</p>
  }

  if (error && !dossier) {
    return (
      <div className="border-2 border-red-600 rounded-2xl bg-white p-3 text-sm font-semibold text-red-600">
        {error}
      </div>
    )
  }

  if (!dossier) {
    return <p className="text-sm text-neutral-600">Dossier introuvable.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="border-2 border-red-600 rounded-2xl bg-white p-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Colonne gauche */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge type={dossier.type} />
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-black bg-[#F2F1E6]">
                    {DOSSIER_STATUT_LABELS[dossier.statut] ?? dossier.statut}
                  </span>
                  <span className="text-xs text-neutral-600">{PRIORITE_LABELS[dossier.priorite] ?? dossier.priorite}</span>
                </div>
                <h1 className="font-bold text-xl">{dossier.titre}</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {dossier.statut !== 'clos' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClore}
                    disabled={closing}
                    className="rounded-full border-2 border-black bg-white font-semibold shrink-0"
                  >
                    {closing ? 'Clôture…' : 'Clore le dossier'}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleSupprimer}
                  disabled={deleting}
                  className="bg-red-600 text-white border-2 border-black rounded-full font-semibold shrink-0 hover:bg-red-700"
                >
                  {deleting ? 'Suppression…' : '🗑 Supprimer le dossier'}
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="etapes">
            <TabsList>
              <TabsTrigger value="etapes">Étapes</TabsTrigger>
              <TabsTrigger value="fil">Fil</TabsTrigger>
            </TabsList>
            <TabsContent value="etapes">
              <EtapesTimeline dossierId={dossierId} etapes={etapes} onChange={loadDossier} />
            </TabsContent>
            <TabsContent value="fil">
              <FilPanel parentType="dossier" parentId={dossierId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          <div className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm">Tickets rattachés</h2>
              <Button
                type="button"
                onClick={() => setCreateTicketOpen(true)}
                className="bg-[#FFC300] border-2 border-black rounded-full font-bold text-xs px-3 py-1 h-auto shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] text-black hover:bg-[#FFC300]"
              >
                + Ticket
              </Button>
            </div>
            {tickets.length === 0 ? (
              <p className="text-xs text-neutral-600">Aucun ticket rattaché.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tickets.map((t) => (
                  <li key={t.id} className="border border-black rounded-xl p-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <TypeBadge type={t.type} />
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-black bg-[#F2F1E6]">
                        {TICKET_STATUT_LABELS[t.statut] ?? t.statut}
                      </span>
                    </div>
                    <p className="text-sm font-semibold truncate">{t.titre}</p>
                    {t.prestataire_nom && <p className="text-xs text-neutral-600 truncate">{t.prestataire_nom}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-3">
            <h2 className="font-bold text-sm mb-1">Pièces Estale</h2>
            <p className="text-xs text-neutral-600">Liens GED — V2</p>
          </div>
        </div>
      </div>

      <CreateTicketDialog
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
        coproId={dossier.copro_id}
        dossierId={dossierId}
        onCreated={loadTickets}
      />
    </div>
  )
}

function CreateTicketDialog({
  open,
  onOpenChange,
  coproId,
  dossierId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  coproId: string
  dossierId: string
  onCreated: () => void
}) {
  const [type, setType] = useState<TicketType>('intervention')
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [prestataireNom, setPrestataireNom] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = titre.trim().length > 0 && !submitting

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
          dossier_id: dossierId,
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
      setTitre('')
      setDescription('')
      setPrestataireNom('')
      setType('intervention')
      onOpenChange(false)
      onCreated()
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
          <DialogTitle>Nouveau ticket</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
              <SelectTrigger id="ticket-type">
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
            <Label htmlFor="ticket-titre">Titre</Label>
            <Input
              id="ticket-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Fuite chaufferie"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-prestataire">Prestataire</Label>
            <Input
              id="ticket-prestataire"
              value={prestataireNom}
              onChange={(e) => setPrestataireNom(e.target.value)}
              placeholder="Ex : Plomberie Martin"
              maxLength={200}
            />
          </div>

          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        </div>
        <DialogFooter>
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
