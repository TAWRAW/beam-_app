'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Etape, EtapeStatut } from '@/lib/venator/types'

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
  etapes,
  onChange,
}: {
  dossierId: string
  etapes: Etape[]
  onChange: () => void
}) {
  const [nouvelleTitre, setNouvelleTitre] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function patchEtape(etapeId: string, patch: { statut?: EtapeStatut; notes?: string | null }) {
    setError(null)
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
      onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  function handlePastilleClick(etape: Etape) {
    const next = NEXT_STATUT[etape.statut]
    if (!next) return
    patchEtape(etape.id, { statut: next })
  }

  function handleNotes(etape: Etape) {
    const val = window.prompt('Notes de l’étape', etape.notes ?? '')
    if (val === null) return
    patchEtape(etape.id, { notes: val })
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
      onChange()
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
      onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      {etapes.length === 0 && <p className="text-sm text-neutral-600">Aucune étape.</p>}

      <ul className="flex flex-col gap-2">
        {etapes.map((etape) => {
          const overdue = !!etape.echeance && etape.statut !== 'fait' && new Date(etape.echeance) < new Date(new Date().toDateString())
          return (
            <li
              key={etape.id}
              className="flex items-center gap-3 border-2 border-black rounded-2xl bg-white p-3 shadow-[3px_3px_0px_0px_#000]"
            >
              <button
                type="button"
                onClick={() => handlePastilleClick(etape)}
                disabled={!NEXT_STATUT[etape.statut]}
                aria-label={`Statut : ${etape.statut}`}
                className={cn(
                  'text-xl leading-none shrink-0',
                  NEXT_STATUT[etape.statut] ? 'cursor-pointer' : 'cursor-default opacity-70'
                )}
              >
                {PASTILLE[etape.statut]}
              </button>

              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', etape.statut === 'sautee' && 'line-through text-neutral-500')}>
                  {etape.titre}
                </p>
                {etape.echeance && (
                  <p className={cn('text-xs', overdue ? 'text-red-600 font-bold' : 'text-neutral-600')}>
                    Échéance : {formatEcheance(etape.echeance)}
                  </p>
                )}
                {etape.notes && <p className="text-xs text-neutral-600 whitespace-pre-wrap mt-1">{etape.notes}</p>}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="shrink-0 px-2 text-lg font-bold" aria-label="Menu étape">
                    ⋮
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => patchEtape(etape.id, { statut: 'sautee' })}>
                    Sauter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNotes(etape)}>Notes</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSupprimer(etape)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    🗑 Supprimer l&apos;étape
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
        />
        <Button
          type="button"
          onClick={handleAjouter}
          disabled={!nouvelleTitre.trim() || submitting}
          className="bg-[#FFC300] border-2 border-black rounded-full font-bold shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] text-black hover:bg-[#FFC300] shrink-0"
        >
          {submitting ? 'Ajout…' : 'Ajouter une étape'}
        </Button>
      </div>
    </div>
  )
}
