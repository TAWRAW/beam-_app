'use client'

// Rapport budgétaire aux couleurs Beamô — la couche PÉDAGOGIQUE au-dessus des
// annexes comptables SRU : le document que le conseil syndical lit vraiment.
// Identité visuelle assumée mono-thème (crème #F2F1E6 / noir #0A0A0A / jaune
// #FFC300), indépendante du thème clair/sombre des apps : un document imprimé
// n'a qu'une seule vérité colorimétrique.
//
// ⚠️ Ce rapport ne remplace PAS les annexes comptables réglementaires
// (décret 2005-240) — mention imprimée en pied de page.

import { useEffect, useMemo, useState } from 'react'
import { Download, Printer, RefreshCw } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

// --- Types (miroir de /api/estale/budgets?condoId=…) ------------------------

interface BudgetGlobal {
  vote: number
  consomme: number
  appele: number
  encaisse: number
}

interface Poste {
  accountID: string
  nom: string
  nomenclature: string
  vote: number
  consomme: number
  voteN1: number
  consommeN1: number
}

interface AutreBudget {
  id: string
  nom: string
  categorie: string
  vote: number
  appele: number
  encaisse: number
}

interface Detail {
  condoID: string
  nom: string
  reference: string
  periode: [string, string] | null
  nomBudget: string | null
  global: BudgetGlobal | null
  postes: Poste[]
  autresBudgets: AutreBudget[]
}

// --- Identité Beamô ----------------------------------------------------------

const CREME = '#F2F1E6'
const NOIR = '#0A0A0A'
const JAUNE = '#FFC300'
const VERT = '#1a7a4f'
const ROUGE = '#c22a1e'
const GRIS = '#6b6a62'
const DONUT_NEUTRES = ['#55544c', '#8b8a80', '#b3b2a6', '#3b3a34', '#cfcec2', '#6f6e64']

const CATEGORIES: Record<string, string> = {
  WORK_DECIDED: 'Travaux votés',
  WORK_URGENT: 'Travaux urgents',
  WORK_OTHER: 'Travaux — autres',
  WORK_CS: 'Travaux CS',
  ALUR: 'Fonds travaux ALUR',
  COUNCIL: 'Conseil syndical',
  ADVANCE_1031: 'Avance de trésorerie',
  ADVANCE_1032: 'Avance travaux',
  ADVANCE_1033: 'Avance — autres',
  LOAN: 'Emprunt collectif',
}

const euro = (v: number) =>
  v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const euroCts = (v: number) =>
  v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

function formatPeriode(periode: [string, string] | null): string {
  if (!periode) return ''
  const f = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return `du ${f(periode[0])} au ${f(periode[1])}`
}

function nomCourt(nom: string, reference: string): string {
  return nom.replace(/^SDC\s+/i, '').replace(new RegExp(`\\s*${reference}\\s*$`), '').trim()
}

// --- Composant ----------------------------------------------------------------

