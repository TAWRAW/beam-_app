'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  VISIT_PLACE_FR,
  VISIT_COMPONENT_FR,
  type VisitPlace,
  type VisitComponent,
} from '@/lib/estale/visit-enums'
import { EnumPicker } from '@/components/visites/EnumPicker'
import { PhotoSlot } from '@/components/visites/PhotoSlot'
import {
  getCommentsForVisit,
  updateCommentDraft,
  addPhotoDraft,
  getPhotosForComment,
  type CommentDraft,
  type PhotoDraft,
} from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'

const LABEL = 'block text-xs font-bold uppercase tracking-wide mb-1'

export default function EditLignePage({
  params,
}: {
  params: { condoId: string; visitId: string; id: string }
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<CommentDraft | null>(null)
  const [photos, setPhotos] = useState<PhotoDraft[]>([])
  const [place, setPlace] = useState<VisitPlace | null>(null)
  const [component, setComponent] = useState<VisitComponent | null>(null)
  const [content, setContent] = useState('')
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const comments = await getCommentsForVisit(params.visitId)
      const d = comments.find((c) => c.localId === params.id)
      if (d) {
        setDraft(d)
        const p = d.payload as {
          place: VisitPlace
          component: VisitComponent
          content: string
        }
        setPlace(p.place)
        setComponent(p.component)
        setContent(p.content)
        setPhotos(await getPhotosForComment(d.localId))
      }
    })()
  }, [params.visitId, params.id])

  const existingPhotoUrls = useMemo(
    () => photos.map((p) => ({ id: p.localId, url: URL.createObjectURL(p.blob) })),
    [photos],
  )
  useEffect(() => () => existingPhotoUrls.forEach((p) => URL.revokeObjectURL(p.url)), [existingPhotoUrls])

  const newPhotoUrls = useMemo(
    () => newPhotos.map((f, i) => ({ id: `new-${i}-${f.name}`, url: URL.createObjectURL(f) })),
    [newPhotos],
  )
  useEffect(() => () => newPhotoUrls.forEach((p) => URL.revokeObjectURL(p.url)), [newPhotoUrls])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft || !place || !component) return
    setSaving(true)
    await updateCommentDraft(draft.localId, {
      payload: { place, component, content },
      syncStatus: draft.estaleCommentId ? 'pending' : draft.syncStatus,
    })
    for (const f of newPhotos) {
      await addPhotoDraft(draft.localId, f, f.name)
    }
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${params.visitId}` as any)
  }

  if (!draft) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 font-bold">
        Chargement…
      </div>
    )
  }

  return (
    <form
      onSubmit={save}
      className="space-y-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5"
    >
      <h2 className="text-lg font-black uppercase tracking-tight border-b-2 border-black pb-2 mb-2">
        Modifier la ligne
      </h2>
      <div>
        <label className={LABEL}>Lieu *</label>
        <EnumPicker
          label="Lieu"
          options={VISIT_PLACE_FR}
          value={place}
          onChange={setPlace}
          required
        />
      </div>
      <div>
        <label className={LABEL}>Équipement *</label>
        <EnumPicker
          label="Équipement"
          options={VISIT_COMPONENT_FR}
          value={component}
          onChange={setComponent}
          required
        />
      </div>
      <div>
        <label className={LABEL}>Commentaire *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] px-3 py-2 font-medium min-h-[120px] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#000] transition"
          required
        />
      </div>

      {existingPhotoUrls.length > 0 && (
        <div>
          <label className={LABEL}>
            Photos déjà attachées ({existingPhotoUrls.length})
          </label>
          <div className="grid grid-cols-3 gap-3">
            {existingPhotoUrls.map((p, idx) => {
              const photo = photos[idx]
              const synced = photo?.syncStatus === 'synced'
              return (
                <div
                  key={p.id}
                  className="relative aspect-square border-2 border-black shadow-[3px_3px_0px_0px_#000] overflow-hidden bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-1 right-1 border-2 border-black px-1 py-0.5 text-[9px] font-bold uppercase ${
                      synced ? 'bg-[#A8E6A1]' : 'bg-primary'
                    }`}
                  >
                    {synced ? '✓' : '⏳'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <label className={LABEL}>
          Ajouter des photos {newPhotoUrls.length > 0 && `(${newPhotoUrls.length} en attente)`}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {newPhotoUrls.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square border-2 border-dashed border-black shadow-[3px_3px_0px_0px_#000] overflow-hidden bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="Nouvelle photo" className="w-full h-full object-cover" />
              <span className="absolute top-1 right-1 bg-primary border-2 border-black px-1 py-0.5 text-[9px] font-bold uppercase">
                NEW
              </span>
            </div>
          ))}
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary border-2 border-black shadow-[4px_4px_0px_0px_#000] py-3 font-black uppercase tracking-wide transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Enregistrement…' : 'Mettre à jour'}
      </button>
    </form>
  )
}
