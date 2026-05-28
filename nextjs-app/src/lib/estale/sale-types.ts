// src/lib/estale/sale-types.ts
// Types TypeScript pour les ventes/mutations Estale (module devis-mutation).
// Alignés sur le schéma GraphQL Estale (cf. introspection 2026-05-23,
// note Obsidian : Claude/Références/Estale GraphQL — schéma mutation).

export interface EstaleAddressDetail {
  housenumber?: string | null
  street?: string | null
  addressL2?: string | null
  addressL3?: string | null
  postcode: string
  city: string
  country: string
  isFR: boolean
}

export type EstaleCivility = string // ENUM Civility côté Estale — laissé string pour souplesse

export interface EstaleOwnerSummary {
  id: string
  fullname: string
  civility?: EstaleCivility | null
  firstname?: string | null
  lastname: string
  email?: string | null
  isPro: boolean
  companyName?: string | null
  companySiret?: string | null
}

export interface EstaleOwnerDetail extends EstaleOwnerSummary {
  reference: string
  birthDate?: string | null
  birthPlace?: string | null
  phone?: string | null
  mobile?: string | null
  companyForm?: string | null
  companyCapital?: number | null
  address: EstaleAddressDetail
  nbShares: number
  nbLots: number
}

export interface EstaleLotSummary {
  id: string
  reference: string
  num: string
  type: string
  use: string // ENUM LotCategory : RESIDENTIAL | OFFICE | COMMERCIAL | MIXED | PARKING | OTHER | EXTERNAL | PRIMARY | SECONDARY
  floor?: number | null
  staircase?: string | null
  door?: string | null
  size?: number | null
  rooms?: number | null
}

export interface EstaleSaleBuyer {
  id: string
  fullname: string
  civility?: EstaleCivility | null
  firstname?: string | null
  lastname: string
  company?: string | null
  isPro: boolean
}

export interface EstaleSaleSummary {
  id: string
  reference: string
  scheduledDate: string
  isClosed: boolean
  isPartial: boolean
  nbLot: number
  nbOwner: number
  notaryReference?: string | null
  condoID: string
  condoName: string
  condoReference: string
  owners: EstaleOwnerSummary[]
  lots: EstaleLotSummary[]
}

export interface EstaleSaleSettingFee {
  fees?: number | null
  allowOverride: boolean
}

export interface EstaleCondoSaleSettings {
  ed: EstaleSaleSettingFee
  ped: EstaleSaleSettingFee
}

export interface EstaleSaleDetail extends EstaleSaleSummary {
  isFree: boolean
  closedAt?: string | null
  createdAt: string
  ownersDetail: EstaleOwnerDetail[]
  buyers: EstaleSaleBuyer[]
  notaryOfficeName?: string | null
  condoSettings: EstaleCondoSaleSettings
}

export interface EstaleBusinessCard {
  cardID: string
  isSY: boolean
  isGI: boolean
  isTR: boolean
  issuedBy: string
  issuedAt: string
  validUntil: string
}

export interface EstaleInsurance {
  company: string
  reference: string
  subscription: string
}

export interface EstaleGuaranteeFund {
  company: string
  reference: string
  amount: number
  subscription: string
}

export interface EstaleAgencyLegal {
  id: string
  name: string
  businessCard?: EstaleBusinessCard | null
  insurance?: EstaleInsurance | null
  guaranteeFund?: EstaleGuaranteeFund | null
}

export interface EstaleEstablishmentLegalInfo {
  id: string
  name: string
  form: string
  capital: number
  rcs: string
  siret: string
  vat: string
  phone: string
  email: string
  noReply: string
  address: EstaleAddressDetail
  agency: EstaleAgencyLegal
}
