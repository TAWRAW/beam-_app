'use client'

// Mailing ciblé — ciblage par bâtiment / clé de répartition (données Estale, lecture seule),
// envoi par RESEND avec le gabarit « note d'information Beamô », trace pérenne en base
// (`mailing_notes`) et rattachement facultatif à un dossier Venator (?copro=REF&dossier=UUID).
//
// Décisions du 24/08/2026 :
//  - Estale n'est plus utilisé en écriture ici (ses brouillons restent accessibles via l'API) ;
//  - l'envoi passe par une pop-up de confirmation centrale ;
//  - chaque destinataire reçoit son propre courriel (pas de CCI) ;
//  - le rapport (qui a reçu / échoué) se consulte note par note, statuts relus chez Resend.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CondoRef {
  id: string
  name: string
  reference: string
}
interface Building {
  id: string
  name: string
}
interface DistributionKey {
  id: string
  name: string
  code: string
  nbOwners: number
}
interface TargetOwner {
  id: string
  fullname: string
  email?: string | null
  phone?: string | null
  mobile?: string | null
  canReceiveMail: boolean
  canReceiveSMS: boolean
  buildingIDs: string[]
  dkIDs: string[]
}
interface Collaborateur {
  id: string
  email: string
  fullname: string
}
interface Ciblage {
  condo: CondoRef
  condoAdresse: string
  establishmentID: string
  collaborateur: Collaborateur
  buildings: Building[]
  dks: DistributionKey[]
  owners: TargetOwner[]
}
interface NoteResume {
  id: string
  created_at: string
  copro_ref: string
  copro_nom: string
  cible: string | null
  type_note: string
  objet: string
  dossier_id: string | null
  nb_destinataires: number
  nb_echecs: number
}
interface DossierRef {
  id: string
  titre: string
  type: string
  statut: string
}
interface EnvoiNote {
  email: string
  resend_id?: string
  statut?: string
  erreur?: string
}
interface NoteDetail extends NoteResume {
  corps: string
  envois: EnvoiNote[]
  statuts_maj_at: string | null
}

type Onglet = 'tous' | 'joignables' | 'injoignables'
type Focus = 'cible' | 'message'

const EST_GEOGRAPHIQUE = /b[âa]timent|escalier|cage|all[ée]e|entr[ée]e/i

const TYPES_NOTE = ["NOTE D'INFORMATION", 'AVIS DE TRAVAUX', "RAPPEL D'AG", 'URGENT'] as const

const GABARIT_ENCADRE = `=== TITRE DE L'ENCADRÉ
- premier point ;
- second point.
===`

function Micro({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-app-fg-faint">
      {children}
    </p>
  )
}

function Bascule({
  label,
  compte,
  actif,
  variante = 'plein',
  onClick,
}: {
  label: string
  compte?: number
  actif: boolean
  variante?: 'plein' | 'sortie'
  onClick: () => void
}) {
  const base =
    'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-md border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-1'
  const etat = actif
    ? 'border-app-accent bg-app-accent text-app-accent-foreground shadow-sm'
    : variante === 'sortie'
      ? 'border-dashed border-app-border-strong bg-app-surface text-app-fg-muted hover:bg-app-surface-hover hover:text-app-fg'
      : 'border-app-border bg-app-surface text-app-fg hover:bg-app-surface-hover hover:border-app-border-strong'
  return (
    <button type="button" onClick={onClick} className={`${base} ${etat}`}>
      {label}
      {compte !== undefined && (
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
            actif ? 'bg-black/15 text-app-accent-foreground' : 'bg-app-surface-2 text-app-fg-muted'
          }`}
        >
          {compte}
        </span>
      )}
    </button>
  )
}

function BadgeStatut({ statut, erreur }: { statut?: string; erreur?: string }) {
  const s = erreur ? 'failed' : (statut ?? 'sent')
  const rendu: Record<string, { label: string; cls: string }> = {
    delivered: { label: 'reçu', cls: 'bg-app-success-bg text-app-success-fg' },
    opened: { label: 'ouvert', cls: 'bg-app-success-bg text-app-success-fg' },
    clicked: { label: 'ouvert', cls: 'bg-app-success-bg text-app-success-fg' },
    sent: { label: 'envoyé', cls: 'bg-app-info-bg text-app-info-fg' },
    delivery_delayed: { label: 'retardé', cls: 'bg-app-warning-bg text-app-warning-fg' },
    bounced: { label: 'rejeté', cls: 'bg-app-danger-bg text-app-danger-fg' },
    complained: { label: 'signalé spam', cls: 'bg-app-danger-bg text-app-danger-fg' },
    failed: { label: 'échec', cls: 'bg-app-danger-bg text-app-danger-fg' },
  }
  const r = rendu[s] ?? { label: s, cls: 'bg-app-surface-2 text-app-fg-muted' }
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${r.cls}`}>{r.label}</span>
  )
}

