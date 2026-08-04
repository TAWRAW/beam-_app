// src/lib/venator/services/equipements-service.ts — référentiel d'équipements par copropriété
// (interphone, portail, toiture…). Sert la continuité de suivi (§18 spec Venator) : un même
// équipement peut être rattaché à plusieurs dossiers dans le temps (dépannage ponctuel,
// puis un jour un chantier voté), sans être réservé au type de dossier 'entretien'.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Equipement, EquipementCategorie } from '../types'
import { logJournal } from './journal-service'
import { VenatorError } from './errors'

export async function listerEquipements(db: SupabaseClient, copro_id: string): Promise<Equipement[]> {
  const { data } = await db.from('venator_equipements').select('*').eq('copro_id', copro_id).order('nom')
  return data ?? []
}

export async function creerEquipement(
  db: SupabaseClient,
  input: { copro_id: string; nom: string; categorie: EquipementCategorie }
): Promise<Equipement> {
  const { data, error } = await db.from('venator_equipements').insert(input).select().single()
  if (error || !data) throw new VenatorError('invalid', error?.message ?? 'création impossible')
  await logJournal(db, { copro_id: input.copro_id, type_evenement: 'equipement_cree', contenu: `Équipement ajouté : ${input.nom}` })
  return data
}

export async function majEquipement(
  db: SupabaseClient,
  id: string,
  patch: { nom?: string; categorie?: EquipementCategorie }
): Promise<Equipement> {
  const { data, error } = await db.from('venator_equipements').update(patch).eq('id', id).select().single()
  if (error || !data) throw new VenatorError('not_found', 'Équipement introuvable')
  return data
}

export async function supprimerEquipement(db: SupabaseClient, id: string): Promise<void> {
  const { data: equipement } = await db.from('venator_equipements').select('*').eq('id', id).maybeSingle()
  await db.from('venator_equipements').delete().eq('id', id)
  // Le nettoyage des dossiers liés (equipement_id → null) est porté par la contrainte
  // ON DELETE SET NULL de la migration SQL — rien à répliquer ici.
  if (equipement) {
    await logJournal(db, { copro_id: equipement.copro_id, type_evenement: 'equipement_supprime', contenu: `Équipement supprimé : ${equipement.nom}` })
  }
}
