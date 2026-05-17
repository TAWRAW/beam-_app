'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VISIT_CATEGORY_FR, type VisitCategory } from '@/lib/estale/visit-enums'
import { addVisitDraft } from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'

export default function NewVisitePage({ params }: { params: { condoId: string } }) {
  const router = useRouter()
  const [category, setCategory] = useState<VisitCategory>('NON_CONTRACTUAL')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [period, setPeriod] = useState(60)
  const [object, setObject] = useState('')
  const [organiserID, setOrganiserID] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-récupération du collaborator id via /api/estale/condos
  useEffect(() => {
    fetch('/api/estale/condos')
      .then((r) => r.json())
      .then((d) => {
        // gestionnaire vient avec name/phone/email mais pas d'id direct ici
        // On laisse Tom saisir manuellement pour MVP — TODO V2 récupérer le collaborator.id
      })
      .catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!organiserID) {
      setError('Renseigne ton organiserID (id Collaborator estale)')
      return
    }
    setSaving(true)
    const draft = await addVisitDraft(params.condoId, {
      category,
      date: new Date(date).toISOString(),
      period,
      object,
      condoID: params.condoId,
      organiserID,
      collaboratorIDs: [],
      ownerIDs: [],
    })
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${draft.localId}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Catégorie</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as VisitCategory)}
          className="w-full border rounded px-3 py-2"
        >
          {Object.entries(VISIT_CATEGORY_FR).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date & heure</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Durée (min)</label>
        <input
          type="number"
          min={5}
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value || '0', 10))}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Objet</label>
        <input
          type="text"
          value={object}
          onChange={(e) => setObject(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Visite annuelle obligatoire…"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Organiser (id collaborator estale)
        </label>
        <input
          type="text"
          value={organiserID}
          onChange={(e) => setOrganiserID(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="cl_xxx"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          À automatiser en V2 — pour MVP, copier depuis estale desktop.
        </p>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Créer la visite'}
      </button>
    </form>
  )
}
