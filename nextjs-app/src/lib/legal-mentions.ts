// Mentions légales partagées entre les templates de documents (affiche, règlement, contacts).
// Utilise les données Estale (Establishment + Agency) quand disponibles, avec fallback
// hardcoded sur les valeurs Beamô actuelles si Estale ne répond pas.

import type { AgencyInfo } from '@/schemas/document'
import { BEAMO_LEGAL_INFO, generateLegalMentions as generateStaticLegalMentions } from '@/lib/mock-data'

// Fallbacks Beamô — utilisés uniquement si Estale ne fournit pas la donnée.
const FALLBACK = {
  siegeSocial: '8 rue du général Leclerc 27950 Saint-Marcel',
  postalAddress: '2 Place d\'Evreux BP 110 27200 Vernon',
  raisonSociale: 'SASU BEAMO IMMOBILIER',
  capital: '2 500',
  rcs: 'Évreux',
  tvaNumber: 'FR33989101829',
  carteG: 'CPI27012025000000013',
  carteGIssuer: 'CCI PORTE DE NORMANDIE (27)',
  rcp: 'ALLIANZ M. RAYEUR Guillaume 4 rue Carnot 27200 Vernon',
  garantie: 'SO.CA.F sise 26 avenue de Suffren 75015 Paris d\'un montant de 30 000 €',
}

function formatSiren(siret?: string): string {
  if (!siret) return ''
  return siret.substring(0, 9).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
}

function formatAmount(n?: number): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return ''
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)
}

function buildPostalAddress(agency: AgencyInfo): string {
  // Adresse de la boîte aux lettres (cabinet Estale) :
  // rue + compléments (BP, bâtiment) + CP + ville, le tout sur une seule ligne.
  const parts = [
    agency.adresse,
    agency.adresseL2,
    agency.adresseL3,
    [agency.codePostal, agency.ville].filter(Boolean).join(' ') || undefined,
  ].filter(Boolean)
  const joined = parts.join(' ').trim()
  return joined || FALLBACK.postalAddress
}

function buildRcpMention(agency: AgencyInfo): string {
  const ins = agency.insurance
  if (!ins?.company) return FALLBACK.rcp
  const refPart = ins.reference ? ` (police n° ${ins.reference})` : ''
  return `${ins.company}${refPart}`
}

function buildGaranteeMention(agency: AgencyInfo): string {
  const gf = agency.guaranteeFund
  if (!gf?.company) return FALLBACK.garantie
  const amountStr = formatAmount(gf.amount)
  const amountPart = amountStr ? ` d'un montant de ${amountStr} €` : ''
  return `${gf.company}${amountPart}`
}

/**
 * Génère les mentions légales complètes pour les documents Beamô.
 * Privilégie les données Estale ; tombe sur les fallbacks hardcodés si absent.
 */
export function generateLegalMentions(agency?: AgencyInfo): string {
  // Si pas du tout de données (API down + pas de mock), utilise le générateur statique.
  if (!agency?.legal?.siret) {
    return generateStaticLegalMentions(BEAMO_LEGAL_INFO)
  }

  const legal = agency.legal
  const agencyName = agency.nom || 'Beamô'
  const postalAddress = buildPostalAddress(agency)
  const siren = formatSiren(legal.siret)
  const carteG = agency.businessCard?.cardID || FALLBACK.carteG
  const carteGIssuer = agency.businessCard?.issuedBy || FALLBACK.carteGIssuer
  const rcp = buildRcpMention(agency)
  const garantie = buildGaranteeMention(agency)

  return `Enseigne ${agencyName} | ${FALLBACK.raisonSociale} au capital de ${legal.capital || FALLBACK.capital} € dont le siège social est situé au ${FALLBACK.siegeSocial} | Boîte aux lettres : ${postalAddress} | SIREN ${siren} ${legal.rcs || FALLBACK.rcs} | Numéro TVA intracommunautaire ${legal.tvaNumber || FALLBACK.tvaNumber}. Carte professionnelle portant la mention "Syndic de Copropriété" ${carteG}, délivrée par ${carteGIssuer}, conformément à la (Loi n° 70-9 du 02/01/1970). Titulaire d'une assurance en responsabilité civile professionnelle auprès de ${rcp}, et d'une garantie financière auprès de ${garantie}.
Document propriété de la société BEAMO IMMOBILIER, ne pas reproduire.`
}
