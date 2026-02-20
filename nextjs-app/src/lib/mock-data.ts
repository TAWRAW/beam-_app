import type { SupplierCondo, BuildingInfo, AgencyInfo } from '@/schemas/document'

// Logo Beamô - utiliser l'URL absolue pour le rendu PDF
const BEAMO_LOGO_URL = '/beamo-logo.png'

export const mockSuppliers: SupplierCondo[] = [
  {
    id: 'supplier-1',
    nom: 'Plomberie Martin & Fils',
    telephone: '01 23 45 67 89',
    email: 'contact@plomberie-martin.fr',
    specialite: 'Plomberie - Chauffage',
    tags: ['PLOMBERIE', 'CHAUFFAGE', 'URGENCE'],
  },
  {
    id: 'supplier-2',
    nom: 'Électricité Durand',
    telephone: '01 98 76 54 32',
    email: 'contact@electricite-durand.fr',
    specialite: 'Électricité générale',
    tags: ['ELECTRICITE', 'DOMOTIQUE'],
  },
  {
    id: 'supplier-3',
    nom: 'Espaces Verts Legrand',
    telephone: '06 12 34 56 78',
    email: 'contact@ev-legrand.fr',
    specialite: 'Entretien espaces verts',
    tags: ['JARDINAGE', 'ESPACES_VERTS'],
  },
]

export const mockBuilding: BuildingInfo = {
  nom: 'Résidence Les Tilleuls',
  adresse: '12 rue des Lilas',
  codePostal: '27200',
  ville: 'Vernon',
}

export const mockAgency: AgencyInfo = {
  nom: 'Beamô',
  adresse: '2 Place Jean Paul II',
  codePostal: '27200',
  ville: 'Vernon',
  telephone: '02 32 71 23 90',
  email: 'contact@beamo.fr',
  logo: BEAMO_LOGO_URL,
}

// Structure des informations légales (prête pour être remplacée par l'API Estale)
// TODO: Créer un endpoint /api/estale/company-info pour récupérer ces données dynamiquement
export interface BeamoLegalInfo {
  enseigne: string
  raisonSociale: string
  formeJuridique: string
  capital: string
  siegeSocial: string
  cabinetAdresse: string
  siren: string
  tvaIntracommunautaire: string
  carteProfessionnelle: {
    numero: string
    mention: string
    delivreePar: string
    loi: string
  }
  assurance: {
    compagnie: string
    courtier: string
    adresse: string
  }
  garantieFinanciere: {
    organisme: string
    adresse: string
    montant: string
  }
}

// Données légales actuelles (à remplacer par fetch API Estale)
export const BEAMO_LEGAL_INFO: BeamoLegalInfo = {
  enseigne: 'Beamô',
  raisonSociale: 'BEAMO IMMOBILIER',
  formeJuridique: 'SASU',
  capital: '2 500 €',
  siegeSocial: '8 rue du général Leclerc 27950 Saint-Marcel',
  cabinetAdresse: '2 Place Jean Paul II 27200 Vernon',
  siren: '989 101 829 Évreux',
  tvaIntracommunautaire: 'FR33989101829',
  carteProfessionnelle: {
    numero: 'CPI27012025000000013',
    mention: 'Syndic de Copropriété',
    delivreePar: 'CCI PORTE DE NORMANDIE (27)',
    loi: 'Loi n° 70-9 du 02/01/1970',
  },
  assurance: {
    compagnie: 'ALLIANZ',
    courtier: 'M. RAYEUR Guillaume',
    adresse: '4 rue Carnot 27200 Vernon',
  },
  garantieFinanciere: {
    organisme: 'SO.CA.F',
    adresse: '26 avenue de Suffren 75015 Paris',
    montant: '30 000 €',
  },
}

// Génère le texte des mentions légales à partir des données structurées
export function generateLegalMentions(info: BeamoLegalInfo = BEAMO_LEGAL_INFO): string {
  return `Enseigne ${info.enseigne} | ${info.formeJuridique} ${info.raisonSociale} au capital de ${info.capital} dont le siège social est situé au ${info.siegeSocial} | Cabinet au ${info.cabinetAdresse} | SIREN ${info.siren} | Numéro TVA intracommunautaire ${info.tvaIntracommunautaire}. Carte professionnelle portant la mention "${info.carteProfessionnelle.mention}" ${info.carteProfessionnelle.numero}, délivrée par ${info.carteProfessionnelle.delivreePar}, conformément à la (${info.carteProfessionnelle.loi}). Titulaire d'une assurance en responsabilité civile professionnelle auprès de ${info.assurance.compagnie} ${info.assurance.courtier} ${info.assurance.adresse}, et d'une garantie financière auprès de la ${info.garantieFinanciere.organisme} sise ${info.garantieFinanciere.adresse} d'un montant de ${info.garantieFinanciere.montant}.
Document propriété de la société ${info.raisonSociale}, ne pas reproduire.`
}

// Mentions légales complètes pour les documents (rétrocompatibilité)
export const BEAMO_LEGAL_MENTIONS = generateLegalMentions()

/**
 * Trouve un prestataire par tag
 * Utile pour l'auto-sélection basée sur le type de travaux
 */
export function findSupplierByTag(tag: string): SupplierCondo | undefined {
  return mockSuppliers.find((supplier) =>
    supplier.tags.some((t) => t.toUpperCase() === tag.toUpperCase())
  )
}

/**
 * Trouve un prestataire par ID
 */
export function findSupplierById(id: string): SupplierCondo | undefined {
  return mockSuppliers.find((supplier) => supplier.id === id)
}
