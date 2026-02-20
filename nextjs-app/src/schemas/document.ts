import { z } from 'zod'

// Types de documents avec couleurs sémantiques (Eco-Design)
export const DocumentTypeSchema = z.enum(['general', 'urgency', 'intervention', 'info', 'other'])
export type DocumentType = z.infer<typeof DocumentTypeSchema>

// Palette sémantique pour économie d'encre
export const DOCUMENT_TYPE_COLORS: Record<DocumentType, { bg: string; label: string }> = {
  general: { bg: '#FFC300', label: 'Administratif / Rappel' },
  urgency: { bg: '#FF5252', label: 'Urgence / Panne' },
  intervention: { bg: '#4ADE80', label: 'Entretien / Contrat' },
  info: { bg: '#FB923C', label: 'Information diverse' },
  other: { bg: '#FFFFFF', label: 'Autre' },
}

// Informations de base d'un prestataire
export const SupplierInfoSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  specialite: z.string().optional(),
})

export type SupplierInfo = z.infer<typeof SupplierInfoSchema>

// Prestataire avec tags pour auto-sélection
export const SupplierCondoSchema = SupplierInfoSchema.extend({
  id: z.string(),
  tags: z.array(z.string()).default([]),
})

export type SupplierCondo = z.infer<typeof SupplierCondoSchema>

// Informations d'un immeuble
export const BuildingInfoSchema = z.object({
  nom: z.string().min(1, "Le nom de l'immeuble est requis"),
  adresse: z.string().min(1, "L'adresse est requise"),
  codePostal: z.string().regex(/^\d{5}$/, 'Code postal à 5 chiffres'),
  ville: z.string().min(1, 'La ville est requise'),
})

export type BuildingInfo = z.infer<typeof BuildingInfoSchema>

// Équipements de l'immeuble (pour Règlement Intérieur)
export const BuildingFeaturesSchema = z.object({
  // Communs
  hasElevator: z.boolean().default(false),
  hasStairs: z.boolean().default(false),
  hasCorridors: z.boolean().default(false),
  hasLandings: z.boolean().default(false),
  // Extérieurs
  hasBalconies: z.boolean().default(false),
  hasTerraces: z.boolean().default(false),
  hasPrivateGarden: z.boolean().default(false),
  hasCommonGarden: z.boolean().default(false),
  // Technique
  hasTrashRoom: z.boolean().default(false),
  hasBikeRoom: z.boolean().default(false),
  // Parking
  hasPrivateParking: z.boolean().default(false),
  hasVisitorParking: z.boolean().default(false),
  // Personnel
  hasCaretaker: z.boolean().default(false),
  // Vie quotidienne
  hasPets: z.boolean().default(false),
})

export type BuildingFeatures = z.infer<typeof BuildingFeaturesSchema>

// Informations légales de l'agence
export const AgencyLegalInfoSchema = z.object({
  siret: z.string().optional(),
  tvaNumber: z.string().optional(),
  capital: z.string().optional(),
  rcs: z.string().optional(),
})

export type AgencyLegalInfo = z.infer<typeof AgencyLegalInfoSchema>

// Informations de l'agence
export const AgencyInfoSchema = z.object({
  nom: z.string().min(1, "Le nom de l'agence est requis"),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  logo: z.string().optional(), // URL absolue ou Base64
  legal: AgencyLegalInfoSchema.optional(),
})

export type AgencyInfo = z.infer<typeof AgencyInfoSchema>

// Schéma pour l'affiche travaux
export const AfficheTravauxDataSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  dateTravaux: z.string().min(1, 'La date des travaux est requise'),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  heureFin: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  supplier: SupplierInfoSchema,
  notes: z.string().optional(),
})

export type AfficheTravauxData = z.infer<typeof AfficheTravauxDataSchema>

// Union discriminée pour l'extensibilité future
export const DocumentDataSchema = z.discriminatedUnion('documentType', [
  z.object({
    documentType: z.literal('affiche-travaux'),
    data: AfficheTravauxDataSchema,
    building: BuildingInfoSchema,
    agency: AgencyInfoSchema,
  }),
  // Autres types de documents à ajouter ici
  // z.object({
  //   documentType: z.literal('convocation-ag'),
  //   data: ConvocationAGDataSchema,
  //   building: BuildingInfoSchema,
  //   agency: AgencyInfoSchema,
  // }),
])

