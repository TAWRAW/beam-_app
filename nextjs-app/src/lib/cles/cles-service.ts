// src/lib/cles/cles-service.ts
// Orchestration du module Clés. Les fonctions prennent un client Supabase
// (service-role) en paramètre → aucun import next/* (réutilisable API + MCP).

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CleInventaire,
  CleInventaireInput,
  CleInventairePatch,
  CleRemise,
  CleRemiseInput,
  CleFacture,
  CleFactureInput,
  CleFactureLigne,
  CleMontants,
} from './cles-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = SupabaseClient<any, any, any>

export class CleError extends Error {}

// ============================================================
// Helpers de calcul (purs — testables sans DB)
// ============================================================

/** Arrondi monétaire à 2 décimales (évite les flottants type 0.1+0.2). */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Montant HT d'une ligne = prix unitaire HT × quantité. */
export function ligneMontantHT(prixUnitaireHT: number, quantite: number): number {
  return roundMoney(prixUnitaireHT * quantite)
}

/** Totaux HT → TVA → TTC à partir des lignes et d'un taux unique. */
export function computeMontants(
  lignes: Pick<CleFactureLigne, 'montant_ht'>[],
  tauxTva = 20,
): CleMontants {
  const montant_ht = roundMoney(
    lignes.reduce((sum, l) => sum + (l.montant_ht || 0), 0),
  )
  const montant_tva = roundMoney(montant_ht * (tauxTva / 100))
  const montant_ttc = roundMoney(montant_ht + montant_tva)
  return { montant_ht, montant_tva, montant_ttc }
}

// ============================================================
// Inventaire
// ============================================================

export async function listInventaire(
  db: DB,
  estaleCondoId: string,
): Promise<CleInventaire[]> {
  const { data, error } = await db
    .from('cles_inventaire')
    .select('*')
    .eq('estale_condo_id', estaleCondoId)
    .order('created_at', { ascending: true })
  if (error) throw new CleError(error.message)
  return (data ?? []) as CleInventaire[]
}

export async function createInventaire(
  db: DB,
  input: CleInventaireInput,
  createdBy?: string | null,
): Promise<CleInventaire> {
  const { data, error } = await db
    .from('cles_inventaire')
    .insert({ ...input, created_by: createdBy ?? null })
    .select('*')
    .single()
  if (error) throw new CleError(error.message)
  return data as CleInventaire
}

export async function updateInventaire(
  db: DB,
  id: string,
  patch: CleInventairePatch,
): Promise<CleInventaire> {
  const { data, error } = await db
    .from('cles_inventaire')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new CleError(error.message)
  return data as CleInventaire
}

export async function deleteInventaire(db: DB, id: string): Promise<void> {
  // on delete restrict côté DB : refuse si des remises référencent la clé.
  const { error } = await db.from('cles_inventaire').delete().eq('id', id)
  if (error) throw new CleError(error.message)
}

// ============================================================
// Remises
// ============================================================

export async function listRemises(
  db: DB,
  estaleCondoId?: string,
): Promise<CleRemise[]> {
  let q = db.from('cles_remises').select('*').order('date_remise', { ascending: false })
  if (estaleCondoId) q = q.eq('estale_condo_id', estaleCondoId)
  const { data, error } = await q
  if (error) throw new CleError(error.message)
  return (data ?? []) as CleRemise[]
}

export async function listRemisesNonFacturees(
  db: DB,
  estaleCondoId: string,
  estaleOwnerId: string,
): Promise<CleRemise[]> {
  const { data, error } = await db
    .from('cles_remises')
    .select('*')
    .eq('estale_condo_id', estaleCondoId)
    .eq('estale_owner_id', estaleOwnerId)
    .is('facture_id', null)
    .order('date_remise', { ascending: true })
  if (error) throw new CleError(error.message)
  return (data ?? []) as CleRemise[]
}

/**
 * Crée une remise et décrémente le stock de la clé de façon gardée
 * (update conditionnel stock >= quantite). Si le stock est insuffisant,
 * lève une CleError et n'insère rien.
 */
