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
  addCommentDraft,
  addPhotoDraft,
  getVisitDraft,
  getAllVisitDrafts,
  getPhotosForComment,
  updateCommentDraft,
  hydrateVisitFromRemote,
  type PhotoDraft,
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
  // commentLocalId créé à la première capture photo (ou au submit si pas
  // de photos). Stocker en IndexedDB dès la capture → photos jamais perdues
  // même si l'utilisateur ferme l'app avant submit.
  const [commentLocalId, setCommentLocalId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<PhotoDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Résout le visitLocalId réel (cas hydratation Estale → estaleVisitId).
   */
  async function resolveVisitLocalId(): Promise<string | null> {
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
        /* ignoré */
      }
    }
    return visit?.localId ?? null
  }

  /**
   * Crée le commentDraft à la 1ère capture photo (avec place/component vides)
   * pour pouvoir sauvegarder la photo immédiatement en IndexedDB. Au submit,
   * le payload sera mis à jour avec place/component/content réels.
   * Le sync engine skip les drafts avec payload incomplet (pas de place ou
   * component) pour ne pas générer d'erreur côté Estale.
   */
  async function ensureCommentDraft(): Promise<string | null> {
    if (commentLocalId) return commentLocalId
    const visitLocalId = await resolveVisitLocalId()
    if (!visitLocalId) return null
    const draft = await addCommentDraft(visitLocalId, {
      place: '' as VisitPlace,
      component: '' as VisitComponent,
      content: '',
    })
    setCommentLocalId(draft.localId)
    return draft.localId
  }

  async function handleAddPhoto(f: File) {
    setError(null)
    const draftId = await ensureCommentDraft()
    if (!draftId) {
      setError('Visite introuvable — impossible de sauvegarder la photo.')
      return
    }
    await addPhotoDraft(draftId, f, f.name)
    setPhotos(await getPhotosForComment(draftId))
  }

  // Recharge les photos si la page est revisitée avec un draft existant
  useEffect(() => {
    if (!commentLocalId) return
    getPhotosForComment(commentLocalId).then(setPhotos)
  }, [commentLocalId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!place || !component) {
      setError('Sélectionne un lieu et un équipement.')
      return
    }
    setSaving(true)

    const draftId = commentLocalId || (await ensureCommentDraft())
    if (!draftId) {
      setError('Visite introuvable — impossible de créer la ligne.')
      setSaving(false)
      return
    }

    // Finalise le draft : ajoute place/component/content et marque pending
    // pour que le sync engine pousse vers Estale.
    await updateCommentDraft(draftId, {
      payload: { place, component, content },
      syncStatus: 'pending',
      syncAttempts: 0,
      syncError: undefined,
    })
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${params.visitId}` as any)
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 rounded-2xl"
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
          className="w-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] px-3 py-2 font-medium min-h-[120px] rounded-xl focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#000] transition"
          required
        />
      </div>
      <div>
        <label className={LABEL}>Photos {photos.length > 0 && `(${photos.length} sauvegardée${photos.length > 1 ? 's' : ''})`}</label>
        <div className="grid grid-cols-3 gap-3">
          <PhotoSlot label="Cadrage" onCapture={handleAddPhoto} />
          <PhotoSlot label="Détail" onCapture={handleAddPhoto} />
          <PhotoSlot label="+ Autre" onCapture={handleAddPhoto} />
        </div>
        {photos.length > 0 && (
          <p className="text-xs text-gray-700 mt-2 font-bold">
            ✓ {photos.length} photo{photos.length > 1 ? 's' : ''} sauvegardée{photos.length > 1 ? 's' : ''} en local
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
        className="w-full bg-primary border-2 border-black shadow-[4px_4px_0px_0px_#000] py-3 font-black uppercase tracking-wide rounded-full transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
