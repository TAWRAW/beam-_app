'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { keys, useFil } from '@/lib/venator/useVenator'
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

function FilSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1].map((i) => (
        <div key={i} className="h-16 rounded-2xl border-2 border-black bg-neutral-200 animate-pulse" />
      ))}
    </div>
  )
}

export default function FilPanel({
  parentType,
  parentId,
}: {
  parentType: 'dossier' | 'ticket'
  parentId: string
}) {
  const key = keys.fil(parentType, parentId)
  const { data, isLoading } = useFil(parentType, parentId)
  const messages = data?.messages ?? []
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ajout de note optimiste : le message apparaît tout de suite, rollback si l'appel échoue.
  async function handleAjouter() {
    const contenu = note.trim()
    if (!contenu || submitting) return
    setSubmitting(true)
    setError(null)

    const optimisticMessage: FilMessage = {
      id: `temp-${Date.now()}`,
      parent_type: parentType,
      parent_id: parentId,
      direction: 'note',
      source: 'manuel',
      from_email: null,
      sujet: null,
      contenu,
      gmail_message_id: null,
      created_at: new Date().toISOString(),
    }
    const previous = data
    mutate(key, { messages: [...messages, optimisticMessage] }, { revalidate: false })
    setNote('')

    try {
      const res = await fetch('/api/venator/fil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_type: parentType,
          parent_id: parentId,
          direction: 'note',
          source: 'manuel',
          contenu,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      await mutate(key)
    } catch (e) {
      mutate(key, previous, { revalidate: true })
      setNote(contenu)
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      {isLoading ? (
        <FilSkeleton />
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
