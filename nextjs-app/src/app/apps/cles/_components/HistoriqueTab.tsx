'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, FileDown } from 'lucide-react'
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
import type { CleInventaire, CleRemise } from '@/lib/cles/cles-types'
import { CLE_TYPE_LABELS } from '@/lib/cles/cles-types'
import {
  CondoSelect,
  fetchOwners,
  useCondos,
  type CondoOption,
  type OwnerOption,
} from './common'

export function HistoriqueTab() {
  const { condos } = useCondos()
  const [condoId, setCondoId] = useState<string | null>(null)
  const [remises, setRemises] = useState<CleRemise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agency, setAgency] = useState<Record<string, unknown> | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generatingBordereau, setGeneratingBordereau] = useState(false)
  const [bordereauError, setBordereauError] = useState<string | null>(null)

  const condo = condos.find((c) => c.id === condoId) || null

  // Cabinet (en-tête bordereau) chargé une fois — même source que la facture.
  useEffect(() => {
    fetch('/api/estale/agency')
      .then((r) => r.json())
      .then((j) => setAgency(j.agency ?? null))
      .catch(() => setAgency(null))
  }, [])

  const reload = useCallback(async (id: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const url = id
        ? `/api/cles/remises?condoId=${encodeURIComponent(id)}`
        : '/api/cles/remises'
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setRemises(json.items ?? [])
      setSelected(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload(condoId)
  }, [condoId, reload])

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedRemises = remises.filter((r) => selected.has(r.id))
  const selectedOwnerIds = new Set(selectedRemises.map((r) => r.estale_owner_id))
  const selectedCondoIds = new Set(selectedRemises.map((r) => r.estale_condo_id))
  // Un bordereau = un seul copropriétaire ET une seule copro (l'entête n'en porte
  // qu'une) : en vue « toutes les copropriétés » on garde-fou contre une sélection
  // mixte qui misattribuerait des lignes à la mauvaise copro.
  const canGenerateBordereau =
    selectedRemises.length > 0 && selectedOwnerIds.size === 1 && selectedCondoIds.size === 1

  const genererBordereau = async () => {
    if (!canGenerateBordereau) return
    setGeneratingBordereau(true)
    setBordereauError(null)
    try {
      const first = selectedRemises[0]
      const condoName = condos.find((c) => c.id === first.estale_condo_id)?.name ?? null
      const html = buildBordereauHtml({ remises: selectedRemises, agency, condoName })
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, metadata: { title: 'Bordereau de remise' } }),
      })
      if (!res.ok) throw new Error('Erreur génération PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10)
      a.download = `Bordereau-remise-${slugify(first.owner_nom)}-${dateStr}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setSelected(new Set())
    } catch (e) {
      setBordereauError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setGeneratingBordereau(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CondoSelect
          condos={condos}
          value={condoId}
          onChange={setCondoId}
          placeholder="Toutes les copropriétés"
        />
        <div className="flex items-center gap-2">
          <button
            disabled={!canGenerateBordereau || generatingBordereau}
            onClick={genererBordereau}
            title={
              canGenerateBordereau
                ? undefined
                : 'Sélectionnez une ou plusieurs remises d’un même copropriétaire'
            }
            className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50"
          >
            {generatingBordereau ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Bordereau de remise
          </button>
          {condo && (
            <RemiseFormDialog
              condo={condo}
              onSaved={() => reload(condoId)}
              trigger={
                <button className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-primary px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]">
                  <Plus className="h-4 w-4" /> Nouvelle remise
                </button>
              }
            />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border-2 border-black bg-[#FFF1F1] px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      {bordereauError && (
        <div className="rounded-xl border-2 border-black bg-[#FFF1F1] px-3 py-2 text-sm font-semibold text-red-700">
          {bordereauError}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-black/50" />
        </div>
      )}

      {!loading && remises.length === 0 && !error && (
        <div className="rounded-2xl border-2 border-dashed border-black/30 bg-white/50 p-6 text-center text-sm text-gray-600">
          Aucune remise enregistrée{condoId ? ' pour cette copropriété' : ''}.
        </div>
      )}

      {!loading && remises.length > 0 && (
        <div className="overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-black bg-[#F2F1E6] text-left">
              <tr>
                <th className="w-10 px-3 py-2"></th>
                <th className="px-3 py-2 text-xs font-black uppercase">Date</th>
                <th className="px-3 py-2 text-xs font-black uppercase">Copropriétaire</th>
                <th className="px-3 py-2 text-xs font-black uppercase">Clé</th>
                <th className="px-3 py-2 text-right text-xs font-black uppercase">Qté</th>
                <th className="px-3 py-2 text-xs font-black uppercase">Facturé&nbsp;?</th>
              </tr>
            </thead>
            <tbody>
              {remises.map((r) => (
                <tr key={r.id} className="border-b border-black/10 last:border-0">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="h-4 w-4 accent-black"
                    />
                  </td>
                  <td className="px-3 py-2">{formatDate(r.date_remise)}</td>
                  <td className="px-3 py-2 font-semibold">
                    {r.owner_ref ? `${r.owner_ref} — ` : ''}
                    {r.owner_nom}
                  </td>
                  <td className="px-3 py-2">
                    {r.cle_libelle}{' '}
                    <span className="text-xs text-gray-500">({CLE_TYPE_LABELS[r.cle_type]})</span>
                  </td>
                  <td className="px-3 py-2 text-right">{r.quantite}</td>
                  <td className="px-3 py-2">
                    {r.facture_id ? (
                      <span className="rounded-full bg-[#A8E6A1] px-2 py-0.5 text-xs font-bold">facturé</span>
                    ) : (
                      <span className="rounded-full bg-[#FFE9A8] px-2 py-0.5 text-xs font-bold">à facturer</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ----- Dialog : enregistrer une remise -----

function RemiseFormDialog({
  condo,
  onSaved,
  trigger,
}: {
  condo: CondoOption
  onSaved: () => void
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [owners, setOwners] = useState<OwnerOption[]>([])
  const [keys, setKeys] = useState<CleInventaire[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [refsError, setRefsError] = useState<string | null>(null)

  const [ownerId, setOwnerId] = useState<string>('')
  const [cleId, setCleId] = useState<string>('')
  const [quantite, setQuantite] = useState('1')
  const [dateRemise, setDateRemise] = useState(() => isoToday())
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoadingRefs(true)
    setRefsError(null)
    Promise.all([
      fetchOwners(condo.id),
      fetch(`/api/cles/inventaire?condoId=${encodeURIComponent(condo.id)}`).then((r) => r.json()),
    ])
      .then(([ow, inv]) => {
        setOwners(ow)
        setKeys((inv.items ?? []).filter((k: CleInventaire) => k.actif))
      })
      .catch((e) => setRefsError(e instanceof Error ? e.message : 'Erreur de chargement'))
      .finally(() => setLoadingRefs(false))
  }, [open, condo.id])

  const selectedKey = keys.find((k) => k.id === cleId) || null
  const owner = owners.find((o) => o.id === ownerId) || null

  const submit = async () => {
    if (!owner || !selectedKey) return
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch('/api/cles/remises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estale_condo_id: condo.id,
          condo_ref: condo.reference ?? null,
          cle_id: selectedKey.id,
          cle_libelle: selectedKey.libelle,
          cle_type: selectedKey.type,
          estale_owner_id: owner.id,
          owner_ref: owner.reference ?? null,
          owner_nom: owner.fullname,
          quantite: parseInt(quantite, 10) || 1,
          date_remise: dateRemise,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setOpen(false)
      setOwnerId('')
      setCleId('')
      setQuantite('1')
      onSaved()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-2 border-black">
        <DialogHeader>
          <DialogTitle>Remettre des clés — {condo.name}</DialogTitle>
        </DialogHeader>

        {loadingRefs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-black/50" />
          </div>
        ) : refsError ? (
          <div className="rounded-xl border-2 border-black bg-[#FFF1F1] px-3 py-2 text-sm font-semibold text-red-700">
            {refsError}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Copropriétaire</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="border-2 border-black">
                  <SelectValue placeholder="Choisir un copropriétaire…" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.reference} — {o.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Clé</Label>
              <Select value={cleId} onValueChange={setCleId}>
                <SelectTrigger className="border-2 border-black">
                  <SelectValue placeholder="Choisir une clé…" />
                </SelectTrigger>
                <SelectContent>
                  {keys.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.libelle} — stock {k.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedKey && selectedKey.stock <= 0 && (
                <p className="text-xs font-semibold text-red-600">Stock épuisé pour cette clé.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantité</Label>
                <Input
                  className="border-2 border-black"
                  type="number"
                  min={1}
                  max={selectedKey?.stock ?? undefined}
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Date de remise</Label>
                <Input
                  className="border-2 border-black"
                  type="date"
                  value={dateRemise}
                  onChange={(e) => setDateRemise(e.target.value)}
                />
              </div>
            </div>
            {keys.length === 0 && (
              <p className="text-xs text-gray-600">
                Aucune clé active dans l’inventaire de cette copropriété. Ajoutez-en une dans l’onglet Inventaire.
              </p>
            )}
            {err && (
              <div className="rounded-xl border-2 border-black bg-[#FFF1F1] px-3 py-2 text-sm font-semibold text-red-700">
                {err}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <button
            disabled={saving || !owner || !selectedKey || (selectedKey?.stock ?? 0) <= 0}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-primary px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer la remise
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function isoToday(): string {
  // Date du jour au format YYYY-MM-DD pour <input type="date">
  return new Date().toISOString().slice(0, 10)
}
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR')
  } catch {
    return iso
  }
}

function slugify(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ----- HTML du bordereau de remise (injecté dans /api/pdf) -----
// Distinct de la facture : reçu de remise des clés, pas de tarification.
function buildBordereauHtml(d: {
  remises: CleRemise[]
  agency: Record<string, unknown> | null
  condoName: string | null
}): string {
  const a = (d.agency ?? {}) as Record<string, any>
  const first = d.remises[0]
  const today = new Date().toLocaleDateString('fr-FR')
  const cabinetLines = [
    a.name || 'Beamô',
    [a.address, a.addressL2, a.addressL3].filter(Boolean).join(' '),
    [a.zipCode, a.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .map((l: string) => `<div>${escapeHtml(l)}</div>`)
    .join('')

  // Date de remise affichée en pied de page = la plus récente du lot sélectionné.
  const latestDateIso = d.remises.reduce(
    (max, r) => (r.date_remise > max ? r.date_remise : max),
    d.remises[0].date_remise,
  )
  const latestDate = formatDate(latestDateIso)

  const rows = d.remises
    .map(
      (r, i) => `
      <tr style="background:${i % 2 ? '#FAFAF7' : '#fff'}">
        <td style="padding:9px 12px;border-bottom:1px solid #e5e5e5">${escapeHtml(formatDate(r.date_remise))}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #e5e5e5;font-weight:600">${escapeHtml(r.cle_libelle)} <span style="color:#888;font-weight:400">(${escapeHtml(CLE_TYPE_LABELS[r.cle_type])})</span></td>
        <td style="padding:9px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600">${r.quantite}</td>
      </tr>`,
    )
    .join('')

  return `
  <div style="font-family:'Poppins','Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;max-width:720px;margin:0 auto">
    <!-- Filet jaune de marque -->
    <div style="height:8px;background:#FFC300;border-radius:6px;margin-bottom:22px"></div>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px">
      <div style="font-size:12px;line-height:1.5;color:#333">${cabinetLines}</div>
      <div style="text-align:right">
        <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;text-transform:uppercase">Bordereau de remise de clés</div>
        <div style="font-size:12px;color:#555;margin-top:6px">Date : ${today}</div>
      </div>
    </div>

    <!-- Réf. copropriété -->
    ${
      d.condoName || first.condo_ref
        ? `<div style="display:flex;gap:12px;margin-bottom:20px">
      <div style="border:2px solid #000;border-radius:16px;background:#FFC300;padding:8px 14px">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px">Réf. copropriété</div>
        <div style="font-size:20px;font-weight:800;line-height:1">${escapeHtml(first.condo_ref || '—')}</div>
      </div>
    </div>`
        : ''
    }

    <!-- Bénéficiaire -->
    <div style="border:2px solid #000;border-radius:16px;padding:12px 16px;margin-bottom:18px;font-size:13px;line-height:1.6">
      ${d.condoName ? `<div><span style="font-weight:700">Copropriété :</span> ${escapeHtml(d.condoName)}</div>` : ''}
      <div><span style="font-weight:700">Bénéficiaire :</span> ${escapeHtml(first.owner_nom)}${first.owner_ref ? ` (réf. ${escapeHtml(first.owner_ref)})` : ''}</div>
    </div>

    <!-- Tableau des clés remises -->
    <div style="border:2px solid #000;border-radius:16px;overflow:hidden;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:#F2F1E6">
            <th style="padding:9px 12px;text-align:left;border-bottom:2px solid #000;text-transform:uppercase;font-size:10px;letter-spacing:0.3px">Date</th>
            <th style="padding:9px 12px;text-align:left;border-bottom:2px solid #000;text-transform:uppercase;font-size:10px;letter-spacing:0.3px">Clé</th>
            <th style="padding:9px 12px;text-align:right;border-bottom:2px solid #000;text-transform:uppercase;font-size:10px;letter-spacing:0.3px">Qté remise</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- Signature -->
    <p style="font-size:13px;margin-top:32px">
      Remis le ${escapeHtml(latestDate)} — Signature du bénéficiaire : _______________________
    </p>
  </div>`
}
