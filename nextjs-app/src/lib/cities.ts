export type City = {
  slug: string
  name: string
  department?: string
  region?: string
  prep?: 'à' | 'aux' | "à la" | "à l'"
  // Optional display overrides for UI copy
  displayName?: string
  displayPrep?: string
  // Control presence in footer listing (default: true)
  showInFooter?: boolean
  // Code postal pour API stats copropriétés
  postalCode?: string
  // Quartiers couverts pour SEO local
  neighborhoods?: string[]
}

export const cities: City[] = [
  { slug: 'vernon', name: 'Vernon', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27200', neighborhoods: ['Vernonnet', 'Les Blanchères', 'Les Boutardes', 'Le Moussel', 'Le Parc', 'Glatigny', 'Fieschi', 'Le Petit Val', 'Ma Campagne', 'Valmeux'] },
  { slug: 'evreux', name: 'Évreux', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27000', neighborhoods: ['Centre-ville', 'La Madeleine', 'Nétreville', 'Saint-Michel', 'Saint-Léger', 'Navarre', 'Clos au Duc', 'La Poterie'] },
  { slug: 'rouen', name: 'Rouen', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76000', neighborhoods: ['Vieux-Marché', 'Saint-Sever', 'Grammont', 'Pasteur', 'Jardin des Plantes', 'Beauvoisine', 'Jouvenet', 'Grand Mare', 'Quartier Sud', 'Quartier Ouest', 'Centre Historique', 'Rive Gauche'] },
  { slug: 'les-andelys', name: 'Les Andelys', displayName: 'Andelys', displayPrep: 'Aux', department: 'Eure (27)', region: 'Normandie', prep: 'aux', postalCode: '27700', neighborhoods: ['Grand Andely', 'Petit Andely', 'Centre historique'] },
  { slug: 'louviers', name: 'Louviers', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27400', neighborhoods: ['Centre-ville', 'Les Oiseaux', 'Maison Rouge'] },
  { slug: 'gaillon', name: 'Gaillon', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27600', neighborhoods: ['Quartier Nord', 'Quartier Sud-Ouest', 'Aubevoye', 'Saint-Aubin-sur-Gaillon'] },
  { slug: 'gasny', name: 'Gasny', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27620' },
  { slug: 'pacy-sur-eure', name: 'Pacy-sur-Eure', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27120' },
  { slug: 'val-de-reuil', name: 'Val-de-Reuil', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'gisors', name: 'Gisors', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'bueil', name: 'Bueil', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'mantes-la-jolie', name: 'Mantes-la-Jolie', department: 'Yvelines (78)', region: 'Île-de-France', prep: 'à', showInFooter: false },

  // Nouveaux ajouts (ne pas afficher dans le footer)
  { slug: 'saint-marcel', name: 'Saint-Marcel', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'la-chapelle-longueville', name: 'La Chapelle-Longueville', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'giverny', name: 'Giverny', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'etrepagny', name: 'Étrépagny', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'le-vaudreuil', name: 'Le Vaudreuil', displayName: 'Vaudreuil', displayPrep: 'Au', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'saint-andre-de-l-eure', name: "Saint-André-de-l’Eure", department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'ivry-la-bataille', name: 'Ivry-la-Bataille', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'la-couture-boussey', name: 'La Couture-Boussey', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'gauville-la-campagne', name: 'Gauville-la-Campagne', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'parville', name: 'Parville', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'aviron', name: 'Aviron', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'gravigny', name: 'Gravigny', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'huest', name: 'Huest', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'saint-sebastien-de-morsent', name: 'Saint-Sébastien-de-Morsent', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'fauville', name: 'Fauville', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'le-vieil-evreux', name: 'Le Vieil-Évreux', displayName: 'Vieil-Évreux', displayPrep: 'Au', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'arnieres-sur-iton', name: 'Arnières-sur-Iton', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'guichainville', name: 'Guichainville', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'angerville-la-campagne', name: 'Angerville-la-Campagne', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
]

export function getCityBySlug(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug)
}

export function getCitySlugs(): string[] {
  return cities.map((c) => c.slug)
}
