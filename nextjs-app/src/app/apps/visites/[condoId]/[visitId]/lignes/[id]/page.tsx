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
  getVisitDraft,
  getAllVisitDrafts,
  hydrateVisitFromRemote,
  type CommentDraft,
  type PhotoDraft,
} from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'
import type { EstaleVisit } from '@/lib/estale-api'

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
      // `params.visitId` peut être un localId (draft pur) OU un estaleVisitId
      // (visite remote hydratée). Les comments sont indexés par visitLocalId,
      // il faut donc trouver le bon VisitDraft avant de chercher les comments.
      let visit = await getVisitDraft(params.visitId).catch(() => null)
      if (!visit) {
        const all = await getAllVisitDrafts()
        visit = all.find((v) => v.estaleVisitId === params.visitId) ?? null
      }
      // Deep link : visite jamais ouverte côté client → hydrater depuis estale.
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
          // ignoré : on retombe sur "Chargement…" → "Ligne introuvable"
        }
      }
      if (!visit) return

      const comments = await getCommentsForVisit(visit.localId)
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
  }, [params.condoId, params.visitId, params.id])

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

  // Enregistrement immédiat en IndexedDB à chaque capture photo : empêche la
  // perte si l'utilisateur ferme l'app avant de cliquer "Mettre à jour".
  async function handleAddPhoto(f: File) {
    if (!draft) return
    await addPhotoDraft(draft.localId, f, f.name)
    setPhotos(await getPhotosForComment(draft.localId))
  }

  /**
   * Exporte la photo en PLEINE RÉSOLUTION (l'original stocké en local, jamais
   * compressé) via le partage natif iOS/Android → enregistrement dans
   * Photos/Fichiers. Permet de récupérer les photos même si la sync vers Estale
   * échoue. Fallback : ouverture plein écran si le partage n'est pas dispo.
   */
  async function exportPhoto(photo: PhotoDraft) {
    const file = new File([photo.blob], photo.filename || 'photo.jpg', {
      type: photo.mimeType || 'image/jpeg',
    })
    try {
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean
      }
      if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await nav.share({ files: [file], title: photo.filename })
        return
      }
    } catch {
      /* partage annulé ou indisponible → fallback ci-dessous */
    }
    const url = URL.createObjectURL(photo.blob)
    window.open(url, '_blank')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft || !place || !component) return
    setSaving(true)
    await updateCommentDraft(draft.localId, {
      payload: { place, component, content },
      syncStatus: draft.estaleCommentId ? 'pending' : draft.syncStatus,
    })
    // Backwards-compat : si des photos sont encore dans newPhotos (queue
    // restée en mémoire d'une session pré-fix), on les enregistre aussi.
    for (const f of newPhotos) {
      await addPhotoDraft(draft.localId, f, f.name)
    }
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${params.visitId}` as any)
  }

  if (!draft) {
    return (
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 rounded-2xl font-bold">
        Chargement…
      </div>
    )
  }

  return (
    <form
      onSubmit={save}
      className="space-y-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-5 rounded-2xl"
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
          className="w-full bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] px-3 py-2 font-medium min-h-[120px] rounded-xl focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_#000] transition"
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
                  className="relative aspect-square border-2 border-black shadow-[3px_3px_0px_0px_#000] overflow-hidden bg-white rounded-xl"
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
                  {photo && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        exportPhoto(photo)
                      }}
                      className="absolute bottom-1 left-1 bg-white border-2 border-black px-1.5 py-0.5 text-[9px] font-bold uppercase rounded shadow-[1px_1px_0px_0px_#000]"
                    >
                      ⬇ HD
                    </button>
                  )}
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
              className="relative aspect-square border-2 border-dashed border-black shadow-[3px_3px_0px_0px_#000] overflow-hidden bg-white rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="Nouvelle photo" className="w-full h-full object-cover" />
              <span className="absolute top-1 right-1 bg-primary border-2 border-black px-1 py-0.5 text-[9px] font-bold uppercase">
                NEW
              </span>
            </div>
          ))}
          <PhotoSlot label="+ Photo" onCapture={handleAddPhoto} />
          <PhotoSlot label="+ Photo" onCapture={handleAddPhoto} />
          <PhotoSlot label="+ Photo" onCapture={handleAddPhoto} />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary border-2 border-black shadow-[4px_4px_0px_0px_#000] py-3 font-black uppercase tracking-wide rounded-full transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Enregistrement…' : 'Mettre à jour'}
      </button>
    </form>
  )
}
