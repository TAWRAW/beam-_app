'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VISIT_CATEGORY_FR, type VisitCategory } from '@/lib/estale/visit-enums'
import { addVisitDraft } from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'

const FIELD =
  'w-full bg-app-surface border-2 border-app-border-strong shadow-[3px_3px_0px_0px_var(--app-border-strong)] px-3 py-2 font-medium focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_var(--app-border-strong)] transition'

const LABEL = 'block text-xs font-bold uppercase tracking-wide mb-1'

interface Me {
  id: string
  fullname: string | null
  email: string | null
}

export default function NewVisitePage({ params }: { params: { condoId: string } }) {
  const router = useRouter()
  const [category, setCategory] = useState<VisitCategory>('NON_CONTRACTUAL')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [period, setPeriod] = useState(60)
  const [object, setObject] = useState('')
  const [me, setMe] = useState<Me | null>(null)
  const [meError, setMeError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/estale/me')
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.error || `HTTP ${r.status}`)
        }
        return r.json()
      })
      .then((d) => setMe(d.collaborator))
      .catch((e) => setMeError(e instanceof Error ? e.message : String(e)))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!me?.id) {
      setError('Collaborator estale non récupéré — réessaie dans un instant.')
      return
    }
    setSaving(true)
    const draft = await addVisitDraft(params.condoId, {
      category,
      date: new Date(date).toISOString(),
      period,
      object,
      condoID: params.condoId,
      organiserID: me.id,
      collaboratorIDs: [],
      ownerIDs: [],
    })
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${draft.localId}` as any)
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 bg-app-surface border-2 border-app-border-strong shadow-[4px_4px_0px_0px_var(--app-border-strong)] p-5"
    >
      <h2 className="text-lg font-black uppercase tracking-tight border-b-2 border-app-border-strong pb-2 mb-2">
        Nouvelle visite
      </h2>

      <div className="bg-primary border-2 border-app-border-strong px-3 py-2 text-xs font-bold flex items-center justify-between gap-2">
        {meError ? (
          <span>⚠️ Estale : {meError}</span>
        ) : me ? (
          <>
            <span>Organisateur : {me.fullname || me.email || me.id}</span>
            <span className="font-mono text-[10px] opacity-70">{me.id.slice(0, 8)}…</span>
          </>
        ) : (
          <span>Chargement organisateur…</span>
        )}
      </div>

      <div>
        <label className={LABEL}>Catégorie</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as VisitCategory)}
          className={FIELD}
        >
          {Object.entries(VISIT_CATEGORY_FR).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={LABEL}>Date & heure</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={FIELD}
          required
        />
      </div>
      <div>
        <label className={LABEL}>Durée (min)</label>
        <input
          type="number"
          min={5}
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value || '0', 10))}
          className={FIELD}
          required
        />
      </div>
      <div>
        <label className={LABEL}>Objet</label>
        <input
          type="text"
          value={object}
          onChange={(e) => setObject(e.target.value)}
          className={FIELD}
          placeholder="Visite annuelle obligatoire…"
          required
        />
      </div>
      {error && (
        <p className="bg-[#FF6B6B] border-2 border-app-border-strong px-3 py-2 text-sm font-bold">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving || !me}
        className="w-full bg-primary border-2 border-app-border-strong shadow-[4px_4px_0px_0px_var(--app-border-strong)] py-3 font-black uppercase tracking-wide transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--app-border-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Enregistrement…' : me ? 'Créer la visite' : 'Chargement…'}
      </button>
    </form>
  )
}
