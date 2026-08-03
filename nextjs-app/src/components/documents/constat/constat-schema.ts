// Schéma du formulaire Constat amiable dégât des eaux.
// Les champs oui/non sont des enums tri-état ('' = non renseigné → aucune croix sur le constat).
import { z } from 'zod'

const OuiNon = z.enum(['', 'oui', 'non']).default('')

const PartieSchema = z.object({
  nom: z.string().default(''),
  adresse: z.string().default(''),
  bat: z.string().default(''),
  etage: z.string().default(''),
  mail: z.string().default(''),
  tel: z.string().default(''),
  assureur: z.string().default(''),
  contratNo: z.string().default(''),
  sinistreNo: z.string().default(''),
  agent: z.string().default(''),
  agentTel: z.string().default(''),
  adresseAssureur: z.string().default(''),
  usageHabitation: OuiNon,
  resiliationBail: OuiNon,
  locationMeublee: OuiNon,
  vousEtes: z.enum(['', 'locataire', 'proprioOccupant', 'proprioNonOccupant', 'syndic', 'gerant']).default(''),
  // Nom et coordonnées du propriétaire ou du gérant (cas locataire) — 2 lignes sur le constat
  proprietaireCoordonnees: z.string().default(''),
  dommages: OuiNon,
})

export const ConstatFormSchema = z.object({
  sinistre: z.object({
    date: z.string().default(''), // jj/mm/aaaa
    adresse: z.string().default(''),
    typeImmeuble: z.enum(['', 'maison', 'copro', 'locatif']).default(''),
    moins10Ans: OuiNon,
    syndicNom: z.string().default(''),
    syndicAdresse: z.string().default(''),
    syndicTel: z.string().default(''),
  }).default({}),
  partieA: PartieSchema.default({}),
  partieB: PartieSchema.default({}),
  cause: z.object({
    rechercheFuite: OuiNon,
    rechercheFuiteParQui: z.string().default(''),
    causeIdentifiee: OuiNon,
    causeReparee: OuiNon,
    origine: z.enum(['', 'A', 'B', 'ailleurs']).default(''),
    origineAilleursPrecision: z.string().default(''),
    fuiteCanalisation: z.boolean().default(false),
    canalisationCommune: z.enum(['', 'commune', 'privative']).default(''),
    canalisationType: z.enum(['', 'alimentation', 'evacuation']).default(''),
    canalisationAccessible: z.enum(['', 'accessible', 'nonAccessible']).default(''),
    appareilEffetEau: z.boolean().default(false),
    cheneaux: z.boolean().default(false),
    infiltration: z.boolean().default(false),
    infiltrationToiture: z.boolean().default(false),
    infiltrationTerrasse: z.boolean().default(false),
    infiltrationFacade: z.boolean().default(false),
    infiltrationFenetre: z.boolean().default(false),
    infiltrationJoint: z.boolean().default(false),
    gel: z.boolean().default(false),
    autreCause: z.boolean().default(false),
    autreCauseLabel: z.string().default(''),
    entrepreneurOrigine: OuiNon,
    entrepreneurPrecision: z.string().default(''),
    entrepreneurNomAdresse: z.string().default(''),
  }).default({}),
  pied: z.object({
    faitA: z.string().default(''),
    faitLe: z.string().default(''), // jj/mm/aaaa
  }).default({}),
})

export type ConstatFormInput = z.infer<typeof ConstatFormSchema>

export const constatDefaults: ConstatFormInput = ConstatFormSchema.parse({})
