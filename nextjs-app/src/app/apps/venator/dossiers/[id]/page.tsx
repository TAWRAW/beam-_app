'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import { Pencil, Send, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import TicketDetailDialog from '../../_components/TicketDetailDialog'
import LierLabelDialog from '../../_components/LierLabelDialog'
import ModifierDossierDialog from '../../_components/ModifierDossierDialog'
import PiecesPanel from '../../_components/PiecesPanel'
import { dernierSegment } from '@/lib/venator/google/labels'
import {
  venatorButtonPrimary,
  venatorButtonSecondary,
  venatorDialogContent,
  venatorInput,
  venatorLabel,
  venatorMicroLabel,
  venatorSegmentedList,
  venatorSegmentedTrigger,
  venatorSelectContent,
  venatorSelectItem,
  venatorSelectTrigger,
} from '../../_components/venator-ui-classes'
import { fetcher, keys, useCopros, useDossier } from '@/lib/venator/useVenator'
import { TICKET_TYPES, VOTE_STATUTS_PROCHAINE_AG, type Ticket, type TicketType, type VoteStatut } from '@/lib/venator/types'
import { TICKET_TYPE_LABELS } from '@/lib/venator/labels'

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

const TICKET_STATUT_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  os_envoye: 'OS envoyé',
  planifie: 'Planifié',
  realise: 'Réalisé',
  clos: 'Clos',
}

function DossierSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-24 rounded-[var(--venator-radius-lg)] bg-venator-surface animate-pulse" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2 md:col-span-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-[var(--venator-radius-lg)] bg-venator-surface animate-pulse" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-32 rounded-[var(--venator-radius-lg)] bg-venator-surface animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function DossierPage({ params }: { params: { id: string } }) {
  const dossierId = params.id
  const router = useRouter()

  const { data, error: loadError, isLoading } = useDossier(dossierId)
  const dossier = data?.dossier ?? null
  const etapes = data?.etapes ?? []

  const ticketsKey = dossier ? keys.tickets(`copro_id=${dossier.copro_id}&dossier_id=${dossierId}`) : null
  const { data: ticketsData, mutate: mutateTickets } = useSWR<{ tickets: Ticket[] }>(ticketsKey, fetcher)
  const { data: coprosData, mutate: mutateCopros } = useCopros()
  const copro = coprosData?.copros.find((c) => c.id === dossier?.copro_id) ?? null
  const tickets = ticketsData?.tickets ?? []

  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [createTicketOpen, setCreateTicketOpen] = useState(false)
  const [ticketDetail, setTicketDetail] = useState<Ticket | null>(null)
  const [votePending, setVotePending] = useState(false)
  const [modifOpen, setModifOpen] = useState(false)
  const [labelDialogOpen, setLabelDialogOpen] = useState(false)
  const [labelPending, setLabelPending] = useState(false)

  /** Rattache ou détache le libellé Gmail (null/null pour délier). */
  async function lierLabel(labelId: string | null, chemin: string | null) {
    if (labelPending) return
    setLabelPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail_label_id: labelId, gmail_label_chemin: chemin }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`)
      }
      await mutate(keys.dossier(dossierId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de liaison')
    } finally {
      setLabelPending(false)
    }
  }

  // État de vote du dossier. Optimiste : le choix s'affiche aussitôt, on
  // recharge derrière et on revient en arrière si l'appel échoue.
  async function handleVoteChange(vote: VoteStatut) {
    if (votePending) return
    setVotePending(true)
    setError(null)
    const previous = data
    if (data) mutate(keys.dossier(dossierId), { ...data, dossier: { ...data.dossier, vote_statut: vote } }, { revalidate: false })
    try {
      const res = await fetch(`/api/venator/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_statut: vote }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`)
      }
      await mutate(keys.dossier(dossierId))
    } catch (e) {
      mutate(keys.dossier(dossierId), previous, { revalidate: true })
      setError(e instanceof Error ? e.message : 'Erreur de mise à jour')
    } finally {
      setVotePending(false)
    }
  }

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
      await mutate(keys.dossier(dossierId))
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
      await mutate((k) => typeof k === 'string' && k.startsWith('/api/venator/dossiers'))
      router.push('/apps/venator')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setDeleting(false)
    }
  }

  if (isLoading) {
    return <DossierSkeleton />
  }

  if (loadError && !dossier) {
    return (
      <div className="rounded-[var(--venator-radius-md)] border border-venator-danger/40 bg-venator-danger/10 p-3 text-sm font-medium text-venator-danger">
        {loadError instanceof Error ? loadError.message : 'Erreur de chargement'}
      </div>
    )
  }

  if (!dossier) {
    return <p className="text-sm text-venator-fg-muted">Dossier introuvable.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-[var(--venator-radius-md)] border border-venator-danger/40 bg-venator-danger/10 p-3 text-sm font-medium text-venator-danger">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="flex flex-col gap-2 rounded-[var(--venator-radius-lg)] bg-venator-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className={cn(venatorMicroLabel, 'flex flex-wrap items-center gap-x-2 gap-y-1')}>
                  <TypeBadge type={dossier.type} />
                  <span className="text-venator-fg-faint">·</span>
                  <span>{DOSSIER_STATUT_LABELS[dossier.statut] ?? dossier.statut}</span>
                  <span className="text-venator-fg-faint">·</span>
                  <span className={cn(dossier.priorite === 1 && 'text-venator-accent')}>
                    {PRIORITE_LABELS[dossier.priorite] ?? dossier.priorite}
                  </span>
                </div>
                <h1 className="text-[22px] font-semibold leading-snug tracking-[-0.02em] text-venator-fg">
                  {dossier.titre}
                </h1>

                {/* Une case, pas un menu : inscrire un sujet à l'assemblée est un
                    geste qu'on répète toute l'année, il doit coûter un clic. Les
                    états voté/refusé/reporté restent en base pour la suite, mais
                    l'interface ne demande que la seule question utile ici. */}
                <label className="mt-1.5 inline-flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={VOTE_STATUTS_PROCHAINE_AG.includes(dossier.vote_statut)}
                    disabled={votePending}
                    onChange={(e) => handleVoteChange(e.target.checked ? 'a_voter' : 'sans_objet')}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-venator-accent"
                  />
                  <span
                    className={cn(
                      'text-[12.5px] font-medium transition-colors',
                      VOTE_STATUTS_PROCHAINE_AG.includes(dossier.vote_statut)
                        ? 'text-venator-fg'
                        : 'text-venator-fg-muted'
                    )}
                  >
                    Prochaine AG
                  </span>
                  {dossier.vote_statut === 'reporte' && (
                    <span className={venatorMicroLabel}>reporté</span>
                  )}
                </label>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Mailing ciblé pré-rattaché au dossier : la note envoyée alimentera le
                    journal du dossier et portera son id dans la trace mailing_notes. */}
                {copro && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/apps/mailings?copro=${encodeURIComponent(copro.reference)}&dossier=${dossier.id}`,
                      )
                    }
                    title="Créer un mailing rattaché à ce dossier"
                    className={cn(venatorButtonSecondary, 'h-8 shrink-0 px-3')}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Mailing
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setModifOpen(true)}
                  aria-label="Modifier le dossier"
                  title="Modifier le dossier (titre, type, priorité)"
                  className={cn(venatorButtonSecondary, 'h-8 w-8 shrink-0')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {dossier.statut !== 'clos' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClore}
                    disabled={closing}
                    className={cn(venatorButtonSecondary, 'h-8 shrink-0 px-3')}
                  >
                    {closing ? 'Clôture…' : 'Clore le dossier'}
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleSupprimer}
                  disabled={deleting}
                  aria-label="Supprimer le dossier"
                  title={deleting ? 'Suppression…' : 'Supprimer le dossier'}
                  className={cn(venatorButtonSecondary, 'h-8 w-8 shrink-0 text-venator-fg-faint hover:bg-venator-danger/10 hover:text-venator-danger')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="etapes">
            <TabsList className={cn(venatorSegmentedList, 'w-fit')}>
              <TabsTrigger value="etapes" className={venatorSegmentedTrigger}>
                Étapes
              </TabsTrigger>
              <TabsTrigger value="fil" className={venatorSegmentedTrigger}>
                Fil
              </TabsTrigger>
            </TabsList>
            <TabsContent value="etapes">
              <EtapesTimeline dossierId={dossierId} dossier={dossier} etapes={etapes} />
            </TabsContent>
            <TabsContent value="fil">
              <FilPanel
                parentType="dossier"
                parentId={dossierId}
                labelChemin={dossier?.gmail_label_chemin ?? null}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne droite */}
        {/* Bloc Mails placé avant les tickets : c'est le contexte d'un dossier
            (ce qui s'est dit) avant ses interventions (ce qui est commandé). */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className={venatorMicroLabel}>Mails</h2>
              <Button
                type="button"
                onClick={() => setLabelDialogOpen(true)}
                className={cn(venatorButtonSecondary, 'h-7 px-2.5 text-[12px]')}
              >
                {dossier.gmail_label_id ? 'Changer' : 'Lier un libellé'}
              </Button>
            </div>
            {dossier.gmail_label_id ? (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {/* Dernier segment seul, conformément au choix retenu ; le chemin
                      complet reste en info-bulle pour distinguer deux « Toiture ». */}
                  <p
                    className="truncate text-[13px] font-medium text-venator-fg"
                    title={dossier.gmail_label_chemin ?? undefined}
                  >
                    {dernierSegment(dossier.gmail_label_chemin ?? '')}
                  </p>
                  {dossier.gmail_label_erreur ? (
                    <p className="mt-0.5 text-[11px] font-medium text-venator-danger">
                      {dossier.gmail_label_erreur} — relier un libellé existant.
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-venator-fg-faint">
                      {dossier.gmail_last_sync
                        ? `Relevé le ${new Date(dossier.gmail_last_sync).toLocaleString('fr-FR')}`
                        : 'Pas encore relevé'}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => lierLabel(null, null)}
                  disabled={labelPending}
                  className="shrink-0 text-[12px] text-venator-fg-faint transition-colors hover:text-venator-danger"
                >
                  Délier
                </button>
              </div>
            ) : (
              <p className="text-[13px] text-venator-fg-faint">
                Aucun libellé lié : les échanges Gmail de ce dossier ne remontent pas.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className={venatorMicroLabel}>Tickets rattachés</h2>
              <Button
                type="button"
                onClick={() => setCreateTicketOpen(true)}
                className={cn(venatorButtonSecondary, 'h-7 px-2.5 text-[12px]')}
              >
                + Ticket
              </Button>
            </div>
            {tickets.length === 0 ? (
              <p className="text-[13px] text-venator-fg-faint">Aucun ticket rattaché.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-venator-border">
                {tickets.map((t) => (
                  <li key={t.id}>
                    {/* Cliquable : la description saisie à la création n'était
                        visible nulle part une fois le ticket enregistré. */}
                    <button
                      type="button"
                      onClick={() => setTicketDetail(t)}
                      className="-mx-2 w-[calc(100%+1rem)] rounded-[var(--venator-radius-md)] px-2 py-2.5 text-left transition-colors hover:bg-venator-surface-2"
                    >
                      <div className={cn(venatorMicroLabel, 'mb-1 flex flex-wrap items-center gap-x-2')}>
                        <TypeBadge type={t.type} />
                        <span className="text-venator-fg-faint">·</span>
                        <span>{TICKET_STATUT_LABELS[t.statut] ?? t.statut}</span>
                      </div>
                      <p className="truncate text-[13px] font-medium text-venator-fg">{t.titre}</p>
                      {t.prestataire_nom && (
                        <p className="truncate text-[12px] text-venator-fg-muted">{t.prestataire_nom}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {copro && (
            <PiecesPanel
              dossier={dossier}
              copro={copro}
              onCoproLiee={() => mutateCopros()}
              onDossierCree={() => mutate(keys.dossier(dossierId))}
            />
          )}
        </div>
      </div>

      <ModifierDossierDialog
        dossier={dossier}
        open={modifOpen}
        onOpenChange={setModifOpen}
        onModifie={() => mutate(keys.dossier(dossierId))}
      />

      <LierLabelDialog
        open={labelDialogOpen}
        onOpenChange={setLabelDialogOpen}
        labelActuelId={dossier.gmail_label_id}
        onChoisir={(label) => lierLabel(label.id, label.chemin)}
      />

      <TicketDetailDialog
        ticket={ticketDetail}
        open={ticketDetail !== null}
        onOpenChange={(open) => {
          if (!open) setTicketDetail(null)
        }}
      />

      <CreateTicketDialog
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
        coproId={dossier.copro_id}
        dossierId={dossierId}
        onCreated={() => mutateTickets()}
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
      <DialogContent className={venatorDialogContent}>
        <DialogHeader>
          <DialogTitle className="text-venator-fg">Nouveau ticket</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-type" className={venatorLabel}>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
              <SelectTrigger id="ticket-type" className={venatorSelectTrigger}>
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
            <Label htmlFor="ticket-titre" className={venatorLabel}>Titre</Label>
            <Input
              id="ticket-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Fuite chaufferie"
              maxLength={200}
              className={venatorInput}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-description" className={venatorLabel}>Description</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              className={venatorInput}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-prestataire" className={venatorLabel}>Prestataire</Label>
            <Input
              id="ticket-prestataire"
              value={prestataireNom}
              onChange={(e) => setPrestataireNom(e.target.value)}
              placeholder="Ex : Plomberie Martin"
              maxLength={200}
              className={venatorInput}
            />
          </div>

          {error && <p className="text-sm font-medium text-venator-danger">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit} className={venatorButtonPrimary}>
            {submitting ? 'Création…' : 'Créer le ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
