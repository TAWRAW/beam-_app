// src/lib/venator/google/arborescence.ts — arborescence Drive type d'une copropriété.
// AUCUN import next/* ni appel réseau : logique pure.

import { DOSSIER_TYPES, DOSSIER_TYPE_LABELS } from '../labels'

/**
 * Documents permanents de la copropriété.
 *
 * Distincts des types de dossier : ils ne décrivent pas une affaire en cours mais
 * le patrimoine documentaire, consulté en permanence et jamais clos. Venator n'y
 * crée rien — il ne fait que les mettre en place.
 *
 * La liste vient du relevé des 12 Drive copropriétés (août 2026) : carnet
 * d'entretien, diagnostics, assurance, mandat et immatriculation y existaient
 * déjà, éparpillés sous des noms libres, faute d'une case prévue pour eux.
 */
export const DOSSIERS_PERMANENTS = [
  'RCP',
  'Plan',
  "Carnet d'entretien",
  'Diagnostics',
  'Assurance',
  'Mandat & immatriculation',
  'Comptabilité',
  'Ancien syndic',
] as const

/**
 * Arborescence complète attendue sous une copropriété.
 *
 * Les libellés des types viennent de DOSSIER_TYPE_LABELS, jamais réécrits ici :
 * un dossier Drive nommé autrement que le type ne serait pas retrouvé au moment
 * de créer, et Venator en fabriquerait un doublon.
 */
export function arborescenceType(): string[] {
  return [...DOSSIER_TYPES.map((t) => DOSSIER_TYPE_LABELS[t]), ...DOSSIERS_PERMANENTS]
}
