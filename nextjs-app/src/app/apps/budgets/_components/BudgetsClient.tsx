'use client'

// Suivi budgétaire — panel de consultation des budgets Estale.
//
// Vocabulaire visuel repris de Venator (venator-ui-classes.ts) :
//   — les blocs se séparent par le FOND et l'espace, pas par un trait ;
//   — le jaune est rationné : ici, uniquement le signal « rythme dépassé »
//     (consommé qui court plus vite que le calendrier de l'exercice) ;
//   — micro-labels typographiques plutôt que puces ;
//   — le dépassement de budget (>100 %) est un état danger, pas un accent.
//
// Lecture du rythme : un poste à 65 % consommé n'est inquiétant que si
// l'exercice n'en est qu'à 40 % — la barre de chaque budget est donc toujours
// mise en regard de l'avancement calendaire (le trait vertical sur la piste).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChartSpline, FileText, RefreshCw, TriangleAlert } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Masque } from '@/components/apps/ModeConfidentiel'
import { cn } from '@/lib/utils'

// --- Types (miroir de la route /api/estale/budgets) -------------------------

interface BudgetGlobal {
  vote: number
  consomme: number
  appele: number
  encaisse: number
}

interface OverviewRow {
  condoID: string
  nom: string
  reference: string
  periode: [string, string] | null
  nomBudget: string | null
  global: BudgetGlobal | null
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
  periode: [string, string] | null
}

interface Detail extends OverviewRow {
  postes: Poste[]
  autresBudgets: AutreBudget[]
}

// --- Helpers ----------------------------------------------------------------

const euro = (v: number) =>
  v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const euroCts = (v: number) =>
  v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

function pct(consomme: number, vote: number): number | null {
  if (!vote) return null
  return (consomme / vote) * 100
}

/** Avancement calendaire de l'exercice, 0-100. */
function avancementExercice(periode: [string, string] | null): number | null {
  if (!periode) return null
  const debut = new Date(periode[0]).getTime()
  const fin = new Date(periode[1]).getTime()
  if (!(fin > debut)) return null
  const now = Date.now()
  return Math.min(100, Math.max(0, ((now - debut) / (fin - debut)) * 100))
}

function formatPeriode(periode: [string, string] | null): string {
  if (!periode) return 'Exercice inconnu'
  const f = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  return `${f(periode[0])} → ${f(periode[1])}`
}

/** Nom de copro sans le préfixe « SDC » ni la référence en queue. */
function nomCourt(nom: string, reference: string): string {
  return nom
    .replace(/^SDC\s+/i, '')
    .replace(new RegExp(`\\s*${reference}\\s*$`), '')
    .trim()
}

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

// --- Barre de consommation ---------------------------------------------------
// Piste neutre. Le trait vertical = avancement calendaire.
// États : vert (rythme sain), accent jaune (consommé en avance de plus de
// 15 points sur le calendrier — le signal d'anticipation d'un appel de fonds),
// danger (>100 % du voté). `reference` : rendu gris atténué, pour une barre
// historique (N-1) qui sert de repère et ne doit pas concourir avec le présent.

function BarreConso({
  pourcent,
  repere,
  reference = false,
  className,
}: {
  pourcent: number | null
  repere?: number | null
  reference?: boolean
  className?: string
}) {
  if (pourcent === null) {
    return <div className={cn('h-1.5 rounded-full bg-app-surface-2', className)} />
  }
  const depasse = pourcent > 100
  const enAvance = !reference && repere != null && pourcent - repere > 15
  return (
    <div className={cn('relative h-1.5 overflow-hidden rounded-full bg-app-surface-2', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-[width]',
          depasse
            ? cn('bg-app-danger', reference && 'opacity-40')
            : reference
              ? 'bg-app-fg-faint/60'
              : enAvance
                ? 'bg-app-accent'
                : 'bg-app-success-fg',
        )}
        style={{ width: `${Math.min(100, pourcent)}%` }}
      />
      {repere != null && repere > 0 && repere < 100 && (
        <div
          className="absolute top-0 h-full w-[2px] bg-app-fg/40"
          style={{ left: `${repere}%` }}
          title={`Avancement de l'exercice : ${Math.round(repere)} %`}
        />
      )}
    </div>
  )
}

