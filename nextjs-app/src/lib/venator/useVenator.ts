// src/lib/venator/useVenator.ts — hooks SWR pour le dashboard + fiches Venator (client only)
'use client'

import useSWR from 'swr'
import type { Checklist, ChecklistItem, Copro, Dossier, DossierType, Etape, FilMessage, JournalEntry, Ticket } from '@/lib/venator/types'
import type { GabaritEtape } from '@/lib/venator/gabarits'

export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json()
  })

// Constructeurs de clés SWR — réutilisés par les composants pour `mutate(key, ...)` ciblés.
export const keys = {
  copros: () => '/api/venator/copros',
  dossiers: (query: string) => `/api/venator/dossiers?${query}`,
  dossier: (id: string) => `/api/venator/dossiers/${id}`,
  tickets: (query: string) => `/api/venator/tickets?${query}`,
  fil: (parentType: 'dossier' | 'ticket', parentId: string) =>
    `/api/venator/fil?parent_type=${parentType}&parent_id=${parentId}`,
  journal: (coproId: string) => `/api/venator/journal?copro_id=${coproId}`,
  checklist: (coproId: string) => `/api/venator/checklists?copro_id=${coproId}`,
  gabarits: () => '/api/venator/gabarits',
}

export function useCopros() {
  return useSWR<{ copros: Copro[] }>(keys.copros(), fetcher)
}

export function useDossiers(query: string) {
  return useSWR<{ dossiers: Dossier[] }>(keys.dossiers(query), fetcher)
}

export function useTickets(query: string) {
  return useSWR<{ tickets: Ticket[] }>(keys.tickets(query), fetcher)
}

export function useDossier(id: string) {
  return useSWR<{ dossier: Dossier; etapes: Etape[] }>(id ? keys.dossier(id) : null, fetcher)
}

export function useFil(parentType: 'dossier' | 'ticket', parentId: string) {
  return useSWR<{ messages: FilMessage[] }>(parentId ? keys.fil(parentType, parentId) : null, fetcher)
}

export function useJournal(coproId: string) {
  return useSWR<{ entries: JournalEntry[] }>(coproId ? keys.journal(coproId) : null, fetcher)
}

/** Gabarits d'étapes réglés par type de dossier. Un type absent = aucune étape à la création. */
export function useGabarits() {
  return useSWR<{ gabarits: Partial<Record<DossierType, GabaritEtape[]>> }>(keys.gabarits(), fetcher)
}

export function useChecklist(coproId: string) {
  return useSWR<{ etat: { checklist: Checklist; items: ChecklistItem[]; progression: number } | null }>(
    coproId ? keys.checklist(coproId) : null,
    fetcher
  )
}
