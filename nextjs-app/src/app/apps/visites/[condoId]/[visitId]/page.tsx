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
  getPhotosForComment,
  type VisitDraft,
  type CommentDraft,
} from '@/lib/visites/db'
import type { EstaleVisit, VisitCreateInput } from '@/lib/estale-api'

type Entete = VisitCreateInput | EstaleVisit

interface PhotoInfo {
  url: string | null
  count: number
}

export default function VisitDetailPage({
  params,
}: {
  params: { condoId: string; visitId: string }
}) {
  const [draft, setDraft] = useState<VisitDraft | null>(null)
  const [draftComments, setDraftComments] = useState<CommentDraft[]>([])
  const [remoteVisit, setRemoteVisit] = useState<EstaleVisit | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoMap, setPhotoMap] = useState<Record<string, PhotoInfo>>({})

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

  useEffect(() => {
    if (draftComments.length === 0) {
      setPhotoMap({})
      return
    }
    const created: string[] = []
    let cancelled = false

    ;(async () => {
      const map: Record<string, PhotoInfo> = {}
      for (const c of draftComments) {
        const photos = await getPhotosForComment(c.localId)
        if (photos.length === 0) {
          map[c.localId] = { url: null, count: 0 }
          continue
        }
        const url = URL.createObjectURL(photos[0].blob)
        created.push(url)
        map[c.localId] = { url, count: photos.length }
      }
      if (!cancelled) setPhotoMap(map)
    })()

    return () => {
      cancelled = true
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [draftComments])

  if (loading) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 font-bold">
        Chargement…
      </div>
    )
  }

  const entete: Entete | null = draft?.entete || remoteVisit
  if (!entete) {
    return (
      <div className="bg-[#FF6B6B] border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 font-bold">
        Visite introuvable.
      </div>
    )
  }

  const localComments = draftComments
  const remoteComments = remoteVisit?.comments || []

  return (
    <div className="space-y-5">
      <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5">
        <div className="font-black uppercase tracking-tight text-lg">{entete.object}</div>
        <div className="text-sm font-medium text-gray-700 mt-1">
          {new Date(entete.date).toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
          {' • '}
          {entete.period} min{' • '}
          {VISIT_CATEGORY_FR[entete.category]}
        </div>
        {draft && !draft.estaleVisitId && (
          <div className="mt-3 inline-block bg-primary border-2 border-black px-3 py-1 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_#000]">
            ⏳ Pas encore poussée vers estale
          </div>
        )}
      </section>

      <section>
        <h2 className="font-black uppercase tracking-tight mb-2">Lignes</h2>
        <div className="space-y-3">
          {localComments.map((c, idx) => {
            const p = c.payload as {
              place: keyof typeof VISIT_PLACE_FR
              component: keyof typeof VISIT_COMPONENT_FR
              content: string
            }
            const photo = photoMap[c.localId]
            return (
              <Link
                key={c.localId}
                href={`/apps/visites/${params.condoId}/${params.visitId}/lignes/${c.localId}`}
                className="flex gap-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-3 transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">
                    {idx + 1}. {VISIT_PLACE_FR[p.place]} → {VISIT_COMPONENT_FR[p.component]}
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-2 mt-1">{p.content}</div>
                  {c.syncStatus !== 'synced' && (
                    <span className="inline-block mt-2 bg-primary border-2 border-black px-2 py-0.5 text-xs font-bold uppercase">
                      ⏳ pas synced
                    </span>
                  )}
                </div>
                {photo?.url && (
                  <div className="relative shrink-0 w-20 h-20 border-2 border-black overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Photo ligne ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photo.count > 1 && (
                      <span className="absolute bottom-0 right-0 bg-black text-white text-[10px] px-1 font-bold">
                        +{photo.count - 1}
                      </span>
                    )}
                  </div>
                )}
                {!photo?.url && photo?.count === 0 && (
                  <div className="shrink-0 w-20 h-20 border-2 border-dashed border-black/30 flex items-center justify-center text-black/30 text-2xl">
                    —
                  </div>
                )}
              </Link>
            )
          })}
          {remoteComments.map((c, idx) => (
            <div
              key={c.id}
              className="flex gap-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">
                  {idx + 1 + localComments.length}. {VISIT_PLACE_FR[c.place]} →{' '}
                  {VISIT_COMPONENT_FR[c.component]}
                </div>
                <div className="text-sm text-gray-700 line-clamp-2 mt-1">{c.content}</div>
              </div>
              {c.documents.length > 0 ? (
                <div className="shrink-0 w-20 h-20 border-2 border-black bg-gray-100 flex flex-col items-center justify-center font-bold">
                  <span className="text-2xl">📷</span>
                  <span className="text-xs">{c.documents.length}</span>
                </div>
              ) : (
                <div className="shrink-0 w-20 h-20 border-2 border-dashed border-black/30 flex items-center justify-center text-black/30 text-2xl">
                  —
                </div>
              )}
            </div>
          ))}
          {localComments.length === 0 && remoteComments.length === 0 && (
            <p className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] p-3 text-gray-700 text-sm font-medium">
              Aucune ligne pour le moment.
            </p>
          )}
        </div>
      </section>

      <Link
        href={`/apps/visites/${params.condoId}/${params.visitId}/lignes/new`}
        className="block w-full text-center bg-primary border-2 border-black shadow-[4px_4px_0px_0px_#000] py-3 font-black uppercase tracking-wide transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000]"
      >
        + Ajouter une ligne
      </Link>
    </div>
  )
}