function microLabel(extra?: string) {
  return cn('text-[10.5px] font-semibold uppercase tracking-[0.08em] text-app-fg-faint', extra)
}

// --- Composant principal ------------------------------------------------------

export default function BudgetsClient() {
  const [copros, setCopros] = useState<OverviewRow[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [selection, setSelection] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailErreur, setDetailErreur] = useState<string | null>(null)
  const [rafraichit, setRafraichit] = useState(false)

  const chargerOverview = useCallback(async (refresh = false) => {
    setErreur(null)
    try {
      const res = await fetch(`/api/estale/budgets${refresh ? '?refresh=1' : ''}`)
      if (!res.ok) throw new Error(`Chargement impossible (${res.status})`)
      const data = await res.json()
      setCopros(data.copros ?? [])
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
      setCopros([])
    }
  }, [])

  useEffect(() => {
    chargerOverview()
  }, [chargerOverview])

  useEffect(() => {
    if (!selection) {
      setDetail(null)
      return
    }
    let annule = false
    setDetail(null)
    setDetailErreur(null)
    fetch(`/api/estale/budgets?condoId=${encodeURIComponent(selection)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Chargement impossible (${res.status})`)
        return res.json()
      })
      .then((d) => {
        if (!annule) setDetail(d)
      })
      .catch((e) => {
        if (!annule) setDetailErreur(e instanceof Error ? e.message : 'Erreur inconnue')
      })
    return () => {
      annule = true
    }
  }, [selection])

  const rafraichir = async () => {
    setRafraichit(true)
    await chargerOverview(true)
    if (selection) {
      try {
        const res = await fetch(`/api/estale/budgets?condoId=${encodeURIComponent(selection)}&refresh=1`)
        if (res.ok) setDetail(await res.json())
      } catch {}
    }
    setRafraichit(false)
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className={microLabel('mb-1')}>Suivi budgétaire</p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-app-fg">
            <ChartSpline className="h-5 w-5 text-app-accent" />
            Budgets
          </h1>
          <p className="mt-1 text-[13px] text-app-fg-muted">
            Consommé réel depuis la comptabilité Estale — mis à jour à chaque facture saisie.
            Le trait vertical sur chaque barre marque l&apos;avancement de l&apos;exercice.
          </p>
        </div>
        <button
          onClick={rafraichir}
          disabled={rafraichit}
          className="flex items-center gap-1.5 rounded-[var(--app-radius-btn)] bg-app-surface-2 px-3 py-1.5 text-[13px] font-medium text-app-fg transition hover:bg-app-surface-hover disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', rafraichit && 'animate-spin')} />
          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="mb-4 rounded-[var(--app-radius-md)] bg-app-danger-bg px-4 py-3 text-[13px] text-app-danger-fg">
          {erreur}
        </div>
      )}

      {selection ? (
        <VueDetail
          detail={detail}
          erreur={detailErreur}
          retour={() => setSelection(null)}
        />
      ) : (
        <VueEnsemble copros={copros} onSelect={setSelection} />
      )}
    </div>
  )
}

// --- Vue d'ensemble -----------------------------------------------------------