export type DocumentData = z.infer<typeof DocumentDataSchema>

// Schéma pour le formulaire d'affiche travaux (utilisé côté client)
export const AfficheTravauxFormSchema = z.object({
  documentType: DocumentTypeSchema.default('general'),
  titre: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  dateTravaux: z.string().min(1, 'La date des travaux est requise'),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  heureFin: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  // Options d'affichage
  showSupplierContactOnPreview: z.boolean().default(false),
  // Sélection copropriété
  condoId: z.string().optional(),
  buildingNom: z.string().optional(),
  buildingAdresse: z.string().optional(),
  buildingCodePostal: z.string().optional(),
  buildingVille: z.string().optional(),
  // Sélection prestataire
  supplierMode: z.enum(['select', 'manual']),
  supplierId: z.string().optional(),
  supplierNom: z.string().optional(),
  supplierTelephone: z.string().optional(),
  supplierEmail: z.string().optional(),
  supplierSpecialite: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.supplierMode === 'select') {
      return !!data.supplierId
    }
    return !!data.supplierNom && data.supplierNom.trim().length > 0
  },
  {
    message: 'Veuillez sélectionner ou saisir un prestataire',
    path: ['supplierNom'],
  }
)

export type AfficheTravauxFormInput = z.infer<typeof AfficheTravauxFormSchema>

// Schéma pour le formulaire du Règlement Intérieur
export const ReglementInterieurFormSchema = z.object({
  // Sélection copropriété
  condoId: z.string().optional(),
  buildingNom: z.string().min(1, "Le nom de l'immeuble est requis"),
  buildingAdresse: z.string().min(1, "L'adresse est requise"),
  buildingCodePostal: z.string().optional(),
  buildingVille: z.string().optional(),
  // Équipements de l'immeuble
  features: BuildingFeaturesSchema,
})

export type ReglementInterieurFormInput = z.infer<typeof ReglementInterieurFormSchema>

// === Contacts Utiles ===

export interface ContractEntry {
  equipmentType: string
  equipmentLabel: string
  supplierName: string
  supplierPhone?: string
}

export interface CommuneContacts {
  label: string
  codePostal?: string
mairieName?: string
  mairiePhone?: string
  mairieSupplierEstaleId?: string
  dechetterieName?: string
  dechetteriePhone?: string
  dechetterieAdresse?: string
  dechetterieHoraires?: string
  dechetterieSupplierEstaleId?: string
  eauFournisseur?: string
  eauPhone?: string
  eauSupplierEstaleId?: string
  conseillers: { nom: string; specialite: string; telephone?: string }[]
  extras?: { label: string; name?: string; phone?: string }[]
}

export type CommuneContactsMap = Record<string, CommuneContacts>

export interface UrgenceContact {
  label: string   // ex: "Pompiers", "Police", "SAMU"
  numero: string  // ex: "18", "17", "15"
}

export interface CustomContactBlock {
  id: string
  title: string
  icon: string
  lines: string[]
  show?: boolean
}

export interface ContactsUtilesData {
  buildingNom: string
  buildingAdresse: string
  buildingCodePostal?: string
  buildingVille?: string
  syndicNom: string
  syndicAdresse?: string
  syndicTelephone?: string
  syndicEmail?: string
  gestionnaireNom?: string
  gestionnaireTelephone?: string
  gestionnaireEmail?: string
  enedisPhone: string
  eauPrivative: boolean
  eauFournisseur?: string
  eauPhone?: string
  mairieName?: string
  mairiePhone?: string
  dechetterieName?: string
  dechetteriePhone?: string
  dechetterieAdresse?: string
  dechetterieHoraires?: string
  contracts: ContractEntry[]
  conseillers: { nom: string; specialite: string; telephone?: string }[]
  agency?: AgencyInfo
  // Section visibility
  showUrgences?: boolean
  showEnergie?: boolean
  showContracts?: boolean
  showConseillers?: boolean
  // Urgences
  urgences?: UrgenceContact[]
  // Blocs personnalisés
  customBlocks?: CustomContactBlock[]
}
