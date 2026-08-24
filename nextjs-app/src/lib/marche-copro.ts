/**
 * Analyse de marché de la copropriété, commune par commune.
 *
 * Source : Le Comptoir de la Copropriété, endpoint `/api/beamo/marche/<insee>`,
 * qui lit le Registre national des copropriétés (ANAH) au dernier trimestre publié
 * et le compare au trimestre précédent avec la même méthode — c'est ce qui rend
 * l'évolution publiable.
 *
 * On interroge TOUJOURS par code INSEE : les noms de communes du registre ne sont
 * pas normalisés (« Évreux »/« Evreux », « Mont-Saint-Aignan »/« Mont St Aignan »),
 * et plusieurs communes françaises partagent le même nom (Vernon, Saint-Marcel).
 * Un filtre par nom sous-compte lourdement et attrape des homonymes.
 */

// Surchargeable en développement pour taper un Comptoir lancé en local
// (COMPTOIR_API_URL=http://localhost:3001), sans quoi la production fait foi.
const API = process.env.COMPTOIR_API_URL || 'https://www.le-comptoir-de-la-copropriete.fr'

export type FamilleSyndic = 'professionnel' | 'benevole' | 'non_declare'

export interface TrancheMarche {
  cle: 'micro' | 'petite' | 'moyenne' | 'grande'
  libelle: string
  min: number
  max: number | null
  nb: number
  part: number
  lots: number
  syndic: Record<FamilleSyndic, number>
}

export interface MarcheCommune {
  commune: { insee: string; nom: string | null; code_postal: string | null; departement: string }
  trimestre: { actuel: string; compare: string | null }
  total: {
    coproprietes: number
    lots: number
    lots_habitation: number
    taille_moyenne: number
    taille_mediane: number
  }
  evolution: { coproprietes_avant: number; delta: number; delta_pct: number | null } | null
  tranches: TrancheMarche[]
  syndics: Record<FamilleSyndic, number>
  petites_coproprietes: {
    seuil_lots: number
    nb: number
    part: number
    avec_syndic_professionnel: number
    part_avec_syndic_professionnel: number
  }
  top: Array<{
    nom: string | null
    adresse: string | null
    lots: number
    lots_habitation: number
    syndic_nom: string | null
    syndic_type: FamilleSyndic
  }>
  construction: Array<{ periode: string; nb: number; part: number }>
  source: { registre: string; note: string }
}

/**
 * Le registre est trimestriel : une journée de cache suffit largement et évite de
 * refrapper l'API à chaque visite. `null` si la commune n'a aucune copropriété
 * immatriculée ou si l'API est indisponible — l'appelant décide quoi afficher.
 */
export async function getMarcheCommune(insee: string): Promise<MarcheCommune | null> {
  // Une seule reprise, car l'appelant ne peut pas distinguer « commune sans
  // copropriété » d'« API momentanément indisponible » : les deux donnent null.
  // Un redéploiement du Comptoir pendant la régénération du sitemap avait ainsi
  // silencieusement ramené la liste des communes de 20 à 3 (constaté le 24/08/2026).
  for (let essai = 0; essai < 2; essai++) {
    try {
      const r = await fetch(`${API}/api/beamo/marche/${insee}`, {
        next: { revalidate: 86400 },
      })
      // 404 = commune sans copropriété immatriculée : réponse légitime, pas une panne.
      if (r.status === 404) return null
      if (!r.ok) {
        if (essai === 0) continue
        console.error(`marché ${insee} — API indisponible (${r.status})`)
        return null
      }
      const data = (await r.json()) as MarcheCommune | { error: string }
      if ('error' in data) return null
      return data
    } catch (e) {
      if (essai === 0) continue
      console.error(`marché ${insee} — appel impossible:`, e)
      return null
    }
  }
  return null
}

/**
 * En dessous de ce nombre de copropriétés, une commune n'a pas de page dédiée :
 * les parts n'y veulent plus rien dire (« 50 % » sur deux copropriétés) et la page
 * serait trop maigre pour être utile à qui la lit. Les chiffres restent visibles
 * dans le tableau du sommaire.
 */
