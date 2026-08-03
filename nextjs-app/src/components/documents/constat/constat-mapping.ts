// Mapping des données Estale → champs du formulaire Constat DDE.
// La copro/Beamô prend TOUJOURS la colonne B (règle métier Beamô).
import type { ConstatAddress, ConstatCondoData, ConstatContract, ConstatOwner } from '@/lib/estale/constat-queries'

export interface ConstatAgencyInfo {
  name?: string
  address?: string
  addressL2?: string
  zipCode?: string
  city?: string
  phone?: string
}

export function formatAddress(addr?: ConstatAddress | null): string {
  if (!addr) return ''
  const line1 = [addr.housenumber, addr.street].filter(Boolean).join(' ')
  return [line1, addr.addressL2, addr.addressL3, [addr.postcode, addr.city].filter(Boolean).join(' ')]
    .filter((s) => s && String(s).trim() !== '')
    .join(', ')
}

export function todayFR(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

// Contrats d'assurance de la copro (catégories Estale INSURANCE, INSURANCE_MULTI_RISK, …)
export function insuranceCandidates(contracts: ConstatContract[]): ConstatContract[] {
  return contracts.filter((c) => (c.category || '').toUpperCase().startsWith('INSURANCE'))
}

// Préférence : multirisque immeuble (MRI), sinon premier contrat assurance trouvé.
export function pickDefaultInsurance(candidates: ConstatContract[]): ConstatContract | null {
  if (candidates.length === 0) return null
  const mri = candidates.find((c) => {
    const cat = (c.category || '').toUpperCase()
    const label = (c.label || '').toUpperCase()
    return cat.includes('MULTI_RISK') || label.includes('MRI') || label.includes('IMMEUBLE') || label.includes('MULTIRISQUE')
  })
  return mri || candidates[0]
}

export function ownerLabel(o: ConstatOwner): string {
  return (o.isPro && o.companyName ? o.companyName : o.fullname) || 'Sans nom'
}

// Paires [chemin RHF relatif à `constat.`, valeur] à appliquer via form.setValue.
export type ConstatFieldEntries = Array<[string, string]>

export function mapConstatFromEstale(
  condo: ConstatCondoData,
  agency: ConstatAgencyInfo | null,
  insurance: ConstatContract | null
): ConstatFieldEntries {
  const entries: ConstatFieldEntries = []
  const condoAddress = formatAddress(condo.address)
  const today = todayFR()

  // En-tête sinistre
  entries.push(['sinistre.date', today])
  entries.push(['sinistre.adresse', condoAddress])
  entries.push(['sinistre.typeImmeuble', 'copro'])
  if (typeof condo.constructionDate === 'number' && condo.constructionDate > 1000) {
    const age = new Date().getFullYear() - condo.constructionDate
    entries.push(['sinistre.moins10Ans', age < 10 ? 'oui' : 'non'])
  }
  if (agency) {
    entries.push(['sinistre.syndicNom', agency.name || ''])
    const agencyAddress = [agency.address, agency.addressL2, [agency.zipCode, agency.city].filter(Boolean).join(' ')]
      .filter((s) => s && String(s).trim() !== '')
      .join(', ')
    entries.push(['sinistre.syndicAdresse', agencyAddress])
    entries.push(['sinistre.syndicTel', agency.phone || ''])
  }

  // Colonne B = la copropriété représentée par son syndic
  const sdcName = /^SDC\b/i.test(condo.name.trim()) ? condo.name.trim() : `SDC ${condo.name.trim()}`
  entries.push(['partieB.nom', sdcName])
  entries.push(['partieB.adresse', condoAddress])
  entries.push(['partieB.vousEtes', 'syndic'])
  entries.push(['partieB.usageHabitation', 'oui'])
  applyInsurance(entries, insurance)

  // Pied
  const faitA = (agency?.city || '').replace(/\s*CEDEX\s*\d*/i, '').trim()
  entries.push(['pied.faitA', faitA])
  entries.push(['pied.faitLe', today])

  return entries
}

export function applyInsurance(entries: ConstatFieldEntries, insurance: ConstatContract | null): ConstatFieldEntries {
  entries.push(['partieB.assureur', insurance?.supplier?.name || ''])
  entries.push(['partieB.contratNo', insurance?.reference || ''])
  entries.push(['partieB.agentTel', insurance?.supplier?.contacts?.[0]?.phone || ''])
  return entries
}

export function mapOwnerToPartieA(owner: ConstatOwner): ConstatFieldEntries {
  return [
    ['partieA.nom', ownerLabel(owner)],
    ['partieA.adresse', formatAddress(owner.address)],
    ['partieA.mail', owner.email || ''],
    ['partieA.tel', owner.mobile || owner.phone || ''],
  ]
}
