'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { EstaleVisit } from '@/lib/estale-api'
import { getAllVisitDrafts, type VisitDraft } from '@/lib/visites/db'

export default function VisitesCondoPage({ params }: { params: { condoId: string } }) {
  const [remoteVisits, setRemoteVisits] = useState<EstaleVisit[]>([])
  const [drafts, setDrafts] = useState<VisitDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    const localAll = await getAllVisitDrafts()
    setDrafts(localAll.filter((d) => d.condoId === params.condoId))

    const r = await fetch(
      `/api/estale/visits?condoId=${encodeURIComponent(params.condoId)}&archived=false`,
    )
    const d = await r.json()
    if (d.error) setError(d.error)
    else setRemoteVisits(d.visits || [])
    setLoading(false)
  }

  useEffect(() => {
    reload().catch((e) => {
      setError(String(e))
      setLoading(false)
    })
    const id = setInterval(() => {
      getAllVisitDrafts()
        .then((all) => setDrafts(all.filter((d) => d.condoId === params.condoId)))
        .catch(() => {})
    }, 5000)
    return () => clearInterval(id)
  }, [params.condoId])

  const syncedDraftIds = new Set(drafts.map((d) => d.estaleVisitId).filter(Boolean))
  const remoteOnly = remoteVisits.filter((v) => !syncedDraftIds.has(v.id))
  const sortedDrafts = [...drafts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

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
      {error && (
        <p className="bg-[#FF6B6B] border-2 border-black px-3 py-2 text-sm font-bold">
          {error}
        </p>
      )}
      {!loading && drafts.length === 0 && remoteOnly.length === 0 && !error && (
        <p className="text-gray-700 font-medium">Aucune visite pour le moment.</p>
      )}

      <div className="space-y-3">
        {sortedDrafts.map((d) => {
          const isSynced = !!d.estaleVisitId && d.syncStatus === 'synced'
          const isError = d.syncStatus === 'error'
          return (
            <Link
              key={d.localId}
              href={`/apps/visites/${params.condoId}/${d.estaleVisitId || d.localId}`}
              className="block bg-white rounded-2xl border-2 border-black p-3 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold">{d.entete.object || '(sans objet)'}</div>
                {isSynced ? (
                  <span className="bg-[#A8E6A1] border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase shrink-0">
                    ✓ Synced
                  </span>
                ) : isError ? (
                  <span className="bg-[#FF6B6B] border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase shrink-0">
                    ❌ Erreur
                  </span>
                ) : (
                  <span className="bg-primary border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase shrink-0">
                    ⏳ Local
                  </span>
                )}
              </div>
              <div className="text-sm text-black/60 mt-1">
                {new Date(d.entete.date).toLocaleString('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </div>
              {isError && d.syncError && (
                <div className="text-xs mt-2 bg-[#FFF1F1] border border-black/30 px-2 py-1 font-mono break-words">
                  {d.syncError}
                </div>
              )}
            </Link>
          )
        })}

        {remoteOnly.map((v) => (
          <Link
            key={v.id}
            href={`/apps/visites/${params.condoId}/${v.id}`}
            className="block bg-white rounded-2xl border-2 border-black p-3 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold">{v.object || '(sans objet)'}</div>
              <span className="bg-[#A8E6A1] border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase shrink-0">
                ✓ Estale
              </span>
            </div>
            <div className="text-sm text-black/60 mt-1">
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
