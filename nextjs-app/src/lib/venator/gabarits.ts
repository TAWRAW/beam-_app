// src/lib/venator/gabarits.ts — gabarits d'étapes par type de dossier + checklist onboarding.
// Données volontairement en code (V1). Modifiables par dossier après instanciation.
import type { DossierType } from './types'

export interface GabaritEtape { titre: string; echeanceOffsetJours?: number }

export const GABARITS: Record<DossierType, GabaritEtape[]> = {
  sinistre: [
    { titre: 'Déclaration assureur', echeanceOffsetJours: 5 },
    { titre: 'Mesures conservatoires' },
    { titre: 'Expertise' },
    { titre: 'Devis réparation' },
    { titre: 'Accord assureur' },
    { titre: 'Travaux' },
    { titre: 'Réception' },
    { titre: 'Indemnisation / Clôture' },
  ],
  travaux: [
    { titre: 'Résolution AG (référence)' },
    { titre: 'Consultation devis', echeanceOffsetJours: 21 },
    { titre: 'Ordre de service' },
    { titre: 'Planification' },
    { titre: 'Réalisation' },
    { titre: 'Réception' },
    { titre: 'Levée des réserves' },
    { titre: 'Solde facture' },
  ],
  procedure: [
    { titre: 'Relance amiable', echeanceOffsetJours: 15 },
    { titre: 'Relance LRAR', echeanceOffsetJours: 30 },
    { titre: 'Mise en demeure' },
    { titre: 'Transmission avocat / huissier' },
    { titre: 'Suivi contentieux' },
    { titre: 'Recouvrement / Clôture' },
  ],
  mutation: [
    { titre: 'Réception avis de mutation' },
    { titre: 'Pré-état daté / État daté', echeanceOffsetJours: 10 },
    { titre: 'Opposition art. 20 si impayé' },
    { titre: 'Mise à jour registre / Estale' },
    { titre: 'Clôture' },
  ],
  ag: [
    { titre: 'Ordre du jour + conseil syndical' },
    { titre: 'Convocation (J-21 copro / J-15 ASL)' },
    { titre: 'Tenue de l’AG' },
    { titre: 'Procès-verbal', echeanceOffsetJours: 7 },
    { titre: 'Notification du PV' },
    { titre: 'Exécution des résolutions' },
  ],
  conseil_syndical: [
    { titre: 'Préparation' },
    { titre: 'Réunion' },
    { titre: 'Compte rendu', echeanceOffsetJours: 7 },
    { titre: 'Actions décidées' },
  ],
  vie_copro: [
    { titre: 'Signalement' },
    { titre: 'Qualification' },
    { titre: 'Médiation / courrier' },
    { titre: 'Suivi' },
    { titre: 'Clôture' },
  ],
  autre: [
    { titre: 'Ouverture' },
    { titre: 'Suivi' },
    { titre: 'Clôture' },
  ],
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

export function instancierGabarit(type: DossierType, dateBase: Date) {
  return GABARITS[type].map((g, i) => {
    let echeance: string | null = null
    if (g.echeanceOffsetJours != null) {
      const d = new Date(dateBase)
      d.setDate(d.getDate() + g.echeanceOffsetJours)
      echeance = d.toISOString().slice(0, 10)
    }
    return { ordre: i + 1, titre: g.titre, echeance }
  })
}
