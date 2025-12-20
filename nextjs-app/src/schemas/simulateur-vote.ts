import { z } from 'zod'

// === CLÉS DE CHARGES ===

// Schema pour une clé de charges
export const CleDeChargesSchema = z.object({
  id: z.string(),
  nom: z
    .string()
    .min(1, 'Le nom de la clé ne peut pas être vide')
    .max(50, 'Le nom de la clé ne peut pas dépasser 50 caractères'),
  isDefault: z.boolean(),
})

// Schema pour le formulaire de création/édition d'une clé
export const CleFormSchema = z.object({
  nom: z
    .string()
    .min(1, 'Le nom de la clé est obligatoire')
    .max(50, 'Le nom de la clé ne peut pas dépasser 50 caractères'),
})

// === LOTS ===

// Schema pour les tantièmes par clé (Record<cleId, number>)
export const TantièmesParCleSchema = z.record(
  z.string(),
  z.coerce
    .number()
    .int('Les tantièmes doivent être un nombre entier')
    .min(0, 'Les tantièmes ne peuvent pas être négatifs')
)

// Schema pour un lot
export const LotSchema = z.object({
  id: z.string(),
  numero: z
    .string()
    .min(1, 'Le numéro de lot ne peut pas être vide')
    .max(20, 'Le numéro de lot ne peut pas dépasser 20 caractères'),
  nom: z
    .string()
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional(),
  tantièmesParCle: TantièmesParCleSchema,
})

// Schema pour le formulaire de création/édition d'un lot (tantièmes dynamiques)
export const LotFormSchema = z.object({
  numero: z
    .string()
    .min(1, 'Le numéro de lot est obligatoire')
    .max(20, 'Le numéro de lot ne peut pas dépasser 20 caractères'),
  nom: z
    .string()
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  tantièmesParCle: TantièmesParCleSchema,
})

// Schema pour les statuts de présence
export const PresenceStatusSchema = z.enum(['absent', 'present', 'represente'])

// Schema pour les choix de vote
export const VoteChoiceSchema = z.enum(['pour', 'contre', 'abstention']).nullable()

// Schema pour les types de majorité
export const MajorityTypeSchema = z.enum(['art24', 'art25', 'art26', 'unanimite'])

// Schema pour l'export de données
export const ExportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  copropriete: z.object({
    nom: z.string(),
    clesDeCharges: z.array(CleDeChargesSchema),
    lots: z.array(LotSchema),
  }),
  presences: z.record(z.string(), PresenceStatusSchema).optional(),
  representations: z.record(z.string(), z.string()).optional(),
})

// Types inférés des schemas
export type CleFormData = z.infer<typeof CleFormSchema>
export type LotFormData = z.infer<typeof LotFormSchema>
export type ExportDataZod = z.infer<typeof ExportDataSchema>
