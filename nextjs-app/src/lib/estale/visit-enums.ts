// src/lib/estale/visit-enums.ts
// Mapping FR ↔ enums GraphQL d'estale pour la brique visites.
// Source : introspection live le 2026-05-17.

export const VISIT_CATEGORY_FR = {
  CONTRACTUAL: 'Contractuelle',
  NON_CONTRACTUAL: 'Hors contrat',
} as const

export type VisitCategory = keyof typeof VISIT_CATEGORY_FR

export const VISIT_PLACE_FR = {
  ELEVATOR: 'Ascenseur',
  CELLARS: 'Caves',
  BOILER_ROOM: 'Chaufferie',
  CORRIDOR: 'Couloir',
  COURT_YARD: 'Cour',
  HALL: 'Hall',
  STAIRS: 'Escaliers',
  EXTERIORS: 'Extérieurs',
  GARAGE: 'Garage',
  BIKE_ROOM: 'Local vélos',
  TECHNICAL_AREA: 'Local technique',
  GARBAGE_DISPOSAL_AREA: 'Local poubelles',
  LEVEL_1: 'Niveau 1',
  LEVEL_2: 'Niveau 2',
  LANDING: 'Palier',
  CAR_PARK: 'Parking',
  SWIMMING_POOL: 'Piscine',
  ROOF_PLACE: 'Toiture',
  ACCESS_ROAD: 'Voie d\'accès',
  OTHER: 'Autre',
} as const

export type VisitPlace = keyof typeof VISIT_PLACE_FR

export const VISIT_COMPONENT_FR = {
  ANTENNA: 'Antenne',
  WATER_INLET: 'Arrivée d\'eau',
  SANDBOX: 'Bac à sable',
  FENCE: 'Barrière',
  EMERGENCY_BLOCK: 'BAES (bloc secours)',
  LETTER_BOX: 'Boîte aux lettres',
  CABIN: 'Cabine',
  CHANNELING: 'Canalisation',
  CHAIN: 'Chaîne',
  FENCING: 'Clôture',
  WATER_METER: 'Compteur eau',
  ELECTRIC_METER: 'Compteur électrique',
  GAS_METER: 'Compteur gaz',
  SHOWER: 'Douche',
  LIGHTING: 'Éclairage',
  EXTINGUISHER: 'Extincteur',
  FACADE: 'Façade',
  WINDOW: 'Fenêtre',
  GROOM: 'Ferme-porte',
  INTERCOM: 'Interphone',
  SWITCHER: 'Interrupteur',
  PLANTER: 'Jardinière',
  WALL: 'Mur',
  NEON: 'Néon',
  DOORMAT: 'Paillasson',
  LAWN: 'Pelouse',
  CEILING: 'Plafond',
  CEILING_LIGHT: 'Plafonnier',
  EVACUATION_PLAN: 'Plan d\'évacuation',
  STUDS: 'Plots',
  LIFT_PUMP: 'Pompe de relevage',
  GATE: 'Portail',
  ACCES_DOOR: 'Porte d\'accès',
  ELEVATOR_DOOR: 'Porte d\'ascenseur',
  FRONT_DOOR: 'Porte d\'entrée',
  LANDING_DOOR: 'Porte palière',
  SOCKET: 'Prise',
  RAMP: 'Rampe',
  FAUCET: 'Robinet',
  SKYDOME: 'Skydome',
  FLOOR: 'Sol',
  OTHERS: 'Autres',
} as const

export type VisitComponent = keyof typeof VISIT_COMPONENT_FR

export const VISIT_CATEGORIES: VisitCategory[] = Object.keys(VISIT_CATEGORY_FR) as VisitCategory[]
export const VISIT_PLACES: VisitPlace[] = Object.keys(VISIT_PLACE_FR) as VisitPlace[]
export const VISIT_COMPONENTS: VisitComponent[] = Object.keys(VISIT_COMPONENT_FR) as VisitComponent[]
