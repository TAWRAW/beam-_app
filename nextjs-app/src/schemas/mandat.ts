import { z } from 'zod'

const optionalDate = z.preprocess((v) => {
  if (typeof v === 'string' && v.trim() === '') return undefined
  return v
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional())

export const MandatSchema = z.object({
  // Identité copropriété
  COPRO__NOM_USAGE: z.string().min(1, 'Requis'),
  COPRO__ADRESSE: z.string().min(1, 'Requis'),
  COPRO__CP: z.string().regex(/^\d{5}$/, 'Code postal à 5 chiffres'),
  COPRO__VILLE: z.string().min(1, 'Requis'),
  COPRO__NUMERO_RNC: z.string().min(1, 'Requis'),
  COPRO__NB_LOT: z.coerce.number().int().min(0),
  COPRO__NB_LOGT_BRX: z.coerce.number().int().min(0),
  COPRO__NB_AUTRE: z.coerce.number().int().min(0),

  AG__DATE: optionalDate,
  MANDAT__DUREE: z.coerce.number().int().positive(),
  MANDAT__DATE_DEBUT: optionalDate,
  MANDAT__DATE_FIN: optionalDate,
  COPRO__NOMBRE_VISITE: z.coerce.number().int().min(0),
  COPRO__DUREE__VISITE: z.coerce.number().min(0),
  AG__PLAGE_HORAIRE_DEBUT: z.string().regex(/^\d{2}:\d{2}$/),
  AG__PLAGE_HORAIRE_FIN: z.string().regex(/^\d{2}:\d{2}$/),
  AG__DUREE: z.coerce.number().min(0).optional(),
  CS__NOMBRE_REUNIONS: z.coerce.number().int().min(0),
  CS__DUREE_REUNIONS: z.coerce.number().min(0),
  CS__HEURE_DEBUT: z.string().regex(/^\d{2}:\d{2}$/),
  CS__HEURE_FIN: z.string().regex(/^\d{2}:\d{2}$/),
  SYNDIC__HONORAIRES_HT: z.coerce.number().min(0),
  SYNDIC__HONORAIRES_TTC: z.coerce.number().min(0).optional(),
})

export type MandatInput = z.infer<typeof MandatSchema>

export function computeDateFin(dateDebut: string, dureeMois: number) {
  const d = new Date(dateDebut + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + dureeMois)
  const iso = d.toISOString().slice(0, 10)
  return iso
}

export function computeDureeHeures(hhmmStart: string, hhmmEnd: string) {
  const [hs, ms] = hhmmStart.split(':').map(Number)
  const [he, me] = hhmmEnd.split(':').map(Number)
  let diff = (he * 60 + me) - (hs * 60 + ms)
  if (diff < 0) diff += 24 * 60
  return Math.round((diff / 60) * 100) / 100
}

export function computeTTC(ht: number, tvaRate: number | null) {
  if (!tvaRate && tvaRate !== 0) return undefined
  const ttc = ht * (1 + tvaRate / 100)
  return Math.round(ttc * 100) / 100
}
