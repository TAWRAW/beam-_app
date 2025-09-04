export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { MandatSchema, computeDateFin, computeDureeHeures, computeTTC } from '@/schemas/mandat'
import { getSessionFromCookies } from '@/lib/auth/session'

const InputSchema = MandatSchema

export async function POST(req: NextRequest) {
  // Auth check
  const session = getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const parsed = InputSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 })
    }
    const data = parsed.data

    // Normalize and compute derived server-side
    const tvaRate = Number(process.env.NEXT_PUBLIC_TVA_TAUX ?? '0')
    const normalized = {
      ...data,
      MANDAT__DATE_FIN: data.MANDAT__DATE_FIN || computeDateFin(data.MANDAT__DATE_DEBUT, Number(data.MANDAT__DUREE)),
      AG__DUREE: data.AG__DUREE ?? computeDureeHeures(data.AG__PLAGE_HORAIRE_DEBUT, data.AG__PLAGE_HORAIRE_FIN),
      SYNDIC__HONORAIRES_TTC:
        data.SYNDIC__HONORAIRES_TTC ?? computeTTC(Number(data.SYNDIC__HONORAIRES_HT), isNaN(tvaRate) ? null : tvaRate),
    }

    // Optionally load profile info
    const profile = null

    const webhookUrl = process.env.N8N_MANDAT_WEBHOOK_URL
    const token = process.env.N8N_MANDAT_TOKEN
    const basicUser = process.env.N8N_MANDAT_BASIC_USER
    const basicPass = process.env.N8N_MANDAT_BASIC_PASS
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (basicUser && basicPass) {
      const b64 = Buffer.from(`${basicUser}:${basicPass}`).toString('base64')
      headers['Authorization'] = `Basic ${b64}`
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: 'site-app',
        userId: session.email,
        profile,
        payload: normalized,
      }),
    })

    const out = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ error: out?.error || 'Webhook error' }, { status: 502 })
    }

    return NextResponse.json(out)
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
