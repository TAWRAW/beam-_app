'use client'

import { useMemo, useState } from 'react'
import { useSWRConfig } from 'swr'
import { Plus, RefreshCw, Zap } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import DossierCard, { type ListItem } from './_components/DossierCard'
import TicketDetailDialog from './_components/TicketDetailDialog'
import CreateDossierDialog from './_components/CreateDossierDialog'
import TicketExpressDialog from './_components/TicketExpressDialog'
import EmettreOsDialog, { type OsTicket } from './_components/EmettreOsDialog'
import ChecklistPanel from './_components/ChecklistPanel'
import DndBoard from './_components/DndBoard'
import { JOURNAL_EVENT_FALLBACK, JOURNAL_EVENT_META } from './_components/journal-event-meta'
import { useVenatorNavState } from './_components/nav/useVenatorNavState'
import { useVenatorHotkey } from './_components/nav/useVenatorHotkey'
import { useDossierTypeCounts } from './_components/nav/useDossierTypeCounts'
import { useCopros, useJournal, useTickets } from '@/lib/venator/useVenator'
import { DOSSIER_STATUTS, type DossierStatut, type Ticket } from '@/lib/venator/types'
import { DOSSIER_TYPE_LABELS } from '@/lib/venator/labels'
import {
  venatorButtonNeutral,
  venatorButtonPrimary,
  venatorButtonSecondary,
  venatorMicroLabel,
  venatorSegmentedList,
  venatorSegmentedTrigger,
} from './_components/venator-ui-classes'

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR')
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-[var(--venator-radius-lg)] bg-venator-surface animate-pulse" />
      ))}
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {DOSSIER_STATUTS.map((statut) => (
        <div key={statut} className="flex flex-col gap-2">
          <div className="h-4 w-20 rounded bg-venator-surface animate-pulse" />
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-[var(--venator-radius-lg)] bg-venator-surface animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function VenatorDashboardPage() {
  const { mutate } = useSWRConfig()
  const { nav, setVue } = useVenatorNavState()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [ticketExpressOpen, setTicketExpressOpen] = useState(false)
  const [osDialogTicket, setOsDialogTicket] = useState<OsTicket | null>(null)
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null)
  // Détail d'un ticket ouvert depuis une carte (liste ou board).
  const [ticketDetailId, setTicketDetailId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  // Création au clavier — les dialogs eux-mêmes neutralisent ces touches (cf.
  // garde de saisie dans useVenatorHotkey), pas de risque de réouverture.
  useVenatorHotkey('n', () => setCreateOpen(true))
  useVenatorHotkey('t', () => setTicketExpressOpen(true))

  const ticketsQuery = useMemo(
    () => (nav.coproId !== 'all' ? `copro_id=${nav.coproId}` : ''),
    [nav.coproId]
  )

  const { data: coprosData } = useCopros()
  // Copro-filtrée uniquement (jamais par type) — sert au calcul des compteurs
  // par type (panneaux de nav) ET à la liste affichée ci-dessous, filtrée par
  // type côté client. Un seul appel réseau (cache SWR partagé avec VenatorShell).
  const { dossiers, isLoading: dossiersLoading } = useDossierTypeCounts(nav.coproId)
  const { data: ticketsData, isLoading: ticketsLoading } = useTickets(ticketsQuery)
  const loading = dossiersLoading || ticketsLoading

  const copros = coprosData?.copros ?? []
  const copro = nav.coproId !== 'all' ? copros.find((c) => c.id === nav.coproId) ?? null : null
  const filteredDossiers = useMemo(
    () => (nav.type === 'all' ? dossiers : dossiers.filter((d) => d.type === nav.type)),
    [dossiers, nav.type]
  )
  // Les tickets ont leur propre taxonomie (intervention/demande/signalement),
  // sans rapport avec les types de dossier — on ne les affiche que dans la vue
  // "Tous les types", pour éviter de les confronter à un filtre qui ne les concerne pas.
  const tickets = nav.type === 'all' ? ticketsData?.tickets ?? [] : []

  const { data: journalData, isLoading: journalLoading } = useJournal(copro ? nav.coproId : '')
  const journalEntries = journalData?.entries ?? []

  // Rafraîchit toutes les clés Venator (copros, dossiers, tickets, journal, checklist) après une mutation.
  function refreshAll() {
    return mutate((key) => typeof key === 'string' && key.startsWith('/api/venator/'))
  }

  async function handleSync() {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/copros/sync', { method: 'POST' })
      if (!res.ok) throw new Error(`Erreur sync ${res.status}`)
      await refreshAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  async function handleAjouterNote() {
    if (!note.trim() || noteSubmitting || !copro) return
    setNoteSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copro_id: copro.id, contenu: note.trim(), type_evenement: 'note' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      setNote('')
      await refreshAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setNoteSubmitting(false)
    }
  }

  async function handleTicketExpressCreated() {
    setConfirmMsg('Ticket express créé.')
    await refreshAll()
    setTimeout(() => setConfirmMsg(null), 3000)
  }

  async function handleOsEmis() {
    setConfirmMsg('OS envoyé.')
    await refreshAll()
    setTimeout(() => setConfirmMsg(null), 3000)
  }

  async function handleTicketCreatedForOs(ticket: Ticket) {
    setOsDialogTicket({ id: ticket.id, copro_id: ticket.copro_id, titre: ticket.titre })
    await refreshAll()
  }

  const coproById = useMemo(() => new Map(copros.map((c) => [c.id, c])), [copros])

  const listItems: ListItem[] = useMemo(() => {
    const fromDossiers: ListItem[] = filteredDossiers.map((d) => ({
      id: d.id,
      kind: 'dossier',
      type: d.type,
      titre: d.titre,
      statut: d.statut,
      priorite: d.priorite,
      coproNom: coproById.get(d.copro_id)?.nom ?? '—',
      copro_id: d.copro_id,
      created_at: d.created_at,
      href: `/apps/venator/dossiers/${d.id}`,
    }))
    const fromTickets: ListItem[] = tickets.map((t) => ({
      id: t.id,
      kind: 'ticket',
      type: t.type,
      titre: t.titre,
      statut: t.statut,
      priorite: null,
      coproNom: coproById.get(t.copro_id)?.nom ?? '—',
      copro_id: t.copro_id,
      created_at: t.created_at,
      href: t.dossier_id ? `/apps/venator/dossiers/${t.dossier_id}` : `/apps/venator?copro=${t.copro_id}`,
    }))
    return [...fromDossiers, ...fromTickets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [filteredDossiers, tickets, coproById])

  const boardItems: ListItem[] = useMemo(
    () =>
      filteredDossiers.map((d) => ({
        id: d.id,
        kind: 'dossier',
        type: d.type,
        titre: d.titre,
        statut: d.statut,
        priorite: d.priorite,
        coproNom: coproById.get(d.copro_id)?.nom ?? '—',
        copro_id: d.copro_id,
        created_at: d.created_at,
        href: `/apps/venator/dossiers/${d.id}`,
      })),
    [filteredDossiers, coproById]
  )

  const unassignedTicketItems: ListItem[] = useMemo(
    () =>
      tickets
        .filter((t) => !t.dossier_id)
        .map((t) => ({
          id: t.id,
          kind: 'ticket',
          type: t.type,
          titre: t.titre,
          statut: t.statut,
          priorite: null,
          coproNom: coproById.get(t.copro_id)?.nom ?? '—',
          copro_id: t.copro_id,
          created_at: t.created_at,
          href: `/apps/venator?copro=${t.copro_id}`,
        })),
    [tickets, coproById]
  )

  async function handleDossierStatutChange(dossierId: string, statut: DossierStatut) {
    try {
      const body = statut === 'clos' ? { action: 'clore' } : { statut }
      const res = await fetch(`/api/venator/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      await refreshAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de mise à jour du statut')
    }
  }

  async function handleDeleteItem(item: ListItem) {
    if (!window.confirm(`Supprimer définitivement ce ${item.kind === 'ticket' ? 'ticket' : 'dossier'} ? Cette action est irréversible.`)) return
    try {
      const endpoint = item.kind === 'ticket' ? `/api/venator/tickets/${item.id}` : `/api/venator/dossiers/${item.id}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      await refreshAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de suppression')
    }
  }

  async function handleTicketRattacher(ticketId: string, dossierId: string) {
    try {
      const res = await fetch(`/api/venator/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dossier_id: dossierId }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const dossier = dossiers.find((d) => d.id === dossierId)
      setConfirmMsg(`Ticket rattaché à ${dossier?.titre ?? 'dossier'}.`)
      await refreshAll()
      setTimeout(() => setConfirmMsg(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de rattachement')
    }
  }

  const heading = copro ? copro.nom : nav.type !== 'all' ? DOSSIER_TYPE_LABELS[nav.type as keyof typeof DOSSIER_TYPE_LABELS] : "Vue d'ensemble"
  const subheading = copro
    ? nav.type !== 'all'
      ? DOSSIER_TYPE_LABELS[nav.type as keyof typeof DOSSIER_TYPE_LABELS]
      : copro.reference
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[26px] font-semibold leading-tight tracking-[-0.02em] text-venator-fg">
            {heading}
          </h2>
          {subheading && <p className="mt-0.5 text-[13px] text-venator-fg-muted">{subheading}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          <Tabs value={nav.vue} onValueChange={(v) => setVue(v as 'liste' | 'board')}>
            <TabsList className={venatorSegmentedList}>
              <TabsTrigger value="liste" className={venatorSegmentedTrigger}>
                Liste
              </TabsTrigger>
              <TabsTrigger value="board" className={venatorSegmentedTrigger}>
                Board
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
            aria-label="Synchroniser les copropriétés"
            title={syncing ? 'Synchronisation…' : 'Synchroniser les copropriétés'}
            className={cn(venatorButtonSecondary, 'h-8 w-8')}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTicketExpressOpen(true)}
            title="Ticket express (T)"
            className={cn(venatorButtonSecondary, 'h-8 gap-1.5 px-3')}
          >
            <Zap className="h-3.5 w-3.5" />
            Ticket express
            <kbd className="font-sans text-[10.5px] text-venator-fg-faint">T</kbd>
          </Button>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            title="Nouveau dossier (N)"
            className={cn(venatorButtonPrimary, 'h-8 gap-1.5 px-3.5')}
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau dossier
            <kbd className="font-sans text-[10.5px] opacity-60">N</kbd>
          </Button>
        </div>
      </div>

      {confirmMsg && (
        <div className="rounded-[var(--venator-radius-md)] bg-venator-surface-2 p-3 text-sm font-medium text-venator-fg">
          {confirmMsg}
        </div>
      )}

      {error && (
        <div className="rounded-[var(--venator-radius-md)] border border-venator-danger/40 bg-venator-danger/10 p-3 text-sm font-medium text-venator-danger">
          {error}
        </div>
      )}

      {copro && (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-5 md:col-span-2">
            <h3 className={venatorMicroLabel}>Journal technique</h3>

            {journalLoading ? (
              <div className="h-16 rounded bg-venator-surface-2 animate-pulse" />
            ) : journalEntries.length === 0 ? (
              <p className="text-[13px] text-venator-fg-faint">Aucun événement pour l&apos;instant.</p>
            ) : (
              <ul className="flex max-h-64 flex-col divide-y divide-venator-border overflow-y-auto">
                {journalEntries.map((e) => {
                  const meta = JOURNAL_EVENT_META[e.type_evenement] ?? JOURNAL_EVENT_FALLBACK
                  const Icon = meta.icon
                  return (
                    <li key={e.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={venatorMicroLabel}>{meta.label}</span>
                          <span className="text-[10.5px] tabular-nums text-venator-fg-faint">
                            {formatDate(e.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-[13px] font-normal leading-relaxed text-venator-fg">
                          {e.contenu}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note rapide…"
                maxLength={5000}
                className="min-h-[72px] resize-none border-0 bg-venator-surface-2 text-[13px] text-venator-fg placeholder:text-venator-fg-faint focus-visible:ring-1 focus-visible:ring-venator-border-strong"
              />
              <Button
                type="button"
                onClick={handleAjouterNote}
                disabled={!note.trim() || noteSubmitting}
                className={cn(venatorButtonNeutral, 'h-8 self-end px-3')}
              >
                {noteSubmitting ? 'Ajout…' : 'Ajouter au journal'}
              </Button>
            </div>
          </div>

          <ChecklistPanel coproId={copro.id} />
        </section>
      )}

      {loading ? (
        nav.vue === 'liste' ? <ListSkeleton /> : <BoardSkeleton />
      ) : nav.vue === 'liste' ? (
        <div className="flex flex-col gap-1.5">
          {listItems.length === 0 && (
            <p className="text-[13px] text-venator-fg-faint">Aucun dossier ni ticket pour l&apos;instant.</p>
          )}
          {listItems.map((item) => (
            <DossierCard
              key={`${item.kind}-${item.id}`}
              item={item}
              onDelete={handleDeleteItem}
              onOsEmis={handleOsEmis}
              onOuvrirTicket={setTicketDetailId}
            />
          ))}
        </div>
      ) : (
        <DndBoard
          boardItems={boardItems}
          unassignedTickets={unassignedTicketItems}
          onDossierStatutChange={handleDossierStatutChange}
          onTicketRattacher={handleTicketRattacher}
          onDelete={handleDeleteItem}
          onOsEmis={handleOsEmis}
          onOuvrirTicket={setTicketDetailId}
        />
      )}

      <TicketDetailDialog
        ticket={ticketsData?.tickets.find((t) => t.id === ticketDetailId) ?? null}
        open={ticketDetailId !== null}
        onOpenChange={(open) => {
          if (!open) setTicketDetailId(null)
        }}
      />

      <CreateDossierDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        copros={copros}
        defaultCoproId={nav.coproId !== 'all' ? nav.coproId : undefined}
        onCreated={() => refreshAll()}
      />

      <TicketExpressDialog
        open={ticketExpressOpen}
        onOpenChange={setTicketExpressOpen}
        copros={copros}
        defaultCoproId={nav.coproId !== 'all' ? nav.coproId : undefined}
        onCreated={handleTicketExpressCreated}
        onCreatedForOs={handleTicketCreatedForOs}
      />

      <EmettreOsDialog
        ticket={osDialogTicket}
        open={osDialogTicket !== null}
        onOpenChange={(open) => {
          if (!open) setOsDialogTicket(null)
        }}
        onEmis={handleOsEmis}
      />
    </div>
  )
}
