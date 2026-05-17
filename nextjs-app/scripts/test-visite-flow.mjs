#!/usr/bin/env node
// Script de validation manuelle de bout en bout pour les helpers visites.
// Crée une visite test, ajoute une ligne, puis archive la visite (pour ne rien polluer).
// Usage : node scripts/test-visite-flow.mjs <condoId>

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

// Charge .env.local
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }),
)
for (const [k, v] of Object.entries(env)) process.env[k] = v

const [, , condoId] = process.argv
if (!condoId) {
  console.error('Usage : node scripts/test-visite-flow.mjs <condoId>')
  process.exit(1)
}

const BASE = process.env.ESTALE_API_BASE_URL
const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0',
  Origin: 'https://app.estale.app',
  Referer: 'https://app.estale.app/',
}

async function login() {
  const r = await fetch(`${BASE}/api/login`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ email: process.env.ESTALE_EMAIL, password: process.env.ESTALE_PASSWORD }),
  })
  if (!r.ok) throw new Error(`Login ${r.status}`)
  const cookies = r.headers.getSetCookie?.() || [r.headers.get('set-cookie')].filter(Boolean)
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

async function gql(cookie, query, variables) {
  const r = await fetch(`${BASE}/graphql/intranet`, {
    method: 'POST', headers: { ...HEADERS, Cookie: cookie },
    body: JSON.stringify({ query, variables }),
  })
  const j = await r.json()
  if (j.errors?.length) throw new Error(j.errors[0].message)
  return j.data
}

const cookie = await login()
console.log('[1/6] login OK')

const meData = await gql(cookie, '{ me { collaborator { id condos(archived:false) { id name } } } }')
const meId = meData.me.collaborator.id
const condo = meData.me.collaborator.condos.find((c) => c.id === condoId)
if (!condo) {
  throw new Error(
    `Condo ${condoId} introuvable parmi : ${meData.me.collaborator.condos.map((c) => c.id).join(', ')}`,
  )
}
console.log(`[2/6] organiser=${meId} condo=${condo.name}`)

const visit = (await gql(cookie, `
  mutation($input: VisitCreateInput!) {
    createVisit(input: $input) { id object date period }
  }
`, {
  input: {
    category: 'NON_CONTRACTUAL',
    date: new Date().toISOString(),
    period: 30,
    object: '[TEST AUTO] visite scriptée',
    condoID: condoId,
    organiserID: meId,
    collaboratorIDs: [],
    ownerIDs: [],
  },
})).createVisit
console.log(`[3/6] visite créée : ${visit.id}`)

const comment = (await gql(cookie, `
  mutation($visitId: ID!, $input: VisitCommentCreateInput!) {
    updateVisit(id: $visitId) {
      createComment(input: $input) { id place component content }
    }
  }
`, {
  visitId: visit.id,
  input: { place: 'HALL', component: 'INTERCOM', content: '[TEST] commentaire scripté', files: [] },
})).updateVisit.createComment
console.log(`[4/6] ligne créée : ${comment.id}`)

await gql(cookie, `
  mutation($visitId: ID!, $commentId: ID!) {
    updateVisit(id: $visitId) { updateComment(id: $commentId) { delete { id } } }
  }
`, { visitId: visit.id, commentId: comment.id })
console.log(`[5/6] ligne supprimée`)

await gql(cookie, `
  mutation($visitId: ID!) { updateVisit(id: $visitId) { archive { id archivedAt } } }
`, { visitId: visit.id })
console.log(`[6/6] visite archivée`)

console.log('\nFlow E2E OK ✓')
