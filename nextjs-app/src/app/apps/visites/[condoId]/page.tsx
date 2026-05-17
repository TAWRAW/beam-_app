'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { EstaleVisit } from '@/lib/estale-api'

export default function VisitesCondoPage({ params }: { params: { condoId: string } }) {
  const [visits, setVisits] = useState<EstaleVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(
      `/api/estale/visits?condoId=${encodeURIComponent(params.condoId)}&archived=false`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setVisits(d.visits || [])
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [params.condoId])

  return (
    <div className="space-y-4">
      <Link
        href={`/apps/visites/${params.condoId}/new`}
        className="block w-full text-center bg-primary text-black py-3 rounded-full font-bold border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition"
      >
        + Nouvelle visite
      </Link>

      <h2 className="font-bold uppercase tracking-wide text-sm">Visites en cours</h2>
      {loading && <p>Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && visits.length === 0 && (
        <p className="text-gray-500">Aucune visite en cours.</p>
      )}
      <div className="space-y-2">
        {visits.map((v) => (
          <Link
            key={v.id}
            href={`/apps/visites/${params.condoId}/${v.id}`}
            className="block bg-white rounded-2xl border-2 border-black p-3 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition"
          >
            <div className="font-bold">{v.object || '(sans objet)'}</div>
            <div className="text-sm text-black/60">
              {new Date(v.date).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
              {' • '}
              {v.comments?.length || 0} ligne{(v.comments?.length || 0) > 1 ? 's' : ''}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
