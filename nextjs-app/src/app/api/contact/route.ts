export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
  phone: z.string().optional(),
  copro: z.string().optional(),
  token: z.string().optional(), // Turnstile token
  hp: z.string().optional(),
})

// Simple in-memory rate limit: 1 req/30s/IP (best-effort)
const lastHit = new Map<string, number>()
const WINDOW_MS = 30 * 1000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📧 Contact form submission:', { name: body.name, email: body.email })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error.issues)
      // Format validation errors in French
      const errors = parsed.error.issues.map(issue => issue.message).join(', ')
      return NextResponse.json({ error: errors, issues: parsed.error.issues }, { status: 400 })
    }
    const { name, email, message, phone, copro, token, hp } = parsed.data

    // Honeypot
    if (hp && hp.trim().length > 0) {
      return NextResponse.json({ ok: true })
    }

    // Rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const last = lastHit.get(ip) || 0
    if (now - last < WINDOW_MS) {
      return NextResponse.json({ error: 'Trop de tentatives. Veuillez patienter 30 secondes.' }, { status: 429 })
    }
    lastHit.set(ip, now)

    // Optional Turnstile verification
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!token) return NextResponse.json({ error: 'Veuillez valider le captcha' }, { status: 400 })
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
      })
      const data = await verifyRes.json()
      if (!data.success) return NextResponse.json({ error: 'Échec de la validation du captcha' }, { status: 400 })
    }

    // Resend configuration
    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.CONTACT_TO || 'tom.lemeille@beamo.fr'

    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured')
      return NextResponse.json({ error: 'Erreur de configuration du serveur' }, { status: 500 })
    }

    const resend = new Resend(apiKey)

    // Send email using Resend
    // Note: Using the root domain verified in Resend
    const { data, error } = await resend.emails.send({
      from: 'Beamô Contact <contact@xn--beam-yqa.fr>',
      to: [to],
      replyTo: email,
      subject: `Nouveau message Beamô — ${name}`,
      text: `Nom: ${name}\nEmail: ${email}\nTéléphone: ${phone || '-'}\nCopro: ${copro || '-'}\n\nMessage:\n${message}`,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: "Erreur lors de l'envoi du message" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err: any) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
