import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, rgpd_consent } = body

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    if (!rgpd_consent) {
      return NextResponse.json({ error: 'Consentement RGPD requis' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: 'Beamô Oignon <contact@xn--beam-yqa.fr>',
      to: [process.env.CONTACT_TO || 'tom.lemeille@beamo.fr'],
      replyTo: email.trim(),
      subject: `Nouvelle inscription waitlist Oignon — ${email.trim()}`,
      text: `Nouvelle inscription à la waitlist Oignon.\n\nEmail : ${email.trim()}\nConsentement RGPD : oui`,
    })

    if (error) {
      console.error('[Oignon Waitlist] Erreur Resend:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })

  } catch (err) {
    console.error('[Oignon Waitlist] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
