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
import {
  addCommentDraft,
  addPhotoDraft,
  getVisitDraft,
  getAllVisitDrafts,
  hydrateVisitFromRemote,
} from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'
import type { EstaleVisit } from '@/lib/estale-api'

const LABEL = 'block text-xs font-bold uppercase tracking-wide mb-1'

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

    // params.visitId est soit un localId (draft pur) soit un estaleVisitId
    // (visite hydratée). On résout le visitLocalId réel avant d'ajouter
    // le comment : sinon le draft serait orphelin (indexé par by-visit avec
    // l'estaleVisitId, invisible aux getCommentsForVisit(localId)).
    let visit = await getVisitDraft(params.visitId).catch(() => null)
    if (!visit) {
      const all = await getAllVisitDrafts()
      visit = all.find((v) => v.estaleVisitId === params.visitId) ?? null
    }
    if (!visit) {
      try {
        const res = await fetch(
          `/api/estale/visits/${params.visitId}?condoId=${params.condoId}`,
        )
        const json = await res.json()
        const remote = json.visit as EstaleVisit | null
        if (remote) {
          visit = await hydrateVisitFromRemote(remote, params.condoId)
        }
      } catch {
        // ignoré
      }
    }
    if (!visit) {
      setError('Visite introuvable — impossible de créer la ligne.')
      setSaving(false)
      return
    }

    const draft = await addCommentDraft(visit.localId, { place, component, content })
    for (const f of photos) {
      await addPhotoDraft(draft.localId, f, f.name)
    }
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${params.visitId}` as any)
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5"
    >
      <h2 className="text-lg font-black uppercase tracking-tight border-b-2 border-black pb-2 mb-2">
        Nouvelle ligne
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
      <div>
        <label className={LABEL}>Photos</label>
        <div className="grid grid-cols-3 gap-3">
          <PhotoSlot label="Cadrage" onCapture={(f) => setPhotos((p) => [...p, f])} />
          <PhotoSlot label="Détail" onCapture={(f) => setPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Autre" onCapture={(f) => setPhotos((p) => [...p, f])} />
        </div>
        {photos.length > 0 && (
          <p className="text-xs text-gray-700 mt-2 font-bold">
            {photos.length} photo{photos.length > 1 ? 's' : ''} à uploader
          </p>
        )}
      </div>
      {error && (
        <p className="bg-[#FF6B6B] border-2 border-black px-3 py-2 text-sm font-bold">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary border-2 border-black shadow-[4px_4px_0px_0px_#000] py-3 font-black uppercase tracking-wide transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
