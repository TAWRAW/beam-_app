'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { FilMessage, FilSource } from '@/lib/venator/types'

const SOURCE_LABELS: Record<FilSource, string> = {
  gmail: 'Gmail',
  manuel: 'Manuel',
  ia: 'IA',
  venator: 'Venator',
}

const DIRECTION_LABELS: Record<FilMessage['direction'], string> = {
  entrant: 'Entrant',
  sortant: 'Sortant',
  note: 'Note',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR')
}

export default function FilPanel({
  parentType,
  parentId,
}: {
  parentType: 'dossier' | 'ticket'
  parentId: string
}) {
  const [messages, setMessages] = useState<FilMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/fil?parent_type=${parentType}&parent_id=${parentId}`)
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const { messages }: { messages: FilMessage[] } = await res.json()
      setMessages(messages ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [parentType, parentId])

  useEffect(() => {
    load()
  }, [load])

  async function handleAjouter() {
    if (!note.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/fil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_type: parentType,
          parent_id: parentId,
          direction: 'note',
          source: 'manuel',
          contenu: note.trim(),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      setNote('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-600">Chargement…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-600">Aucun message pour l'instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((m) => (
            <li key={m.id} className="border-2 border-black rounded-2xl bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border-2 border-black',
                    m.direction === 'entrant' && 'bg-blue-100',
                    m.direction === 'sortant' && 'bg-green-100',
                    m.direction === 'note' && 'bg-[#F2F1E6]'
                  )}
                >
                  {SOURCE_LABELS[m.source]} · {DIRECTION_LABELS[m.direction]}
                </span>
                <span className="text-xs text-neutral-500">{formatDate(m.created_at)}</span>
                {m.from_email && <span className="text-xs text-neutral-500">{m.from_email}</span>}
              </div>
              {m.sujet && <p className="text-sm font-semibold">{m.sujet}</p>}
              <p className="text-sm whitespace-pre-wrap">{m.contenu}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Écrire une note…"
          maxLength={50000}
          className="bg-white"
        />
        <Button
          type="button"
          onClick={handleAjouter}
          disabled={!note.trim() || submitting}
          className="self-end bg-[#FFC300] border-2 border-black rounded-full font-bold shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] text-black hover:bg-[#FFC300]"
        >
          {submitting ? 'Ajout…' : 'Ajouter une note'}
        </Button>
      </div>
    </div>
  )
}
