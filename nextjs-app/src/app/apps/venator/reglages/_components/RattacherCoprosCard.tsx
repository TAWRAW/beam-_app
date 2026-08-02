'use client'

import { useState } from 'react'
import { FolderSymlink, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import LierDriveDialog from '../../_components/LierDriveDialog'
import { venatorButtonNeutral, venatorMicroLabel } from '../../_components/venator-ui-classes'

interface Resultat {
  rattachees: { reference: string; nom: string; dossier: string }[]
  deja: string[]
  sansCorrespondance: string[]
}

/**
 * Rattachement en masse des copropriétés à leur dossier Drive.
 *
 * Les dossiers du Drive portent la référence Estale en tête (`00003 — …`) depuis
 * le rangement du 02/08/2026 : l'appariement est exact, là où rattacher les
 * douze copropriétés à la main demandait autant de navigations.
 */
export default function RattacherCoprosCard() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function rattacher(parentId: string) {
    setPending(true)
    setError(null)
    setResultat(null)
    try {
      const res = await fetch('/api/venator/copros/drive/rattacher-tout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`)
      setResultat(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <FolderSymlink className="mt-0.5 h-4 w-4 shrink-0 text-venator-fg-faint" />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-venator-fg">Drive — dossiers des copropriétés</p>
            <p className="mt-0.5 text-[12px] text-venator-fg-muted">
              Rattache chaque copropriété à son dossier Drive d&apos;après sa référence Estale. Celles
              déjà rattachées ne sont pas touchées.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={pending}
          className={cn(venatorButtonNeutral, 'h-8 shrink-0 gap-1.5 px-3')}
        >
          <Link2 className="h-3.5 w-3.5" />
          {pending ? 'Rattachement…' : 'Rattacher'}
        </Button>
      </div>

      {error && <p className="text-[12px] font-medium text-venator-danger">{error}</p>}

      {resultat && (
        <div className="flex flex-col gap-2 border-t border-venator-border pt-3">
          {resultat.rattachees.length > 0 && (
            <div>
              <p className={venatorMicroLabel}>{resultat.rattachees.length} rattachée(s)</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {resultat.rattachees.map((r) => (
                  <li key={r.reference} className="truncate text-[12px] text-venator-fg">
                    {r.reference} — {r.nom}
                    <span className="text-venator-fg-faint"> → {r.dossier}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Une copropriété sans correspondance n'est pas une erreur — 00011 n'a
              aucun dossier Drive — mais elle doit se voir, pas disparaître. */}
          {resultat.sansCorrespondance.length > 0 && (
            <div>
              <p className={venatorMicroLabel}>Sans dossier Drive trouvé</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {resultat.sansCorrespondance.map((s) => (
                  <li key={s} className="truncate text-[12px] text-venator-fg-muted">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resultat.deja.length > 0 && (
            <p className="text-[12px] text-venator-fg-faint">
              Déjà rattachées, inchangées : {resultat.deja.join(', ')}.
            </p>
          )}
        </div>
      )}

      <LierDriveDialog
        open={open}
        onOpenChange={setOpen}
        onChoisir={(d) => rattacher(d.id)}
        titre="Dossier contenant les copropriétés"
      />
    </div>
  )
}
