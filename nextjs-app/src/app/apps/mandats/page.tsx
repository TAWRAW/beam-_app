"use client"
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MandatSchema, type MandatInput, computeDateFin, computeDureeHeures, computeTTC } from '@/schemas/mandat'

const TVA_RATE = Number(process.env.NEXT_PUBLIC_TVA_TAUX ?? '0')

export default function MandatsPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const defaults: Partial<MandatInput> = {
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
    if (typeof ht !== 'undefined') {
      const ttc = computeTTC(Number(ht), isNaN(TVA_RATE) ? null : TVA_RATE)
      if (typeof ttc !== 'undefined') setValue('SYNDIC__HONORAIRES_TTC', ttc)
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
        form.SYNDIC__HONORAIRES_TTC ?? computeTTC(Number(form.SYNDIC__HONORAIRES_HT), isNaN(TVA_RATE) ? null : TVA_RATE),
    } as MandatInput

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

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Mandats</h1>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
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
        {field('SYNDIC__HONORAIRES_HT', 'SYNDIC__HONORAIRES_HT', {
          type: 'number',
          step: '0.01',
          min: 0,
          onBlur: tryComputeTTC,
        })}
        {field('SYNDIC__HONORAIRES_TTC', 'SYNDIC__HONORAIRES_TTC', { type: 'number', step: '0.01', min: 0 })}

        <div className="md:col-span-2 flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
            {loading ? 'Génération…' : 'Générer le mandat'}
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