export const SEUIL_PAGE_DEDIEE = 10

/**
 * Slugs des communes qui méritent une page dédiée aujourd'hui. Utilisé par le
 * sommaire et par le sitemap, pour qu'ils ne se contredisent jamais.
 */
export async function listerCommunesObservatoire(
  villes: Array<{ slug: string; inseeCode?: string }>,
): Promise<Array<{ slug: string; trimestre: string }>> {
  const releves = await Promise.all(
    villes
      .filter((v) => v.inseeCode)
      .map(async (v) => ({ slug: v.slug, marche: await getMarcheCommune(v.inseeCode!) })),
  )
  return releves
    .filter((r) => r.marche && r.marche.total.coproprietes >= SEUIL_PAGE_DEDIEE)
    .map((r) => ({ slug: r.slug, trimestre: r.marche!.trimestre.actuel }))
}

/**
 * Date de publication d'un trimestre RNC, pour dater honnêtement le sitemap.
 * Annoncer « modifié aujourd'hui » à chaque régénération alors que la donnée
 * n'a pas bougé apprend à Google à ignorer nos dates.
 */
export function dateTrimestre(code: string): Date {
  const m = code.match(/^(\d{4})q(\d)$/i)
  if (!m) return new Date()
  const [, annee, t] = m
  return new Date(Number(annee), (Number(t) - 1) * 3, 1)
}

/** « 2026q3 » → « 3ᵉ trimestre 2026 ». */
export function libelleTrimestre(code: string | null): string {
  if (!code) return ''
  const m = code.match(/^(\d{4})q(\d)$/i)
  if (!m) return code
  const [, annee, t] = m
  return `${t}${t === '1' ? 'ᵉʳ' : 'ᵉ'} trimestre ${annee}`
}

export const LIBELLES_SYNDIC: Record<FamilleSyndic, string> = {
  professionnel: 'Syndic professionnel',
  benevole: 'Syndic bénévole',
  non_declare: 'Syndic non déclaré',
}

export function formatNombre(n: number): string {
  return n.toLocaleString('fr-FR')
}

/**
 * Convertit un relevé d'observatoire au format attendu par `CityStats` sur les
 * pages `/ville/[slug]`.
 *
 * Raison d'être : les deux surfaces annonçaient des nombres différents pour la
 * même commune (237 contre 248 à Vernon), parce que `getFormattedVilleStats()`
 * lit une vue matérialisée restée au 4ᵉ trimestre 2025 et filtrée par nom de
 * commune. Deux chiffres contradictoires sur deux pages qui se lient l'une à
 * l'autre, c'est exactement ce qui ruine la crédibilité d'un observatoire.
 * Le relevé fait donc foi ; on ne conserve de l'ancienne source que les rangs,
 * qu'il ne calcule pas.
 */
export function marcheVersStatsVille(
  m: MarcheCommune,
  nomVille: string,
  rangs?: { rangDepartemental?: number; rangNational?: number; departement?: string },
): {
  ville: string
  nbCoproprietes: number
  tailleMoyenne: number
  nbLotsHabitation: number
  pourcentageSyndicPro: number
  pourcentageSyndicBenevole: number
  periodePrincipalConstruction: string
  departement?: string
  rangDepartemental?: number
  rangNational?: number
} {
  const total = m.total.coproprietes || 1
  const periodes = m.construction.filter((c) => c.periode !== 'Non renseignée')
  const dominante = periodes.length
    ? [...periodes].sort((a, b) => b.nb - a.nb)[0].periode
    : 'Non renseignée'

  return {
    ville: nomVille,
    nbCoproprietes: m.total.coproprietes,
    tailleMoyenne: m.total.taille_moyenne,
    nbLotsHabitation: Math.round(m.total.lots_habitation / total),
    pourcentageSyndicPro: Math.round((m.syndics.professionnel / total) * 100),
    pourcentageSyndicBenevole: Math.round((m.syndics.benevole / total) * 100),
    periodePrincipalConstruction: dominante,
    ...rangs,
  }
}
