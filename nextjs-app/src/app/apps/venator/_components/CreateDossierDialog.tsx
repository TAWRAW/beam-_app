'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
import { DOSSIER_TYPES, type Copro, type Dossier, type DossierType, type Equipement } from '@/lib/venator/types'
import { DOSSIER_TYPE_LABELS, EQUIPEMENT_CATEGORIE_SUGGESTIONS } from '@/lib/venator/labels'
import { useEquipements } from '@/lib/venator/useVenator'
import {
  venatorButtonPrimary,
  venatorButtonSecondary,
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
  const [equipementId, setEquipementId] = useState('')
  const [echeance, setEcheance] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Création d'un équipement à la volée : le référentiel n'a pas d'écran de
  // gestion dédié, il n'y a donc aucun autre moyen de le peupler que depuis ici.
  const [creationEquipement, setCreationEquipement] = useState(false)
  const [nouvelEquipementNom, setNouvelEquipementNom] = useState('')
  const [nouvelleCategorie, setNouvelleCategorie] = useState('')
  const [creationSubmitting, setCreationSubmitting] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)

  const { data: equipementsData, mutate: mutateEquipements } = useEquipements(type === 'entretien' ? coproId : '')
  const equipements = equipementsData?.equipements ?? []

  async function handleCreerEquipement() {
    if (!nouvelEquipementNom.trim() || !nouvelleCategorie.trim() || creationSubmitting) return
    setCreationSubmitting(true)
    setCreationError(null)
    try {
      const res = await fetch('/api/venator/equipements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copro_id: coproId, nom: nouvelEquipementNom.trim(), categorie: nouvelleCategorie.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      const { equipement }: { equipement: Equipement } = await res.json()
      await mutateEquipements()
      setEquipementId(equipement.id)
      setCreationEquipement(false)
      setNouvelEquipementNom('')
      setNouvelleCategorie('')
    } catch (e) {
      setCreationError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setCreationSubmitting(false)
    }
  }

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
    setEquipementId('')
    setEcheance('')
    setError(null)
    setCreationEquipement(false)
    setNouvelEquipementNom('')
    setNouvelleCategorie('')
    setCreationError(null)
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
        body: JSON.stringify({
          copro_id: coproId,
          type,
          titre: titre.trim(),
          priorite,
          equipement_id: equipementId || null,
          echeance: echeance || null,
        }),
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

          {type === 'entretien' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dossier-equipement" className={venatorLabel}>Équipement</Label>
                <Select
                  value={equipementId}
                  onValueChange={(v) => {
                    if (v === '__nouveau__') { setCreationEquipement(true); return }
                    setCreationEquipement(false)
                    setEquipementId(v === '__aucun__' ? '' : v)
                  }}
                  disabled={!coproId}
                >
                  <SelectTrigger id="dossier-equipement" className={venatorSelectTrigger}>
                    <SelectValue placeholder="Aucun équipement lié" />
                  </SelectTrigger>
                  <SelectContent className={venatorSelectContent}>
                    <SelectItem value="__aucun__" className={venatorSelectItem}>Aucun équipement lié</SelectItem>
                    {equipements.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id} className={venatorSelectItem}>
                        {eq.nom}
                      </SelectItem>
                    ))}
                    <SelectItem value="__nouveau__" className={venatorSelectItem}>+ Nouvel équipement…</SelectItem>
                  </SelectContent>
                </Select>

                {creationEquipement && (
                  <div className="flex flex-col gap-2 rounded-[var(--venator-radius-md)] bg-venator-surface-2 p-3">
                    <Input
                      value={nouvelEquipementNom}
                      onChange={(e) => setNouvelEquipementNom(e.target.value)}
                      placeholder="Ex : Interphone Bât A"
                      maxLength={200}
                      className={venatorInput}
                    />
                    <Input
                      value={nouvelleCategorie}
                      onChange={(e) => setNouvelleCategorie(e.target.value)}
                      placeholder="Ex : VMC, Chauffage…"
                      maxLength={100}
                      list="equipement-categorie-suggestions"
                      className={venatorInput}
                    />
                    <datalist id="equipement-categorie-suggestions">
                      {EQUIPEMENT_CATEGORIE_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                    </datalist>
                    {creationError && <p className="text-sm font-medium text-venator-danger">{creationError}</p>}
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setCreationEquipement(false); setNouvelEquipementNom(''); setNouvelleCategorie(''); setCreationError(null) }}
                        className={cn(venatorButtonSecondary, 'h-8 px-3')}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreerEquipement}
                        disabled={!nouvelEquipementNom.trim() || !nouvelleCategorie.trim() || creationSubmitting}
                        className={cn(venatorButtonPrimary, 'h-8 px-3')}
                      >
                        {creationSubmitting ? 'Ajout…' : 'Ajouter'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dossier-echeance" className={venatorLabel}>Échéance</Label>
                <Input
                  id="dossier-echeance"
                  type="date"
                  value={echeance}
                  onChange={(e) => setEcheance(e.target.value)}
                  className={venatorInput}
                />
              </div>
            </>
          )}

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
