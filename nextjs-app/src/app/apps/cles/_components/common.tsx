'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ----- Types côté client (miroir des réponses API) -----

export interface CondoOption {
  id: string
  name: string
  reference?: string
  zipCode?: string
  city?: string
}

export interface OwnerOption {
  id: string
  reference: string
  fullname: string
  isPro?: boolean | null
  companyName?: string | null
}

// ----- Fetchers -----

export async function fetchCondos(): Promise<CondoOption[]> {
  const res = await fetch('/api/estale/condos')
  const json = await res.json()
  return (json.condos ?? []) as CondoOption[]
}

export async function fetchOwners(condoId: string): Promise<OwnerOption[]> {
  const res = await fetch(`/api/estale/condos/${condoId}/owners`)
  const json = await res.json()
  if (json.error && (!json.owners || json.owners.length === 0)) {
    throw new Error(json.error)
  }
  return (json.owners ?? []) as OwnerOption[]
}

// ----- Hook : liste des copros (chargée une fois) -----

export function useCondos() {
  const [condos, setCondos] = useState<CondoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchCondos()
      .then((c) => {
        if (alive) setCondos(c)
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Erreur')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { condos, loading, error }
}

// ----- Sélecteur de copropriété (charte brutalist) -----

export function CondoSelect({
  condos,
  value,
  onChange,
  placeholder = 'Choisir une copropriété…',
}: {
  condos: CondoOption[]
  value: string | null
  onChange: (id: string) => void
  placeholder?: string
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full max-w-md border-2 border-black bg-white font-semibold shadow-[2px_2px_0px_0px_#000]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {condos.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.reference ? `${c.reference} — ` : ''}
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ----- Petit helper format € -----

export function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
