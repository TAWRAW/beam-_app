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
  // ═══════════════════════════════════════════════════════════════════════════
  // VILLES PRINCIPALES (affichées dans le footer)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: 'vernon', name: 'Vernon', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27200', neighborhoods: ['Vernonnet', 'Les Blanchères', 'Les Boutardes', 'Le Moussel', 'Le Parc', 'Glatigny', 'Fieschi', 'Le Petit Val', 'Ma Campagne', 'Valmeux'] },
  { slug: 'evreux', name: 'Évreux', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27000', neighborhoods: ['Centre-ville', 'La Madeleine', 'Nétreville', 'Saint-Michel', 'Saint-Léger', 'Navarre', 'Clos au Duc', 'La Poterie'] },
  { slug: 'rouen', name: 'Rouen', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76000', neighborhoods: ['Vieux-Marché', 'Saint-Sever', 'Grammont', 'Pasteur', 'Jardin des Plantes', 'Beauvoisine', 'Jouvenet', 'Grand Mare', 'Quartier Sud', 'Quartier Ouest', 'Centre Historique', 'Rive Gauche'] },
  { slug: 'les-andelys', name: 'Les Andelys', displayName: 'Andelys', displayPrep: 'Aux', department: 'Eure (27)', region: 'Normandie', prep: 'aux', postalCode: '27700', neighborhoods: ['Grand Andely', 'Petit Andely', 'Centre historique'] },
  { slug: 'louviers', name: 'Louviers', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27400', neighborhoods: ['Centre-ville', 'Les Oiseaux', 'Maison Rouge'] },
  { slug: 'gaillon', name: 'Gaillon', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27600', neighborhoods: ['Quartier Nord', 'Quartier Sud-Ouest', 'Aubevoye', 'Saint-Aubin-sur-Gaillon'] },
  { slug: 'gasny', name: 'Gasny', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27620' },
  { slug: 'pacy-sur-eure', name: 'Pacy-sur-Eure', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27120' },

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTROPOLE DE ROUEN (7 villes - ~180 copropriétés)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: 'mont-saint-aignan', name: 'Mont-Saint-Aignan', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76130', showInFooter: false },
  { slug: 'darnetal', name: 'Darnétal', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76160', showInFooter: false },
  { slug: 'le-mesnil-esnard', name: 'Le Mesnil-Esnard', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76240', showInFooter: false },
  { slug: 'saint-etienne-du-rouvray', name: 'Saint-Étienne-du-Rouvray', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76800', showInFooter: false },
  { slug: 'notre-dame-de-bondeville', name: 'Notre-Dame-de-Bondeville', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76960', showInFooter: false },
  { slug: 'franqueville-saint-pierre', name: 'Franqueville-Saint-Pierre', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76520', showInFooter: false },
  { slug: 'saint-leger-du-bourg-denis', name: 'Saint-Léger-du-Bourg-Denis', department: 'Seine-Maritime (76)', region: 'Normandie', prep: 'à', postalCode: '76160', showInFooter: false },

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONE VERNON / EURE (villes secondaires)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: 'saint-marcel', name: 'Saint-Marcel', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27950', showInFooter: false },
  { slug: 'la-chapelle-longueville', name: 'La Chapelle-Longueville', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },
  { slug: 'giverny', name: 'Giverny', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27620', showInFooter: false },
  { slug: 'bueil', name: 'Bueil', department: 'Eure (27)', region: 'Normandie', prep: 'à', showInFooter: false },

  // ═══════════════════════════════════════════════════════════════════════════
  // AXE VERNON - ÉVREUX (villes intermédiaires)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: 'val-de-reuil', name: 'Val-de-Reuil', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27100', showInFooter: false },
  { slug: 'le-vaudreuil', name: 'Le Vaudreuil', displayName: 'Vaudreuil', displayPrep: 'Au', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27100', showInFooter: false },
  { slug: 'etrepagny', name: 'Étrépagny', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27150', showInFooter: false },
  { slug: 'ivry-la-bataille', name: 'Ivry-la-Bataille', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27540', showInFooter: false },

  // ═══════════════════════════════════════════════════════════════════════════
  // COURONNE ÉBROÏCIENNE (satellites d'Évreux)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: 'gravigny', name: 'Gravigny', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27930', showInFooter: false },
  { slug: 'saint-sebastien-de-morsent', name: 'Saint-Sébastien-de-Morsent', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27180', showInFooter: false },
  { slug: 'saint-andre-de-l-eure', name: "Saint-André-de-l'Eure", department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27220', showInFooter: false },
  { slug: 'le-vieil-evreux', name: 'Le Vieil-Évreux', displayName: 'Vieil-Évreux', displayPrep: 'Au', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27930', showInFooter: false },
  { slug: 'la-couture-boussey', name: 'La Couture-Boussey', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27750', showInFooter: false },
  { slug: 'angerville-la-campagne', name: 'Angerville-la-Campagne', department: 'Eure (27)', region: 'Normandie', prep: 'à', postalCode: '27930', showInFooter: false },
]

export function getCityBySlug(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug)
}

export function getCitySlugs(): string[] {
  return cities.map((c) => c.slug)
}

// ═══════════════════════════════════════════════════════════════════════════
// CLUSTERS GÉOGRAPHIQUES POUR MAILLAGE INTERNE SEO
// Chaque ville est liée à ses voisines géographiques uniquement
// ═══════════════════════════════════════════════════════════════════════════
export const CITY_CLUSTERS: Record<string, string[]> = {
  // Hub Vernon (villes proches de Vernon)
  'vernon': ['gaillon', 'gasny', 'giverny', 'pacy-sur-eure', 'la-chapelle-longueville', 'saint-marcel', 'les-andelys'],
  'gaillon': ['vernon', 'louviers', 'val-de-reuil', 'le-vaudreuil', 'les-andelys'],
  'gasny': ['vernon', 'giverny', 'la-chapelle-longueville', 'pacy-sur-eure'],
  'giverny': ['vernon', 'gasny', 'la-chapelle-longueville'],
  'pacy-sur-eure': ['vernon', 'gasny', 'la-couture-boussey', 'ivry-la-bataille', 'evreux'],
  'la-chapelle-longueville': ['vernon', 'gasny', 'giverny', 'saint-marcel'],
  'saint-marcel': ['vernon', 'la-chapelle-longueville', 'gaillon'],
  'les-andelys': ['vernon', 'gaillon', 'etrepagny', 'bueil'],
  'bueil': ['les-andelys', 'etrepagny', 'vernon'],
  'etrepagny': ['les-andelys', 'bueil'],

  // Hub Évreux (couronne ébroïcienne)
  'evreux': ['gravigny', 'saint-sebastien-de-morsent', 'saint-andre-de-l-eure', 'le-vieil-evreux', 'angerville-la-campagne', 'pacy-sur-eure', 'louviers'],
  'gravigny': ['evreux', 'saint-sebastien-de-morsent', 'le-vieil-evreux', 'angerville-la-campagne'],
  'saint-sebastien-de-morsent': ['evreux', 'gravigny', 'le-vieil-evreux'],
  'saint-andre-de-l-eure': ['evreux', 'ivry-la-bataille', 'la-couture-boussey'],
  'le-vieil-evreux': ['evreux', 'gravigny', 'saint-sebastien-de-morsent', 'angerville-la-campagne'],
  'angerville-la-campagne': ['evreux', 'gravigny', 'le-vieil-evreux'],
  'la-couture-boussey': ['pacy-sur-eure', 'ivry-la-bataille', 'saint-andre-de-l-eure'],
  'ivry-la-bataille': ['pacy-sur-eure', 'saint-andre-de-l-eure', 'la-couture-boussey', 'evreux'],

  // Axe Vernon-Évreux (vallée de l'Eure)
  'louviers': ['val-de-reuil', 'le-vaudreuil', 'gaillon', 'evreux', 'rouen'],
  'val-de-reuil': ['louviers', 'le-vaudreuil', 'gaillon'],
  'le-vaudreuil': ['louviers', 'val-de-reuil', 'gaillon'],

  // Hub Rouen (métropole rouennaise)
  'rouen': ['mont-saint-aignan', 'darnetal', 'le-mesnil-esnard', 'saint-etienne-du-rouvray', 'notre-dame-de-bondeville', 'franqueville-saint-pierre', 'louviers'],
  'mont-saint-aignan': ['rouen', 'notre-dame-de-bondeville', 'darnetal'],
  'darnetal': ['rouen', 'mont-saint-aignan', 'saint-leger-du-bourg-denis', 'le-mesnil-esnard'],
  'le-mesnil-esnard': ['rouen', 'darnetal', 'franqueville-saint-pierre'],
  'saint-etienne-du-rouvray': ['rouen', 'franqueville-saint-pierre'],
  'notre-dame-de-bondeville': ['rouen', 'mont-saint-aignan'],
  'franqueville-saint-pierre': ['rouen', 'le-mesnil-esnard', 'saint-etienne-du-rouvray'],
  'saint-leger-du-bourg-denis': ['darnetal', 'rouen'],
}

/**
 * Retourne les villes voisines d'une ville donnée (pour le maillage interne)
 * Si la ville n'a pas de cluster défini, retourne les 6 premières villes principales
 */
export function getNearbyCities(currentSlug: string, limit: number = 6): City[] {
  const neighborSlugs = CITY_CLUSTERS[currentSlug]

  if (neighborSlugs && neighborSlugs.length > 0) {
    // Retourne les villes du cluster
    return neighborSlugs
      .map(slug => getCityBySlug(slug))
      .filter((city): city is City => city !== undefined)
      .slice(0, limit)
  }

  // Fallback: retourne les villes principales (hors ville courante)
  return cities
    .filter(c => c.slug !== currentSlug && c.showInFooter !== false)
    .slice(0, limit)
}
