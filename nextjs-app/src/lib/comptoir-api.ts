/**
 * Client API pour Le Comptoir de la Copropriété
 * Permet de rechercher des copropriétés pour pré-remplir les formulaires
 */

const COMPTOIR_BASE_URL = 'https://www.le-comptoir-de-la-copropriete.fr'

// Types pour l'API Beamô (filtres géographiques)
export interface BeamoSearchParams {
  ville?: string
  departement?: string
  region?: string
  code_postal?: string
  page?: number
  limit?: number
}

export interface BeamoCopropriete {
  id: string
  nom: string
  adresse: string
  code_postal: string
  ville: string
  numero_immatriculation: string
  nb_lots?: number
}

export interface BeamoSearchResponse {
  coproprietes: BeamoCopropriete[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Types pour l'API Search (recherche textuelle avancée)
export interface SearchParams {
  q?: string
  commune?: string
  code_postal?: string
  departement?: string
  region?: string
  min_lots?: number
  max_lots?: number
  page?: number
  limit?: number
  exact?: boolean
}

export interface SearchCopropriete {
  id: string
  nom: string
  adresse: {
    numero?: string
    voie?: string
    code_postal: string
    commune: string
    complete: string
  }
  lots: {
    total: number
    habitation: number
    commerce?: number
    parking?: number
  }
  numero_immatriculation?: string
  score?: number
}

export interface SearchResponse {
  data: SearchCopropriete[]
  meta: {
    total: number
    page: number
    limit: number
    execution_time_ms: number
    cache_hit: boolean
  }
}

// Réponse de l'API copropriete/{id} (détails complets)
export interface CoproprieteDetail {
  id: string
  numero_immatriculation: string
  titre: string
  nom_usage: string
  adresse_1: string
  code_postal: string
  commune: string
  departement: string
  region: string
  nombre_total_lots: number
  lots_detail: {
    nombre_lots_habitation: number
    nombre_lots_commerces: number
    nombre_lots_stationnement: number
    total_calcule: number
  }
}

// Données normalisées pour le formulaire de mandat
export interface CoproprietePourMandat {
  nom: string
  adresse: string
  codePostal: string
  ville: string
  numeroRNC: string
  nbLots: number
  nbLogementsBureaux: number
}

// Regex pour détecter un numéro d'immatriculation (ex: AD1473222)
const IMMATRICULATION_REGEX = /^[A-Z]{2}\d{5,}$/i

/**
 * Nettoie le code postal (retire le .0 si présent, ex: "75116.0" → "75116")
 */
export function cleanCodePostal(cp: string | null | undefined): string {
  if (!cp) return ''
  return cp.replace(/\.0$/, '')
}

/**
 * Client API pour Le Comptoir de la Copropriété
 */
export class ComptoirCoproAPI {
  private baseUrl: string

  constructor(baseUrl = COMPTOIR_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * API Beamô - Recherche par filtres géographiques (simple et rapide)
   */
  async searchBeamo(params: BeamoSearchParams): Promise<BeamoSearchResponse> {
    const url = new URL(`${this.baseUrl}/api/beamo/coproprietes`)

    if (params.ville) url.searchParams.append('ville', params.ville)
    if (params.departement) url.searchParams.append('departement', params.departement)
    if (params.region) url.searchParams.append('region', params.region)
    if (params.code_postal) url.searchParams.append('code_postal', params.code_postal)
    url.searchParams.append('page', String(params.page ?? 1))
    url.searchParams.append('limit', String(params.limit ?? 20))

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Erreur API Beamô: ${response.status}`)
    }
    return response.json()
  }

  /**
   * Récupère une copropriété par son ID/numéro d'immatriculation
   */
  async getById(id: string): Promise<CoproprieteDetail | null> {
    const url = new URL(`/api/coproprietes/${id}`, window.location.origin)
    const response = await fetch(url.toString())
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Erreur API: ${response.status}`)
    }
    return response.json()
  }

  /**
   * Convertit les détails d'une copropriété en format SearchCopropriete
   */
  private detailToSearchFormat(detail: CoproprieteDetail): SearchCopropriete {
    return {
      id: detail.id,
      nom: detail.nom_usage || detail.titre,
      adresse: {
        complete: detail.adresse_1,
        code_postal: cleanCodePostal(detail.code_postal),
        commune: detail.commune,
      },
      lots: {
        total: detail.nombre_total_lots,
        habitation: detail.lots_detail?.nombre_lots_habitation || 0,
        commerce: detail.lots_detail?.nombre_lots_commerces || 0,
        parking: detail.lots_detail?.nombre_lots_stationnement || 0,
      },
      numero_immatriculation: detail.numero_immatriculation,
    }
  }

  /**
   * API Search - Recherche textuelle avancée (nom, adresse, immatriculation)
   * Utilise notre API proxy pour éviter les problèmes CORS
   * Détecte automatiquement les numéros d'immatriculation pour une recherche directe
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const query = params.q?.trim() || ''

    // Si le terme ressemble à un numéro d'immatriculation, recherche directe
    if (query && IMMATRICULATION_REGEX.test(query)) {
      try {
        const detail = await this.getById(query.toUpperCase())
        if (detail) {
          return {
            data: [this.detailToSearchFormat(detail)],
            meta: {
              total: 1,
              page: 1,
              limit: 1,
              execution_time_ms: 0,
              cache_hit: false,
            },
          }
        }
      } catch {
        // Si la recherche directe échoue, on continue avec la recherche textuelle
      }
    }

    // Recherche textuelle classique via l'API proxy
    const url = new URL('/api/coproprietes/search', window.location.origin)

    if (params.q) url.searchParams.append('q', params.q)
    if (params.commune) url.searchParams.append('commune', params.commune)
    if (params.code_postal) url.searchParams.append('code_postal', params.code_postal)
    if (params.departement) url.searchParams.append('departement', params.departement)
    if (params.region) url.searchParams.append('region', params.region)
    if (params.min_lots) url.searchParams.append('min_lots', String(params.min_lots))
    if (params.max_lots) url.searchParams.append('max_lots', String(params.max_lots))
    if (params.exact) url.searchParams.append('exact', 'true')
    url.searchParams.append('page', String(params.page ?? 1))
    url.searchParams.append('limit', String(params.limit ?? 10))

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Erreur API Search: ${response.status}`)
    }
    return response.json()
  }

  /**
   * Recherche par numéro d'immatriculation
   */
  async getByImmatriculation(immat: string): Promise<SearchCopropriete | null> {
    const result = await this.search({ q: immat, limit: 1 })
    return result.data[0] ?? null
  }

  /**
   * Recherche par adresse
   */
  async searchByAddress(address: string): Promise<SearchResponse> {
    return this.search({ q: address, limit: 10 })
  }

  /**
   * Convertit une copropriété de l'API Search en format pour formulaire mandat
   */
  static toMandatFormat(copro: SearchCopropriete): CoproprietePourMandat {
    return {
      nom: copro.nom,
      adresse: copro.adresse.numero && copro.adresse.voie
        ? `${copro.adresse.numero} ${copro.adresse.voie}`
        : copro.adresse.complete.split(',')[0] || '',
      codePostal: cleanCodePostal(copro.adresse.code_postal),
      ville: copro.adresse.commune,
      numeroRNC: copro.numero_immatriculation || '',
      nbLots: copro.lots.total,
      nbLogementsBureaux: copro.lots.habitation,
    }
  }

  /**
   * Convertit une copropriété de l'API Beamô en format pour formulaire mandat
   */
  static beamoToMandatFormat(copro: BeamoCopropriete): CoproprietePourMandat {
    // Parser l'adresse si elle contient le numéro et la voie
    const adresseParts = copro.adresse.split(',')
    const adresseVoie = adresseParts[0]?.trim() || copro.adresse

    return {
      nom: copro.nom,
      adresse: adresseVoie,
      codePostal: cleanCodePostal(copro.code_postal),
      ville: copro.ville,
      numeroRNC: copro.numero_immatriculation,
      nbLots: copro.nb_lots || 0,
      nbLogementsBureaux: 0, // Non disponible dans l'API Beamô
    }
  }
}

// Instance singleton pour utilisation facile
export const comptoirAPI = new ComptoirCoproAPI()