function VueEnsemble({
  copros,
  onSelect,
}: {
  copros: OverviewRow[] | null
  onSelect: (id: string) => void
}) {
  if (copros === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-[var(--app-radius-md)]" />
        ))}
      </div>
    )
  }

  const avecBudget = copros.filter((c) => c.global)
  const sansBudget = copros.filter((c) => !c.global)

  // Les copros qui courent le plus vite en tête : c'est là que se décident
  // les appels de fonds exceptionnels.
  const lignes = [...avecBudget].sort((a, b) => {
    const pa = pct(a.global!.consomme, a.global!.vote) ?? -1
    const pb = pct(b.global!.consomme, b.global!.vote) ?? -1
    return pb - pa
  })

  return (
    <div>
      <div className="space-y-2">
        {lignes.map((c) => {
          const g = c.global!
          const p = pct(g.consomme, g.vote)
          const repere = avancementExercice(c.periode)
          const depasse = p !== null && p > 100
          const enAvance = p !== null && repere !== null && p - repere > 15
          return (
            <button
              key={c.condoID}
              onClick={() => onSelect(c.condoID)}
              className="block w-full rounded-[var(--app-radius-md)] bg-app-surface px-4 py-3 text-left transition hover:bg-app-surface-hover"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[13px] font-medium text-app-fg">
                    <Masque>{nomCourt(c.nom, c.reference)}</Masque>
                  </span>
                  <span className="ml-2 text-[11px] text-app-fg-faint">
                    <Masque>{c.reference}</Masque>
                  </span>
                </div>
                <div className="flex shrink-0 items-baseline gap-3">
                  {(depasse || enAvance) && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[11px] font-semibold',
                        depasse ? 'text-app-danger' : 'text-app-warning-fg',
                      )}
                    >
                      <TriangleAlert className="h-3 w-3" />
                      {depasse ? 'Budget dépassé' : 'Rythme élevé'}
                    </span>
                  )}
                  <span className="text-[13px] font-semibold tabular-nums text-app-fg">
                    {p === null ? '—' : `${Math.round(p)} %`}
                  </span>
                </div>
              </div>
              <BarreConso pourcent={p} repere={repere} className="mt-2" />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-app-fg-muted">
                <span>
                  {euro(g.consomme)} consommés sur {euro(g.vote)}
                </span>
                <span className="tabular-nums">
                  appelé {g.vote ? Math.round((g.appele / g.vote) * 100) : 0} % · {formatPeriode(c.periode)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {sansBudget.length > 0 && (
        <div className="mt-6">
          <p className={microLabel('mb-2')}>Sans budget ordinaire sur l&apos;exercice courant</p>
          <div className="flex flex-wrap gap-2">
            {sansBudget.map((c) => (
              <span
                key={c.condoID}
                className="rounded-[var(--app-radius-btn)] bg-app-surface-2 px-2.5 py-1 text-[12px] text-app-fg-muted"
              >
                <Masque>{nomCourt(c.nom, c.reference)}</Masque>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Vue détail -----------------------------------------------------------------

function VueDetail({
  detail,
  erreur,
  retour,
}: {
  detail: Detail | null
  erreur: string | null
  retour: () => void
}) {
  return (
    <div>
      <button
        onClick={retour}
        className="mb-4 flex items-center gap-1.5 rounded-[var(--app-radius-btn)] bg-transparent px-2 py-1 text-[13px] font-medium text-app-fg-muted transition hover:bg-app-surface-2 hover:text-app-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Toutes les copropriétés
      </button>

      {erreur && (
        <div className="rounded-[var(--app-radius-md)] bg-app-danger-bg px-4 py-3 text-[13px] text-app-danger-fg">
          {erreur}
        </div>
      )}

      {!detail && !erreur && (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-[var(--app-radius-md)]" />
          <Skeleton className="h-64 rounded-[var(--app-radius-md)]" />
        </div>
      )}

      {detail && <DetailContenu detail={detail} />}
    </div>
  )
}

function DetailContenu({ detail }: { detail: Detail }) {
  const g = detail.global
  const repere = avancementExercice(detail.periode)
  const pGlobal = g ? pct(g.consomme, g.vote) : null

  return (
    <div className="space-y-6">
      {/* Cartouche global */}
      <div className="rounded-[var(--app-radius-lg)] bg-app-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={microLabel()}>
              <Masque>{detail.reference}</Masque> · {formatPeriode(detail.periode)}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-app-fg">
              <Masque>{nomCourt(detail.nom, detail.reference)}</Masque>
            </h2>
          </div>
          <a
            href={`/rapport-budget/${detail.condoID}`}
            target="_blank"
            rel="noopener"
            className="flex shrink-0 items-center gap-1.5 rounded-[var(--app-radius-btn)] bg-app-accent px-3 py-1.5 text-[13px] font-semibold text-app-accent-foreground transition hover:brightness-95"
          >
            <FileText className="h-3.5 w-3.5" />
            Rapport CS
          </a>
        </div>

        {g ? (
          <div className="mt-4 flex flex-col gap-6 md:flex-row">
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <Chiffre label="Voté" valeur={euro(g.vote)} />
                <Chiffre
                  label="Consommé"
                  valeur={euroCts(g.consomme)}
                  sous={pGlobal === null ? undefined : `${Math.round(pGlobal)} % du budget`}
                />
                <Chiffre
                  label="Appelé"
                  valeur={euro(g.appele)}
                  sous={g.vote ? `${Math.round((g.appele / g.vote) * 100)} % du budget` : undefined}
                />
                <Chiffre label="Encaissé" valeur={euroCts(g.encaisse)} />
              </div>
              <BarreConso pourcent={pGlobal} repere={repere} className="mt-4 h-2" />
              {repere !== null && (
                <p className="mt-1.5 text-[11px] text-app-fg-muted">
                  Exercice écoulé à {Math.round(repere)} %
                  {pGlobal !== null && pGlobal - repere > 15 && (
                    <span className="ml-1 font-semibold text-app-warning-fg">
                      — consommation en avance sur le calendrier, appel de fonds complémentaire à surveiller
                    </span>
                  )}
                </p>
              )}
            </div>
            <RepartitionDonut postes={detail.postes} />
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-app-fg-muted">
            Pas de budget ordinaire sur l&apos;exercice courant.
          </p>
        )}
      </div>

      {/* Postes */}
      {detail.postes.length > 0 && <PostesCard postes={detail.postes} repere={repere} />}

      {/* Autres budgets (travaux, ALUR, avances…) */}
      {detail.autresBudgets.length > 0 && (
        <div className="rounded-[var(--app-radius-lg)] bg-app-surface p-5">
          <p className={microLabel('mb-3')}>Autres budgets de l&apos;exercice</p>
          <div className="space-y-2">
            {detail.autresBudgets.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-[var(--app-radius-md)] bg-app-surface-2 px-3 py-2"
              >
                <div>
                  <span className="text-[13px] text-app-fg">{b.nom}</span>
                  <span className="ml-2 text-[11px] text-app-fg-faint">
                    {CATEGORIES[b.categorie] ?? b.categorie}
                  </span>
                </div>
                <span className="text-[12px] tabular-nums text-app-fg-muted">
                  {euro(b.vote)} votés · {euro(b.appele)} appelés · {euroCts(b.encaisse)} encaissés
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Camembert de répartition du consommé par poste — répond à « où part
// l'argent », ce que les barres d'avancement ne montrent pas. Jaune Beamô
// réservé au plus gros poste (le jaune reste un signal, pas une taxonomie),
// camaïeu neutre pour le reste, petits postes regroupés en « Autres ».
const DONUT_NEUTRES = ['#5c5c66', '#8a8a94', '#b5b5bd', '#43434b', '#d0d0d6', '#70707a', '#2e2e34']

function RepartitionDonut({ postes }: { postes: Poste[] }) {
  const data = useMemo(() => {
    const positifs = postes
      .filter((p) => p.consomme > 0)
      .sort((a, b) => b.consomme - a.consomme)
    const tetes = positifs.slice(0, 6)
    const resteTotal = positifs.slice(6).reduce((s, p) => s + p.consomme, 0)
    const total = positifs.reduce((s, p) => s + p.consomme, 0)
    const items = tetes.map((p, i) => ({
      name: p.nom,
      value: p.consomme,
      couleur: i === 0 ? '#ffc300' : DONUT_NEUTRES[(i - 1) % DONUT_NEUTRES.length],
    }))
    if (resteTotal > 0) items.push({ name: 'Autres postes', value: resteTotal, couleur: '#e4e4e9' })
    return { items, total }
  }, [postes])

  if (data.total <= 0) return null

  return (
    <div className="flex shrink-0 items-center gap-4">
      <div className="relative h-[150px] w-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.items}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.items.map((entry) => (
                <Cell key={entry.name} fill={entry.couleur} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${euroCts(value)} · ${Math.round((value / data.total) * 100)} %`,
              ]}
              contentStyle={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                borderRadius: 'var(--app-radius-btn)',
                fontSize: 12,
                color: 'var(--app-fg)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className={microLabel()}>Consommé</span>
          <span className="text-[13px] font-semibold tabular-nums text-app-fg">{euro(data.total)}</span>
        </div>
      </div>
      <ul className="max-w-[180px] space-y-1">
        {data.items.map((item) => (
          <li key={item.name} className="flex items-center gap-1.5 text-[11px] text-app-fg-muted">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.couleur }} />
            <span className="truncate">{item.name}</span>
            <span className="ml-auto shrink-0 tabular-nums">
              {Math.round((item.value / data.total) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Postes du budget, avec comparaison N-1 optionnelle : cochée, chaque poste
// s'affiche en deux colonnes — l'exercice courant à gauche, le N-1 à droite
// (barre grise de référence : l'historique sert de repère, il ne concourt pas).
function PostesCard({ postes, repere }: { postes: Poste[]; repere: number | null }) {
  const [comparerN1, setComparerN1] = useState(false)

  return (
    <div className="rounded-[var(--app-radius-lg)] bg-app-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className={microLabel()}>Postes du budget · consommé / voté</p>
        <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] font-medium text-app-fg-muted">
          <Checkbox
            checked={comparerN1}
            onCheckedChange={(v) => setComparerN1(v === true)}
            className="h-3.5 w-3.5 border-app-border-strong data-[state=checked]:bg-app-accent data-[state=checked]:text-app-accent-foreground data-[state=checked]:border-app-accent"
          />
          Comparer à N-1
        </label>
      </div>

      {comparerN1 && (
        <div className="mb-2 hidden grid-cols-2 gap-6 md:grid">
          <p className={microLabel()}>Exercice courant</p>
          <p className={microLabel()}>Exercice N-1</p>
        </div>
      )}

      <div className="space-y-3">
        {postes.map((poste) => {
          const p = pct(poste.consomme, poste.vote)
          const pN1 = pct(poste.consommeN1, poste.voteN1)
          return (
            <div key={poste.accountID}>
              <div className={cn(comparerN1 && 'grid gap-x-6 gap-y-1 md:grid-cols-2')}>
                {/* Exercice courant */}
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0 truncate">
                      <span className="text-[13px] text-app-fg">{poste.nom}</span>
                      <span className="ml-2 text-[11px] tabular-nums text-app-fg-faint">
                        {poste.nomenclature}
                      </span>
                    </div>
                    <span className="shrink-0 text-[13px] font-medium tabular-nums text-app-fg">
                      {euroCts(poste.consomme)}
                      <span className="text-app-fg-muted"> / {euro(poste.vote)}</span>
                      <span className="ml-2 inline-block w-12 text-right font-semibold">
                        {p === null ? '—' : `${Math.round(p)} %`}
                      </span>
                    </span>
                  </div>
                  <BarreConso pourcent={p} repere={repere} className="mt-1.5" />
                </div>

                {/* Exercice N-1 */}
                {comparerN1 && (
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[11px] text-app-fg-faint md:hidden">N-1</span>
                      <span className="hidden text-[11px] text-app-fg-faint md:inline">&nbsp;</span>
                      <span className="shrink-0 text-[13px] tabular-nums text-app-fg-muted">
                        {euroCts(poste.consommeN1)}
                        <span> / {euro(poste.voteN1)}</span>
                        <span className="ml-2 inline-block w-12 text-right font-semibold">
                          {pN1 === null ? '—' : `${Math.round(pN1)} %`}
                        </span>
                      </span>
                    </div>
                    <BarreConso pourcent={pN1} reference className="mt-1.5" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Chiffre({ label, valeur, sous }: { label: string; valeur: string; sous?: string }) {
  return (
    <div>
      <p className={microLabel()}>{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-app-fg">{valeur}</p>
      {sous && <p className="text-[11px] tabular-nums text-app-fg-muted">{sous}</p>}
    </div>
  )
}