export async function createRemise(
  db: DB,
  input: CleRemiseInput,
  createdBy?: string | null,
): Promise<CleRemise> {
  if (input.quantite <= 0) throw new CleError('Quantité invalide')

  // Supabase JS ne supporte pas "stock = stock - n" en update simple ;
  // on lit le stock puis on écrit avec une garde optimiste (eq sur l'ancien
  // stock) pour éviter une double-décrémentation concurrente.
  const { data: cle, error: readErr } = await db
    .from('cles_inventaire')
    .select('id, stock')
    .eq('id', input.cle_id)
    .single()
  if (readErr) throw new CleError(readErr.message)
  if (!cle) throw new CleError('Clé introuvable')
  if ((cle.stock ?? 0) < input.quantite) {
    throw new CleError('Stock insuffisant')
  }

  // Garde optimiste : on ne décrémente que si le stock n'a pas changé.
  const { data: decremented, error: decErr } = await db
    .from('cles_inventaire')
    .update({ stock: cle.stock - input.quantite })
    .eq('id', input.cle_id)
    .eq('stock', cle.stock)
    .select('id')
  if (decErr) throw new CleError(decErr.message)
  if (!decremented || decremented.length === 0) {
    throw new CleError('Conflit de stock, réessayez')
  }

  const { data, error } = await db
    .from('cles_remises')
    .insert({
      estale_condo_id: input.estale_condo_id,
      condo_ref: input.condo_ref ?? null,
      cle_id: input.cle_id,
      cle_libelle: input.cle_libelle,
      cle_type: input.cle_type,
      estale_owner_id: input.estale_owner_id,
      owner_ref: input.owner_ref ?? null,
      owner_nom: input.owner_nom,
      quantite: input.quantite,
      ...(input.date_remise ? { date_remise: input.date_remise } : {}),
      created_by: createdBy ?? null,
    })
    .select('*')
    .single()
  if (error) {
    // Compense le décrément si l'insertion de la remise échoue.
    await db
      .from('cles_inventaire')
      .update({ stock: cle.stock })
      .eq('id', input.cle_id)
    throw new CleError(error.message)
  }
  return data as CleRemise
}

// ============================================================
// Factures
// ============================================================

export async function listFactures(db: DB): Promise<CleFacture[]> {
  const { data, error } = await db
    .from('cles_factures')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new CleError(error.message)
  return (data ?? []) as CleFacture[]
}

/**
 * Crée une facture à partir de remises non facturées (même copro + copropriétaire),
 * calcule les montants, génère le numéro (FAC-CLES-YYYY-NNNN via RPC) et marque
 * les remises comme facturées. Renvoie la facture créée.
 */
