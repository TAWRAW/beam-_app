'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { keys, useFil } from '@/lib/venator/useVenator'
import type { FilMessage, FilSource } from '@/lib/venator/types'
import ApercuMailDialog from './ApercuMailDialog'
import { venatorButtonNeutral, venatorMicroLabel } from './venator-ui-classes'

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
        <div key={i} className="h-16 rounded-[var(--venator-radius-lg)] bg-venator-surface animate-pulse" />
      ))}
    </div>
  )
}

export default function FilPanel({
  parentType,
  parentId,
  labelChemin = null,
}: {
  parentType: 'dossier' | 'ticket'
  parentId: string
  /** Libellé Gmail du dossier : alimente le bouton « Ouvrir le libellé » de l'aperçu. */
  labelChemin?: string | null
}) {
  const key = keys.fil(parentType, parentId)
  const { data, isLoading } = useFil(parentType, parentId)
  const messages = data?.messages ?? []
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apercu, setApercu] = useState<FilMessage | null>(null)

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
      {error && <p className="text-sm font-medium text-venator-danger">{error}</p>}

      {isLoading ? (
        <FilSkeleton />
      ) : sorted.length === 0 ? (
        <p className="text-sm text-venator-fg-muted">Aucun message pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((m) => {
            // Seuls les messages venus de Gmail ont un aperçu : une note prise
            // dans Venator n'existe nulle part ailleurs, il n'y a rien à ouvrir.
            const ouvrable = m.source === 'gmail' && !!m.gmail_message_id
            const Contenu = (
              <>
                <div className={cn(venatorMicroLabel, 'mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1')}>
                  <span>
                    {SOURCE_LABELS[m.source]} · {DIRECTION_LABELS[m.direction]}
                  </span>
                  <span className="tabular-nums font-normal normal-case tracking-normal text-venator-fg-faint">
                    {formatDate(m.created_at)}
                  </span>
                  {m.from_email && (
                    <span className="font-normal normal-case tracking-normal text-venator-fg-faint">{m.from_email}</span>
                  )}
                  {ouvrable && <Mail className="h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />}
                </div>
                {m.sujet && <p className="text-[13px] font-semibold text-venator-fg">{m.sujet}</p>}
                <p className="whitespace-pre-wrap text-[13px] font-normal leading-relaxed text-venator-fg">
                  {m.contenu}
                </p>
              </>
            )

            return (
              <li key={m.id}>
                {ouvrable ? (
                  <button
                    type="button"
                    onClick={() => setApercu(m)}
                    className="w-full rounded-[var(--venator-radius-lg)] bg-venator-surface px-4 py-3 text-left transition-colors hover:bg-venator-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-venator-border-strong"
                  >
                    {Contenu}
                  </button>
                ) : (
                  <div className="rounded-[var(--venator-radius-lg)] bg-venator-surface px-4 py-3">{Contenu}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Écrire une note…"
          maxLength={50000}
          className="min-h-[72px] resize-none border-0 bg-venator-surface text-[13px] text-venator-fg placeholder:text-venator-fg-faint focus-visible:ring-1 focus-visible:ring-venator-border-strong"
        />
        <Button
          type="button"
          onClick={handleAjouter}
          disabled={!note.trim() || submitting}
          className={cn(venatorButtonNeutral, 'h-8 self-end px-3')}
        >
          {submitting ? 'Ajout…' : 'Ajouter une note'}
        </Button>
      </div>

      <ApercuMailDialog
        open={!!apercu}
        onOpenChange={(o) => !o && setApercu(null)}
        gmailMessageId={apercu?.gmail_message_id ?? null}
        labelChemin={labelChemin}
        sujetConnu={apercu?.sujet ?? null}
        fromConnu={apercu?.from_email ?? null}
      />
    </div>
  )
}