export default function RapportBudgetClient() {
  const [condoId, setCondoId] = useState<string | null>(null)
  const [exercice, setExercice] = useState<'courant' | 'precedent'>('courant')
  const [detail, setDetail] = useState<Detail | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(true)
  const [telechargement, setTelechargement] = useState(false)

  // Téléchargement PDF : on capture le document tel qu'il est rendu et on le
  // confie à la route Puppeteer existante (/api/pdf, authentifiée) — même
  // moteur que les affiches et documents officiels.
  const telecharger = async () => {
    const el = document.querySelector('.page-rapport')
    if (!el || !detail) return
    setTelechargement(true)
    try {
      const clone = el.cloneNode(true) as HTMLElement
      // Puppeteer rend le HTML sans URL de base : les images relatives
      // (logo) doivent être absolutisées.
      clone.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src')
        if (src) img.setAttribute('src', new URL(src, window.location.origin).href)
      })
      const html = `
        <style>
          @page { size: A4; margin: 12mm; }
          body { background: ${CREME}; color: ${NOIR}; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
        </style>
        <div style="background: ${CREME}; color: ${NOIR};">${clone.outerHTML}</div>
      `
      const titre = `Rapport budgétaire ${detail.reference} — ${nomCourt(detail.nom, detail.reference)}`
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, metadata: { title: titre, documentType: 'rapport-budget' } }),
      })
      if (!res.ok) throw new Error(`Génération PDF impossible (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${titre.replace(/[/\\:*?"<>|]/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la génération du PDF')
    } finally {
      setTelechargement(false)
    }
  }

  // L'ID vient du chemin — lu côté client pour rester un composant simple.
  useEffect(() => {
    const segments = window.location.pathname.split('/')
    setCondoId(decodeURIComponent(segments[segments.length - 1] || ''))
    const p = new URLSearchParams(window.location.search)
    if (p.get('exercice') === 'precedent') setExercice('precedent')
  }, [])

  useEffect(() => {
    if (!condoId) return
    setChargement(true)
    setErreur(null)
    fetch(`/api/estale/budgets?condoId=${encodeURIComponent(condoId)}&exercice=${exercice}`)
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) throw new Error('Connexion requise — ouvrez d’abord une session sur /apps.')
        if (!res.ok) throw new Error(`Chargement impossible (${res.status})`)
        return res.json()
      })
      .then(setDetail)
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Erreur inconnue'))
      .finally(() => setChargement(false))
  }, [condoId, exercice])

  const g = detail?.global ?? null
  const pGlobal = g && g.vote ? (g.consomme / g.vote) * 100 : null

  const donut = useMemo(() => {
    const positifs = (detail?.postes ?? []).filter((p) => p.consomme > 0).sort((a, b) => b.consomme - a.consomme)
    const tetes = positifs.slice(0, 6)
    const reste = positifs.slice(6).reduce((s, p) => s + p.consomme, 0)
    const total = positifs.reduce((s, p) => s + p.consomme, 0)
    const items = tetes.map((p, i) => ({
      name: p.nom,
      value: p.consomme,
      couleur: i === 0 ? JAUNE : DONUT_NEUTRES[(i - 1) % DONUT_NEUTRES.length],
    }))
    if (reste > 0) items.push({ name: 'Autres postes', value: reste, couleur: '#dedcd0' })
    return { items, total }
  }, [detail])

  // Les écarts qui méritent un mot au CS : dépassements et gros restes.
  const depassements = (detail?.postes ?? []).filter((p) => p.vote > 0 && p.consomme > p.vote)

  return (
    <div style={{ background: CREME, color: NOIR }} className="min-h-screen">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          .no-print { display: none !important; }
          .page-rapport { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          body { background: ${CREME} !important; }
        }
      `}</style>

      {/* Barre d'outils — écran seulement */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-3" style={{ background: NOIR, color: CREME }}>
        <span className="text-sm font-semibold">Rapport budgétaire — aperçu avant impression</span>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded" style={{ border: `1px solid ${CREME}44` }}>
            {(['precedent', 'courant'] as const).map((ex) => (
              <button
                key={ex}
                onClick={() => setExercice(ex)}
                className="px-3 py-1.5 text-xs font-medium transition"
                style={exercice === ex ? { background: JAUNE, color: NOIR } : { color: CREME }}
              >
                {ex === 'precedent' ? 'Exercice clos' : 'Exercice en cours'}
              </button>
            ))}
          </div>
          <button
            onClick={telecharger}
            disabled={telechargement || !detail}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ background: JAUNE, color: NOIR }}
          >
            <Download className={`h-3.5 w-3.5 ${telechargement ? 'animate-bounce' : ''}`} />
            {telechargement ? 'Génération…' : 'Télécharger PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium"
            style={{ border: `1px solid ${CREME}66`, color: CREME }}
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer
          </button>
        </div>
      </div>

      {chargement && (
        <div className="no-print flex min-h-[50vh] items-center justify-center gap-2 text-sm" style={{ color: GRIS }}>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Chargement des données Estale…
        </div>
      )}

      {erreur && (
        <div className="no-print mx-auto mt-10 max-w-xl rounded p-4 text-sm" style={{ background: '#fdeceb', color: ROUGE }}>
          {erreur}
          {exercice === 'precedent' && (
            <p className="mt-2" style={{ color: GRIS }}>
              Si cette copropriété n&apos;a pas d&apos;exercice antérieur dans Estale, repassez sur « Exercice en cours ».
            </p>
          )}
        </div>
      )}

      {!chargement && !erreur && detail && (
        <div className="page-rapport mx-auto my-6 max-w-[210mm] bg-transparent px-2 print:my-0">
          {/* En-tête Beamô */}
          <header className="flex items-end justify-between pb-4" style={{ borderBottom: `3px solid ${NOIR}` }}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GRIS }}>
                Rapport budgétaire {exercice === 'precedent' ? '· clôture des comptes' : '· exercice en cours'}
              </p>
              <h1 className="mt-1 text-[26px] font-extrabold leading-tight">
                {nomCourt(detail.nom, detail.reference)}
              </h1>
              <p className="mt-0.5 text-[12px]" style={{ color: GRIS }}>
                Copropriété {detail.reference} · Exercice {formatPeriode(detail.periode)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {/* Logo rond (asset dédié syndic) + bandeau jaune/noir — demande Tom. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_beamo_rond_syndic.png"
                alt="Beamô"
                className="h-14 w-14 rounded-full object-cover"
                style={{ border: `2px solid ${NOIR}` }}
              />
              <span className="inline-block px-3 py-1 text-[16px] font-extrabold lowercase" style={{ background: NOIR, color: JAUNE }}>
                beamô
              </span>
              <p className="text-[10px]" style={{ color: GRIS }}>
                édité le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </header>

          {g ? (
            <>
              {/* Chiffres clés + donut */}
              <section className="mt-6 flex items-start gap-8">
                <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5">
                  <ChiffreCle label="Budget voté" valeur={euro(g.vote)} />
                  <ChiffreCle
                    label={exercice === 'precedent' ? 'Dépenses de l’exercice' : 'Consommé à ce jour'}
                    valeur={euroCts(g.consomme)}
                    accent={pGlobal !== null && pGlobal > 100 ? ROUGE : undefined}
                    sous={pGlobal === null ? undefined : `${Math.round(pGlobal)} % du budget voté`}
                  />
                  <ChiffreCle label="Appelé auprès des copropriétaires" valeur={euro(g.appele)} sous={g.vote ? `${Math.round((g.appele / g.vote) * 100)} % du budget` : undefined} />
                  <ChiffreCle
                    label="Écart budget / dépenses"
                    valeur={`${g.vote - g.consomme >= 0 ? '+' : '−'} ${euroCts(Math.abs(g.vote - g.consomme))}`}
                    accent={g.vote - g.consomme >= 0 ? VERT : ROUGE}
                    sous={g.vote - g.consomme >= 0 ? 'sous le budget voté' : 'au-delà du budget voté'}
                  />
                </div>

                {donut.total > 0 && (
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="relative h-[160px] w-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donut.items} dataKey="value" nameKey="name" innerRadius={50} outerRadius={76} paddingAngle={2} strokeWidth={0} isAnimationActive={false}>
                            {donut.items.map((e) => (
                              <Cell key={e.name} fill={e.couleur} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: GRIS }}>Dépenses</span>
                        <span className="text-[14px] font-extrabold">{euro(donut.total)}</span>
                      </div>
                    </div>
                    <ul className="max-w-[170px] space-y-1">
                      {donut.items.map((item) => (
                        <li key={item.name} className="flex items-center gap-1.5 text-[10px]" style={{ color: GRIS }}>
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.couleur }} />
                          <span className="truncate">{item.name}</span>
                          <span className="ml-auto shrink-0 font-semibold" style={{ color: NOIR }}>
                            {Math.round((item.value / donut.total) * 100)} %
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* À retenir — dépassements */}
              {depassements.length > 0 && (
                <section className="mt-6 rounded p-4" style={{ background: `${JAUNE}33`, borderLeft: `4px solid ${JAUNE}` }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em]">À retenir</p>
                  <ul className="mt-1.5 space-y-1 text-[12px]">
                    {depassements.map((p) => (
                      <li key={p.accountID}>
                        <strong>{p.nom}</strong> dépasse le budget voté : {euroCts(p.consomme)} pour {euro(p.vote)} prévus
                        ({Math.round((p.consomme / p.vote) * 100)} %).
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Tableau des postes */}
              <section className="mt-6">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.15em]">Détail par poste de dépense</h2>
                <table className="mt-2 w-full border-collapse text-[11.5px]">
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${NOIR}` }}>
                      <th className="py-1.5 pr-2 text-left font-bold">Poste</th>
                      <th className="px-2 py-1.5 text-right font-bold">Voté</th>
                      <th className="px-2 py-1.5 text-right font-bold">Dépensé</th>
                      <th className="px-2 py-1.5 text-right font-bold">%</th>
                      <th className="px-2 py-1.5 text-right font-bold" style={{ color: GRIS }}>N-1 dépensé</th>
                      <th className="py-1.5 pl-2 text-right font-bold">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.postes.map((p) => {
                      const pc = p.vote ? (p.consomme / p.vote) * 100 : null
                      const ecart = p.vote - p.consomme
                      return (
                        <tr key={p.accountID} style={{ borderBottom: `1px solid ${NOIR}22` }}>
                          <td className="py-1.5 pr-2">
                            {p.nom} <span className="text-[9.5px]" style={{ color: GRIS }}>{p.nomenclature}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{p.vote ? euro(p.vote) : '—'}</td>
                          <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{euroCts(p.consomme)}</td>
                          <td className="px-2 py-1.5 text-right font-bold tabular-nums" style={{ color: pc !== null && pc > 100 ? ROUGE : pc !== null ? VERT : GRIS }}>
                            {pc === null ? '—' : `${Math.round(pc)} %`}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: GRIS }}>
                            {p.consommeN1 ? euroCts(p.consommeN1) : '—'}
                          </td>
                          <td className="py-1.5 pl-2 text-right tabular-nums" style={{ color: ecart >= 0 ? VERT : ROUGE }}>
                            {p.vote ? `${ecart >= 0 ? '+' : '−'} ${euro(Math.abs(ecart))}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {g && (
                    <tfoot>
                      <tr style={{ borderTop: `2px solid ${NOIR}` }}>
                        <td className="py-2 pr-2 font-bold">Total budget général</td>
                        <td className="px-2 py-2 text-right font-bold tabular-nums">{euro(g.vote)}</td>
                        <td className="px-2 py-2 text-right font-bold tabular-nums">{euroCts(g.consomme)}</td>
                        <td className="px-2 py-2 text-right font-bold tabular-nums" style={{ color: pGlobal !== null && pGlobal > 100 ? ROUGE : VERT }}>
                          {pGlobal === null ? '—' : `${Math.round(pGlobal)} %`}
                        </td>
                        <td />
                        <td className="py-2 pl-2 text-right font-bold tabular-nums" style={{ color: g.vote - g.consomme >= 0 ? VERT : ROUGE }}>
                          {`${g.vote - g.consomme >= 0 ? '+' : '−'} ${euro(Math.abs(g.vote - g.consomme))}`}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </section>

              {/* Autres budgets */}
              {detail.autresBudgets.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.15em]">Fonds et budgets annexes</h2>
                  <div className="mt-2 space-y-1.5">
                    {detail.autresBudgets.map((b) => (
                      <div key={b.id} className="flex items-baseline justify-between rounded px-3 py-2 text-[11.5px]" style={{ background: `${NOIR}0a` }}>
                        <span>
                          <strong>{b.nom}</strong>{' '}
                          <span style={{ color: GRIS }}>· {CATEGORIES[b.categorie] ?? b.categorie}</span>
                        </span>
                        <span className="tabular-nums" style={{ color: GRIS }}>
                          {euro(b.vote)} votés · {euro(b.appele)} appelés
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <p className="mt-8 text-sm" style={{ color: GRIS }}>
              Pas de budget ordinaire sur cet exercice dans Estale.
            </p>
          )}

          {/* Pied de page */}
          <footer className="mt-8 flex items-end justify-between pb-6 pt-3 text-[9px]" style={{ borderTop: `1px solid ${NOIR}33`, color: GRIS }}>
            <p className="max-w-[65%]">
              Document pédagogique établi par Beamô Immobilier à partir de la comptabilité du syndicat.
              Il ne se substitue pas aux annexes comptables réglementaires (décret n° 2005-240 du 14 mars 2005),
              seules opposables, remises avec la convocation d&apos;assemblée générale.
            </p>
            <p className="text-right font-semibold" style={{ color: NOIR }}>
              Beamô Immobilier — syndic de copropriété
            </p>
          </footer>
        </div>
      )}
    </div>
  )
}

function ChiffreCle({ label, valeur, sous, accent }: { label: string; valeur: string; sous?: string; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: GRIS }}>{label}</p>
      <p className="mt-0.5 text-[22px] font-extrabold tabular-nums leading-tight" style={accent ? { color: accent } : undefined}>{valeur}</p>
      {sous && <p className="text-[10px] tabular-nums" style={{ color: GRIS }}>{sous}</p>}
    </div>
  )
}
