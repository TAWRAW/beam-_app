export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
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
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Bad request', issues: parsed.error.issues }, { status: 400 })
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
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    lastHit.set(ip, now)

    // Optional Turnstile verification
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!token) return NextResponse.json({ error: 'Captcha required' }, { status: 400 })
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
      })
      const data = await verifyRes.json()
      if (!data.success) return NextResponse.json({ error: 'Captcha failed' }, { status: 400 })
    }

    // SMTP transporter (OVH)
    const host = process.env.SMTP_HOST || 'ssl0.ovh.net'
    const port = Number(process.env.SMTP_PORT || 465)
    const secure = String(process.env.SMTP_SECURE || 'true') === 'true'
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const to = process.env.CONTACT_TO || user
    if (!user || !pass || !to) {
      return NextResponse.json({ error: 'Server email not configured' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } })

    const subject = `Nouveau message Beamô — ${name}`
    const text = `Nom: ${name}\nEmail: ${email}\nTéléphone: ${phone || '-'}\nCopro: ${copro || '-'}\n\nMessage:\n${message}`

    await transporter.sendMail({
      from: user,
      to,
      subject,
      text,
      replyTo: email,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

