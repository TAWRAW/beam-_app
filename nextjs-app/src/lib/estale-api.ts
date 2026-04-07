/**
 * Client GraphQL pour l'API Estale (logiciel de gestion syndic)
 *
 * Configuration requise dans .env.local :
 * - ESTALE_API_BASE_URL : URL de base de l'API (https://api.estale.app)
 * - ESTALE_EMAIL : Email de connexion
 * - ESTALE_PASSWORD : Mot de passe
 *
 * L'authentification se fait via cookies de session.
 */

const ESTALE_API_BASE_URL = process.env.ESTALE_API_BASE_URL || 'https://api.estale.app'
const ESTALE_EMAIL = process.env.ESTALE_EMAIL
const ESTALE_PASSWORD = process.env.ESTALE_PASSWORD

// Store session cookie in memory (server-side only)
let sessionCookie: string | null = null
let lastLoginAttempt = 0
const LOGIN_COOLDOWN = 5000 // 5 seconds between login attempts

export interface EstaleSupplier {
  id: string
  name: string
  phone?: string
  email?: string
  specialty?: string
  tags?: string[]
  address?: string  // "N° rue, CP ville"
}

export interface EstaleAgency {
  id: string
  name: string
  address?: string
  zipCode?: string
  city?: string
  phone?: string
  email?: string
}

export interface EstaleCondo {
  id: string
  name: string
  address?: string
  zipCode?: string
  city?: string
}

export interface EstaleContract {
  id: string
  label: string
  category: string
  supplierName: string
  supplierPhone?: string
}

/**
 * Authentification via l'API REST Estale
 * Retourne le cookie de session si succès
 */
