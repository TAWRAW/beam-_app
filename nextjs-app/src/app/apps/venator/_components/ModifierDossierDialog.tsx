'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { DOSSIER_TYPES, DOSSIER_TYPE_LABELS } from '@/lib/venator/labels'
import type { Dossier, DossierType } from '@/lib/venator/types'
import {
  venatorButtonPrimary,
  venatorDialogContent,
  venatorInput,
  venatorLabel,
  venatorSelectContent,
  venatorSelectItem,
  venatorSelectTrigger,
} from './venator-ui-classes'

const PRIORITE_LABELS: Record<number, string> = {
  1: '1 — Urgent',
  2: '2 — Normal',
  3: '3 — Bas',
}

/**
 * Correction de l'identité d'un dossier.
 *
 * Existe parce qu'une faute de frappe imposait jusqu'ici de supprimer et recréer,
 * en perdant étapes, fil et journal.
 */
export default function ModifierDossierDialog({
  dossier,
  open,
  onOpenChange,
  onModifie,
}: {
  dossier: Dossier
  open: boolean
  onOpenChange: (open: boolean) => void
  onModifie?: () => void
}) {
  const [titre, setTitre] = useState(dossier.titre)
  const [type, setType] = useState<DossierType>(dossier.type)
  const [priorite, setPriorite] = useState<number>(dossier.priorite)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Le dialog reste monté : sans cette resynchronisation, il rouvrirait sur les
  // valeurs de la première ouverture, et écraserait une modification faite depuis.
  useEffect(() => {
    if (!open) return
    setTitre(dossier.titre)
    setType(dossier.type)
    setPriorite(dossier.priorite)
    setError(null)
  }, [open, dossier.titre, dossier.type, dossier.priorite])

  const modifie =
    titre.trim() !== dossier.titre || type !== dossier.type || priorite !== dossier.priorite
  const canSubmit = titre.trim().length > 0 && modifie && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/dossiers/${dossier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: titre.trim(), type, priorite }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`)
      }
      onOpenChange(false)
      onModifie?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={venatorDialogContent}>
        <DialogHeader>
          <DialogTitle className="text-venator-fg">Modifier le dossier</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modif-titre" className={venatorLabel}>Titre</Label>
            <Input
              id="modif-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              maxLength={200}
              className={venatorInput}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modif-type" className={venatorLabel}>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DossierType)}>
              <SelectTrigger id="modif-type" className={venatorSelectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={venatorSelectContent}>
                {DOSSIER_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className={venatorSelectItem}>
                    {DOSSIER_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {type !== dossier.type && (
              // Précision utile : on pourrait croire que changer le type réaligne
              // les étapes sur le gabarit du nouveau type.
              <p className="text-[11px] text-venator-fg-faint">
                Les étapes déjà créées ne changent pas.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modif-priorite" className={venatorLabel}>Priorité</Label>
            <Select value={String(priorite)} onValueChange={(v) => setPriorite(Number(v))}>
              <SelectTrigger id="modif-priorite" className={venatorSelectTrigger}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={venatorSelectContent}>
                {[1, 2, 3].map((p) => (
                  <SelectItem key={p} value={String(p)} className={venatorSelectItem}>
                    {PRIORITE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm font-medium text-venator-danger">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(venatorButtonPrimary, 'h-8 px-3.5')}
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
