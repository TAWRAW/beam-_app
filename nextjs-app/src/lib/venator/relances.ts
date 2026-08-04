// src/lib/venator/relances.ts — calcul PUR du retard/urgence d'un dossier entretien.
// AUCUN import next/* : logique pure, testable avec des dates fixes.
//
// Pas de champ `urgence` dédié : on réutilise `priorite` (1-3, déjà sur tous les
// dossiers) — priorite=1 ⇒ profil de cadence "urgent", 2 ou 3 ⇒ "normal". Le
// calcul est fait à l'affichage (dashboard), jamais poussé : aucun cron, aucune
// table de notifications, comme le badge de retard existant sur EtapesTimeline.
import type { CadenceProfil } from './types'

export const DEFAULT_CADENCES: Record<CadenceProfil, number[]> = {
  urgent: [48, 24, 12],
  normal: [96],
}

export function profilPourPriorite(priorite: number): CadenceProfil {
  return priorite === 1 ? 'urgent' : 'normal'
}

export interface RetardEntretien {
  enRetard: boolean
  heuresAvantEcheance: number
  /** Le seuil de cadence le plus serré déjà franchi, ou null si aucun. */
  seuilFranchiHeures: number | null
}

/**
 * Aucune échéance ⇒ rien à calculer (null). Sinon, compare le temps restant
 * avant l'échéance aux seuils du profil de cadence (dérivé de la priorité) et
 * retient le seuil le plus serré déjà franchi — c'est le niveau d'urgence
 * courant à afficher.
 */
export function calculerRetard(
  dossier: { echeance: string | null; priorite: number },
  cadences: Record<CadenceProfil, number[]>,
  now: Date
): RetardEntretien | null {
  if (!dossier.echeance) return null
  const echeanceDate = new Date(`${dossier.echeance}T00:00:00`)
  const heuresAvantEcheance = (echeanceDate.getTime() - now.getTime()) / 3_600_000
  const seuils = cadences[profilPourPriorite(dossier.priorite)] ?? []
  const franchis = seuils.filter((s) => heuresAvantEcheance <= s)
  return {
    enRetard: heuresAvantEcheance < 0,
    heuresAvantEcheance,
    seuilFranchiHeures: franchis.length ? Math.min(...franchis) : null,
  }
}
