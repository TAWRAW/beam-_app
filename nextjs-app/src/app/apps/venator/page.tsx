'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import DossierCard, { type ListItem } from './_components/DossierCard'
import CreateDossierDialog from './_components/CreateDossierDialog'
import { DOSSIER_STATUTS, DOSSIER_TYPES, type Copro, type Dossier, type DossierType, type Ticket } from '@/lib/venator/types'

const TYPE_LABELS: Record<DossierType, string> = {
  sinistre: 'Sinistre',
  travaux: 'Travaux',
  procedure: 'Procédure',
  mutation: 'Mutation',
  ag: 'AG',
  conseil_syndical: 'Conseil syndical',
  vie_copro: 'Vie copro',
}

const STATUT_LABELS: Record<(typeof DOSSIER_STATUTS)[number], string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  en_attente: 'En attente',
  clos: 'Clos',
}

type Filters = { copro_id: string; type: string; vue: 'liste' | 'board' }

export default function VenatorDashboardPage() {
  const [copros, setCopros] = useState<Copro[]>([])
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filters, setFilters] = useState<Filters>({ copro_id: 'all', type: 'all', vue: 'liste' })
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const loadCopros = useCallback(async () => {
    try {
      const res = await fetch('/api/venator/copros')
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const { copros } = await res.json()
      setCopros(copros ?? [])
    } catch {
      setCopros([])
    }
  }, [])

  const loadDossiers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.copro_id !== 'all') params.set('copro_id', filters.copro_id)
      if (filters.type !== 'all') params.set('type', filters.type)

      const [dossiersRes, ticketsRes] = await Promise.all([
        fetch(`/api/venator/dossiers?${params.toString()}`),
        fetch(`/api/venator/tickets${filters.copro_id !== 'all' ? `?copro_id=${filters.copro_id}` : ''}`),
      ])
      if (!dossiersRes.ok) throw new Error(`Erreur dossiers ${dossiersRes.status}`)
      if (!ticketsRes.ok) throw new Error(`Erreur tickets ${ticketsRes.status}`)
      const dossiersBody = await dossiersRes.json()
      const ticketsBody = await ticketsRes.json()
      setDossiers(dossiersBody.dossiers ?? [])
      setTickets(ticketsBody.tickets ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setDossiers([])
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [filters.copro_id, filters.type])

  useEffect(() => {
    loadCopros()
  }, [loadCopros])

  useEffect(() => {
    loadDossiers()
  }, [loadDossiers])

  async function handleSync() {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/copros/sync', { method: 'POST' })
      if (!res.ok) throw new Error(`Erreur sync ${res.status}`)
      await loadCopros()
      await loadDossiers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
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
        href: t.dossier_id ? `/apps/venator/dossiers/${t.dossier_id}` : `/apps/venator/tickets/${t.id}`,
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
            {syncing ? 'Sync…' : '⟳ Sync copros'}
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

      {error && (
        <div className="border-2 border-red-600 rounded-2xl bg-white p-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Chargement…</p>
      ) : filters.vue === 'liste' ? (
        <div className="flex flex-col gap-2">
          {listItems.length === 0 && (
            <p className="text-sm text-neutral-600">Aucun dossier ni ticket pour l'instant.</p>
          )}
          {listItems.map((item) => (
            <DossierCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {DOSSIER_STATUTS.map((statut) => (
            <div key={statut} className="flex flex-col gap-2">
              <h2 className="text-xs font-bold uppercase px-2">{STATUT_LABELS[statut]}</h2>
              <div className="flex flex-col gap-2">
                {boardItems
                  .filter((item) => item.statut === statut)
                  .map((item) => (
                    <DossierCard key={item.id} item={item} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateDossierDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        copros={copros}
        defaultCoproId={filters.copro_id !== 'all' ? filters.copro_id : undefined}
      />
    </div>
  )
}
