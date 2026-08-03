// Query GraphQL Estale pour le pré-remplissage du Constat amiable DDE.
// Une seule requête agrégée : copro + adresse + contrats (assurance) + gestionnaire + copropriétaires.
// S'appuie sur estaleGraphQL (auth/retry/login géré côté estale-api.ts).

import { estaleGraphQL } from '../estale-api'

const ADDRESS_FIELDS = 'housenumber street addressL2 addressL3 postcode city'

export interface ConstatAddress {
  housenumber?: string | null
  street?: string | null
  addressL2?: string | null
  addressL3?: string | null
  postcode?: string | null
  city?: string | null
}

export interface ConstatContract {
  id: string
  label?: string | null
  category?: string | null
  reference?: string | null
  supplier?: {
    name?: string | null
    // NB : `supplier.contact` (singulier) renvoie 422 dans ce contexte — utiliser la liste
    contacts?: { phone?: string | null }[] | null
  } | null
}

export interface ConstatOwner {
  id: string
  fullname?: string | null
  isPro?: boolean | null
  companyName?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  address?: ConstatAddress | null
}

export interface ConstatCondoData {
  id: string
  name: string
  reference?: string | null
  constructionDate?: number | null
  address?: ConstatAddress | null
  contracts: ConstatContract[]
  gestionnaire?: { name?: string; phone?: string; email?: string } | null
  owners: ConstatOwner[]
}

export async function getCondoConstatData(condoId: string): Promise<ConstatCondoData | null> {
  const query = `
    {
      me {
        collaborator {
          condo(id: "${condoId}") {
            id
            name
            reference
            constructionDate
            address { ${ADDRESS_FIELDS} }
            contracts {
              id
              label
              category
              reference
              supplier {
                name
                contacts { phone }
              }
            }
            serviceBook {
              mandate {
                manager {
                  fullname
                  email
                  user { phone }
                }
              }
            }
            owners {
              id
              fullname
              isPro
              companyName
              email
              phone
              mobile
              address { ${ADDRESS_FIELDS} }
            }
          }
        }
      }
    }
  `

  const data = await estaleGraphQL<{
    me?: {
      collaborator?: {
        condo?: {
          id: string
          name: string
          reference?: string | null
          constructionDate?: number | null
          address?: ConstatAddress | null
          contracts?: ConstatContract[] | null
          serviceBook?: {
            mandate?: {
              manager?: {
                fullname?: string | null
                email?: string | null
                user?: { phone?: string | null } | null
              } | null
            } | null
          } | null
          owners?: ConstatOwner[] | null
        } | null
      }
    }
  }>(query)

  const condo = data.me?.collaborator?.condo
  if (!condo) return null

  const manager = condo.serviceBook?.mandate?.manager

  return {
    id: condo.id,
    name: condo.name,
    reference: condo.reference,
    constructionDate: condo.constructionDate,
    address: condo.address,
    contracts: condo.contracts ?? [],
    gestionnaire: manager
      ? {
          name: manager.fullname || undefined,
          email: manager.email || undefined,
          phone: manager.user?.phone || undefined,
        }
      : null,
    owners: condo.owners ?? [],
  }
}
