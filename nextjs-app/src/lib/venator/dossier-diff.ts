// src/lib/venator/dossier-diff.ts — résumé lisible d'une modification de dossier.
// AUCUN import next/* : logique pure.

import { DOSSIER_TYPE_LABELS } from './labels'
import type { DossierType } from './types'

export interface ChampsModifiables {
  titre: string
  type: DossierType
  priorite: number
}

const PRIORITE_LABELS: Record<number, string> = { 1: 'urgent', 2: 'normal', 3: 'bas' }

/**
 * Décrit ce qui a changé, pour le journal de la copropriété.
 *
 * Rend `null` quand rien n'a bougé : une modification blanche (le formulaire
 * rouvert puis validé sans rien toucher) ne doit pas laisser d'entrée au journal,
 * qui deviendrait vite illisible.
 *
 * Le titre n'est pas recopié en entier — certains font deux lignes — mais son
 * changement est signalé, l'ancienne valeur restant consultable dans l'historique.
 */
export function resumerChangements(avant: ChampsModifiables, apres: Partial<ChampsModifiables>): string | null {
  const parts: string[] = []

  if (apres.titre !== undefined && apres.titre !== avant.titre) {
    parts.push(`titre « ${avant.titre} » → « ${apres.titre} »`)
  }
  if (apres.type !== undefined && apres.type !== avant.type) {
    parts.push(`type ${DOSSIER_TYPE_LABELS[avant.type]} → ${DOSSIER_TYPE_LABELS[apres.type]}`)
  }
  if (apres.priorite !== undefined && apres.priorite !== avant.priorite) {
    const de = PRIORITE_LABELS[avant.priorite] ?? avant.priorite
    const vers = PRIORITE_LABELS[apres.priorite] ?? apres.priorite
    parts.push(`priorité ${de} → ${vers}`)
  }

  return parts.length > 0 ? `Dossier modifié : ${parts.join(', ')}` : null
}
