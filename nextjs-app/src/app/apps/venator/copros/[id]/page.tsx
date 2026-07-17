'use client'

import { useState } from 'react'
import Link from 'next/link'
import { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TypeBadge } from '../../_components/DossierCard'
import ChecklistPanel from '../../_components/ChecklistPanel'
import { keys, useCopros, useDossiers, useJournal } from '@/lib/venator/useVenator'

const DOSSIER_STATUT_LABELS: Record<string, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  en_attente: 'En attente',
  clos: 'Clos',
}

const EVENEMENT_META: Record<string, { icon: string; label: string }> = {
  note: { icon: '📝', label: 'Note' },
  checklist_complete: { icon: '✅', label: 'Checklist complétée' },
  dossier_cree: { icon: '📁', label: 'Dossier créé' },
  etape_faite: { icon: '☑️', label: 'Étape faite' },
  dossier_clos: { icon: '🔒', label: 'Dossier clos' },
  ticket_cree: { icon: '🎫', label: 'Ticket créé' },
  ticket_rattache: { icon: '🔗', label: 'Ticket rattaché' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR')
}

function CoproSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-16 rounded-2xl border-2 border-black bg-neutral-200 animate-pulse" />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl border-2 border-black bg-neutral-200 animate-pulse" />
          ))}
        </div>
        <div className="h-40 rounded-2xl border-2 border-black bg-neutral-200 animate-pulse" />
      </div>
    </div>
  )
}

export default function CoproPage({ params }: { params: { id: string } }) {
  const coproId = params.id

  const { data: coprosData, isLoading: coprosLoading } = useCopros()
  const copro = coprosData?.copros.find((c) => c.id === coproId) ?? null

  const { data: journalData, isLoading: journalLoading } = useJournal(coproId)
  const entries = journalData?.entries ?? []

  const { data: dossiersData, isLoading: dossiersLoading } = useDossiers(`copro_id=${coproId}`)
  const dossiers = (dossiersData?.dossiers ?? []).filter((d) => d.statut !== 'clos')

  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loading = coprosLoading || journalLoading || dossiersLoading

  async function handleAjouterNote() {
    if (!note.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copro_id: coproId, contenu: note.trim(), type_evenement: 'note' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      setNote('')
      await mutate(keys.journal(coproId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <CoproSkeleton />
  }

  if (!copro) {
    return (
      <div className="flex flex-col gap-3">
        {error && (
          <div className="border-2 border-red-600 rounded-2xl bg-white p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600">Copropriété introuvable.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="border-2 border-red-600 rounded-2xl bg-white p-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-4">
        <p className="text-xs font-semibold text-neutral-500">{copro.reference}</p>
        <h1 className="font-bold text-xl">{copro.nom}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Colonne gauche : journal + dossiers */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-4 flex flex-col gap-3">
            <h2 className="font-bold text-sm">Journal technique</h2>

            {entries.length === 0 ? (
              <p className="text-xs text-neutral-600">Aucun événement pour l'instant.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {entries.map((e) => {
                  const meta = EVENEMENT_META[e.type_evenement] ?? { icon: '•', label: e.type_evenement }
                  return (
                    <li key={e.id} className="border border-black rounded-xl p-2 flex items-start gap-2">
                      <span className="text-lg leading-none">{meta.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase text-neutral-500">{meta.label}</span>
                          <span className="text-[10px] text-neutral-400">{formatDate(e.created_at)}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{e.contenu}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note rapide…"
                maxLength={5000}
                className="bg-white"
              />
              <Button
                type="button"
                onClick={handleAjouterNote}
                disabled={!note.trim() || submitting}
                className="self-end bg-[#FFC300] border-2 border-black rounded-full font-bold shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] text-black hover:bg-[#FFC300]"
              >
                {submitting ? 'Ajout…' : 'Ajouter au journal'}
              </Button>
            </div>
          </div>

          <div className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-3 flex flex-col gap-2">
            <h2 className="font-bold text-sm">Dossiers ouverts</h2>
            {dossiers.length === 0 ? (
              <p className="text-xs text-neutral-600">Aucun dossier ouvert.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dossiers.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/apps/venator/dossiers/${d.id}` as any}
                      className="block border border-black rounded-xl p-2 hover:bg-[#F2F1E6] transition"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <TypeBadge type={d.type} />
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-black bg-[#F2F1E6]">
                          {DOSSIER_STATUT_LABELS[d.statut] ?? d.statut}
                        </span>
                      </div>
                      <p className="text-sm font-semibold truncate">{d.titre}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Colonne droite : checklist */}
        <div className="flex flex-col gap-4">
          <ChecklistPanel coproId={coproId} />
        </div>
      </div>
    </div>
  )
}
