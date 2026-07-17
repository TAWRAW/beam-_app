// src/lib/venator/useVenator.ts — hooks SWR pour le dashboard + copros Venator (client only)
'use client'

import useSWR from 'swr'
import type { Copro, Dossier, Ticket } from '@/lib/venator/types'

export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json()
  })

export function useCopros() {
  return useSWR<{ copros: Copro[] }>('/api/venator/copros', fetcher)
}

export function useDossiers(query: string) {
  return useSWR<{ dossiers: Dossier[] }>(`/api/venator/dossiers?${query}`, fetcher)
}

export function useTickets(query: string) {
  return useSWR<{ tickets: Ticket[] }>(`/api/venator/tickets?${query}`, fetcher)
}
