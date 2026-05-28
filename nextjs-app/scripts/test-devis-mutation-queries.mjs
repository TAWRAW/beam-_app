#!/usr/bin/env node
// Test ad-hoc des 4 queries Estale ajoutées pour le module Devis mutation.
// Réplique inline les queries (cf. src/lib/estale/sale-queries.ts) pour
// valider qu'elles passent contre l'API réelle sans erreur de schéma.
// Usage : node scripts/test-devis-mutation-queries.mjs

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n').filter((l) => l && !l.startsWith('#') && l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }),
)
for (const [k, v] of Object.entries(env)) process.env[k] = v

const BASE = process.env.ESTALE_API_BASE_URL
const HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'Mozilla/5.0', Origin: 'https://app.estale.app', Referer: 'https://app.estale.app/' }

let cookie = null
async function login() {
  const r = await fetch(`${BASE}/api/login`, { method: 'POST', headers: HEADERS, body: JSON.stringify({ email: process.env.ESTALE_EMAIL, password: process.env.ESTALE_PASSWORD }) })
  if (!r.ok) throw new Error(`Login failed: ${r.status}`)
  const setCookie = r.headers.get('set-cookie')
  cookie = setCookie ? setCookie.split(';')[0] : null
  if (!cookie) throw new Error('No session cookie')
  console.log('✓ Login OK')
}
async function gql(query, variables = {}) {
  const r = await fetch(`${BASE}/graphql/intranet`, { method: 'POST', headers: { ...HEADERS, Cookie: cookie }, body: JSON.stringify({ query, variables }) })
  const json = await r.json()
  if (json.errors) {
    console.error('  ❌ GraphQL errors:', JSON.stringify(json.errors, null, 2))
    return null
  }
  return json.data
}

const ADDRESS = `housenumber street addressL2 addressL3 postcode city country isFR`
const OWNER_SUMMARY = `id fullname civility firstname lastname email isPro companyName companySiret`
const OWNER_DETAIL = `${OWNER_SUMMARY} reference birthDate birthPlace phone mobile companyForm companyCapital nbShares nbLots address { ${ADDRESS} }`
const LOT_SUMMARY = `id reference num type use floor staircase door size rooms`
const SALE_SUMMARY = `id reference scheduledDate isClosed isPartial nbLot nbOwner notaryReference owners { ${OWNER_SUMMARY} } lots { ${LOT_SUMMARY} }`

async function testGetOpenSales() {
  console.log('\n--- 1. getOpenSales ---')
  const data = await gql(`{ me { collaborator { condos(archived: false) { id name reference sales(archived: false) { ${SALE_SUMMARY} } } } } }`)
  if (!data) return
  const condos = data.me?.collaborator?.condos ?? []
  const allSales = condos.flatMap((c) => (c.sales ?? []).map((s) => ({ ...s, condoID: c.id, condoName: c.name })))
  const open = allSales.filter((s) => !s.isClosed)
  console.log(`  ${condos.length} copropriétés visibles, ${allSales.length} ventes total, ${open.length} ventes ouvertes`)
  if (open.length > 0) {
    const s = open[0]
    console.log(`  Exemple ouverte : ${s.reference} (copro ${s.condoName}) — scheduledDate=${s.scheduledDate}, ${s.nbLot} lot(s), ${s.nbOwner} owner(s)`)
    return { saleId: s.id, condoID: s.condoID }
  }
  return null
}

async function testGetSaleDetail(condoId, saleId) {
  console.log('\n--- 2. getSaleDetail ---')
  if (!condoId || !saleId) { console.log('  (skip : aucune Sale ouverte trouvée)'); return }
  const q = `query SaleDetail($condoId: ID!, $saleId: ID!) {
    condo(id: $condoId) {
      id name reference
      settings { sale { ed { fees allowOverride } ped { fees allowOverride } } }
      sale(id: $saleId) {
        ${SALE_SUMMARY}
        isFree closedAt createdAt
        ownersDetail: owners { ${OWNER_DETAIL} }
        buyers { id fullname civility firstname lastname company isPro }
        notaryOffice { name }
      }
    }
  }`
  const data = await gql(q, { condoId, saleId })
  if (!data) return
  const sale = data.condo?.sale
  if (!sale) { console.log('  ❌ Sale non trouvée'); return }
  const owner0 = sale.ownersDetail?.[0]
  const fees = data.condo?.settings?.sale
  console.log(`  Sale ${sale.reference} : isFree=${sale.isFree}, ${sale.ownersDetail?.length || 0} owner(s) détail, ${sale.buyers?.length || 0} buyer(s)`)
  console.log(`  Vendeur principal : ${owner0?.fullname || '?'} (email=${owner0?.email || '?'}, postcode=${owner0?.address?.postcode || '?'})`)
  console.log(`  Frais copro : ED=${fees?.ed?.fees ?? '(défaut cabinet)'} (override=${fees?.ed?.allowOverride}) | PED=${fees?.ped?.fees ?? '(défaut cabinet)'} (override=${fees?.ped?.allowOverride})`)
}

async function testGetCondoSaleSettings(condoId) {
  console.log('\n--- 3. getCondoSaleSettings ---')
  if (!condoId) { console.log('  (skip : pas de condoId)'); return }
  const data = await gql(`query CondoSaleSettings($condoId: ID!) { condo(id: $condoId) { settings { sale { ed { fees allowOverride } ped { fees allowOverride } } } } }`, { condoId })
  if (!data) return
  const s = data.condo?.settings?.sale
  console.log(`  ed: ${JSON.stringify(s?.ed)}`)
  console.log(`  ped: ${JSON.stringify(s?.ped)}`)
}

async function testGetEstablishmentLegalInfo() {
  console.log('\n--- 4. getEstablishmentLegalInfo ---')
  const data = await gql(`{
    me {
      establishment {
        id name form capital rcs siret vat phone email noReply
        address { ${ADDRESS} }
        agency {
          id name
          businessCard { cardID isSY isGI isTR issuedBy issuedAt validUntil }
          insurance { company reference subscription }
          guaranteeFund { company reference amount subscription }
        }
      }
    }
  }`)
  if (!data) return
  const e = data.me?.establishment
  if (!e) { console.log('  ❌ Pas d\'establishment'); return }
  console.log(`  Establishment : ${e.name} | SIRET=${e.siret} | RCS=${e.rcs} | TVA=${e.vat} | Capital=${e.capital}`)
  console.log(`  Agency : ${e.agency?.name}`)
  console.log(`  Carte G : ${e.agency?.businessCard ? `${e.agency.businessCard.cardID} (SY=${e.agency.businessCard.isSY}, validUntil=${e.agency.businessCard.validUntil})` : '(absent)'}`)
  console.log(`  RCP : ${e.agency?.insurance ? `${e.agency.insurance.company} — ${e.agency.insurance.reference}` : '(absent)'}`)
  console.log(`  Garantie fin. : ${e.agency?.guaranteeFund ? `${e.agency.guaranteeFund.company} — ${e.agency.guaranteeFund.amount} €` : '(absent)'}`)
}

async function main() {
  await login()
  const opened = await testGetOpenSales()
  await testGetSaleDetail(opened?.condoID, opened?.saleId)
  await testGetCondoSaleSettings(opened?.condoID)
  await testGetEstablishmentLegalInfo()
}
main().catch((e) => { console.error('FATAL', e); process.exit(1) })
