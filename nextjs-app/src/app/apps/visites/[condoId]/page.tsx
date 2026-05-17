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
        className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-medium active:bg-blue-700"
      >
        + Nouvelle visite
      </Link>

      <h2 className="font-semibold">Visites en cours</h2>
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
            className="block bg-white rounded-lg border p-3 shadow-sm active:bg-gray-100"
          >
            <div className="font-medium">{v.object || '(sans objet)'}</div>
            <div className="text-sm text-gray-500">
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