async function login(): Promise<string | null> {
  if (!ESTALE_EMAIL || !ESTALE_PASSWORD) {
    console.log('Estale credentials not configured')
    return null
  }

  // Cooldown to avoid hammering the API
  const now = Date.now()
  if (now - lastLoginAttempt < LOGIN_COOLDOWN) {
    return sessionCookie
  }
  lastLoginAttempt = now

  try {
    const response = await fetch(`${ESTALE_API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ESTALE_EMAIL,
        password: ESTALE_PASSWORD,
      }),
    })

    if (!response.ok) {
      console.error('Estale login failed:', response.status)
      return null
    }

    // Extract Set-Cookie header
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      // Store the full cookie string for subsequent requests
      sessionCookie = setCookie.split(';')[0] // Get just the cookie value
      console.log('Estale login successful')
      return sessionCookie
    }

    // Some implementations might not need cookies if using same origin
    const data = await response.json()
    if (data.id) {
      console.log('Estale login successful (no cookie needed)')
      sessionCookie = 'authenticated'
      return sessionCookie
    }

    return null
  } catch (error) {
    console.error('Estale login error:', error)
    return null
  }
}

/**
 * Vérifie si connecté, sinon tente une connexion
 */
async function ensureAuthenticated(): Promise<boolean> {
  if (sessionCookie) {
    return true
  }
  const cookie = await login()
  return cookie !== null
}

/**
 * Exécute une requête GraphQL vers l'API Estale
 */
async function executeQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const isAuth = await ensureAuthenticated()
  if (!isAuth) {
    throw new Error('Impossible de se connecter à Estale')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add cookie if we have one
  if (sessionCookie && sessionCookie !== 'authenticated') {
    headers['Cookie'] = sessionCookie
  }

  const response = await fetch(`${ESTALE_API_BASE_URL}/graphql/intranet`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    credentials: 'include',
  })

  if (!response.ok) {
    // Session might have expired, clear and retry once
    if (response.status === 401 || response.status === 403) {
      sessionCookie = null
      const retryAuth = await ensureAuthenticated()
      if (retryAuth) {
        return executeQuery(query, variables)
      }
    }
    throw new Error(`Erreur API Estale: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()

  if (json.errors && json.errors.length > 0) {
    console.warn('GraphQL erreurs partielles:', json.errors.map((e: any) => e.message))
    if (!json.data) {
      throw new Error(`Erreur GraphQL: ${json.errors[0].message}`)
    }
  }

  return json.data
}

export interface EstaleCollaborator {
  name?: string
  phone?: string
  email?: string
}

/**
 * Récupère les infos personnelles du collaborateur connecté (non-bloquant)
 */
async function getCollaboratorInfo(): Promise<EstaleCollaborator | undefined> {
  const query = `
    {
      me {
        collaborator {
          id
          fullname
          email
          user {
            phone
          }
        }
      }
    }
  `

  try {
    const data = await executeQuery<{
      me?: {
        collaborator?: {
          fullname?: string
          email?: string
          user?: { phone?: string }
        }
      }
    }>(query)

    const collab = data.me?.collaborator
    if (!collab) return undefined

    return {
      name: collab.fullname || undefined,
      phone: collab.user?.phone || undefined,
      email: collab.email || undefined,
    }
  } catch (error) {
    console.warn('Impossible de récupérer les infos collaborateur:', error)
    return undefined
  }
}

/**
 * Récupère les copropriétés de l'utilisateur connecté + infos collaborateur (gestionnaire)
 */
export async function getCondos(): Promise<{ condos: EstaleCondo[]; collaborator?: EstaleCollaborator }> {
  // Requête 1 (DOIT réussir) : condos uniquement
  const condosQuery = `
    {
      me {
        id
        collaborator {
          id
          condos(archived: false) {
            id
            name
            address {
              housenumber
              street
              postcode
              city
            }
          }
        }
      }
    }
  `

  const data = await executeQuery<{
    me: {
      id?: string
      collaborator?: {
        id?: string
        condos: any[]
      }
    }
  }>(condosQuery)

  const collab = data.me?.collaborator
  const condos: EstaleCondo[] = (collab?.condos || []).map((condo: any) => {
    const addr = condo.address
    const streetFull = addr
      ? [addr.housenumber, addr.street].filter(Boolean).join(' ')
      : ''

    return {
      id: condo.id,
      name: condo.name,
      address: streetFull,
      zipCode: addr?.postcode || '',
      city: addr?.city || '',
    }
  })

  // Requête 2 (non-bloquante) : infos personnelles collaborateur
  const collaborator = await getCollaboratorInfo()

  return { condos, collaborator }
}

/**
 * Récupère les prestataires d'une copropriété (pour l'instant tous les prestataires de l'établissement)
 */
export async function getSuppliersByCondo(_condoId: string): Promise<EstaleSupplier[]> {
  // Les prestataires sont au niveau de l'établissement, pas de la copropriété
  return await getSuppliersByEstablishment()
}

/**
 * Récupère tous les prestataires de l'établissement
 */
export async function getSuppliersByCabinet(): Promise<EstaleSupplier[]> {
  return await getSuppliersByEstablishment()
}

/**
 * Récupère tous les prestataires de l'établissement via l'API Estale
 */
export async function getSuppliersByEstablishment(): Promise<EstaleSupplier[]> {
  const query = `
    {
      me {
        establishment {
          suppliers {
            id
            name
            keywords
            contacts {
              name
              phone
              email
            }
            address {
              housenumber
              street
              postcode
              city
            }
          }
        }
      }
    }
  `

  try {
    const data = await executeQuery<{
      me?: {
        establishment?: {
          suppliers?: Array<{
            id: string
            name: string
            keywords?: string[]
            contacts?: Array<{
              name?: string
              phone?: string
              email?: string
            }>
            address?: {
              housenumber?: string
              street?: string
              postcode?: string
              city?: string
            }
          }>
        }
      }
    }>(query)

    console.log('Estale suppliers response:', JSON.stringify(data, null, 2))

    const suppliers = data.me?.establishment?.suppliers
    if (!suppliers || suppliers.length === 0) {
      return []
    }

    return suppliers.map((s) => {
      const firstContact = s.contacts?.[0]
      const addr = s.address
      const addressParts = addr
        ? [addr.housenumber, addr.street, addr.postcode, addr.city].filter(Boolean).join(' ')
        : ''

      return {
        id: s.id,
        name: s.name,
        phone: firstContact?.phone || '',
        email: firstContact?.email || '',
        specialty: s.keywords?.join(', ') || '',
        tags: s.keywords || [],
        address: addressParts || undefined,
      }
    })
  } catch (error) {
    console.error('Erreur récupération prestataires:', error)
    return []
  }
}

export interface EstateLegalInfo {
  siren?: string
  siret?: string
  tvaNumber?: string
  capital?: string
  rcs?: string
  carteProNumber?: string
  carteProDeliveredBy?: string
  insuranceCompany?: string
  insuranceBroker?: string
  insuranceAddress?: string
  garantieFinanciereOrganisme?: string
  garantieFinanciereAddress?: string
  garantieFinanciereMontant?: string
}

/**
 * Récupère les informations de l'agence/établissement avec données légales
 */
export async function getAgencyInfo(): Promise<(EstaleAgency & { legal?: EstateLegalInfo }) | null> {
  // Requête pour récupérer les infos de l'établissement
  const query = `
    {
      me {
        establishment {
          id
          name
          phone
          email
          siret
          vat
          capital
          rcs
          form
          address {
            housenumber
            street
            postcode
            city
          }
        }
      }
    }
  `

  try {
    const data = await executeQuery<{
      me?: {
        establishment?: {
          id: string
          name: string
          phone?: string
          email?: string
          siret?: string
          vat?: string
          capital?: number
          rcs?: string
          form?: string
          address?: {
            housenumber?: string
            street?: string
            postcode?: string
            city?: string
          }
        }
      }
    }>(query)

    console.log('Estale API response:', JSON.stringify(data, null, 2))

    if (!data.me?.establishment) {
      return null
    }

    const establishment = data.me.establishment
    const addr = establishment.address

    return {
      id: establishment.id,
      name: establishment.name || 'Beamô',
      address: addr ? [addr.housenumber, addr.street].filter(Boolean).join(' ') : '',
      zipCode: addr?.postcode || '',
      city: addr?.city || '',
      phone: establishment.phone || '',
      email: establishment.email || '',
      legal: {
        siret: establishment.siret,
        tvaNumber: establishment.vat,
        capital: establishment.capital?.toString(),
        rcs: establishment.rcs,
      }
    }
  } catch (error) {
    console.error('Erreur récupération infos agence:', error)
    return null
  }
}

/**
 * Vérifie si l'API Estale est configurée
 */
export function isEstaleConfigured(): boolean {
  return Boolean(ESTALE_EMAIL && ESTALE_PASSWORD)
}

/**
 * Introspection d'un type GraphQL — retourne les champs avec leur type
 */
export async function introspectType(typeName: string): Promise<{ name: string; type: string; kind: string }[]> {
  const query = `
    {
      __type(name: "${typeName}") {
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `

  try {
    const data = await executeQuery<{
      __type?: {
        fields?: {
          name: string
          type: { name: string | null; kind: string; ofType?: { name: string | null; kind: string } }
        }[]
      }
    }>(query)
    return (data.__type?.fields || []).map(f => ({
      name: f.name,
      type: f.type.name || f.type.ofType?.name || 'unknown',
      kind: f.type.kind,
    }))
  } catch (error) {
    console.error(`Introspection ${typeName} failed:`, error)
    return []
  }
}

/**
 * Introspection : récupère tous les noms de types OBJECT du schema GraphQL
 */
export async function introspectAllTypeNames(): Promise<{ name: string; kind: string }[]> {
  const query = `
    {
      __schema {
        types {
          name
          kind
        }
      }
    }
  `

  try {
    const data = await executeQuery<{
      __schema?: {
        types?: { name: string; kind: string }[]
      }
    }>(query)

    return (data.__schema?.types || [])
      .filter(t => !t.name.startsWith('__') && t.kind === 'OBJECT')
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Introspection schema failed:', error)
    return []
  }
}

/**
 * Récupère les détails d'une copropriété avec le gestionnaire via serviceBook.mandate.manager
 */
export async function getCondoDetails(condoId: string): Promise<{
  gestionnaire?: { name?: string; phone?: string; email?: string }
} | null> {
  try {
    // Approche directe : serviceBook.mandate.manager donne le gestionnaire du condo
    const query = `
      {
        me {
          collaborator {
            condo(id: "${condoId}") {
              serviceBook {
                mandate {
                  manager {
                    fullname
                    email
                    user {
                      phone
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const data = await executeQuery<{
      me?: {
        collaborator?: {
          condo?: {
            serviceBook?: {
              mandate?: {
                manager?: {
                  fullname?: string
                  email?: string
                  user?: { phone?: string }
                }
              }
            }
          }
        }
      }
    }>(query)

    const manager = data.me?.collaborator?.condo?.serviceBook?.mandate?.manager
    if (manager) {
      return {
        gestionnaire: {
          name: manager.fullname || undefined,
          phone: manager.user?.phone || undefined,
          email: manager.email || undefined,
        },
      }
    }

    // Fallback : utiliser le collaborateur connecté
    const fallback = await getCollaboratorInfo()
    if (fallback) {
      return { gestionnaire: fallback }
    }

    return null
  } catch (error) {
    console.error('Erreur récupération détails copropriété:', error)
    return null
  }
}

/**
 * Récupère les contrats d'une copropriété avec le prestataire associé
 */
export async function getCondoContracts(condoId: string): Promise<EstaleContract[]> {
  const query = `
    {
      me {
        collaborator {
          condo(id: "${condoId}") {
            contracts {
              id
              label
              category
              supplier {
                name
                contact {
                  phone
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const data = await executeQuery<{
      me?: {
        collaborator?: {
          condo?: {
            contracts?: {
              id: string
              label: string
              category: string
              supplier?: {
                name: string
                contact?: { phone?: string }
              }
            }[]
          }
        }
      }
    }>(query)

    const contracts = data.me?.collaborator?.condo?.contracts
    if (!contracts || contracts.length === 0) return []

    return contracts.map(c => ({
      id: c.id,
      label: c.label,
      category: c.category || '',
      supplierName: c.supplier?.name || '',
      supplierPhone: c.supplier?.contact?.phone || undefined,
    }))
  } catch (error) {
    console.error('Erreur récupération contrats:', error)
    return []
  }
}
