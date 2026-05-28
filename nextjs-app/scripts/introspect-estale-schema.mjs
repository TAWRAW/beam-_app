#!/usr/bin/env node
// Introspection ciblée du schéma GraphQL Estale pour le module Devis mutation.
// Cherche les types liés aux copropriétaires/vendeurs et aux lots.
// Usage : node scripts/introspect-estale-schema.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }),
)
for (const [k, v] of Object.entries(env)) process.env[k] = v

const BASE = process.env.ESTALE_API_BASE_URL
const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0',
  Origin: 'https://app.estale.app',
  Referer: 'https://app.estale.app/',
}

let cookie = null

async function login() {
  const r = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email: process.env.ESTALE_EMAIL, password: process.env.ESTALE_PASSWORD }),
  })
  if (!r.ok) throw new Error(`Login failed: ${r.status} ${r.statusText}`)
  const setCookie = r.headers.get('set-cookie')
  cookie = setCookie ? setCookie.split(';')[0] : null
  if (!cookie) throw new Error('No session cookie returned')
  console.log('✓ Login OK')
}

async function gql(query, variables = {}) {
  const r = await fetch(`${BASE}/graphql/intranet`, {
    method: 'POST',
    headers: { ...HEADERS, Cookie: cookie },
    body: JSON.stringify({ query, variables }),
  })
  if (!r.ok) throw new Error(`GraphQL HTTP ${r.status}: ${r.statusText}`)
  const json = await r.json()
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2))
  }
  return json.data
}

async function inspectType(name) {
  const res = await gql(`{ __type(name: "${name}") { name fields { name type { name kind ofType { name kind ofType { name kind } } } } } }`)
  const t = res?.__type
  if (!t) {
    console.log(`(type ${name} introuvable)`)
    return null
  }
  console.log(`\n--- Type ${name} ---`)
  for (const f of t.fields) {
    console.log(`  ${f.name.padEnd(35)} ${renderType(f.type)}`)
  }
  return t
}

async function main() {
  await login()

  // 1. Liste filtrée
  console.log('\n--- 1. Types pertinents du schéma ---')
  const allTypes = await gql(`{ __schema { types { name kind } } }`)
  const candidates = (allTypes?.__schema?.types || [])
    .filter((t) => /condo|lot|owner|sale|mutation|vendor|seller|address|building/i.test(t.name))
    .filter((t) => !t.name.startsWith('__'))
    .filter((t) => t.kind === 'OBJECT' || t.kind === 'INPUT_OBJECT' || t.kind === 'ENUM')
    .map((t) => `${t.kind.padEnd(12)} ${t.name}`)
  console.log(candidates.join('\n') || '(aucun match)')

  // 2. Inspecter les types clés
  const types = {}
  for (const name of ['Condo', 'Lot', 'Owner', 'Sale', 'Address', 'CondoSettingsSaleED', 'CondoSettingsSalePED', 'CondoSettingsSale', 'Establishment']) {
    types[name] = await inspectType(name)
  }

  // 3. Inspecter aussi les enums utiles
  for (const name of ['LotCategory', 'LotDivision', 'CondoSyndicate']) {
    const res = await gql(`{ __type(name: "${name}") { name enumValues { name } } }`)
    if (res?.__type) {
      console.log(`\n--- Enum ${name} ---`)
      console.log('  ' + (res.__type.enumValues || []).map((v) => v.name).join(', '))
      types[name] = res.__type
    }
  }

  // 4. Dump JSON
  const dump = { allTypeNames: candidates, types }
  const out = join(__dirname, 'estale-introspection-output.json')
  writeFileSync(out, JSON.stringify(dump, null, 2))
  console.log(`\n✓ Dump sauvegardé : ${out}`)
}

function renderType(t) {
  if (!t) return '?'
  if (t.kind === 'NON_NULL') return renderType(t.ofType) + '!'
  if (t.kind === 'LIST') return `[${renderType(t.ofType)}]`
  return t.name || t.kind
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) })
