'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DOSSIER_TYPES, type Copro, type Dossier, type DossierType } from '@/lib/venator/types'
import { DOSSIER_TYPE_LABELS } from '@/lib/venator/labels'
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

export default function CreateDossierDialog({
  open,
  onOpenChange,
  copros,
  defaultCoproId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  copros: Copro[]
  defaultCoproId?: string
  onCreated?: (dossier: Dossier) => void
}) {
  const router = useRouter()
  const [coproId, setCoproId] = useState(defaultCoproId ?? '')
  const [type, setType] = useState<DossierType>('sinistre')
  const [titre, setTitre] = useState('')
  const [priorite, setPriorite] = useState<number>(2)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Le dialog reste monté entre deux ouvertures : sans cette remise à zéro, le
  // useState ci-dessus fige la copro du tout premier rendu (souvent aucune) et
  // le champ reste vide alors qu'une copropriété est sélectionnée à l'écran.
  useEffect(() => {
    if (open) {
      setCoproId(defaultCoproId ?? '')
      return
    }
    setType('sinistre')
    setTitre('')
    setPriorite(2)
    setError(null)
  }, [open, defaultCoproId])

  const canSubmit = coproId && titre.trim().length > 0 && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copro_id: coproId, type, titre: titre.trim(), priorite }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      const { dossier }: { dossier: Dossier } = await res.json()
      onOpenChange(false)
      onCreated?.(dossier)
      router.push(`/apps/venator/dossiers/${dossier.id}` as any)
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
          <DialogTitle className="text-venator-fg">Nouveau dossier</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dossier-copro" className={venatorLabel}>Copropriété</Label>
            <Select value={coproId} onValueChange={setCoproId}>
              <SelectTrigger id="dossier-copro" className={venatorSelectTrigger}>
                <SelectValue placeholder="Choisir une copropriété" />
              </SelectTrigger>
              <SelectContent className={venatorSelectContent}>
                {copros.map((c) => (
                  <SelectItem key={c.id} value={c.id} className={venatorSelectItem}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dossier-type" className={venatorLabel}>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DossierType)}>
              <SelectTrigger id="dossier-type" className={venatorSelectTrigger}>
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dossier-titre" className={venatorLabel}>Titre</Label>
            <Input
              id="dossier-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Dégât des eaux appartement 12"
              maxLength={200}
              className={venatorInput}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dossier-priorite" className={venatorLabel}>Priorité</Label>
            <Select value={String(priorite)} onValueChange={(v) => setPriorite(Number(v))}>
              <SelectTrigger id="dossier-priorite" className={venatorSelectTrigger}>
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
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit} className={venatorButtonPrimary}>
            {submitting ? 'Création…' : 'Créer le dossier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