export async function createFacture(
  db: DB,
  input: CleFactureInput,
  createdBy?: string | null,
): Promise<CleFacture> {
  // Les remises à facturer = celles déjà existantes (remise_ids) + celles
  // créées à la volée depuis l'inventaire (new_lignes).
  const remiseIds = [...(input.remise_ids ?? [])]
  const newLignes = (input.new_lignes ?? []).filter((l) => l.quantite > 0)

  if (!remiseIds.length && !newLignes.length) {
    throw new CleError('Aucune clé sélectionnée')
  }

  // 0. Créer les remises à la volée pour les clés de l'inventaire choisies
  //    (décrément de stock géré par createRemise).
  if (newLignes.length) {
    const ownerNom =
      input.owner_nom ||
      (input.owner_snapshot as { fullname?: string } | null)?.fullname ||
      'Copropriétaire'
    const cleIds = Array.from(new Set(newLignes.map((l) => l.cle_id)))
    const { data: cles, error: cleErr } = await db
      .from('cles_inventaire')
      .select('id, libelle, type')
      .in('id', cleIds)
    if (cleErr) throw new CleError(cleErr.message)
    const byId = new Map(
      ((cles ?? []) as Pick<CleInventaire, 'id' | 'libelle' | 'type'>[]).map((c) => [c.id, c]),
    )
    for (const nl of newLignes) {
      const c = byId.get(nl.cle_id)
      if (!c) throw new CleError('Clé introuvable dans l’inventaire')
      const remise = await createRemise(
        db,
        {
          estale_condo_id: input.estale_condo_id,
          condo_ref: input.condo_ref ?? null,
          cle_id: nl.cle_id,
          cle_libelle: c.libelle,
          cle_type: c.type,
          estale_owner_id: input.estale_owner_id,
          owner_ref: input.owner_ref ?? null,
          owner_nom: ownerNom,
          quantite: nl.quantite,
        },
        createdBy,
      )
      remiseIds.push(remise.id)
    }
  }

  // 1. Charger les remises ciblées + vérifier qu'elles sont éligibles.
  const { data: remises, error: remErr } = await db
    .from('cles_remises')
    .select('*')
    .in('id', remiseIds)
  if (remErr) throw new CleError(remErr.message)
  const rows = (remises ?? []) as CleRemise[]
  if (rows.length !== remiseIds.length) {
    throw new CleError('Certaines remises sont introuvables')
  }
  for (const r of rows) {
    if (r.facture_id) throw new CleError('Une remise est déjà facturée')
    if (r.estale_condo_id !== input.estale_condo_id || r.estale_owner_id !== input.estale_owner_id) {
      throw new CleError('Les remises ne correspondent pas au copropriétaire ciblé')
    }
  }

  // 2. Joindre l'inventaire pour libellé / type / prix unitaire HT.
  const cleIds = Array.from(new Set(rows.map((r) => r.cle_id)))
  const { data: cles, error: cleErr } = await db
    .from('cles_inventaire')
    .select('id, libelle, type, prix_unitaire_ht')
    .in('id', cleIds)
  if (cleErr) throw new CleError(cleErr.message)
  const cleById = new Map(
    ((cles ?? []) as Pick<CleInventaire, 'id' | 'libelle' | 'type' | 'prix_unitaire_ht'>[]).map(
      (c) => [c.id, c],
    ),
  )

  // 3. Construire les lignes + totaux.
  const lignes: CleFactureLigne[] = rows.map((r) => {
    const c = cleById.get(r.cle_id)
    if (!c) throw new CleError('Clé liée à une remise introuvable')
    return {
      cle_id: r.cle_id,
      libelle: c.libelle,
      type: c.type,
      quantite: r.quantite,
      prix_unitaire_ht: c.prix_unitaire_ht,
      montant_ht: ligneMontantHT(c.prix_unitaire_ht, r.quantite),
    }
  })
  const tauxTva = input.taux_tva ?? 20
  const montants = computeMontants(lignes, tauxTva)

  // 4. Numéro chronologique via la fonction SQL.
  const { data: numero, error: numErr } = await db.rpc('generate_cles_facture_numero')
  if (numErr) throw new CleError(numErr.message)

  // 5. Insérer la facture.
  const { data: facture, error: facErr } = await db
    .from('cles_factures')
    .insert({
      numero,
      estale_condo_id: input.estale_condo_id,
      condo_ref: input.condo_ref ?? null,
      estale_owner_id: input.estale_owner_id,
      owner_ref: input.owner_ref ?? null,
      owner_snapshot: input.owner_snapshot,
      cabinet_snapshot: input.cabinet_snapshot,
      lignes_snapshot: lignes,
      montant_ht: montants.montant_ht,
      montant_tva: montants.montant_tva,
      montant_ttc: montants.montant_ttc,
      created_by: createdBy ?? null,
    })
    .select('*')
    .single()
  if (facErr) throw new CleError(facErr.message)

  // 6. Marquer les remises comme facturées (garde : encore non facturées).
  const { error: linkErr } = await db
    .from('cles_remises')
    .update({ facture_id: (facture as CleFacture).id })
    .in('id', remiseIds)
    .is('facture_id', null)
  if (linkErr) throw new CleError(linkErr.message)

  return facture as CleFacture
}
