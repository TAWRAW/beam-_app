"use client"
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MandatSchema, type MandatInput, computeDateFin, computeDureeHeures, computeTTC } from '@/schemas/mandat'

const TVA_RATE = Number(process.env.NEXT_PUBLIC_TVA_TAUX ?? '0')

export default function MandatsPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const defaults: Partial<MandatInput> = {
    COPRO__NOM_USAGE: '',
    COPRO__ADRESSE: '',
    COPRO__CP: '',
    COPRO__VILLE: '',
    COPRO__NUMERO_RNC: '',
    AG__DATE: today,
    MANDAT__DUREE: 12,
    MANDAT__DATE_DEBUT: today,
    AG__PLAGE_HORAIRE_DEBUT: '18:00',
    AG__PLAGE_HORAIRE_FIN: '20:00',
    COPRO__NOMBRE_VISITE: 0,
    COPRO__DUREE__VISITE: 1,
    CS__NOMBRE_REUNIONS: 0,
    CS__DUREE_REUNIONS: 1,
    CS__HEURE_DEBUT: '18:00',
    CS__HEURE_FIN: '20:00',
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MandatInput>({
    resolver: zodResolver(MandatSchema),
    defaultValues: defaults as any,
    mode: 'onBlur',
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ docUrl?: string; pdfUrl?: string; error?: string } | null>(null)

  // Derived fields on blur/change
  const dateDebut = watch('MANDAT__DATE_DEBUT')
  const duree = watch('MANDAT__DUREE')
  const start = watch('AG__PLAGE_HORAIRE_DEBUT')
  const end = watch('AG__PLAGE_HORAIRE_FIN')
  const ht = watch('SYNDIC__HONORAIRES_HT')

  function tryComputeFin() {
    const d = (dateDebut && duree) ? computeDateFin(dateDebut, Number(duree)) : null
    if (d) setValue('MANDAT__DATE_FIN', d)
  }
  function tryComputeAGDuree() {
    if (start && end) setValue('AG__DUREE', computeDureeHeures(start, end))
  }
  function tryComputeTTC() {
    if (typeof ht !== 'undefined' && !isNaN(TVA_RATE)) {
      const ttc = computeTTC(Number(ht), TVA_RATE)
      if (typeof ttc !== 'undefined') setValue('SYNDIC__HONORAIRES_TTC', ttc)
    }
  }

  function tryComputeHT() {
    const ttc = watch('SYNDIC__HONORAIRES_TTC')
    if (typeof ttc !== 'undefined' && !isNaN(TVA_RATE)) {
      const rate = 1 + TVA_RATE / 100
      const htVal = Math.round((Number(ttc) / rate) * 100) / 100
      if (isFinite(htVal)) setValue('SYNDIC__HONORAIRES_HT', htVal)
    }
  }

  const onSubmit = handleSubmit(async (form) => {
    setLoading(true)
    setResult(null)
    // Compute missing derived fields
    const payload: MandatInput = {
      ...form,
      MANDAT__DATE_FIN: form.MANDAT__DATE_FIN || computeDateFin(form.MANDAT__DATE_DEBUT, Number(form.MANDAT__DUREE)),
      AG__DUREE: form.AG__DUREE ?? computeDureeHeures(form.AG__PLAGE_HORAIRE_DEBUT, form.AG__PLAGE_HORAIRE_FIN),
      SYNDIC__HONORAIRES_TTC:
        typeof form.SYNDIC__HONORAIRES_TTC !== 'undefined'
          ? form.SYNDIC__HONORAIRES_TTC
          : computeTTC(Number(form.SYNDIC__HONORAIRES_HT), isNaN(TVA_RATE) ? null : TVA_RATE),
    } as MandatInput

    // If TTC provided but HT missing, back-compute HT
    if (
      typeof payload.SYNDIC__HONORAIRES_TTC !== 'undefined' &&
      typeof payload.SYNDIC__HONORAIRES_HT === 'undefined' &&
      !isNaN(TVA_RATE)
    ) {
      const rate = 1 + TVA_RATE / 100
      const htVal = Math.round((Number(payload.SYNDIC__HONORAIRES_TTC) / rate) * 100) / 100
      if (isFinite(htVal)) (payload as any).SYNDIC__HONORAIRES_HT = htVal
    }

    try {
      const res = await fetch('/api/mandats/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (res.status === 401) {
        // Session absente/expirée: redirige vers login avec retour sur cette page
        const back = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?redirect=${back}`
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erreur serveur')
      setResult(data)
    } catch (e: any) {
      setResult({ error: e.message || 'Erreur inconnue' })
    } finally {
      setLoading(false)
    }
  })

  const field = (name: keyof MandatInput, label: string, props: any = {}) => (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input
        {...register(name)}
        {...props}
        className="mt-1 w-full rounded border px-3 py-2"
        aria-invalid={errors[name] ? 'true' : 'false'}
      />
      {errors[name] && (
        <span className="text-xs text-red-600">{String(errors[name]?.message || 'Champ invalide')}</span>
      )}
    </label>
  )

  // Presets (configurations) for horaires / réunions
  type PresetValues = Pick<
    MandatInput,
    | 'COPRO__NOMBRE_VISITE'
    | 'COPRO__DUREE__VISITE'
    | 'AG__PLAGE_HORAIRE_DEBUT'
    | 'AG__PLAGE_HORAIRE_FIN'
    | 'AG__DUREE'
    | 'CS__NOMBRE_REUNIONS'
    | 'CS__DUREE_REUNIONS'
    | 'CS__HEURE_DEBUT'
    | 'CS__HEURE_FIN'
  >
  type Preset = { name: string; values: Partial<PresetValues> }
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetName, setPresetName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('')

  function loadPresets() {
    try {
      const raw = localStorage.getItem('mandat_presets')
      if (raw) setPresets(JSON.parse(raw))
    } catch {}
  }
  function savePresets(next: Preset[]) {
    setPresets(next)
    try { localStorage.setItem('mandat_presets', JSON.stringify(next)) } catch {}
  }

  // initial load
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMemo(() => { loadPresets(); return null }, [])

  function collectCurrentValues(): Partial<PresetValues> {
    const names: (keyof PresetValues)[] = [
      'COPRO__NOMBRE_VISITE',
      'COPRO__DUREE__VISITE',
      'AG__PLAGE_HORAIRE_DEBUT',
      'AG__PLAGE_HORAIRE_FIN',
      'AG__DUREE',
      'CS__NOMBRE_REUNIONS',
      'CS__DUREE_REUNIONS',
      'CS__HEURE_DEBUT',
      'CS__HEURE_FIN',
    ]
    const out: Partial<PresetValues> = {}
    for (const n of names) (out as any)[n] = watch(n)
    return out
  }

  function onSavePreset() {
    const name = presetName.trim()
    if (!name) return
    const values = collectCurrentValues()
    const existingIdx = presets.findIndex((p) => p.name === name)
    const next = [...presets]
    if (existingIdx >= 0) next[existingIdx] = { name, values }
    else next.push({ name, values })
    savePresets(next)
    setSelectedPreset(name)
  }

  function onApplyPreset(name: string) {
    const p = presets.find((x) => x.name === name)
    if (!p) return
    const v = p.values
    ;(Object.keys(v) as (keyof PresetValues)[]).forEach((k) => {
      // @ts-ignore
      if (typeof v[k] !== 'undefined') setValue(k as any, v[k] as any)
    })
  }

  function onDeletePreset(name: string) {
    const next = presets.filter((p) => p.name !== name)
    savePresets(next)
    if (selectedPreset === name) setSelectedPreset('')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Mandats</h1>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
        {/* Identité copropriété */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-medium mb-2">Informations copropriété</h2>
        </div>
        {field('COPRO__NOM_USAGE', 'Nom d’usage de la copropriété', { type: 'text', placeholder: 'Ex: Résidence Les Tilleuls' })}
        {field('COPRO__NUMERO_RNC', 'Numéro RNC', { type: 'text', placeholder: 'Ex: RNC-123456' })}
        {field('COPRO__ADRESSE', 'Adresse', { type: 'text', placeholder: 'N° et voie' })}
        {field('COPRO__CP', 'Code postal', { type: 'text', inputMode: 'numeric', pattern: '\\d{5}', placeholder: '75001' })}
        {field('COPRO__VILLE', 'Ville', { type: 'text', placeholder: 'Paris' })}

        <div className="md:col-span-2 h-2" />

        {field('AG__DATE', 'AG__DATE', { type: 'date' })}
        {field('MANDAT__DUREE', 'MANDAT__DUREE (mois)', { type: 'number', min: 1, onBlur: tryComputeFin })}
        {field('MANDAT__DATE_DEBUT', 'MANDAT__DATE_DEBUT', { type: 'date', onBlur: tryComputeFin })}
        {field('MANDAT__DATE_FIN', 'MANDAT__DATE_FIN', { type: 'date' })}
        {field('COPRO__NOMBRE_VISITE', 'COPRO__NOMBRE_VISITE', { type: 'number', min: 0 })}
        {field('COPRO__DUREE__VISITE', 'COPRO__DUREE__VISITE (heures)', { type: 'number', step: '0.25', min: 0 })}
        {field('AG__PLAGE_HORAIRE_DEBUT', 'AG__PLAGE_HORAIRE_DEBUT', { type: 'time', onBlur: tryComputeAGDuree })}
        {field('AG__PLAGE_HORAIRE_FIN', 'AG__PLAGE_HORAIRE_FIN', { type: 'time', onBlur: tryComputeAGDuree })}
        {field('AG__DUREE', 'AG__DUREE (heures)', { type: 'number', step: '0.25', min: 0 })}
        {field('CS__NOMBRE_REUNIONS', 'CS__NOMBRE_REUNIONS', { type: 'number', min: 0 })}
        {field('CS__DUREE_REUNIONS', 'CS__DUREE_REUNIONS (heures)', { type: 'number', step: '0.25', min: 0 })}
        {field('CS__HEURE_DEBUT', 'CS__HEURE_DEBUT', { type: 'time' })}
        {field('CS__HEURE_FIN', 'CS__HEURE_FIN', { type: 'time' })}
        <label className="block">
          <span className="text-sm">SYNDIC__HONORAIRES_HT</span>
          <input
            type="number"
            step="0.01"
            min={0}
            className="mt-1 w-full rounded border px-3 py-2"
            aria-label="SYNDIC__HONORAIRES_HT"
            aria-invalid={errors['SYNDIC__HONORAIRES_HT'] ? 'true' : 'false'}
            {...register('SYNDIC__HONORAIRES_HT', {
              onChange: (e) => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val) && !isNaN(TVA_RATE)) {
                  const ttc = computeTTC(val, TVA_RATE)
                  if (typeof ttc !== 'undefined') setValue('SYNDIC__HONORAIRES_TTC', ttc)
                }
              },
            })}
          />
          {errors['SYNDIC__HONORAIRES_HT'] && (
            <span className="text-xs text-red-600">{String(errors['SYNDIC__HONORAIRES_HT']?.message || 'Champ invalide')}</span>
          )}
        </label>

        <label className="block">
          <span className="text-sm">SYNDIC__HONORAIRES_TTC</span>
          <input
            type="number"
            step="0.01"
            min={0}
            className="mt-1 w-full rounded border px-3 py-2"
            aria-label="SYNDIC__HONORAIRES_TTC"
            aria-invalid={errors['SYNDIC__HONORAIRES_TTC'] ? 'true' : 'false'}
            {...register('SYNDIC__HONORAIRES_TTC', {
              onChange: (e) => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val) && !isNaN(TVA_RATE)) {
                  const rate = 1 + TVA_RATE / 100
                  const htVal = Math.round((val / rate) * 100) / 100
                  if (isFinite(htVal)) setValue('SYNDIC__HONORAIRES_HT', htVal)
                }
              },
            })}
          />
          {errors['SYNDIC__HONORAIRES_TTC'] && (
            <span className="text-xs text-red-600">{String(errors['SYNDIC__HONORAIRES_TTC']?.message || 'Champ invalide')}</span>
          )}
        </label>

        <div className="md:col-span-2 flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
            {loading ? 'Génération…' : 'Générer le mandat'}
          </button>
          {/* Presets controls */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nom de configuration"
              className="rounded border px-3 py-2"
            />
            <button type="button" className="rounded border px-3 py-2" onClick={onSavePreset}>
              Enregistrer la configuration
            </button>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <select
            className="rounded border px-3 py-2"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            <option value="">Sélectionner une configuration…</option>
            {presets.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          <button type="button" className="rounded border px-3 py-2" onClick={() => onApplyPreset(selectedPreset)} disabled={!selectedPreset}>
            Appliquer
          </button>
          <button type="button" className="rounded border px-3 py-2" onClick={() => onDeletePreset(selectedPreset)} disabled={!selectedPreset}>
            Supprimer
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 rounded border p-4">
          {result.error ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-green-700">Mandat généré avec succès.</p>
              {result.docUrl && (
                <p>
                  Document: <a className="text-blue-700 underline" href={result.docUrl} target="_blank">Ouvrir</a>
                </p>
              )}
              {result.pdfUrl && (
                <p>
                  PDF: <a className="text-blue-700 underline" href={result.pdfUrl} target="_blank">Télécharger</a>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
