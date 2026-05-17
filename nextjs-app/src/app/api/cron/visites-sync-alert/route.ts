// src/app/api/cron/visites-sync-alert/route.ts
// Cron quotidien : pour chaque user dont oldest_pending_at est en retard,
// envoyer un mail Resend de rappel.

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const THRESHOLD_DAYS = parseInt(process.env.VISITES_ALERT_THRESHOLD_DAYS || '5', 10)
const ALERT_EMAIL = process.env.VISITES_ALERT_EMAIL

interface HeartbeatRow {
  user_id: string
  pending_count: number
  oldest_pending_at: string | null
  last_alert_sent_at: string | null
  updated_at: string
}

export async function GET(request: Request) {
  // Vercel Cron passe optionnellement un header secret (CRON_SECRET)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const cutoff = new Date(Date.now() - THRESHOLD_DAYS * 86400_000).toISOString()
  const { data: rows, error } = await supabase
    .from('visite_sync_heartbeat')
    .select('*')
    .lt('oldest_pending_at', cutoff)
    .gt('pending_count', 0)

  if (error) {
    console.error('cron read heartbeat :', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!ALERT_EMAIL) {
    return NextResponse.json({
      skipped: true,
      reason: 'VISITES_ALERT_EMAIL non configuré',
      candidates: rows?.length || 0,
    })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      skipped: true,
      reason: 'RESEND_API_KEY manquant',
      candidates: rows?.length || 0,
    })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const sent: string[] = []

  for (const row of (rows || []) as HeartbeatRow[]) {
    // déduplication : pas plus d'une alerte par 24h pour la même ligne
    if (
      row.last_alert_sent_at &&
      new Date(row.last_alert_sent_at).getTime() > Date.now() - 86400_000
    ) {
      continue
    }

    const daysLate = Math.floor(
      (Date.now() - new Date(row.oldest_pending_at!).getTime()) / 86400_000,
    )
    const html = `
      <p>Bonjour Tom,</p>
      <p>Tu as <strong>${row.pending_count} items non synchronisés</strong> dans la brique Visites de beam-app,
        dont certains depuis <strong>${daysLate} jours</strong>.</p>
      <p>Pour éviter toute perte de données :</p>
      <ol>
        <li>Ouvre Chrome iOS sur ton téléphone</li>
        <li>Va sur <a href="https://www.beamô.fr/apps/visites">https://www.beamô.fr/apps/visites</a></li>
        <li>Vérifie que le chip en haut à droite est passé en <strong>✓ vert</strong></li>
      </ol>
      <p>Si l'erreur persiste après avoir suivi ces étapes, vérifie ta connexion internet ou consulte les logs.</p>
    `

    const { error: sendErr } = await resend.emails.send({
      from: 'Beamô beam-app <noreply@beamô.fr>',
      to: ALERT_EMAIL,
      subject: `[Visites] ${row.pending_count} items non synchronisés depuis ${daysLate}j`,
      html,
    })

    if (sendErr) {
      console.error('resend send :', sendErr)
      continue
    }
    await supabase
      .from('visite_sync_heartbeat')
      .update({ last_alert_sent_at: new Date().toISOString() })
      .eq('user_id', row.user_id)
    sent.push(row.user_id)
  }

  return NextResponse.json({ ok: true, sent })
}
