// src/lib/venator/labels.ts — source de vérité unique des libellés par type.
// AUCUN import next/* : logique pure.
//
// Record<DossierType, ...> / Record<TicketType, ...> forcent l'exhaustivité au
// compilateur : si un type est ajouté à types.ts sans mise à jour ici, le build
// échoue — garde-fou structurel contre l'oubli qui existait avant (TYPE_META ne
// couvrait pas 'autre', et mélangeait à tort DossierType/TicketType).

import { DOSSIER_TYPES, EQUIPEMENT_CATEGORIE_SUGGESTIONS, TICKET_TYPES, type CadenceProfil, type DossierType, type TicketType } from './types'

export const DOSSIER_TYPE_LABELS: Record<DossierType, string> = {
  sinistre: 'Sinistre',
  travaux: 'Travaux',
  entretien: 'Entretien',
  contrat: 'Contrat',
  procedure: 'Procédure',
  mutation: 'Mutation',
  ag: 'AG',
  conseil_syndical: 'Conseil syndical',
  vie_copro: 'Vie copro',
  autre: 'Autre',
}

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  intervention: 'Intervention',
  demande: 'Demande',
  signalement: 'Signalement',
}

// Ré-export pratique : suggestions de saisie pour la catégorie d'équipement,
// PAS une liste fermée — categorie est du texte libre (cf. types.ts).
export { EQUIPEMENT_CATEGORIE_SUGGESTIONS }

export const CADENCE_PROFIL_LABELS: Record<CadenceProfil, string> = {
  urgent: 'Urgent',
  normal: 'Normal',
}

// Ré-export pratique pour les composants qui itèrent sur la liste des types.
export { DOSSIER_TYPES, TICKET_TYPES }
