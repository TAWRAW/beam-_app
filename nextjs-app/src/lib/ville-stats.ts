/**
 * SERVICE API - STATS COPROPRIÉTÉS PAR VILLE
 *
 * Intégration avec l'API publique du Comptoir de la Copropriété
 * - Source: Registre national ANAH
 * - Rate limit: 200 req/h
 * - Mise à jour: Trimestrielle
 *
 * ISR Strategy:
 * - Revalidate: 7776000s (90 jours = 3 mois)
 * - Fallback: Données statiques si API down
 */

import type { VilleStatsResponse, VilleStatsFormatted } from '@/types/ville-stats'

const API_BASE_URL = 'https://le-comptoir-de-la-copropriete.fr/api/villes'

/**
 * Récupère les stats d'une ville depuis l'API
 * @param villeSlug - Slug de la ville (ex: "vernon", "gaillon", "evreux")
 * @param postalCode - Code postal optionnel pour désambiguïser (ex: "27200")
 */
export async function getVilleStats(
  villeSlug: string,
  postalCode?: string
): Promise<VilleStatsResponse | null> {
  try {
    // Construction URL avec ou sans code postal
    const identifier = postalCode ? `${villeSlug}-${postalCode}` : villeSlug
    const url = `${API_BASE_URL}/${encodeURIComponent(identifier)}/stats`

    const response = await fetch(url, {
      // ISR: Revalidate tous les 3 mois (90 jours = 7776000 secondes)
      next: { revalidate: 7776000 },
      headers: {
        'Accept': 'application/json',
      },
    })

    // Vérifier rate limit
    const remaining = response.headers.get('X-RateLimit-Remaining')
    if (remaining && parseInt(remaining) < 10) {
      console.warn(`⚠️ Rate limit API proche: ${remaining} requêtes restantes`)
    }

    if (!response.ok) {
      if (response.status === 429) {
        console.error('❌ Rate limit API dépassé (200 req/h)')
        return null
      }
      if (response.status === 404) {
        console.warn(`⚠️ Stats non trouvées pour: ${identifier}`)
        return null
      }
      throw new Error(`API error: ${response.status}`)
    }

    const data: VilleStatsResponse = await response.json()
    return data

  } catch (error) {
    console.error(`❌ Erreur fetch stats pour ${villeSlug}:`, error)
    return null
  }
}

/**
 * Formate les stats brutes pour affichage
 */
export function formatVilleStats(
  data: VilleStatsResponse
): VilleStatsFormatted {
  const totalSyndics = data.repartition_syndics.total
  const pourcentageSyndicPro = totalSyndics > 0
    ? Math.round((data.repartition_syndics.professionnel / totalSyndics) * 100)
    : 0
  const pourcentageSyndicBenevole = totalSyndics > 0
    ? Math.round((data.repartition_syndics.benevole / totalSyndics) * 100)
    : 0

  // Trouver période de construction principale
  const periodePrincipale = data.construction_periods.reduce((max, current) =>
    current.stock_total > max.stock_total ? current : max
  )

  return {
    ville: data.territoire.nom,
    nbCoproprietes: data.stats_principales.nombre_coproprietes,
    tailleMoyenne: data.stats_principales.taille_moyenne_lots,
    nbLotsHabitation: data.stats_principales.nombre_lots_habitation_moyen,
    pourcentageSyndicPro,
    pourcentageSyndicBenevole,
    periodePrincipalConstruction: periodePrincipale.periode,
    departement: data.territoire.departement,
    rangDepartemental: data.metadata.rang_departemental,
    rangNational: data.metadata.rang_national,
  }
}

/**
 * Récupère et formate les stats en une seule fonction (helper)
 */
export async function getFormattedVilleStats(
  villeSlug: string,
  postalCode?: string
): Promise<VilleStatsFormatted | null> {
  const stats = await getVilleStats(villeSlug, postalCode)
  if (!stats) return null
  return formatVilleStats(stats)
}
