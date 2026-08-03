// src/lib/venator/services/gabarits-service.ts — gabarits d'étapes réglables par type de dossier.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DossierType } from '../types'
import type { GabaritEtape } from '../gabarits'
import { VenatorError } from './errors'

/**
 * « La table n'existe pas » — la migration n'est pas encore appliquée.
 *
 * Deux codes selon la couche qui répond : PostgREST rend PGRST205 quand la table
 * est absente de son cache de schéma (cas courant via supabase-js), Postgres rend
 * 42P01 quand la requête l'atteint réellement. Vérifié en conditions réelles :
 * seul PGRST205 remonte ici, mais les deux sont traités pour ne pas dépendre du
 * chemin emprunté.
 */
const TABLE_ABSENTE = new Set(['42P01', 'PGRST205'])

const MESSAGE_MIGRATION =
  'Table des gabarits absente : appliquer la migration 20260731_venator_gabarits_reglages.sql.'

export interface GabaritEtapeRow {
  id: string
  type: DossierType
  ordre: number
  titre: string
  echeance_offset_jours: number | null
}

/**
 * Gabarit d'un type, ordonné. Retourne [] si aucun n'est réglé.
 *
 * Tolère l'absence de la table : tant que 20260731_venator_gabarits_reglages.sql
 * n'est pas appliquée, la création de dossier doit continuer de fonctionner — sans
 * étape, ce qui est justement le comportement cible.
 */
export async function lireGabarit(db: SupabaseClient, type: DossierType): Promise<GabaritEtape[]> {
  const { data, error } = await db
    .from('venator_gabarit_etapes')
    .select('*')
    .eq('type', type)
    .order('ordre')

  if (error) {
    if (TABLE_ABSENTE.has(error.code)) return []
    throw new VenatorError('invalid', error.message)
  }
  return (data ?? []).map((r: GabaritEtapeRow) => ({
    titre: r.titre,
    echeanceOffsetJours: r.echeance_offset_jours,
  }))
}

/** Tous les gabarits, groupés par type — alimente l'écran Réglages en un appel. */
export async function lireTousGabarits(
  db: SupabaseClient
): Promise<Partial<Record<DossierType, GabaritEtape[]>>> {
  const { data, error } = await db.from('venator_gabarit_etapes').select('*').order('ordre')

  if (error) {
    if (TABLE_ABSENTE.has(error.code)) return {}
    throw new VenatorError('invalid', error.message)
  }

  const grouped: Partial<Record<DossierType, GabaritEtape[]>> = {}
  for (const r of (data ?? []) as GabaritEtapeRow[]) {
    ;(grouped[r.type] ??= []).push({ titre: r.titre, echeanceOffsetJours: r.echeance_offset_jours })
  }
  return grouped
}

/**
 * Remplace intégralement le gabarit d'un type.
 *
 * Remplacement plutôt que diff : l'écran Réglages édite une liste ordonnée, et
 * réécrire les quelques lignes d'un type évite d'avoir à réconcilier des ordres
 * après insertion/suppression/déplacement. Les dossiers DÉJÀ créés ne sont pas
 * touchés — leurs étapes leur appartiennent une fois instanciées.
 */
export async function remplacerGabarit(
  db: SupabaseClient,
  type: DossierType,
  etapes: GabaritEtape[]
): Promise<GabaritEtape[]> {
  const { error: delError } = await db.from('venator_gabarit_etapes').delete().eq('type', type)
  if (delError) {
    if (TABLE_ABSENTE.has(delError.code)) throw new VenatorError('invalid', MESSAGE_MIGRATION)
    throw new VenatorError('invalid', delError.message)
  }

  const propres = etapes
    .map((e) => ({ ...e, titre: e.titre.trim() }))
    .filter((e) => e.titre.length > 0)

  if (propres.length === 0) return []

  const { error: insError } = await db.from('venator_gabarit_etapes').insert(
    propres.map((e, i) => ({
      type,
      ordre: i + 1,
      titre: e.titre,
      echeance_offset_jours: e.echeanceOffsetJours ?? null,
    }))
  )
  if (insError) {
    if (TABLE_ABSENTE.has(insError.code)) throw new VenatorError('invalid', MESSAGE_MIGRATION)
    throw new VenatorError('invalid', insError.message)
  }

  return propres
}
