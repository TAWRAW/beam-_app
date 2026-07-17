'use client'

import { useMemo, useState } from 'react'
import { useSWRConfig } from 'swr'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import DossierCard, { type ListItem } from './_components/DossierCard'
import CreateDossierDialog from './_components/CreateDossierDialog'
import TicketExpressDialog from './_components/TicketExpressDialog'
import DndBoard from './_components/DndBoard'
import { useCopros, useDossiers, useTickets } from '@/lib/venator/useVenator'
import { DOSSIER_TYPES, DOSSIER_STATUTS, type DossierStatut, type DossierType } from '@/lib/venator/types'

const TYPE_LABELS: Record<DossierType, string> = {
  sinistre: 'Sinistre',
  travaux: 'Travaux',
  procedure: 'Procédure',
  mutation: 'Mutation',
  ag: 'AG',
  conseil_syndical: 'Conseil syndical',
  vie_copro: 'Vie copro',
  autre: 'Autre',
}

type Filters = { copro_id: string; type: string; vue: 'liste' | 'board' }

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-2xl border-2 border-black bg-neutral-200 animate-pulse" />
      ))}
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {DOSSIER_STATUTS.map((statut) => (
        <div key={statut} className="flex flex-col gap-2">
          <div className="h-4 w-20 rounded bg-neutral-200 animate-pulse" />
          {[0, 1].map((i) => (
            <div key={i} className="h-16 rounded-2xl border-2 border-black bg-neutral-200 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function VenatorDashboardPage() {
  const { mutate } = useSWRConfig()
  const [filters, setFilters] = useState<Filters>({ copro_id: 'all', type: 'all', vue: 'liste' })
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [ticketExpressOpen, setTicketExpressOpen] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null)

  const dossiersQuery = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.copro_id !== 'all') params.set('copro_id', filters.copro_id)
    if (filters.type !== 'all') params.set('type', filters.type)
    return params.toString()
  }, [filters.copro_id, filters.type])

  const ticketsQuery = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.copro_id !== 'all') params.set('copro_id', filters.copro_id)
    return params.toString()
  }, [filters.copro_id])

  const { data: coprosData } = useCopros()
  const { data: dossiersData, isLoading: dossiersLoading } = useDossiers(dossiersQuery)
  const { data: ticketsData, isLoading: ticketsLoading } = useTickets(ticketsQuery)

  const copros = coprosData?.copros ?? []
  const dossiers = dossiersData?.dossiers ?? []
  const tickets = ticketsData?.tickets ?? []
  const loading = dossiersLoading || ticketsLoading

  // Rafraîchit toutes les clés Venator (copros, dossiers filtrés, tickets filtrés) après une mutation.
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

  async function handleTicketExpressCreated() {
    setConfirmMsg('Ticket express créé.')
    await refreshAll()
    setTimeout(() => setConfirmMsg(null), 3000)
  }

  const coproById = useMemo(() => new Map(copros.map((c) => [c.id, c])), [copros])

  const listItems: ListItem[] = useMemo(() => {
    const fromDossiers: ListItem[] = dossiers.map((d) => ({
      id: d.id,
      kind: 'dossier',
      type: d.type,
      titre: d.titre,
      statut: d.statut,
      priorite: d.priorite,
      coproNom: coproById.get(d.copro_id)?.nom ?? '—',
      created_at: d.created_at,
      href: `/apps/venator/dossiers/${d.id}`,
    }))
    const fromTickets: ListItem[] = tickets
      .filter((t) => filters.type === 'all' || filters.type === t.type)
      .map((t) => ({
        id: t.id,
        kind: 'ticket',
        type: t.type,
        titre: t.titre,
        statut: t.statut,
        priorite: null,
        coproNom: coproById.get(t.copro_id)?.nom ?? '—',
        created_at: t.created_at,
        href: t.dossier_id ? `/apps/venator/dossiers/${t.dossier_id}` : `/apps/venator/copros/${t.copro_id}`,
      }))
    return [...fromDossiers, ...fromTickets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [dossiers, tickets, coproById, filters.type])

  const boardItems: ListItem[] = useMemo(
    () =>
      dossiers.map((d) => ({
        id: d.id,
        kind: 'dossier',
        type: d.type,
        titre: d.titre,
        statut: d.statut,
        priorite: d.priorite,
        coproNom: coproById.get(d.copro_id)?.nom ?? '—',
        created_at: d.created_at,
        href: `/apps/venator/dossiers/${d.id}`,
      })),
    [dossiers, coproById]
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
          created_at: t.created_at,
          href: `/apps/venator/copros/${t.copro_id}`,
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

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de filtres */}
      <div className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-3 flex flex-wrap items-center gap-3">
        <Select value={filters.copro_id} onValueChange={(v) => setFilters((f) => ({ ...f, copro_id: v }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Copropriété" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les copros</SelectItem>
            {copros.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {DOSSIER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={filters.vue} onValueChange={(v) => setFilters((f) => ({ ...f, vue: v as Filters['vue'] }))}>
          <TabsList>
            <TabsTrigger value="liste">Liste</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-full border-2 border-black bg-white font-semibold"
          >
            {syncing ? (
              <span className="inline-flex items-center gap-1.5">
                <span className={cn('h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin')} />
                Sync…
              </span>
            ) : (
              '⟳ Sync copros'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTicketExpressOpen(true)}
            className="rounded-full border-2 border-black bg-white font-semibold"
          >
            + Ticket express
          </Button>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-[#FFC300] border-2 border-black rounded-full font-bold shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] text-black hover:bg-[#FFC300]"
          >
            + Dossier
          </Button>
        </div>
      </div>

      {confirmMsg && (
        <div className="border-2 border-black rounded-2xl bg-green-100 p-3 text-sm font-semibold">
          {confirmMsg}
        </div>
      )}

      {error && (
        <div className="border-2 border-red-600 rounded-2xl bg-white p-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        filters.vue === 'liste' ? <ListSkeleton /> : <BoardSkeleton />
      ) : filters.vue === 'liste' ? (
        <div className="flex flex-col gap-2">
          {listItems.length === 0 && (
            <p className="text-sm text-neutral-600">Aucun dossier ni ticket pour l'instant.</p>
          )}
          {listItems.map((item) => (
            <DossierCard key={`${item.kind}-${item.id}`} item={item} onDelete={handleDeleteItem} />
          ))}
        </div>
      ) : (
        <DndBoard
          boardItems={boardItems}
          unassignedTickets={unassignedTicketItems}
          onDossierStatutChange={handleDossierStatutChange}
          onTicketRattacher={handleTicketRattacher}
          onDelete={handleDeleteItem}
        />
      )}

      <CreateDossierDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        copros={copros}
        defaultCoproId={filters.copro_id !== 'all' ? filters.copro_id : undefined}
        onCreated={() => refreshAll()}
      />

      <TicketExpressDialog
        open={ticketExpressOpen}
        onOpenChange={setTicketExpressOpen}
        copros={copros}
        defaultCoproId={filters.copro_id !== 'all' ? filters.copro_id : undefined}
        onCreated={handleTicketExpressCreated}
      />
    </div>
  )
}
