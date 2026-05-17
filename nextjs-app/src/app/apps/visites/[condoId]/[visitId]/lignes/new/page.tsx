'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  VISIT_PLACE_FR,
  VISIT_COMPONENT_FR,
  type VisitPlace,
  type VisitComponent,
} from '@/lib/estale/visit-enums'
import { EnumPicker } from '@/components/visites/EnumPicker'
import { PhotoSlot } from '@/components/visites/PhotoSlot'
import { addCommentDraft, addPhotoDraft } from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'

export default function NewLignePage({
  params,
}: {
  params: { condoId: string; visitId: string }
}) {
  const router = useRouter()
  const [place, setPlace] = useState<VisitPlace | null>(null)
  const [component, setComponent] = useState<VisitComponent | null>(null)
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!place || !component) {
      setError('Sélectionne un lieu et un équipement.')
      return
    }
    setSaving(true)
    const draft = await addCommentDraft(params.visitId, { place, component, content })
    for (const f of photos) {
      await addPhotoDraft(draft.localId, f, f.name)
    }
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${params.visitId}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
        <label className="block text-sm font-medium mb-2">Photos</label>
        <div className="grid grid-cols-3 gap-2">
          <PhotoSlot label="Cadrage" onCapture={(f) => setPhotos((p) => [...p, f])} />
          <PhotoSlot label="Détail" onCapture={(f) => setPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Autre" onCapture={(f) => setPhotos((p) => [...p, f])} />
        </div>
        {photos.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{photos.length} photo(s) à uploader</p>
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
