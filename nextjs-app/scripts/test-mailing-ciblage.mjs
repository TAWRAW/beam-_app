#!/usr/bin/env node
// Test de LECTURE du ciblage Mailing (bâtiments / clés de répartition → copropriétaires).
// N'écrit rien, n'envoie rien. Usage : node scripts/test-mailing-ciblage.mjs [reference]
// Exemple : node scripts/test-mailing-ciblage.mjs 00008

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)
for (const [k, v] of Object.entries(env)) process.env[k] = v

const BASE = process.env.ESTALE_API_BASE_URL || 'https://api.estale.app'
const REF = process.argv[2] || '00008'

let cookie = null
async function login() {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: process.env.ESTALE_EMAIL, password: process.env.ESTALE_PASSWORD }),
  })
  if (!res.ok) throw new Error(`login ${res.status}`)
  cookie = (res.headers.getSetCookie?.() || [res.headers.get('set-cookie')])
    .filter(Boolean)
    .map((c) => c.split(';')[0])
    .join('; ')
}

async function gql(query, variables) {
  if (!cookie) await login()
  const res = await fetch(`${BASE}/graphql/intranet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: cookie },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 400))
  return json.data
}

const main = async () => {
  const a = await gql(
    `query($archived: Boolean!) { me { establishment { id condos(archived: $archived) { id name reference } } } }`,
    { archived: false },
  )
  const est = a.me.establishment
  const condo = est.condos.find((c) => c.reference === REF)
  if (!condo) throw new Error(`Copropriété ${REF} introuvable`)
  console.log(`Établissement : ${est.id}`)
  console.log(`Copropriété   : ${condo.reference} ${condo.name}\n`)

  const b = await gql(
    `query($id: ID!) {
      condo(id: $id) {
        buildings { id name }
        dks { id name code nbOwners }
        owners { id fullname email phone mobile canReceiveMail canReceiveSMS buildings { id } dks { id } }
      }
    }`,
    { id: condo.id },
  )
  const { buildings, dks, owners } = b.condo

  console.log(`Bâtiments (${buildings.length}) :`)
  for (const bat of buildings) {
    const n = owners.filter((o) => (o.buildings || []).some((x) => x.id === bat.id)).length
    console.log(`  ${bat.name.padEnd(20)} ${n} copropriétaires`)
  }

  console.log(`\nClés de répartition (${dks.length}) :`)
  for (const d of dks) console.log(`  ${d.code}  ${d.name.padEnd(32)} nbOwners=${d.nbOwners}`)

  const sansMail = owners.filter((o) => !o.email).length
  const sansTel = owners.filter((o) => !o.phone && !o.mobile).length
  console.log(`\nCopropriétaires : ${owners.length}`)
  console.log(`  sans adresse mail : ${sansMail}`)
  console.log(`  sans téléphone    : ${sansTel}`)
  console.log(`  canReceiveMail    : ${owners.filter((o) => o.canReceiveMail).length}`)
  console.log(`  canReceiveSMS     : ${owners.filter((o) => o.canReceiveSMS).length}`)

  // Simulation du filtre « Bâtiment A » (par bâtiment, puis par clé dont le nom contient "Bâtiment A")
  const batA = buildings.find((x) => x.name.trim().toUpperCase() === 'A')
  if (batA) {
    const cible = owners.filter((o) => (o.buildings || []).some((x) => x.id === batA.id))
    console.log(`\n--- Filtre « Bâtiment A » : ${cible.length} copropriétaires`)
    console.log(`    avec mail : ${cible.filter((o) => o.email).length}`)
    console.log(`    sans mail : ${cible.filter((o) => !o.email).length}`)
  }
}

main().catch((e) => {
  console.error('ÉCHEC :', String(e).slice(0, 600))
  process.exit(1)
})
