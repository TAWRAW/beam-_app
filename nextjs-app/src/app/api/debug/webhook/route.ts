export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const webhookUrl = process.env.N8N_MANDAT_WEBHOOK_URL
  const token = process.env.N8N_MANDAT_TOKEN
  const basicUser = process.env.N8N_MANDAT_BASIC_USER
  const basicPass = process.env.N8N_MANDAT_BASIC_PASS
  if (!webhookUrl) {
    return NextResponse.json({ ok: false, error: 'Webhook URL missing' }, { status: 500 })
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  let auth: 'basic' | 'bearer' | 'none' = 'none'
  if (basicUser && basicPass) {
    const b64 = Buffer.from(`${basicUser}:${basicPass}`).toString('base64')
    headers['Authorization'] = `Basic ${b64}`
    auth = 'basic'
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`
    auth = 'bearer'
  }

  const pingBody = { source: 'debug', now: new Date().toISOString() }
  try {
    const res = await fetch(webhookUrl, { method: 'POST', headers, body: JSON.stringify(pingBody) })
    const text = await res.text()
    let body: any
    try { body = JSON.parse(text) } catch { body = text }
    return NextResponse.json({ ok: res.ok, status: res.status, auth, body }, { status: res.ok ? 200 : 502 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: e?.message }, { status: 502 })
  }
}

