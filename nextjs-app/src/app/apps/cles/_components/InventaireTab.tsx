'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CleInventaire, CleType } from '@/lib/cles/cles-types'
import { CLE_TYPE_LABELS } from '@/lib/cles/cles-types'
import {
  CondoSelect,
  formatEur,
  useCondos,
  type CondoOption,
} from './common'

const TYPES: CleType[] = ['badge', 'cle', 'telecommande', 'autre']
const TVA = 20
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function InventaireTab() {
  const { condos, loading: condosLoading } = useCondos()
  const [condoId, setCondoId] = useState<string | null>(null)
  const [items, setItems] = useState<CleInventaire[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const condo = condos.find((c) => c.id === condoId) || null

  const reload = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cles/inventaire?condoId=${encodeURIComponent(id)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setItems(json.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (condoId) reload(condoId)
    else setItems([])
  }, [condoId, reload])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CondoSelect condos={condos} value={condoId} onChange={setCondoId} />
        {condoId && condo && (
          <KeyFormDialog
            condo={condo}
            onSaved={() => reload(condoId)}
            trigger={
              <button className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-primary px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]">
                <Plus className="h-4 w-4" /> Ajouter une clé
              </button>
            }
          />
        )}
      </div>

      {condosLoading && <Spinner />}
      {!condoId && !condosLoading && (
        <EmptyHint>Sélectionnez une copropriété pour voir son inventaire.</EmptyHint>
      )}
      {error && <ErrorBox>{error}</ErrorBox>}

      {condoId && loading && <Spinner />}
      {condoId && !loading && items.length === 0 && !error && (
        <EmptyHint>Aucune clé enregistrée pour cette copropriété.</EmptyHint>
      )}

      {condoId && !loading && items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-black bg-[#F2F1E6] text-left">
              <tr>
                <Th>Type</Th>
                <Th>Libellé</Th>
                <Th className="text-right">Stock</Th>
                <Th className="text-right">Prix unitaire</Th>
                <Th>État</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-black/10 last:border-0">
                  <Td>{CLE_TYPE_LABELS[it.type]}</Td>
                  <Td className="font-semibold">{it.libelle}</Td>
                  <Td className="text-right">{it.stock}</Td>
                  <Td className="text-right">
                    <div className="font-semibold">{formatEur(it.prix_unitaire_ht)} HT</div>
                    <div className="text-xs text-gray-500">
                      {formatEur(round2(it.prix_unitaire_ht * (1 + (it.taux_tva ?? TVA) / 100)))} TTC
                    </div>
                  </Td>
                  <Td>
                    {it.actif ? (
                      <span className="rounded-full bg-[#A8E6A1] px-2 py-0.5 text-xs font-bold">actif</span>
                    ) : (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold">inactif</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    {condo && (
                      <KeyFormDialog
                        condo={condo}
                        existing={it}
                        onSaved={() => reload(condoId)}
                        trigger={
                          <button className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]">
                            <Pencil className="h-3 w-3" /> Éditer
                          </button>
                        }
                      />
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ----- Dialog ajout/édition -----

function KeyFormDialog({
  condo,
  existing,
  onSaved,
  trigger,
}: {
  condo: CondoOption
  existing?: CleInventaire
  onSaved: () => void
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<CleType>(existing?.type ?? 'cle')
  const [libelle, setLibelle] = useState(existing?.libelle ?? '')
  const [stock, setStock] = useState(String(existing?.stock ?? 0))
  // `prix` = valeur saisie dans le mode courant (HT ou TTC). On stocke toujours
  // du HT en base ; le TTC n'est qu'une commodité de saisie/affichage.
  const [prix, setPrix] = useState(String(existing?.prix_unitaire_ht ?? 0))
  const [priceMode, setPriceMode] = useState<'HT' | 'TTC'>('HT')
  const [actif, setActif] = useState(existing?.actif ?? true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Prix dérivés à partir de la saisie + du mode.
  const raw = parseFloat(prix) || 0
  const prixHT = priceMode === 'HT' ? round2(raw) : round2(raw / (1 + TVA / 100))
  const prixTTC = round2(prixHT * (1 + TVA / 100))

  // Bascule HT↔TTC en préservant le prix réel (on recalcule la valeur affichée).
  const switchMode = (mode: 'HT' | 'TTC') => {
    if (mode === priceMode) return
    setPrix(String(mode === 'HT' ? prixHT : prixTTC))
    setPriceMode(mode)
  }

  const reset = () => {
    setType(existing?.type ?? 'cle')
    setLibelle(existing?.libelle ?? '')
    setStock(String(existing?.stock ?? 0))
    setPrix(String(existing?.prix_unitaire_ht ?? 0))
    setPriceMode('HT')
    setActif(existing?.actif ?? true)
    setErr(null)
  }

  const submit = async () => {
    setSaving(true)
    setErr(null)
    try {
      const payload = {
        type,
        libelle: libelle.trim(),
        stock: parseInt(stock, 10) || 0,
        prix_unitaire_ht: prixHT,
        taux_tva: TVA,
        actif,
      }
      const res = existing
        ? await fetch(`/api/cles/inventaire/${existing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/cles/inventaire', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              estale_condo_id: condo.id,
              condo_ref: condo.reference ?? null,
            }),
          })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setOpen(false)
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-2 border-black">
        <DialogHeader>
          <DialogTitle>{existing ? 'Modifier la clé' : 'Nouvelle clé'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CleType)}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CLE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Libellé</Label>
            <Input
              className="border-2 border-black"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex. Badge Vigik hall A"
            />
          </div>
          <div className="space-y-1">
            <Label>Stock</Label>
            <Input
              className="w-32 border-2 border-black"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Prix unitaire</Label>
              {/* Bascule glissante HT ↔ TTC */}
              <div className="inline-flex overflow-hidden rounded-full border-2 border-black text-xs font-bold">
                <button
                  type="button"
                  onClick={() => switchMode('HT')}
                  className={`px-3 py-1 transition ${priceMode === 'HT' ? 'bg-primary' : 'bg-white text-gray-500'}`}
                >
                  HT
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('TTC')}
                  className={`border-l-2 border-black px-3 py-1 transition ${priceMode === 'TTC' ? 'bg-primary' : 'bg-white text-gray-500'}`}
                >
                  TTC
                </button>
              </div>
            </div>
            <Input
              className="border-2 border-black"
              type="number"
              min={0}
              step="0.01"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder={priceMode === 'HT' ? 'Prix HT' : 'Prix TTC'}
            />
            <p className="text-xs font-semibold text-gray-600">
              {formatEur(prixHT)} HT&nbsp;·&nbsp;{formatEur(prixTTC)} TTC{' '}
              <span className="font-normal text-gray-400">(TVA {TVA}%)</span>
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={actif}
              onChange={(e) => setActif(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Clé active (proposée à la remise)
          </label>
          {err && <ErrorBox>{err}</ErrorBox>}
        </div>
        <DialogFooter>
          <button
            disabled={saving || !libelle.trim()}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-primary px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {existing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ----- Petits éléments partagés -----

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-xs font-black uppercase tracking-tight ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>
}
function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-black/50" />
    </div>
  )
}
function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-black/30 bg-white/50 p-6 text-center text-sm text-gray-600">
      {children}
    </div>
  )
}
function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-black bg-[#FFF1F1] px-3 py-2 text-sm font-semibold text-red-700">
      {children}
    </div>
  )
}
