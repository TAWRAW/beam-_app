// app/api/rapport-comptable/route.ts
// Route cron — rapport comptable matinal estale → Gmail via Resend
// Déclenchée chaque matin à 7h30 via vercel.json crons
// Sécurisée par CRON_SECRET (Authorization: Bearer <CRON_SECRET>)

export const runtime = 'nodejs'
export const maxDuration = 60 // Pro plan : jusqu'à 60s

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// ── Config ────────────────────────────────────────────────────────────────────

const ESTALE_API_URL = `${process.env.ESTALE_API_BASE_URL ?? 'https://api.estale.app'}/graphql/intranet`
const ESTALE_LOGIN_URL = `${process.env.ESTALE_API_BASE_URL ?? 'https://api.estale.app'}/api/login`

// ── Types ─────────────────────────────────────────────────────────────────────

interface Condo { id: string; name: string }

interface MonitoringNode {
  id: string
  date: string
  amount: number
  label: string
  entries?: { id: string }[]
  transactions?: { id: string }[]
}

interface BankAccountRaw {
  id: string
  label: string
  institution: string
  balance: number
  monitoring: { edges: { node: MonitoringNode }[] }
}

interface CondoAccountingRaw {
  name: string
  banks: BankAccountRaw[]
  invoice: { nbAlerts: number }
}

interface BankReport {
  label: string
  institution: string
  balance: number
  unscoredTx: MonitoringNode[]
  unscoredEntries: MonitoringNode[]
}

interface CondoReport {
  name: string
  banks: BankReport[]
  nbAlerts: number
  hasBank: boolean
}

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_ALL_CONDOS = `
  query { me { establishment { condos(archived: false) { id name } } } }
`

const GET_CONDO_ACCOUNTING = `
  query CondoAccounting($condoID: ID!) {
    condo(id: $condoID) {
      name
      banks(archived: false) {
        id label institution balance
        monitoring(first: 100) {
          edges {
            node {
              ... on BankMonitoringTransaction { id date amount label entries { id } }
              ... on BankMonitoringEntry { id date amount label transactions { id } }
            }
          }
        }
      }
      invoice { nbAlerts }
    }
  }
`

// ── Estale client (sans dépendance externe) ───────────────────────────────────

async function estaleLogin(): Promise<string> {
  const res = await fetch(ESTALE_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ESTALE_EMAIL,
      password: process.env.ESTALE_PASSWORD,
    }),
  })
  if (!res.ok) throw new Error(`Estale login failed: ${res.status}`)
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error('Pas de cookie estale')
  return setCookie.split(';')[0]
}

async function estaleGql<T>(cookie: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ESTALE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Cookie: cookie },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json() as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return sign + new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function countActions(r: CondoReport): number {
  return r.banks.reduce((acc, b) => acc + b.unscoredTx.length + b.unscoredEntries.length, 0) + r.nbAlerts
}

// ── HTML ticket de caisse ─────────────────────────────────────────────────────

