// src/lib/venator/services/cadences-service.ts — profils de cadence de relance visuelle
// (« Suivi Entretien »), réglables depuis /apps/venator/reglages. Deux profils fixes,
// 'urgent' et 'normal' (pas un référentiel libre), seedés par la migration.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CadenceProfil } from '../types'
import { DEFAULT_CADENCES } from '../relances'
import { VenatorError } from './errors'

// Même tolérance que gabarits-service.ts : tant que la migration n'est pas
// appliquée, l'affichage doit continuer de fonctionner avec des seuils par défaut.
const TABLE_ABSENTE = new Set(['42P01', 'PGRST205'])

const MESSAGE_MIGRATION =
  'Table des cadences absente : appliquer la migration 20260805_venator_equipements_cadences.sql.'

/**
 * Les deux profils, avec repli sur DEFAULT_CADENCES pour tout profil non seedé
 * (table absente, migration pas encore appliquée, ou seed pas encore joué).
 */
export async function lireCadences(db: SupabaseClient): Promise<Record<CadenceProfil, number[]>> {
  const { data, error } = await db.from('venator_cadence_profils').select('*')
  if (error) {
    if (TABLE_ABSENTE.has(error.code)) return { ...DEFAULT_CADENCES }
    throw new VenatorError('invalid', error.message)
  }
  const cadences: Record<CadenceProfil, number[]> = { ...DEFAULT_CADENCES }
  for (const row of data ?? []) {
    cadences[row.profil as CadenceProfil] = row.seuils_heures
  }
  return cadences
}

/** Remplace les seuils d'un profil. Trie décroissant et dédoublonne : l'ordre
 *  n'a pas de sens fonctionnel côté saisie, mais la lecture (calculerRetard)
 *  et l'affichage Réglages sont plus clairs avec des seuils rangés du plus
 *  large au plus serré. */
export async function remplacerCadence(
  db: SupabaseClient,
  profil: CadenceProfil,
  seuilsHeures: number[]
): Promise<number[]> {
  const propres = Array.from(new Set(seuilsHeures)).sort((a, b) => b - a)
  const { data, error } = await db
    .from('venator_cadence_profils')
    .update({ seuils_heures: propres, updated_at: new Date().toISOString() })
    .eq('profil', profil)
    .select()
    .single()
  if (error) {
    if (TABLE_ABSENTE.has(error.code)) throw new VenatorError('invalid', MESSAGE_MIGRATION)
    throw new VenatorError('not_found', 'Profil de cadence introuvable — la migration a-t-elle été appliquée ?')
  }
  return data.seuils_heures
}
