/**
 * Service de géocodage utilisant l'API adresse.data.gouv.fr
 * Convertit une adresse textuelle en coordonnées GPS
 */

export interface GeocodingResult {
  lat: number
  lng: number
  label: string
  score: number
  city: string
  postcode: string
}

interface APIAddressFeature {
  geometry: {
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    label: string
    score: number
    city: string
    postcode: string
  }
}

interface APIAddressResponse {
  features: APIAddressFeature[]
}

/**
 * Géocode une adresse française via api-adresse.data.gouv.fr
 * @param address - Adresse à géocoder (ex: "26 rue de la marne évreux")
 * @returns Coordonnées GPS ou null si non trouvé
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address || address.trim().length < 3) {
    return null
  }

  try {
    const url = new URL('https://api-adresse.data.gouv.fr/search/')
    url.searchParams.append('q', address.trim())
    url.searchParams.append('limit', '1')

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('Erreur géocodage:', response.status)
      return null
    }

    const data: APIAddressResponse = await response.json()

    if (!data.features || data.features.length === 0) {
      return null
    }

    const feature = data.features[0]
    const [lng, lat] = feature.geometry.coordinates

    return {
      lat,
      lng,
      label: feature.properties.label,
      score: feature.properties.score,
      city: feature.properties.city,
      postcode: feature.properties.postcode,
    }
  } catch (error) {
    console.error('Erreur géocodage:', error)
    return null
  }
}