function buildHtml(reports: CondoReport[], dateStr: string): string {
  const sorted = [...reports].sort((a, b) => countActions(b) - countActions(a))

  const sections = sorted.map((r) => {
    const bankBlocks = r.banks
      .filter((b) => b.unscoredTx.length > 0 || b.unscoredEntries.length > 0)
      .map((b) => {
        const txRows = b.unscoredTx.map((t) => `
          <tr>
            <td style="padding:3px 0;font-size:13px;color:#222;width:90px;">${fmtDate(t.date)}</td>
            <td style="padding:3px 8px;font-size:13px;color:#222;">${trunc(t.label, 36)}</td>
            <td style="padding:3px 0;font-size:13px;color:${t.amount >= 0 ? '#1a7f4b' : '#c0392b'};text-align:right;white-space:nowrap;">${fmt(t.amount)}</td>
          </tr>`).join('')

        const entryRows = b.unscoredEntries.map((e) => `
          <tr>
            <td style="padding:3px 0;font-size:13px;color:#222;width:90px;">${fmtDate(e.date)}</td>
            <td style="padding:3px 8px;font-size:13px;color:#222;">${trunc(e.label, 36)}</td>
            <td style="padding:3px 0;font-size:13px;color:${e.amount >= 0 ? '#1a7f4b' : '#c0392b'};text-align:right;white-space:nowrap;">${fmt(e.amount)}</td>
          </tr>`).join('')

        return `
          <div style="margin-bottom:16px;">
            <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;color:#555;text-transform:uppercase;">${b.label} &mdash; ${b.institution}</p>
            <p style="margin:0 0 10px;font-size:13px;">Solde bancaire : <strong>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(b.balance)}</strong></p>
            ${b.unscoredTx.length > 0 ? `
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#222;">[!] A LETTRER &mdash; ${b.unscoredTx.length} transaction${b.unscoredTx.length > 1 ? 's' : ''}</p>
              <p style="margin:0 0 6px;font-size:11px;color:#999;letter-spacing:2px;">${'─'.repeat(42)}</p>
              <table style="width:100%;border-collapse:collapse;"><tbody>${txRows}</tbody></table>
              <p style="margin:8px 0 0;font-size:11px;color:#999;letter-spacing:2px;">${'─'.repeat(42)}</p>` : ''}
            ${b.unscoredEntries.length > 0 ? `
              <p style="margin:${b.unscoredTx.length > 0 ? '12px' : '0'} 0 4px;font-size:12px;font-weight:700;color:#222;">[=] A RAPPROCHER &mdash; ${b.unscoredEntries.length} ecriture${b.unscoredEntries.length > 1 ? 's' : ''}</p>
              <p style="margin:0 0 6px;font-size:11px;color:#999;letter-spacing:2px;">${'─'.repeat(42)}</p>
              <table style="width:100%;border-collapse:collapse;"><tbody>${entryRows}</tbody></table>
              <p style="margin:8px 0 0;font-size:11px;color:#999;letter-spacing:2px;">${'─'.repeat(42)}</p>` : ''}
          </div>`
      }).join('')

    const alertBadge = r.nbAlerts > 0
      ? `<p style="margin:12px 0 0;font-size:12px;font-weight:700;color:#c0392b;">[X] ${r.nbAlerts} ALERTE${r.nbAlerts > 1 ? 'S' : ''} FACTURE${r.nbAlerts > 1 ? 'S' : ''}</p>`
      : ''

    const hasActions = bankBlocks.trim().length > 0 || r.nbAlerts > 0
    const body = hasActions
      ? `${bankBlocks}${alertBadge}`
      : r.hasBank
        ? `<p style="margin:0;font-size:13px;color:#555;">[✓] A JOUR &mdash; aucune ecriture en attente</p>`
        : `<p style="margin:0;font-size:13px;color:#888;">[~] Aucun compte bancaire connecte</p>`

    return `
      <div style="margin-bottom:20px;">
        <div style="background:#111;padding:10px 16px;border-radius:4px 4px 0 0;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#fff;letter-spacing:1px;text-transform:uppercase;">${r.name}</p>
        </div>
        <div style="background:#fff;border:1px solid #ddd;border-top:none;padding:14px 16px;border-radius:0 0 4px 4px;">
          ${body}
        </div>
      </div>`
  }).join('')

  const nbActions = reports.filter((r) => countActions(r) > 0).length

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:28px 12px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr><td style="background:#111;padding:20px 20px 16px;border-radius:6px 6px 0 0;">
          <p style="margin:0;font-size:10px;color:#777;letter-spacing:3px;text-transform:uppercase;">Beamo Immobilier</p>
          <p style="margin:6px 0 2px;font-size:18px;color:#fff;font-weight:700;letter-spacing:1px;">RAPPORT COMPTABLE</p>
          <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:1px;">${dateStr.toUpperCase()}</p>
          <p style="margin:10px 0 0;font-size:11px;color:#999;letter-spacing:2px;">${'═'.repeat(38)}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#ccc;">${reports.length} copropriete${reports.length > 1 ? 's' : ''} | ${nbActions} avec actions en attente</p>
        </td></tr>
        <tr><td style="background:#f5f5f5;padding:20px 4px;">${sections}</td></tr>
        <tr><td style="background:#111;padding:12px 20px;border-radius:0 0 6px 6px;text-align:center;">
          <p style="margin:0;font-size:10px;color:#666;letter-spacing:1px;">rapport automatique estale-mcp &mdash; <a href="https://estale.app" style="color:#aaa;text-decoration:none;">estale.app</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Vérification CRON_SECRET (Vercel injecte automatiquement Authorization: Bearer <CRON_SECRET>)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Auth estale
    const cookie = await estaleLogin()

    // 2. Toutes les copropriétés
    const condosData = await estaleGql<{ me: { establishment: { condos: Condo[] } } }>(cookie, GET_ALL_CONDOS)
    const condos = condosData.me.establishment.condos

    // 3. Données comptables par copropriété
    const reports: CondoReport[] = []
    for (const condo of condos) {
      try {
        const data = await estaleGql<{ condo: CondoAccountingRaw }>(cookie, GET_CONDO_ACCOUNTING, { condoID: condo.id })
        const { banks, invoice } = data.condo

        const bankReports: BankReport[] = banks.map((b) => {
          const allNodes = b.monitoring.edges.map((e) => e.node).filter(Boolean)
          const unscoredTx = allNodes.filter(
            (n) => Array.isArray(n.entries) && n.entries.length === 0 && !Array.isArray(n.transactions)
          )
          const unscoredEntries = allNodes.filter(
            (n) => Array.isArray(n.transactions) && n.transactions.length === 0 && !Array.isArray(n.entries)
          )
          return { label: b.label, institution: b.institution, balance: b.balance, unscoredTx, unscoredEntries }
        })

        reports.push({
          name: data.condo.name,
          banks: bankReports,
          nbAlerts: invoice.nbAlerts,
          hasBank: banks.length > 0,
        })
      } catch (err) {
        console.error(`Erreur ${condo.name}:`, err)
      }
    }

    // 4. Email
    const today = new Date()
    const dateStr = today.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const subject = `[estale] Rapport comptable — ${today.toLocaleDateString('fr-FR')}`
    const html = buildHtml(reports, dateStr)

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const toEmails = (process.env.REPORT_TO_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

    const { error } = await resend.emails.send({
      from: 'Beamo Comptabilite <rapport@xn--beam-yqa.fr>',
      to: toEmails,
      subject,
      html,
    })

    if (error) throw new Error(error.message)

    const nbActions = reports.filter((r) => countActions(r) > 0).length
    return NextResponse.json({ ok: true, condos: reports.length, avecActions: nbActions })
  } catch (err: unknown) {
    console.error('Rapport comptable error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
