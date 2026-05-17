'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
    router.push(`/apps/visites/${params.condoId}/${params.visitId}`)
  }

  if (!draft) return <p>Chargement…</p>

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Lieu *</label>
        <EnumPicker
          label="Lieu"
          options={VISIT_PLACE_FR}
          value={place}
          onChange={setPlace}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Équipement *</label>
        <EnumPicker
          label="Équipement"
          options={VISIT_COMPONENT_FR}
          value={component}
          onChange={setComponent}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Commentaire *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded px-3 py-2 min-h-[120px]"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Photos ({photos.length} déjà attachée{photos.length > 1 ? 's' : ''})
        </label>
        <div className="grid grid-cols-3 gap-2">
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
        </div>
        {newPhotos.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {newPhotos.length} nouvelle{newPhotos.length > 1 ? 's' : ''} photo
            {newPhotos.length > 1 ? 's' : ''} à uploader
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Mettre à jour'}
      </button>
    </form>
  )
}
