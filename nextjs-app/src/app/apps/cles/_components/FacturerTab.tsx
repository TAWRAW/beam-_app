'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CleInventaire, CleRemise, CleFacture } from '@/lib/cles/cles-types'
import { CLE_TYPE_LABELS } from '@/lib/cles/cles-types'
import { generateLegalMentions } from '@/lib/legal-mentions'
import {
  CondoSelect,
  fetchOwners,
  formatEur,
  useCondos,
  type CondoOption,
  type OwnerOption,
} from './common'

const TVA = 20
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100


export function FacturerTab() {
  const { condos } = useCondos()
  const [condoId, setCondoId] = useState<string | null>(null)
  const [owners, setOwners] = useState<OwnerOption[]>([])
  const [ownerId, setOwnerId] = useState<string>('')
  const [keys, setKeys] = useState<CleInventaire[]>([])
  const [remises, setRemises] = useState<CleRemise[]>([]) // remises non facturées existantes
  const [agency, setAgency] = useState<Record<string, unknown> | null>(null)
  const [qty, setQty] = useState<Record<string, string>>({}) // cle_id -> quantité à facturer
  const [selectedRemises, setSelectedRemises] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const condo = condos.find((c) => c.id === condoId) || null
  const owner = owners.find((o) => o.id === ownerId) || null

  // Cabinet (en-tête facture) chargé une fois.
  useEffect(() => {
    fetch('/api/estale/agency')
      .then((r) => r.json())
      .then((j) => setAgency(j.agency ?? null))
      .catch(() => setAgency(null))
  }, [])

  // Copro → owners + inventaire (l'inventaire ne dépend que de la copro).
  useEffect(() => {
    setOwnerId('')
    setOwners([])
    setRemises([])
    setQty({})
    setSelectedRemises(new Set())
    setDone(null)
    if (!condoId) {
      setKeys([])
      return
    }
    setError(null)
    Promise.all([
      fetchOwners(condoId),
      fetch(`/api/cles/inventaire?condoId=${encodeURIComponent(condoId)}`).then((r) => r.json()),
    ])
      .then(([ow, inv]) => {
        setOwners(ow)
        setKeys((inv.items ?? []).filter((k: CleInventaire) => k.actif))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur de chargement'))
  }, [condoId])

  // Owner → remises non facturées existantes (créées via Historique).
  const reloadRemises = useCallback(async () => {
    if (!condoId || !ownerId) {
      setRemises([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/cles/remises?nonFacturees=true&condoId=${encodeURIComponent(condoId)}&ownerId=${encodeURIComponent(ownerId)}`,
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur remises')
      setRemises(json.items ?? [])
      setSelectedRemises(new Set((json.items ?? []).map((r: CleRemise) => r.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [condoId, ownerId])

  useEffect(() => {
    reloadRemises()
  }, [reloadRemises])

  const priceByCle = useMemo(() => {
    const m = new Map<string, number>()
    keys.forEach((k) => m.set(k.id, k.prix_unitaire_ht))
    return m
  }, [keys])

  // Lignes "nouvelles" depuis l'inventaire (quantité > 0).
  const invLines = useMemo(
    () =>
      keys
        .map((k) => ({ key: k, q: parseInt(qty[k.id] || '0', 10) || 0 }))
        .filter((l) => l.q > 0)
        .map((l) => ({
          cle_id: l.key.id,
          libelle: l.key.libelle,
          quantite: l.q,
          prix_unitaire_ht: l.key.prix_unitaire_ht,
          montant_ht: round2(l.key.prix_unitaire_ht * l.q),
        })),
    [keys, qty],
  )

  // Lignes issues des remises existantes cochées.
  const remiseLines = useMemo(
    () =>
      remises
        .filter((r) => selectedRemises.has(r.id))
        .map((r) => {
          const pu = priceByCle.get(r.cle_id) ?? 0
          return { remise: r, prix_unitaire_ht: pu, montant_ht: round2(pu * r.quantite) }
        }),
    [remises, selectedRemises, priceByCle],
  )

  const montantHT = round2(
    invLines.reduce((s, l) => s + l.montant_ht, 0) +
      remiseLines.reduce((s, l) => s + l.montant_ht, 0),
  )
  const montantTVA = round2(montantHT * (TVA / 100))
  const montantTTC = round2(montantHT + montantTVA)
  const nbLignes = invLines.length + remiseLines.length

  const setQ = (cleId: string, v: string) => setQty((p) => ({ ...p, [cleId]: v }))
  const toggleRemise = (id: string) =>
    setSelectedRemises((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const generer = async () => {
    if (!condo || !owner || nbLignes === 0) return
    setGenerating(true)
    setError(null)
    setDone(null)
    try {
      const res = await fetch('/api/cles/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estale_condo_id: condo.id,
          condo_ref: condo.reference ?? null,
          estale_owner_id: owner.id,
          owner_ref: owner.reference ?? null,
          owner_nom: owner.fullname,
          owner_snapshot: owner,
          cabinet_snapshot: agency ?? {},
          remise_ids: [...selectedRemises],
          new_lignes: invLines.map((l) => ({ cle_id: l.cle_id, quantite: l.quantite })),
          taux_tva: TVA,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur création facture')
      const facture: CleFacture = json.facture

      const html = buildInvoiceHtml({ facture, condo, owner })
      const pdfRes = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, metadata: { title: facture.numero } }),
      })
      if (!pdfRes.ok) throw new Error('Erreur génération PDF')
      const blob = await pdfRes.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${facture.numero}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      setDone(`Facture ${facture.numero} générée (${formatEur(facture.montant_ttc)} TTC).`)
      setQty({})
      // recharge l'inventaire (stock décrémenté) + les remises
      if (condoId) {
        fetch(`/api/cles/inventaire?condoId=${encodeURIComponent(condoId)}`)
          .then((r) => r.json())
          .then((inv) => setKeys((inv.items ?? []).filter((k: CleInventaire) => k.actif)))
          .catch(() => {})
      }
      await reloadRemises()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CondoSelect condos={condos} value={condoId} onChange={setCondoId} />
        {condoId && (
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger className="w-full max-w-xs border-2 border-black bg-white font-semibold shadow-[2px_2px_0px_0px_#000]">
              <SelectValue placeholder="Copropriétaire…" />
            </SelectTrigger>
            <SelectContent>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.reference} — {o.fullname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className="rounded-xl border-2 border-black bg-[#FFF1F1] px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      {done && (
        <div className="rounded-xl border-2 border-black bg-[#A8E6A1] px-3 py-2 text-sm font-semibold">
          {done}
        </div>
      )}

      {!ownerId && (
        <div className="rounded-2xl border-2 border-dashed border-black/30 bg-white/50 p-6 text-center text-sm text-gray-600">
          Choisissez une copropriété puis un copropriétaire pour facturer ses clés.
        </div>
      )}

      {ownerId && (
        <>
          {/* Bandeau réfs d'imputation */}
          <div className="flex flex-wrap gap-3">
            <RefBadge label="Réf. copropriété" value={condo?.reference || '—'} />
            <RefBadge label="Réf. copropriétaire" value={owner?.reference || '—'} />
            <div className="flex items-center rounded-2xl border-2 border-black bg-white px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_0px_#000]">
              {owner?.fullname}
            </div>
          </div>

          {/* Clés de l'inventaire à facturer (quantités) */}
          <div>
            <h3 className="mb-2 text-sm font-black uppercase tracking-tight">
              Clés de l’inventaire
            </h3>
            {keys.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-black/30 bg-white/50 p-6 text-center text-sm text-gray-600">
                Aucune clé active dans l’inventaire de cette copropriété. Ajoutez-en dans l’onglet
                Inventaire.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-black bg-[#F2F1E6] text-left">
                    <tr>
                      <th className="px-3 py-2 text-xs font-black uppercase">Clé</th>
                      <th className="px-3 py-2 text-right text-xs font-black uppercase">Stock</th>
                      <th className="px-3 py-2 text-right text-xs font-black uppercase">PU HT</th>
                      <th className="px-3 py-2 text-center text-xs font-black uppercase">Qté à facturer</th>
                      <th className="px-3 py-2 text-right text-xs font-black uppercase">Montant HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => {
                      const q = parseInt(qty[k.id] || '0', 10) || 0
                      const out = k.stock <= 0
                      return (
                        <tr key={k.id} className="border-b border-black/10 last:border-0">
                          <td className="px-3 py-2">
                            {k.libelle}{' '}
                            <span className="text-xs text-gray-500">({CLE_TYPE_LABELS[k.type]})</span>
                          </td>
                          <td className="px-3 py-2 text-right">{k.stock}</td>
                          <td className="px-3 py-2 text-right">{formatEur(k.prix_unitaire_ht)}</td>
                          <td className="px-3 py-2 text-center">
                            <Input
                              type="number"
                              min={0}
                              max={k.stock}
                              value={qty[k.id] ?? ''}
                              onChange={(e) => setQ(k.id, e.target.value)}
                              disabled={out}
                              placeholder="0"
                              className="mx-auto w-20 border-2 border-black text-center"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatEur(round2(k.prix_unitaire_ht * q))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Remises déjà enregistrées (Historique) non facturées */}
          {remises.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-tight">
                Remises déjà enregistrées (non facturées)
              </h3>
              <div className="overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-black bg-[#F2F1E6] text-left">
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="px-3 py-2 text-xs font-black uppercase">Date</th>
                      <th className="px-3 py-2 text-xs font-black uppercase">Clé</th>
                      <th className="px-3 py-2 text-right text-xs font-black uppercase">Qté</th>
                      <th className="px-3 py-2 text-right text-xs font-black uppercase">Montant HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remises.map((r) => {
                      const pu = priceByCle.get(r.cle_id) ?? 0
                      return (
                        <tr key={r.id} className="border-b border-black/10 last:border-0">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedRemises.has(r.id)}
                              onChange={() => toggleRemise(r.id)}
                              className="h-4 w-4 accent-black"
                            />
                          </td>
                          <td className="px-3 py-2">{formatDate(r.date_remise)}</td>
                          <td className="px-3 py-2">
                            {r.cle_libelle}{' '}
                            <span className="text-xs text-gray-500">({CLE_TYPE_LABELS[r.cle_type]})</span>
                          </td>
                          <td className="px-3 py-2 text-right">{r.quantite}</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatEur(round2(pu * r.quantite))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-black/50" />
            </div>
          )}

          {/* Totaux + action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-2xl border-2 border-black bg-white px-4 py-3 text-sm shadow-[2px_2px_0px_0px_#000]">
              <div className="flex justify-between gap-8">
                <span>Total HT</span>
                <span className="font-semibold">{formatEur(montantHT)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>TVA {TVA}%</span>
                <span className="font-semibold">{formatEur(montantTVA)}</span>
              </div>
              <div className="mt-1 flex justify-between gap-8 border-t-2 border-black pt-1 text-base font-black">
                <span>Total TTC</span>
                <span>{formatEur(montantTTC)}</span>
              </div>
            </div>

            <button
              disabled={generating || nbLignes === 0}
              onClick={generer}
              className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-primary px-5 py-3 text-sm font-bold shadow-[3px_3px_0px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Générer la facture PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function RefBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-black bg-primary px-4 py-2 shadow-[2px_2px_0px_0px_#000]">
      <div className="text-[10px] font-black uppercase tracking-tight">{label}</div>
      <div className="text-lg font-black leading-none">{value}</div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR')
  } catch {
    return iso
  }
}

// ----- HTML de la facture (injecté dans /api/pdf), bâti depuis la facture serveur -----

function buildInvoiceHtml(d: {
  facture: CleFacture
  condo: CondoOption
  owner: OwnerOption
}): string {
  const f = d.facture
  // Identité cabinet = snapshot Estale stocké sur la facture (source dynamique).
  const a = (f.cabinet_snapshot ?? {}) as Record<string, any>
  const eur = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const today = new Date().toLocaleDateString('fr-FR')
  const cabinetLines = [
    a.name || 'Beamô',
    [a.address, a.addressL2, a.addressL3].filter(Boolean).join(' '),
    [a.zipCode, a.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .map((l: string) => `<div>${escapeHtml(l)}</div>`)
    .join('')
  // Mentions légales : même source dynamique que les autres documents Beamô
  // (generateLegalMentions privilégie Estale, fallback Beamô si absent).
  const mentionsLegales = generateLegalMentions(a as any)

  const rows = (f.lignes_snapshot ?? [])
    .map(
      (l, i) => `
      <tr style="background:${i % 2 ? '#FAFAF7' : '#fff'}">
        <td style="padding:9px 12px;border-bottom:1px solid #e5e5e5;font-weight:600">${escapeHtml(l.libelle)} <span style="color:#888;font-weight:400">(${escapeHtml(CLE_TYPE_LABELS[l.type])})</span></td>
        <td style="padding:9px 12px;border-bottom:1px solid #e5e5e5;text-align:right">${l.quantite}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #e5e5e5;text-align:right">${eur(l.prix_unitaire_ht)}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600">${eur(l.montant_ht)}</td>
      </tr>`,
    )
    .join('')

  // Style charte Beamô : bordures noires, coins arrondis, titres gras, accents
  // jaunes limités (badges réf + filet) → fond blanc dominant pour l'impression.
  return `
  <div style="font-family:'Poppins','Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;max-width:720px;margin:0 auto">
    <!-- Filet jaune de marque (peu d'encre) -->
    <div style="height:8px;background:#FFC300;border-radius:6px;margin-bottom:22px"></div>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px">
      <div style="font-size:12px;line-height:1.5;color:#333">${cabinetLines}</div>
      <div style="text-align:right">
        <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;text-transform:uppercase">Facture</div>
        <div style="display:inline-block;margin-top:4px;border:2px solid #000;border-radius:9999px;padding:2px 12px;font-size:13px;font-weight:800">${escapeHtml(f.numero)}</div>
        <div style="font-size:12px;color:#555;margin-top:6px">Date : ${today}</div>
      </div>
    </div>

    <!-- Badges de réf d'imputation (signature jaune, format compact) -->
    <div style="display:flex;gap:12px;margin-bottom:20px">
      <div style="border:2px solid #000;border-radius:16px;background:#FFC300;padding:8px 14px">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px">Réf. copropriété</div>
        <div style="font-size:20px;font-weight:800;line-height:1">${escapeHtml(f.condo_ref || d.condo.reference || '—')}</div>
      </div>
      <div style="border:2px solid #000;border-radius:16px;background:#FFC300;padding:8px 14px">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px">Réf. copropriétaire</div>
        <div style="font-size:20px;font-weight:800;line-height:1">${escapeHtml(f.owner_ref || d.owner.reference || '—')}</div>
      </div>
    </div>

    <!-- Bloc destinataire (carte blanche bordée) -->
    <div style="border:2px solid #000;border-radius:16px;padding:12px 16px;margin-bottom:18px;font-size:13px;line-height:1.6">
      <div><span style="font-weight:700">Copropriété :</span> ${escapeHtml(d.condo.name)}${d.condo.city ? ' — ' + escapeHtml([d.condo.zipCode, d.condo.city].filter(Boolean).join(' ')) : ''}</div>
      <div><span style="font-weight:700">Copropriétaire :</span> ${escapeHtml(d.owner.fullname)}</div>
    </div>

    <!-- Tableau des lignes (carte blanche bordée, en-tête crème léger) -->
    <div style="border:2px solid #000;border-radius:16px;overflow:hidden;margin-bottom:18px">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:#F2F1E6">
            <th style="padding:9px 12px;text-align:left;border-bottom:2px solid #000;text-transform:uppercase;font-size:10px;letter-spacing:0.3px">Clé</th>
            <th style="padding:9px 12px;text-align:right;border-bottom:2px solid #000;text-transform:uppercase;font-size:10px;letter-spacing:0.3px">Qté</th>
            <th style="padding:9px 12px;text-align:right;border-bottom:2px solid #000;text-transform:uppercase;font-size:10px;letter-spacing:0.3px">PU HT</th>
            <th style="padding:9px 12px;text-align:right;border-bottom:2px solid #000;text-transform:uppercase;font-size:10px;letter-spacing:0.3px">Montant HT</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- Totaux (carte blanche bordée, ligne TTC accentuée) -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
      <div style="border:2px solid #000;border-radius:16px;overflow:hidden;min-width:240px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:7px 14px;text-align:right">Total HT</td><td style="padding:7px 14px;text-align:right;font-weight:700">${eur(f.montant_ht)}</td></tr>
          <tr><td style="padding:7px 14px;text-align:right;border-bottom:2px solid #000">TVA ${TVA}%</td><td style="padding:7px 14px;text-align:right;font-weight:700;border-bottom:2px solid #000">${eur(f.montant_tva)}</td></tr>
          <tr style="background:#FFC300"><td style="padding:9px 14px;text-align:right;font-weight:800;font-size:15px">Total TTC</td><td style="padding:9px 14px;text-align:right;font-weight:800;font-size:15px">${eur(f.montant_ttc)}</td></tr>
        </table>
      </div>
    </div>

    <p style="font-size:11px;color:#555;margin-top:8px">
      Facture à imputer au compte du copropriétaire réf. <strong>${escapeHtml(f.owner_ref || '—')}</strong> de la copropriété réf. <strong>${escapeHtml(f.condo_ref || '—')}</strong>.
    </p>

    <!-- Mentions légales (pied de facture) — source dynamique partagée -->
    <div style="margin-top:18px;border-top:1px solid #ddd;padding-top:8px;font-size:8.5px;line-height:1.5;color:#777;text-align:justify">
      ${escapeHtml(mentionsLegales)}
    </div>
  </div>`
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
