// src/lib/venator/gabarits.ts — instanciation d'un gabarit d'étapes + checklist onboarding.
// AUCUN import next/* : logique pure.
//
// Les listes d'étapes par type de dossier NE SONT PLUS codées ici : elles vivent
// en base (table venator_gabarit_etapes) et se règlent depuis /apps/venator/reglages.
// Un type sans gabarit défini produit un dossier SANS étape — c'est le
// comportement voulu depuis la suppression des étapes par défaut (31/07/2026).
import type { DossierType } from './types'

export interface GabaritEtape {
  titre: string
  /** Jours ajoutés à la date de création pour calculer l'échéance. null/absent = pas d'échéance. */
  echeanceOffsetJours?: number | null
}

export const CHECKLIST_NOUVELLE_COPRO: { libelle: string; categorie: string; auto_check_key?: string }[] = [
  { libelle: 'Mandat signé', categorie: 'Juridique' },
  { libelle: 'Compte bancaire ouvert', categorie: 'Banque' },
  { libelle: 'Lots rentrés dans Estale', categorie: 'Estale', auto_check_key: 'lots_rentres' },
  { libelle: 'Clés de charges rentrées', categorie: 'Estale', auto_check_key: 'cles_rentrees' },
  { libelle: 'Contrats récupérés', categorie: 'Reprise' },
  { libelle: 'Archives ancien syndic récupérées (art. 18-2)', categorie: 'Reprise' },
  { libelle: 'Immatriculation registre à jour', categorie: 'Juridique' },
  { libelle: 'Assurance en place', categorie: 'Assurance' },
  { libelle: 'Budget saisi', categorie: 'Comptabilité' },
  { libelle: 'GED remplie (RCP, PV, diagnostics)', categorie: 'Estale' },
]

/**
 * Transforme un gabarit (réglé par l'utilisateur) en lignes d'étapes prêtes à
 * insérer. Fonction pure : la lecture du gabarit en base est faite par
 * l'appelant (gabarits-service), pour que ce calcul reste testable seul.
 */
export function instancierGabarit(gabarit: GabaritEtape[], dateBase: Date) {
  return gabarit.map((g, i) => {
    let echeance: string | null = null
    if (g.echeanceOffsetJours != null) {
      const d = new Date(dateBase)
      d.setDate(d.getDate() + g.echeanceOffsetJours)
      echeance = d.toISOString().slice(0, 10)
    }
    return { ordre: i + 1, titre: g.titre, echeance }
  })
}

/** Type de dossier valide ? Garde-fou pour les entrées d'API des Réglages. */
export function estTypeDossier(value: string, types: readonly string[]): value is DossierType {
  return types.includes(value)
}
