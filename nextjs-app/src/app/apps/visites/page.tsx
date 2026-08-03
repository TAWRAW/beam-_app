'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Condo {
  id: string
  name: string
  address?: string
  zipCode?: string
  city?: string
}

export default function VisitesIndex() {
  const [condos, setCondos] = useState<Condo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/estale/condos')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setCondos(d.condos || [])
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Chargement des copropriétés…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (condos.length === 0) return <p>Aucune copropriété trouvée.</p>

  return (
    <div className="space-y-3">
      <p className="text-sm text-app-fg-muted">
        Sélectionne une copropriété pour voir / créer une visite.
      </p>
      {condos.map((c) => (
        <Link
          key={c.id}
          href={`/apps/visites/${c.id}` as any}
          className="block bg-app-surface rounded-2xl border-2 border-app-border-strong p-4 shadow-[4px_4px_0px_0px_var(--app-border-strong)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_var(--app-border-strong)] transition"
        >
          <div className="font-bold">{c.name}</div>
          {(c.address || c.city) && (
            <div className="text-sm text-app-fg-muted">
              {[c.address, c.zipCode, c.city].filter(Boolean).join(' ')}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
