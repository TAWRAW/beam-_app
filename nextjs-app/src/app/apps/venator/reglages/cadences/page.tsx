'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCadences } from '@/lib/venator/useVenator'
import { CADENCE_PROFIL_LABELS } from '@/lib/venator/labels'
import { CADENCE_PROFILS, type CadenceProfil } from '@/lib/venator/types'
import {
  venatorButtonNeutral,
  venatorButtonPrimary,
  venatorButtonSecondary,
  venatorMicroLabel,
  venatorNavItem,
} from '../../_components/venator-ui-classes'
import ReglagesHeader from '../_components/ReglagesHeader'

/** Seuil en cours d'édition. `key` stable pour ne pas recycler les champs au réordonnancement. */
interface SeuilEdition { key: string; heures: number | '' }

let compteurCles = 0
const nouvelleCle = () => `seuil-${++compteurCles}`

function versLignes(seuils: number[]): SeuilEdition[] {
  // Affichés du plus large au plus serré, cohérent avec le tri fait côté service.
  return [...seuils].sort((a, b) => b - a).map((heures) => ({ key: nouvelleCle(), heures }))
}

export default function ReglagesCadencesPage() {
  const { data, isLoading, mutate } = useCadences()
  const [profil, setProfil] = useState<CadenceProfil>('urgent')
  const [lignes, setLignes] = useState<SeuilEdition[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null)

  const seuilsEnregistres = useMemo(() => data?.cadences?.[profil] ?? [], [data, profil])

  useEffect(() => {
    setLignes(versLignes(seuilsEnregistres))
    setError(null)
  }, [seuilsEnregistres])

  const modifie = useMemo(() => {
    const actuels = lignes.filter((l) => l.heures !== '').map((l) => Number(l.heures)).sort((a, b) => b - a)
    const enregistres = [...seuilsEnregistres].sort((a, b) => b - a)
    return actuels.length !== enregistres.length || actuels.some((h, i) => h !== enregistres[i])
  }, [lignes, seuilsEnregistres])

  function patchLigne(index: number, heures: number | '') {
    setLignes((ls) => ls.map((l, i) => (i === index ? { ...l, heures } : l)))
  }

  async function enregistrer() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const seuilsHeures = lignes.filter((l) => l.heures !== '').map((l) => Number(l.heures))
      const res = await fetch('/api/venator/reglages/cadences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profil, seuilsHeures }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`)
      }
      await mutate()
      setConfirmMsg(`Cadence « ${CADENCE_PROFIL_LABELS[profil]} » enregistrée.`)
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
        titre="Cadences de relance"
        description="Seuils d'alerte (en heures avant échéance) affichés sur les dossiers Entretien, selon leur priorité. Aucune notification envoyée : le calcul se fait à l'affichage du dashboard."
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
          <p className={cn(venatorMicroLabel, 'px-3 pb-1')}>Profil</p>
          {CADENCE_PROFILS.map((p) => {
            const count = data?.cadences?.[p]?.length ?? 0
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProfil(p)}
                className={cn(venatorNavItem(profil === p), 'flex items-center gap-2')}
              >
                <span className="flex-1 truncate text-left">{CADENCE_PROFIL_LABELS[p]}</span>
                {count > 0 && <span className="tabular-nums text-[11px] text-venator-fg-faint">{count}</span>}
              </button>
            )
          })}
        </nav>

        <div className="flex flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-venator-fg">{CADENCE_PROFIL_LABELS[profil]}</h3>
            <div className="flex items-center gap-1.5">
              {modifie && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLignes(versLignes(seuilsEnregistres))}
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
              {[0, 1].map((i) => (
                <div key={i} className="h-10 rounded-[var(--venator-radius-md)] bg-venator-surface-2 animate-pulse" />
              ))}
            </div>
          ) : lignes.length === 0 ? (
            <p className="py-2 text-[13px] text-venator-fg-faint">
              Aucun seuil : les dossiers de ce profil n'afficheront jamais d'alerte avant l'échéance dépassée.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              <li className={cn(venatorMicroLabel, 'grid grid-cols-[1fr_auto] items-center gap-2 px-1')}>
                <span>Heures avant échéance</span>
                <span className="w-9" />
              </li>
              {lignes.map((ligne, index) => (
                <li key={ligne.key} className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <Input
                    value={ligne.heures}
                    onChange={(e) => {
                      const v = e.target.value.trim()
                      patchLigne(index, v === '' ? '' : Number(v))
                    }}
                    inputMode="numeric"
                    placeholder="Ex : 48"
                    className="h-9 border-0 bg-venator-surface-2 text-[13px] tabular-nums text-venator-fg placeholder:text-venator-fg-faint focus-visible:ring-1 focus-visible:ring-venator-border-strong"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setLignes((ls) => ls.filter((_, i) => i !== index))}
                    aria-label="Supprimer ce seuil"
                    className={cn(venatorButtonSecondary, 'h-8 w-8 hover:bg-venator-danger/10 hover:text-venator-danger')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            onClick={() => setLignes((ls) => [...ls, { key: nouvelleCle(), heures: '' }])}
            className={cn(venatorButtonNeutral, 'h-8 w-fit gap-1.5 px-3')}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un seuil
          </Button>
        </div>
      </div>
    </div>
  )
}