export default function MailingCibleClient() {
  const searchParams = useSearchParams()
  const coproParam = searchParams.get('copro')
  const dossierParam = searchParams.get('dossier')

  const [condos, setCondos] = useState<CondoRef[]>([])
  const [condoId, setCondoId] = useState('')
  const [ciblage, setCiblage] = useState<Ciblage | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const [batsCoches, setBatsCoches] = useState<Set<string>>(new Set())
  const [clesCochees, setClesCochees] = useState<Set<string>>(new Set())
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [onglet, setOnglet] = useState<Onglet>('tous')
  const [voirTechniques, setVoirTechniques] = useState(false)
  const [focus, setFocus] = useState<Focus>('cible')

  const [typeNote, setTypeNote] = useState<string>(TYPES_NOTE[0])
  const [objet, setObjet] = useState('')
  const [corps, setCorps] = useState('')
  const [copieMoi, setCopieMoi] = useState(true)

  const [popupOuverte, setPopupOuverte] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [resultat, setResultat] = useState<{
    envoyes: number
    echecs: EnvoiNote[]
    noteId?: string
    warning?: string
  } | null>(null)

  const [notes, setNotes] = useState<NoteResume[]>([])
  const [noteOuverte, setNoteOuverte] = useState<NoteDetail | null>(null)
  const [noteChargement, setNoteChargement] = useState(false)

  // Rattachement après coup d'une note à un dossier Venator (envoi fait hors du bouton du dossier)
  const [dossiers, setDossiers] = useState<DossierRef[]>([])
  const [rattachement, setRattachement] = useState<string>('')
  const [rattachementEnCours, setRattachementEnCours] = useState(false)

  // --- Copropriétés + présélection éventuelle (?copro=REF depuis un dossier Venator)
  useEffect(() => {
    fetch('/api/estale/mailings')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return setErreur(d.error)
        setCondos(d.condos ?? [])
        if (coproParam) {
          const c = (d.condos ?? []).find((x: CondoRef) => x.reference === coproParam)
          if (c) setCondoId(c.id)
        }
      })
      .catch((e) => setErreur(String(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chargerNotes = useCallback((coproRef?: string) => {
    const q = coproRef ? `?copro=${encodeURIComponent(coproRef)}` : ''
    fetch(`/api/mailings/notes${q}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []))
      .catch(() => setNotes([]))
  }, [])

  // --- Ciblage
  useEffect(() => {
    if (!condoId) {
      setCiblage(null)
      return
    }
    setChargement(true)
    setErreur(null)
    setResultat(null)
    setBatsCoches(new Set())
    setClesCochees(new Set())
    setOnglet('tous')
    fetch(`/api/estale/mailings?condoId=${encodeURIComponent(condoId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErreur(d.error)
        else {
          setCiblage(d)
          chargerNotes(d.condo?.reference)
        }
      })
      .catch((e) => setErreur(String(e)))
      .finally(() => setChargement(false))
  }, [condoId, chargerNotes])

  const cible = useMemo(() => {
    if (!ciblage) return []
    if (batsCoches.size === 0 && clesCochees.size === 0) return ciblage.owners
    return ciblage.owners.filter(
      (o) =>
        o.buildingIDs.some((id) => batsCoches.has(id)) ||
        o.dkIDs.some((id) => clesCochees.has(id)),
    )
  }, [ciblage, batsCoches, clesCochees])

  useEffect(() => {
    setSelection(new Set(cible.map((o) => o.id)))
  }, [cible])

  const selectionnes = useMemo(() => cible.filter((o) => selection.has(o.id)), [cible, selection])
  const joignables = useMemo(() => selectionnes.filter((o) => o.email), [selectionnes])
  const injoignables = useMemo(() => selectionnes.filter((o) => !o.email), [selectionnes])
  const muets = useMemo(() => injoignables.filter((o) => !o.phone && !o.mobile), [injoignables])

  const pctCouverture = selectionnes.length
    ? Math.round((joignables.length / selectionnes.length) * 100)
    : 0

  const [clesGeo, clesTech] = useMemo(() => {
    if (!ciblage) return [[], []] as [DistributionKey[], DistributionKey[]]
    const actives = ciblage.dks.filter((d) => d.nbOwners > 0)
    return [
      actives.filter((d) => EST_GEOGRAPHIQUE.test(d.name)),
      actives.filter((d) => !EST_GEOGRAPHIQUE.test(d.name)),
    ]
  }, [ciblage])

  /** Libellé de cible pour la pastille du gabarit : déduit des puces cochées. */
  const cibleLabel = useMemo(() => {
    if (!ciblage) return ''
    const noms = [
      ...ciblage.buildings
        .filter((b) => batsCoches.has(b.id))
        .map((b) => (/^[A-Za-z0-9]{1,3}$/.test(b.name.trim()) ? `Bâtiment ${b.name}` : b.name)),
      ...ciblage.dks.filter((d) => clesCochees.has(d.id)).map((d) => d.name),
    ]
    return [...new Set(noms)].join(' + ').toUpperCase()
  }, [ciblage, batsCoches, clesCochees])

  const lignes = useMemo(() => {
    if (onglet === 'joignables') return cible.filter((o) => o.email)
    if (onglet === 'injoignables') return cible.filter((o) => !o.email)
    return cible
  }, [cible, onglet])

  const bascule = useCallback((set: Set<string>, id: string) => {
    const c = new Set(set)
    c.has(id) ? c.delete(id) : c.add(id)
    return c
  }, [])

  const copierInjoignables = useCallback(() => {
    navigator.clipboard.writeText(
      injoignables.map((o) => `${o.fullname}\t${o.mobile || o.phone || 'aucun contact'}`).join('\n'),
    )
  }, [injoignables])

  const insererEncadre = useCallback(() => {
    setCorps((c) => (c.trim() ? `${c.replace(/\s+$/, '')}\n\n${GABARIT_ENCADRE}\n\n` : `${GABARIT_ENCADRE}\n\n`))
  }, [])

  const pret = Boolean(objet.trim() && corps.trim() && joignables.length > 0)

  const envoyer = useCallback(async () => {
    if (!ciblage) return
    setEnvoiEnCours(true)
    setErreur(null)
    try {
      const to = joignables.map((o) => o.email!).filter(Boolean)
      if (copieMoi && ciblage.collaborateur?.email) to.push(ciblage.collaborateur.email)
      const res = await fetch('/api/mailings/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          coproEstaleId: ciblage.condo.id,
          coproRef: ciblage.condo.reference,
          coproNom: ciblage.condo.name,
          coproAdresse: ciblage.condoAdresse || '—',
          typeNote,
          cible: cibleLabel || undefined,
          objet,
          corps,
          dossierId: dossierParam || undefined,
          confirmer: true,
        }),
      })
      const d = await res.json()
      if (!res.ok) setErreur(d.error ?? 'Erreur inconnue')
      else {
        setResultat(d)
        setPopupOuverte(false)
        chargerNotes(ciblage.condo.reference)
      }
    } catch (e) {
      setErreur(String(e))
    } finally {
      setEnvoiEnCours(false)
    }
  }, [ciblage, joignables, copieMoi, typeNote, cibleLabel, objet, corps, dossierParam, chargerNotes])

  const ouvrirNote = useCallback(async (id: string, refresh: boolean) => {
    setNoteChargement(true)
    try {
      const r = await fetch(`/api/mailings/notes/${id}${refresh ? '?refresh=1' : ''}`)
      const d = await r.json()
      if (d.note) {
        setNoteOuverte(d.note)
        setRattachement(d.note.dossier_id ?? '')
      }
    } finally {
      setNoteChargement(false)
    }
  }, [])

  // Dossiers de la copropriété de la note ouverte, pour le rattachement après coup.
  // La note porte la référence Estale ; Venator travaille en uuid → une résolution par référence.
  useEffect(() => {
    const ref = noteOuverte?.copro_ref
    if (!ref) {
      setDossiers([])
      return
    }
    let annule = false
    ;(async () => {
      try {
        const rc = await fetch('/api/venator/copros')
        const dc = await rc.json()
        const copro = (dc.copros ?? []).find(
          (c: { id: string; reference: string }) => c.reference === ref,
        )
        if (!copro || annule) return setDossiers([])
        const rd = await fetch(`/api/venator/dossiers?copro_id=${encodeURIComponent(copro.id)}`)
        const dd = await rd.json()
        if (!annule) setDossiers(dd.dossiers ?? [])
      } catch {
        if (!annule) setDossiers([])
      }
    })()
    return () => {
      annule = true
    }
  }, [noteOuverte?.copro_ref])

  const rattacher = useCallback(async () => {
    if (!noteOuverte) return
    setRattachementEnCours(true)
    try {
      const r = await fetch(`/api/mailings/notes/${noteOuverte.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dossierId: rattachement || null }),
      })
      const d = await r.json()
      if (d.ok) {
        setNoteOuverte({ ...noteOuverte, dossier_id: rattachement || null })
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteOuverte.id ? { ...n, dossier_id: rattachement || null } : n,
          ),
        )
      } else {
        setErreur(d.error ?? 'Rattachement impossible')
      }
    } finally {
      setRattachementEnCours(false)
    }
  }, [noteOuverte, rattachement])

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="sticky top-0 z-20 border-b border-app-border bg-app-bg/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold leading-none text-app-fg">Mailing ciblé</h1>
            <p className="mt-1.5 text-[13px] text-app-fg-muted">
              Ciblez un bâtiment ou une clé, la note part par courriel aux couleurs Beamô.
            </p>
          </div>
          <select
            value={condoId}
            onChange={(e) => setCondoId(e.target.value)}
            className="h-9 min-w-[19rem] rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-fg"
          >
            <option value="">Choisir une copropriété…</option>
            {condos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.reference} · {c.name}
              </option>
            ))}
          </select>
          {ciblage && (
            <button
              type="button"
              onClick={() => setFocus(focus === 'cible' ? 'message' : 'cible')}
              title={focus === 'cible' ? 'Élargir le message' : 'Élargir la cible'}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-app-border bg-app-surface px-3 text-[13px] font-medium tabular-nums text-app-fg transition hover:bg-app-surface-hover hover:border-app-border-strong"
            >
              {focus === 'cible' ? (
                <>
                  Message
                  <ChevronRight className="h-4 w-4 text-app-fg-muted" />
                </>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 text-app-fg-muted" />
                  Cible · {selectionnes.length}
                </>
              )}
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            {dossierParam && (
              <span className="rounded-full border border-app-accent bg-app-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-app-fg">
                Lié à un dossier Venator
              </span>
            )}
            {resultat && (
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                  resultat.echecs.length
                    ? 'bg-app-warning-bg text-app-warning-fg'
                    : 'bg-app-success-bg text-app-success-fg'
                }`}
              >
                Envoyé · {resultat.envoyes} ok
                {resultat.echecs.length ? ` · ${resultat.echecs.length} échec(s)` : ''}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {erreur && (
          <div className="mb-6 rounded-md border border-app-danger-fg/30 bg-app-danger-bg px-4 py-3 text-sm text-app-danger-fg">
            {erreur}
          </div>
        )}
        {resultat?.warning && (
          <div className="mb-6 rounded-md border border-app-warning-fg/30 bg-app-warning-bg px-4 py-3 text-sm text-app-warning-fg">
            {resultat.warning}
          </div>
        )}

        {!ciblage && !chargement && (
          <p className="py-24 text-center text-sm text-app-fg-muted">
            Choisissez une copropriété pour composer une cible.
          </p>
        )}
        {chargement && (
          <p className="py-24 text-center text-sm text-app-fg-muted">Chargement du ciblage…</p>
        )}

        {ciblage && (
          <div
            className={`grid gap-6 ${
              focus === 'cible'
                ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'
                : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'
            }`}
          >
            {/* ---------- Colonne cible ---------- */}
            <div className="space-y-6">
              <section className="rounded-lg border border-app-border bg-app-surface p-5">
                <Micro>Bâtiments</Micro>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Bascule
                    label="Tous"
                    compte={ciblage.owners.length}
                    actif={batsCoches.size === 0 && clesCochees.size === 0}
                    variante="sortie"
                    onClick={() => {
                      setBatsCoches(new Set())
                      setClesCochees(new Set())
                    }}
                  />
                  {ciblage.buildings.map((b) => (
                    <Bascule
                      key={b.id}
                      label={/^[A-Za-z0-9]{1,3}$/.test(b.name.trim()) ? `Bât. ${b.name}` : b.name}
                      compte={ciblage.owners.filter((o) => o.buildingIDs.includes(b.id)).length}
                      actif={batsCoches.has(b.id)}
                      onClick={() => setBatsCoches((s) => bascule(s, b.id))}
                    />
                  ))}
                </div>

                {clesGeo.length > 0 && (
                  <>
                    <div className="mt-5">
                      <Micro>Clés géographiques</Micro>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {clesGeo.map((d) => (
                        <Bascule
                          key={d.id}
                          label={d.name}
                          compte={d.nbOwners}
                          actif={clesCochees.has(d.id)}
                          onClick={() => setClesCochees((s) => bascule(s, d.id))}
                        />
                      ))}
                    </div>
                  </>
                )}

                {clesTech.length > 0 && (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setVoirTechniques((v) => !v)}
                      className="text-[11px] font-semibold uppercase tracking-[0.08em] text-app-fg-faint hover:text-app-fg-muted"
                    >
                      {voirTechniques ? '– ' : '+ '}Clés techniques ({clesTech.length})
                    </button>
                    {voirTechniques && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {clesTech.map((d) => (
                          <Bascule
                            key={d.id}
                            label={d.name}
                            compte={d.nbOwners}
                            actif={clesCochees.has(d.id)}
                            onClick={() => setClesCochees((s) => bascule(s, d.id))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-app-border bg-app-surface p-5">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <Micro>Couverture de la cible</Micro>
                    <p className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-4xl font-semibold tabular-nums leading-none text-app-fg">
                        {joignables.length}
                      </span>
                      <span className="text-lg tabular-nums text-app-fg-faint">
                        / {selectionnes.length}
                      </span>
                      <span className="ml-1 text-sm text-app-fg-muted">joignables par courriel</span>
                    </p>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums text-app-fg-muted">
                    {pctCouverture}&nbsp;%
                  </p>
                </div>
                <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-app-surface-2">
                  <div className="bg-app-accent transition-all" style={{ width: `${pctCouverture}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-app-fg-muted">
                  <span>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-app-accent align-middle" />
                    {joignables.length} avec adresse
                  </span>
                  <span>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-app-fg-faint align-middle" />
                    {injoignables.length} sans adresse
                  </span>
                  {muets.length > 0 && (
                    <span className="text-app-warning-fg">dont {muets.length} sans aucun contact</span>
                  )}
                </div>
              </section>

              {focus === 'cible' && (
                <section className="rounded-lg border border-app-border bg-app-surface">
                  <div className="flex items-center justify-between gap-4 border-b border-app-border px-5 py-3">
                    <Micro>Destinataires</Micro>
                    <div className="flex gap-1 rounded-md bg-app-surface-2 p-0.5">
                      {(
                        [
                          ['tous', `Tous ${cible.length}`],
                          ['joignables', `Joignables ${joignables.length}`],
                          ['injoignables', `Sans adresse ${injoignables.length}`],
                        ] as [Onglet, string][]
                      ).map(([cle, label]) => (
                        <button
                          key={cle}
                          type="button"
                          onClick={() => setOnglet(cle)}
                          className={`rounded px-2.5 py-1 text-[12px] tabular-nums transition ${
                            onglet === cle
                              ? 'bg-app-surface font-medium text-app-fg shadow-sm'
                              : 'text-app-fg-muted hover:text-app-fg'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="max-h-[26rem] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-app-surface">
                        <tr className="border-b border-app-border">
                          <th className="w-10 py-2 pl-5">
                            <Checkbox
                              aria-label="Tout sélectionner"
                              checked={lignes.length > 0 && lignes.every((o) => selection.has(o.id))}
                              onCheckedChange={(v) =>
                                setSelection((s) => {
                                  const c = new Set(s)
                                  lignes.forEach((o) => (v === true ? c.add(o.id) : c.delete(o.id)))
                                  return c
                                })
                              }
                            />
                          </th>
                          <th colSpan={3} className="py-2 pr-5 text-left">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-app-fg-faint">
                              {selectionnes.length} sélectionné{selectionnes.length > 1 ? 's' : ''}
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignes.map((o) => (
                          <tr
                            key={o.id}
                            className="border-b border-app-border/60 last:border-0 hover:bg-app-surface-hover"
                          >
                            <td className="w-10 py-2 pl-5">
                              <Checkbox
                                checked={selection.has(o.id)}
                                onCheckedChange={() => setSelection((s) => bascule(s, o.id))}
                              />
                            </td>
                            <td className="py-2 pr-4 font-medium text-app-fg">{o.fullname}</td>
                            <td className="py-2 pr-4">
                              {o.email ? (
                                <span className="text-app-fg-muted">{o.email}</span>
                              ) : (
                                <span className="rounded bg-app-surface-2 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-app-fg-faint">
                                  sans adresse
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-5 text-right tabular-nums text-app-fg-muted">
                              {o.mobile || o.phone || '—'}
                            </td>
                          </tr>
                        ))}
                        {lignes.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-5 py-10 text-center text-app-fg-muted">
                              Aucun destinataire dans cette vue.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {injoignables.length > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t border-app-border bg-app-warning-bg px-5 py-3">
                      <p className="text-[13px] text-app-warning-fg">
                        <strong className="font-semibold">{injoignables.length}</strong> personnes ne
                        recevront pas ce courriel. Affiche ou courrier.
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={copierInjoignables}>
                        Copier la liste
                      </Button>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* ---------- Colonne message ---------- */}
            <aside className={focus === 'cible' ? 'lg:sticky lg:top-[5.75rem] lg:self-start' : ''}>
              <div className="space-y-4 rounded-lg border border-app-border bg-app-surface p-5">
                <Micro>Message</Micro>

                <div className="space-y-1.5">
                  <label className="text-[13px] text-app-fg-muted">Type de note</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPES_NOTE.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeNote(t)}
                        className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition ${
                          typeNote === t
                            ? 'border-app-accent bg-app-accent text-app-accent-foreground'
                            : 'border-app-border bg-app-surface text-app-fg-muted hover:text-app-fg'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="objet" className="text-[13px] text-app-fg-muted">
                    Objet du courriel
                  </label>
                  <Input
                    id="objet"
                    value={objet}
                    onChange={(e) => setObjet(e.target.value)}
                    className="placeholder:text-app-fg-faint placeholder:italic"
                    placeholder="Ex. : Interphone bâtiment A, intervention le jeudi 27 août"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="corps" className="text-[13px] text-app-fg-muted">
                      Corps
                    </label>
                    <button
                      type="button"
                      onClick={insererEncadre}
                      className="rounded border border-app-border px-2 py-0.5 text-[11px] font-medium text-app-fg-muted transition hover:bg-app-surface-hover hover:text-app-fg"
                    >
                      + Insérer un encadré
                    </button>
                  </div>
                  <Textarea
                    id="corps"
                    value={corps}
                    onChange={(e) => setCorps(e.target.value)}
                    rows={focus === 'message' ? 18 : 10}
                    className="placeholder:text-app-fg-faint placeholder:italic"
                    placeholder="Ex. : Bonjour à toutes et à tous,&#10;&#10;…&#10;&#10;Ligne vide = paragraphe · **gras** · encadré via le bouton ci-dessus"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-app-border bg-app-surface-2 px-3 py-2.5">
                  <Checkbox
                    checked={copieMoi}
                    onCheckedChange={(v) => setCopieMoi(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-[13px] leading-snug text-app-fg">
                    Me mettre en copie
                    <span className="mt-0.5 block text-[12px] text-app-fg-muted">
                      {ciblage.collaborateur?.email ?? 'adresse du compte Estale'}
                    </span>
                  </span>
                </label>

                <div className="space-y-2 border-t border-app-border pt-4">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => setPopupOuverte(true)}
                    disabled={!pret}
                  >
                    Envoyer la note ({joignables.length}
                    {copieMoi ? ' + moi' : ''})
                  </Button>
                  <p className="text-center text-[12px] text-app-fg-faint">
                    {pret
                      ? 'Une confirmation vous sera demandée avant l’envoi.'
                      : 'Objet, corps et au moins un destinataire joignable sont requis.'}
                  </p>
                </div>

                {/* Rapport : notes envoyées pour cette copropriété */}
                {notes.length > 0 && (
                  <div className="space-y-1.5 border-t border-app-border pt-4">
                    <Micro>Notes envoyées</Micro>
                    <ul className="space-y-1">
                      {notes.slice(0, 8).map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => ouvrirNote(n.id, true)}
                            className="flex w-full items-center justify-between gap-3 rounded-md border border-app-border px-2.5 py-1.5 text-left transition hover:bg-app-surface-hover"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] text-app-fg">{n.objet}</span>
                              <span className="block text-[11px] text-app-fg-muted">
                                {new Date(n.created_at).toLocaleDateString('fr-FR')}
                                {n.cible ? ` · ${n.cible}` : ''}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11px] tabular-nums text-app-fg-muted">
                              {n.nb_destinataires}
                            </span>
                            {n.nb_echecs > 0 ? (
                              <span className="shrink-0 rounded bg-app-danger-bg px-1.5 py-0.5 text-[11px] font-semibold text-app-danger-fg">
                                {n.nb_echecs} échec{n.nb_echecs > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="shrink-0 rounded bg-app-success-bg px-1.5 py-0.5 text-[11px] font-semibold text-app-success-fg">
                                ok
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ---------- Pop-up de confirmation d'envoi ---------- */}
      <Dialog open={popupOuverte} onOpenChange={(o) => !envoiEnCours && setPopupOuverte(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer cette note ?</DialogTitle>
            <DialogDescription>
              L&apos;envoi est immédiat et irréversible. Chaque destinataire reçoit son propre
              courriel.
            </DialogDescription>
          </DialogHeader>
          {ciblage && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-app-fg-muted">Copropriété :</span>{' '}
                <strong>
                  {ciblage.condo.reference} · {ciblage.condo.name}
                </strong>
              </p>
              <p>
                <span className="text-app-fg-muted">Cible :</span>{' '}
                <strong>{cibleLabel || 'Toute la copropriété'}</strong>
              </p>
              <p>
                <span className="text-app-fg-muted">Type :</span> <strong>{typeNote}</strong>
              </p>
              <p>
                <span className="text-app-fg-muted">Objet :</span> <strong>{objet}</strong>
              </p>
              <p>
                <span className="text-app-fg-muted">Destinataires :</span>{' '}
                <strong>
                  {joignables.length} copropriétaire{joignables.length > 1 ? 's' : ''}
                  {copieMoi ? ' + vous en copie' : ''}
                </strong>
              </p>
              {injoignables.length > 0 && (
                <p className="rounded-md bg-app-warning-bg px-3 py-2 text-[13px] text-app-warning-fg">
                  {injoignables.length} personne{injoignables.length > 1 ? 's' : ''} de la cible ne
                  recevron{injoignables.length > 1 ? 't' : 'a'} rien (sans adresse mail).
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPopupOuverte(false)}
              disabled={envoiEnCours}
            >
              Annuler
            </Button>
            <Button type="button" onClick={envoyer} disabled={envoiEnCours}>
              {envoiEnCours ? 'Envoi…' : 'Confirmer l’envoi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Détail d'une note (rapport de réception) ---------- */}
      <Dialog open={noteOuverte !== null} onOpenChange={(o) => !o && setNoteOuverte(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {noteOuverte && (
            <>
              <DialogHeader>
                <DialogTitle>{noteOuverte.objet}</DialogTitle>
                <DialogDescription>
                  {noteOuverte.copro_ref} · {noteOuverte.copro_nom}
                  {noteOuverte.cible ? ` · ${noteOuverte.cible}` : ''} —{' '}
                  {new Date(noteOuverte.created_at).toLocaleString('fr-FR')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <Micro>Réception</Micro>
                  <ul className="mt-2 space-y-1">
                    {noteOuverte.envois.map((e) => (
                      <li
                        key={e.email}
                        className="flex items-center justify-between gap-3 rounded-md border border-app-border px-2.5 py-1.5"
                      >
                        <span className="min-w-0 flex-1 truncate text-[13px] text-app-fg">
                          {e.email}
                        </span>
                        <BadgeStatut statut={e.statut} erreur={e.erreur} />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-app-fg-faint">
                    Statut au moment de l&apos;envoi. La relecture chez Resend (remis, rejeté)
                    demande une clé API autorisée en lecture ; la clé d&apos;envoi actuelle ne
                    l&apos;est pas. {noteChargement ? 'Actualisation…' : ''}
                  </p>
                </div>
                <div>
                  <Micro>Dossier Venator</Micro>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={rattachement}
                      onChange={(e) => setRattachement(e.target.value)}
                      className="h-9 min-w-0 flex-1 rounded-md border border-app-border bg-app-surface px-2.5 text-[13px] text-app-fg"
                    >
                      <option value="">Aucun dossier</option>
                      {dossiers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.titre}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        rattachementEnCours || rattachement === (noteOuverte.dossier_id ?? '')
                      }
                      onClick={rattacher}
                    >
                      {rattachementEnCours ? 'Rattachement…' : 'Rattacher'}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-app-fg-faint">
                    {dossiers.length === 0
                      ? 'Aucun dossier pour cette copropriété.'
                      : 'Le rattachement ajoute une entrée au journal du dossier. Rien n’est renvoyé.'}
                  </p>
                </div>
                <div>
                  <Micro>Contenu envoyé</Micro>
                  <pre className="mt-2 whitespace-pre-wrap rounded-md border border-app-border bg-app-surface-2 p-3 font-sans text-[13px] leading-relaxed text-app-fg">
                    {noteOuverte.corps}
                  </pre>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
