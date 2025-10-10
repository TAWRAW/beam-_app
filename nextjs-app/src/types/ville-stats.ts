/**
 * TYPES POUR L'API STATS COPROPRIÉTÉS
 *
 * Source: https://le-comptoir-de-la-copropriete.fr/api/villes/{ville}/stats
 * Données: Registre national des copropriétés (ANAH)
 * Mise à jour: Trimestrielle
 */

export interface VilleStatsResponse {
  territoire: {
    code: string
    nom: string
    type: 'ville'
    departement?: string
    region?: string
  }
  stats_principales: {
    nombre_coproprietes: number
    taille_moyenne_lots: number
    nombre_lots_habitation_moyen: number
    nombre_median_coproprietes: number
    nombre_lots_median: number
    nombre_lots_habitation_median: number
  }
  repartition_syndics: {
    professionnel: number
    benevole: number
    autre: number
    total: number
  }
  syndics: Array<{
    type: 'professionnel' | 'benevole' | 'non_connu'
    nb_coproprietes: number
    fill: string
  }>
  evolution: Array<{
    date: string // Format ISO: "2024-01-01"
    nouvelles: number
    total: number
  }>
  construction_periods: Array<{
    periode: string
    periode_code: string
    stock_total: number
    delta_recent: number
    fill_stock: string
    fill_delta: string
  }>
  navigation: unknown[]
  metadata: {
    source: string
    rang_national?: number
    rang_departemental?: number
    nb_periodes_evolution: number
    nb_periodes_construction: number
    execution_time_ms: number
  }
}

/**
 * Type pour les stats formatées (utilisé dans les composants)
 */
export interface VilleStatsFormatted {
  ville: string
  nbCoproprietes: number
  tailleMoyenne: number
  nbLotsHabitation: number
  pourcentageSyndicPro: number
  pourcentageSyndicBenevole: number
  periodePrincipalConstruction: string
  rangDepartemental?: number
  rangNational?: number
}
