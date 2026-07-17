// src/lib/cles/cles-types.ts
// Types du module Clés (inventaire · remises · facturation).
// Aucun import next/* ici → réutilisable côté API ET futur MCP.

export type CleType = 'badge' | 'cle' | 'telecommande' | 'autre'

export const CLE_TYPE_LABELS: Record<CleType, string> = {
  badge: 'Badge',
  cle: 'Clé',
  telecommande: 'Télécommande',
  autre: 'Autre',
}

// ----- Inventaire -----

export interface CleInventaire {
  id: string
  estale_condo_id: string
  condo_ref: string | null
  type: CleType
  libelle: string
  stock: number
  prix_unitaire_ht: number
  taux_tva: number
  actif: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CleInventaireInput {
  estale_condo_id: string
  condo_ref?: string | null
  type: CleType
  libelle: string
  stock: number
  prix_unitaire_ht: number
  taux_tva?: number
  actif?: boolean
}

export type CleInventairePatch = Partial<
  Omit<CleInventaireInput, 'estale_condo_id'>
>

// ----- Remises -----

export interface CleRemise {
  id: string
  estale_condo_id: string
  condo_ref: string | null
  cle_id: string
  cle_libelle: string
  cle_type: CleType
  estale_owner_id: string
  owner_ref: string | null
  owner_nom: string
  quantite: number
  date_remise: string
  facture_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CleRemiseInput {
  estale_condo_id: string
  condo_ref?: string | null
  cle_id: string
  cle_libelle: string
  cle_type: CleType
  estale_owner_id: string
  owner_ref?: string | null
  owner_nom: string
  quantite: number
  date_remise?: string // défaut = aujourd'hui (côté DB)
}

// ----- Factures -----

export interface CleFactureLigne {
  cle_id: string
  libelle: string
  type: CleType
  quantite: number
  prix_unitaire_ht: number
  montant_ht: number
}

export interface CleFacture {
  id: string
  numero: string
  estale_condo_id: string
  condo_ref: string | null
  estale_owner_id: string
  owner_ref: string | null
  owner_snapshot: Record<string, unknown>
  cabinet_snapshot: Record<string, unknown>
  lignes_snapshot: CleFactureLigne[]
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  pdf_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CleFactureInput {
  estale_condo_id: string
  condo_ref?: string | null
  estale_owner_id: string
  owner_ref?: string | null
  owner_nom?: string // requis si new_lignes (pour créer les remises)
  owner_snapshot: Record<string, unknown>
  cabinet_snapshot: Record<string, unknown>
  // Remises non facturées déjà existantes à inclure (via l'onglet Historique).
  remise_ids?: string[]
  // Clés de l'inventaire à facturer directement : on crée la remise à la volée
  // (décrément de stock) puis on la facture. C'est le cas d'usage principal.
  new_lignes?: { cle_id: string; quantite: number }[]
  taux_tva?: number // défaut 20
}

// Totaux calculés à partir de lignes (HT → TVA → TTC).
export interface CleMontants {
  montant_ht: number
  montant_tva: number
  montant_ttc: number
}
