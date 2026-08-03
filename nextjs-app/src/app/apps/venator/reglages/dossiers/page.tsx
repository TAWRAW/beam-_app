'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useGabarits } from '@/lib/venator/useVenator'
import { DOSSIER_TYPES, DOSSIER_TYPE_LABELS } from '@/lib/venator/labels'
import type { DossierType } from '@/lib/venator/types'
import type { GabaritEtape } from '@/lib/venator/gabarits'
import { DOSSIER_TYPE_ICONS } from '../../_components/type-icons'
import {
  venatorButtonNeutral,
  venatorButtonPrimary,
  venatorButtonSecondary,
  venatorMicroLabel,
  venatorNavItem,
} from '../../_components/venator-ui-classes'
import ReglagesHeader from '../_components/ReglagesHeader'

/** Ligne en cours d'édition. `key` est stable pour que React ne recycle pas les champs au réordonnancement. */
interface LigneEdition extends GabaritEtape {
  key: string
}

let compteurCles = 0
const nouvelleCle = () => `etape-${++compteurCles}`

function versLignes(etapes: GabaritEtape[]): LigneEdition[] {
  return etapes.map((e) => ({ ...e, key: nouvelleCle() }))
}

export default function ReglagesDossiersPage() {
  const { data, isLoading, mutate } = useGabarits()
  const [type, setType] = useState<DossierType>('sinistre')
  const [lignes, setLignes] = useState<LigneEdition[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null)

  const gabaritEnregistre = useMemo(() => data?.gabarits?.[type] ?? [], [data, type])

  // Recharge l'éditeur quand on change de type ou que les données arrivent.
  useEffect(() => {
    setLignes(versLignes(gabaritEnregistre))
    setError(null)
  }, [gabaritEnregistre])

  const modifie = useMemo(() => {
    if (lignes.length !== gabaritEnregistre.length) return true
    return lignes.some(
      (l, i) =>
        l.titre !== gabaritEnregistre[i].titre ||
        (l.echeanceOffsetJours ?? null) !== (gabaritEnregistre[i].echeanceOffsetJours ?? null)
    )
  }, [lignes, gabaritEnregistre])

  function patchLigne(index: number, patch: Partial<GabaritEtape>) {
    setLignes((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function deplacer(index: number, delta: number) {
    setLignes((ls) => {
      const cible = index + delta
      if (cible < 0 || cible >= ls.length) return ls
      const copie = [...ls]
      ;[copie[index], copie[cible]] = [copie[cible], copie[index]]
      return copie
    })
  }

  async function enregistrer() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/gabarits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          etapes: lignes
            .filter((l) => l.titre.trim().length > 0)
            .map((l) => ({ titre: l.titre.trim(), echeanceOffsetJours: l.echeanceOffsetJours ?? null })),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`)
      }
      await mutate()
      setConfirmMsg(`Gabarit « ${DOSSIER_TYPE_LABELS[type]} » enregistré.`)
      setTimeout(() => setConfirmMsg(null), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ReglagesHeader
        titre="Dossiers"
        description="Étapes créées automatiquement à l'ouverture d'un dossier, par type. Les dossiers déjà ouverts ne sont pas modifiés."
      />

      {confirmMsg && (
        <div className="rounded-[var(--venator-radius-md)] bg-venator-surface-2 p-3 text-sm font-medium text-venator-fg">
          {confirmMsg}
        </div>
      )}
      {error && (
        <div className="rounded-[var(--venator-radius-md)] border border-venator-danger/40 bg-venator-danger/10 p-3 text-sm font-medium text-venator-danger">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-col gap-px">
          <p className={cn(venatorMicroLabel, 'px-3 pb-1')}>Type de dossier</p>
          {DOSSIER_TYPES.map((t) => {
            const Icon = DOSSIER_TYPE_ICONS[t]
            const count = data?.gabarits?.[t]?.length ?? 0
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(venatorNavItem(type === t), 'flex items-center gap-2')}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
                <span className="flex-1 truncate text-left">{DOSSIER_TYPE_LABELS[t]}</span>
                {count > 0 && (
                  <span className="tabular-nums text-[11px] text-venator-fg-faint">{count}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="flex flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-venator-fg">{DOSSIER_TYPE_LABELS[type]}</h3>
            <div className="flex items-center gap-1.5">
              {modifie && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLignes(versLignes(gabaritEnregistre))}
                  className={cn(venatorButtonSecondary, 'h-8 px-3')}
                >
                  Annuler
                </Button>
              )}
              <Button
                type="button"
                onClick={enregistrer}
                disabled={!modifie || saving}
                className={cn(venatorButtonPrimary, 'h-8 px-3.5')}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-[var(--venator-radius-md)] bg-venator-surface-2 animate-pulse" />
              ))}
            </div>
          ) : lignes.length === 0 ? (
            <p className="py-2 text-[13px] text-venator-fg-faint">
              Aucune étape : un dossier de ce type sera créé vide.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              <li className={cn(venatorMicroLabel, 'grid grid-cols-[1fr_120px_auto] items-center gap-2 px-1')}>
                <span>Étape</span>
                <span>Échéance (jours)</span>
                <span className="w-[92px]" />
              </li>
              {lignes.map((ligne, index) => (
                <li key={ligne.key} className="grid grid-cols-[1fr_120px_auto] items-center gap-2">
                  <Input
                    value={ligne.titre}
                    onChange={(e) => patchLigne(index, { titre: e.target.value })}
                    placeholder="Intitulé de l'étape"
                    maxLength={200}
                    className="h-9 border-0 bg-venator-surface-2 text-[13px] text-venator-fg placeholder:text-venator-fg-faint focus-visible:ring-1 focus-visible:ring-venator-border-strong"
                  />
                  <Input
                    value={ligne.echeanceOffsetJours ?? ''}
                    onChange={(e) => {
                      const v = e.target.value.trim()
                      // Champ vide = pas d'échéance calculée, pas « J+0 ».
                      patchLigne(index, { echeanceOffsetJours: v === '' ? null : Number(v) })
                    }}
                    inputMode="numeric"
                    placeholder="—"
                    className="h-9 border-0 bg-venator-surface-2 text-[13px] tabular-nums text-venator-fg placeholder:text-venator-fg-faint focus-visible:ring-1 focus-visible:ring-venator-border-strong"
                  />
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => deplacer(index, -1)}
                      disabled={index === 0}
                      aria-label="Monter l'étape"
                      className={cn(venatorButtonSecondary, 'h-8 w-8')}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => deplacer(index, 1)}
                      disabled={index === lignes.length - 1}
                      aria-label="Descendre l'étape"
                      className={cn(venatorButtonSecondary, 'h-8 w-8')}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setLignes((ls) => ls.filter((_, i) => i !== index))}
                      aria-label="Supprimer l'étape"
                      className={cn(venatorButtonSecondary, 'h-8 w-8 hover:bg-venator-danger/10 hover:text-venator-danger')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            onClick={() => setLignes((ls) => [...ls, { key: nouvelleCle(), titre: '', echeanceOffsetJours: null }])}
            className={cn(venatorButtonNeutral, 'h-8 w-fit gap-1.5 px-3')}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter une étape
          </Button>
        </div>
      </div>
    </div>
  )
}
