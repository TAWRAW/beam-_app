'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { keys } from '@/lib/venator/useVenator'
import type { Dossier, Etape, EtapeStatut } from '@/lib/venator/types'
import { venatorButtonNeutral } from './venator-ui-classes'

const PASTILLE: Record<EtapeStatut, string> = {
  a_faire: '○',
  en_cours: '◐',
  fait: '●',
  sautee: '⊘',
}

const NEXT_STATUT: Partial<Record<EtapeStatut, EtapeStatut>> = {
  a_faire: 'en_cours',
  en_cours: 'fait',
}

function formatEcheance(echeance: string) {
  const d = new Date(echeance)
  if (Number.isNaN(d.getTime())) return echeance
  return d.toLocaleDateString('fr-FR')
}

export default function EtapesTimeline({
  dossierId,
  dossier,
  etapes,
}: {
  dossierId: string
  dossier: Dossier
  etapes: Etape[]
}) {
  const [nouvelleTitre, setNouvelleTitre] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const key = keys.dossier(dossierId)

  // Bascule de statut optimiste (pastille) : l'UI change immédiatement, rollback si l'appel échoue.
  async function patchEtapeOptimistic(etapeId: string, patch: { statut?: EtapeStatut; notes?: string | null }) {
    setError(null)
    const previous = { dossier, etapes }
    const optimisticEtapes = etapes.map((e) => (e.id === etapeId ? { ...e, ...patch } : e))
    mutate(key, { dossier, etapes: optimisticEtapes }, { revalidate: false })
    try {
      const res = await fetch(`/api/venator/dossiers/${dossierId}/etapes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etape_id: etapeId, ...patch }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      await mutate(key)
    } catch (e) {
      mutate(key, previous, { revalidate: true })
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  function handlePastilleClick(etape: Etape) {
    const next = NEXT_STATUT[etape.statut]
    if (!next) return
    patchEtapeOptimistic(etape.id, { statut: next })
  }

  function handleNotes(etape: Etape) {
    const val = window.prompt('Notes de l’étape', etape.notes ?? '')
    if (val === null) return
    patchEtapeOptimistic(etape.id, { notes: val })
  }

  async function handleSupprimer(etape: Etape) {
    if (!window.confirm('Supprimer définitivement cette étape ? Cette action est irréversible.')) return
    setError(null)
    try {
      const res = await fetch(`/api/venator/dossiers/${dossierId}/etapes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etape_id: etape.id }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      await mutate(key)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  async function handleAjouter() {
    if (!nouvelleTitre.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/dossiers/${dossierId}/etapes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: nouvelleTitre.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      setNouvelleTitre('')
      await mutate(key)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm font-medium text-venator-danger">{error}</p>}

      {etapes.length === 0 && <p className="text-sm text-venator-fg-muted">Aucune étape.</p>}

      <ul className="flex flex-col gap-1.5">
        {etapes.map((etape) => {
          const overdue = !!etape.echeance && etape.statut !== 'fait' && new Date(etape.echeance) < new Date(new Date().toDateString())
          return (
            <li
              key={etape.id}
              className="group flex items-center gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface px-4 py-3 transition-colors hover:bg-venator-surface-2"
            >
              <button
                type="button"
                onClick={() => handlePastilleClick(etape)}
                disabled={!NEXT_STATUT[etape.statut]}
                aria-label={`Statut : ${etape.statut}`}
                className={cn(
                  'shrink-0 text-base leading-none',
                  etape.statut === 'fait' ? 'text-venator-accent' : 'text-venator-fg-faint',
                  NEXT_STATUT[etape.statut] ? 'cursor-pointer hover:text-venator-fg' : 'cursor-default'
                )}
              >
                {PASTILLE[etape.statut]}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-[13px] font-medium',
                    etape.statut === 'sautee' ? 'text-venator-fg-faint line-through' : 'text-venator-fg'
                  )}
                >
                  {etape.titre}
                </p>
                {etape.echeance && (
                  <p className={cn('text-[12px]', overdue ? 'font-medium text-venator-danger' : 'text-venator-fg-muted')}>
                    Échéance : {formatEcheance(etape.echeance)}
                  </p>
                )}
                {etape.notes && (
                  <p className="mt-1 whitespace-pre-wrap text-[12px] text-venator-fg-muted">{etape.notes}</p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1.5 text-venator-fg-faint opacity-0 transition hover:bg-venator-surface-hover hover:text-venator-fg group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label="Menu étape"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-venator-border bg-venator-surface text-venator-fg">
                  <DropdownMenuItem
                    onClick={() => patchEtapeOptimistic(etape.id, { statut: 'sautee' })}
                    className="focus:bg-venator-surface-hover focus:text-venator-fg"
                  >
                    Sauter
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleNotes(etape)}
                    className="focus:bg-venator-surface-hover focus:text-venator-fg"
                  >
                    Notes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSupprimer(etape)}
                    className="text-venator-danger focus:bg-venator-danger/10 focus:text-venator-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Supprimer l&apos;étape
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-2 pt-1">
        <Input
          value={nouvelleTitre}
          onChange={(e) => setNouvelleTitre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAjouter()
          }}
          placeholder="Titre de l'étape"
          maxLength={200}
          className="h-9 border-0 bg-venator-surface text-[13px] text-venator-fg placeholder:text-venator-fg-faint focus-visible:ring-1 focus-visible:ring-venator-border-strong"
        />
        <Button
          type="button"
          onClick={handleAjouter}
          disabled={!nouvelleTitre.trim() || submitting}
          className={cn(venatorButtonNeutral, 'h-9 shrink-0 px-3.5')}
        >
          {submitting ? 'Ajout…' : 'Ajouter'}
        </Button>
      </div>
    </div>
  )
}
