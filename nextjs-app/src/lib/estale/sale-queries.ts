// src/lib/estale/sale-queries.ts
// Queries GraphQL Estale pour le module Devis mutation.
// S'appuie sur estaleGraphQL (auth/retry/login géré côté estale-api.ts).

import { estaleGraphQL } from '../estale-api'
import type {
  EstaleSaleSummary,
  EstaleSaleDetail,
  EstaleCondoSaleSettings,
  EstaleEstablishmentLegalInfo,
} from './sale-types'

const ADDRESS_FRAGMENT = `
  housenumber street addressL2 addressL3 postcode city country isFR
`

const OWNER_SUMMARY_FRAGMENT = `
  id fullname civility firstname lastname email isPro companyName companySiret
`

const OWNER_DETAIL_FRAGMENT = `
  ${OWNER_SUMMARY_FRAGMENT}
  reference birthDate birthPlace phone mobile companyForm companyCapital nbShares nbLots
  address { ${ADDRESS_FRAGMENT} }
`

const LOT_SUMMARY_FRAGMENT = `
  id reference num type use floor staircase door size rooms
`

const SALE_SUMMARY_FIELDS = `
  id reference scheduledDate isClosed isPartial nbLot nbOwner notaryReference
  owners { ${OWNER_SUMMARY_FRAGMENT} }
  lots { ${LOT_SUMMARY_FRAGMENT} }
`

type RawSaleSummary = Omit<EstaleSaleSummary, 'condoID' | 'condoName' | 'condoReference'>

/**
 * Liste toutes les ventes non closes (non archivées) des copropriétés
 * gérées par le collaborateur connecté.
 * Le filtre `!isClosed` est appliqué côté client (Estale n'expose pas ce filtre).
 */
export async function getOpenSales(): Promise<EstaleSaleSummary[]> {
  const query = `
    {
      me {
        collaborator {
          condos(archived: false) {
            id
            name
            reference
            sales(archived: false) {
              ${SALE_SUMMARY_FIELDS}
            }
          }
        }
      }
    }
  `

  const data = await estaleGraphQL<{
    me?: {
      collaborator?: {
        condos?: Array<{
          id: string
          name: string
          reference: string
          sales?: RawSaleSummary[]
        }>
      }
    }
  }>(query)

  const condos = data.me?.collaborator?.condos ?? []
  const sales: EstaleSaleSummary[] = []

  for (const condo of condos) {
    for (const sale of condo.sales ?? []) {
      if (sale.isClosed) continue
      sales.push({
        ...sale,
        condoID: condo.id,
        condoName: condo.name,
        condoReference: condo.reference,
      })
    }
  }

  // Tri du plus récemment programmé au plus ancien
  sales.sort((a, b) => (a.scheduledDate < b.scheduledDate ? 1 : -1))

  return sales
}

/**
 * Détail complet d'une vente : owners enrichis, buyers, notaire,
 * + paramètres de frais PED/ED de la copropriété parente.
 */
export async function getSaleDetail(
  condoId: string,
  saleId: string,
): Promise<EstaleSaleDetail | null> {
  const query = `
    query SaleDetail($condoId: ID!, $saleId: ID!) {
      condo(id: $condoId) {
        id
        name
        reference
        settings {
          sale {
            ed { fees allowOverride }
            ped { fees allowOverride }
          }
        }
        sale(id: $saleId) {
          ${SALE_SUMMARY_FIELDS}
          isFree
          closedAt
          createdAt
          ownersDetail: owners { ${OWNER_DETAIL_FRAGMENT} }
          buyers { id fullname civility firstname lastname company isPro }
          notaryOffice { name }
        }
      }
    }
  `

  const data = await estaleGraphQL<{
    condo?: {
      id: string
      name: string
      reference: string
      settings?: { sale?: EstaleCondoSaleSettings }
      sale?: (RawSaleSummary & {
        isFree: boolean
        closedAt?: string | null
        createdAt: string
        ownersDetail: EstaleSaleDetail['ownersDetail']
        buyers: EstaleSaleDetail['buyers']
        notaryOffice?: { name: string } | null
      }) | null
    }
  }>(query, { condoId, saleId })

  const condo = data.condo
  const sale = condo?.sale
  if (!condo || !sale) return null

  const settings = condo.settings?.sale ?? {
    ed: { fees: null, allowOverride: false },
    ped: { fees: null, allowOverride: false },
  }

  return {
    ...sale,
    condoID: condo.id,
    condoName: condo.name,
    condoReference: condo.reference,
    notaryOfficeName: sale.notaryOffice?.name ?? null,
    condoSettings: settings,
  }
}

/**
 * Paramètres frais PED/ED d'une copropriété donnée.
 * `allowOverride` indique si la copro override la valeur cabinet.
 * Si `fees` est null, c'est la valeur par défaut du cabinet qui s'applique
 * (à récupérer via getEstablishmentSaleSettings — non implémenté en V1
 * car les UIs liront directement le `fees` retourné par Estale, qui
 * remonte la cascade override/fallback).
 */
export async function getCondoSaleSettings(
  condoId: string,
): Promise<EstaleCondoSaleSettings | null> {
  const query = `
    query CondoSaleSettings($condoId: ID!) {
      condo(id: $condoId) {
        settings {
          sale {
            ed { fees allowOverride }
            ped { fees allowOverride }
          }
        }
      }
    }
  `

  const data = await estaleGraphQL<{
    condo?: { settings?: { sale?: EstaleCondoSaleSettings } }
  }>(query, { condoId })

  return data.condo?.settings?.sale ?? null
}

/**
 * Informations légales complètes du cabinet pour mentions du devis :
 * - Establishment : siret, rcs, vat, capital, form, adresse
 * - Agency : businessCard (carte G), insurance (RCP), guaranteeFund (garantie financière)
 *
 * Tout ce qui était "hardcoded fallback" dans les templates documents
 * (`src/components/documents/templates/ReglementInterieurTemplate.tsx`)
 * est en réalité disponible ici.
 */
export async function getEstablishmentLegalInfo(): Promise<EstaleEstablishmentLegalInfo | null> {
  const query = `
    {
      me {
        establishment {
          id name form capital rcs siret vat phone email noReply
          address { ${ADDRESS_FRAGMENT} }
          agency {
            id name
            businessCard { cardID isSY isGI isTR issuedBy issuedAt validUntil }
            insurance { company reference subscription }
            guaranteeFund { company reference amount subscription }
          }
        }
      }
    }
  `

  const data = await estaleGraphQL<{
    me?: { establishment?: EstaleEstablishmentLegalInfo | null }
  }>(query)

  return data.me?.establishment ?? null
}
