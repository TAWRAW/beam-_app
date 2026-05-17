'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  VISIT_PLACE_FR,
  VISIT_COMPONENT_FR,
  VISIT_CATEGORY_FR,
} from '@/lib/estale/visit-enums'
import {
  getVisitDraft,
  getCommentsForVisit,
  type VisitDraft,
  type CommentDraft,
} from '@/lib/visites/db'
import type { EstaleVisit, VisitCreateInput } from '@/lib/estale-api'

type Entete = VisitCreateInput | EstaleVisit

export default function VisitDetailPage({
  params,
}: {
  params: { condoId: string; visitId: string }
}) {
  // visitId peut être un localId (draft non sync) OU un id estale (visite remote)
  const [draft, setDraft] = useState<VisitDraft | null>(null)
  const [draftComments, setDraftComments] = useState<CommentDraft[]>([])
  const [remoteVisit, setRemoteVisit] = useState<EstaleVisit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const local = await getVisitDraft(params.visitId).catch(() => null)
      if (local) {
        setDraft(local)
        setDraftComments(await getCommentsForVisit(local.localId))
        setLoading(false)
        return
      }
      const res = await fetch(
        `/api/estale/visits/${params.visitId}?condoId=${params.condoId}`,
      )
      const json = await res.json()
      setRemoteVisit(json.visit || null)
      setLoading(false)
    })()
  }, [params.condoId, params.visitId])

  if (loading) return <p>Chargement…</p>

  const entete: Entete | null = draft?.entete || remoteVisit
  if (!entete) return <p className="text-red-600">Visite introuvable.</p>

  const localComments = draftComments
  const remoteComments = remoteVisit?.comments || []

  return (
    <div className="space-y-4">
      <section className="bg-white border rounded-lg p-4">
        <div className="font-semibold">{entete.object}</div>
        <div className="text-sm text-gray-600">
          {new Date(entete.date).toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
          {' • '}
          {entete.period} min{' • '}
          {VISIT_CATEGORY_FR[entete.category]}
        </div>
        {draft && !draft.estaleVisitId && (
          <div className="text-xs text-amber-700 mt-2">
            ⏳ Visite pas encore poussée vers estale
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Lignes</h2>
        <div className="space-y-2">
          {localComments.map((c, idx) => {
            const p = c.payload as {
              place: keyof typeof VISIT_PLACE_FR
              component: keyof typeof VISIT_COMPONENT_FR
              content: string
            }
            return (
              <Link
                key={c.localId}
                href={`/apps/visites/${params.condoId}/${params.visitId}/lignes/${c.localId}`}
                className="block bg-white border rounded-lg p-3 active:bg-gray-100"
              >
                <div className="text-sm font-medium">
                  {idx + 1}. {VISIT_PLACE_FR[p.place]} → {VISIT_COMPONENT_FR[p.component]}
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">{p.content}</div>
                {c.syncStatus !== 'synced' && (
                  <span className="text-xs text-amber-700">⏳ pas synced</span>
                )}
              </Link>
            )
          })}
          {remoteComments.map((c, idx) => (
            <div key={c.id} className="bg-white border rounded-lg p-3">
              <div className="text-sm font-medium">
                {idx + 1 + localComments.length}. {VISIT_PLACE_FR[c.place]} →{' '}
                {VISIT_COMPONENT_FR[c.component]}
              </div>
              <div className="text-sm text-gray-600 line-clamp-2">{c.content}</div>
              <div className="text-xs text-gray-400">{c.documents.length} photo(s)</div>
            </div>
          ))}
          {localComments.length === 0 && remoteComments.length === 0 && (
            <p className="text-gray-500 text-sm">Aucune ligne pour le moment.</p>
          )}
        </div>
      </section>

      <Link
        href={`/apps/visites/${params.condoId}/${params.visitId}/lignes/new`}
        className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-medium active:bg-blue-700"
      >
        + Ajouter une ligne
      </Link>
    </div>
  )
}
