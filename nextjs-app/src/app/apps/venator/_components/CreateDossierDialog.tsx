'use client'

import { useState } from 'react'
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

const TYPE_LABELS: Record<DossierType, string> = {
  sinistre: 'Sinistre',
  travaux: 'Travaux',
  procedure: 'Procédure',
  mutation: 'Mutation',
  ag: 'AG',
  conseil_syndical: 'Conseil syndical',
  vie_copro: 'Vie copro',
  autre: 'Autre',
}

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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  copros: Copro[]
  defaultCoproId?: string
}) {
  const router = useRouter()
  const [coproId, setCoproId] = useState(defaultCoproId ?? '')
  const [type, setType] = useState<DossierType>('sinistre')
  const [titre, setTitre] = useState('')
  const [priorite, setPriorite] = useState<number>(2)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      router.push(`/apps/venator/dossiers/${dossier.id}` as any)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
        <DialogHeader>
          <DialogTitle>Nouveau dossier</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dossier-copro">Copropriété</Label>
            <Select value={coproId} onValueChange={setCoproId}>
              <SelectTrigger id="dossier-copro">
                <SelectValue placeholder="Choisir une copropriété" />
              </SelectTrigger>
              <SelectContent>
                {copros.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dossier-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DossierType)}>
              <SelectTrigger id="dossier-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOSSIER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dossier-titre">Titre</Label>
            <Input
              id="dossier-titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Dégât des eaux appartement 12"
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dossier-priorite">Priorité</Label>
            <Select value={String(priorite)} onValueChange={(v) => setPriorite(Number(v))}>
              <SelectTrigger id="dossier-priorite">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3].map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {PRIORITE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#FFC300] border-2 border-black rounded-full font-bold shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] text-black hover:bg-[#FFC300]"
          >
            {submitting ? 'Création…' : 'Créer le dossier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
