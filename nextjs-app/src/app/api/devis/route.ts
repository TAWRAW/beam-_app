export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { devisSchema, ROLE_LABELS, MOTIF_LABELS, TAILLE_LABELS } from '@/lib/validations/devis'

// Rate limiting: 5 demandes par heure par IP
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 heure
const RATE_LIMIT_MAX = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Devis] Form submission:', { ville: body.ville, role: body.role, motifs: body.motifs })

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { message: 'Trop de demandes. Reessayez dans une heure.' },
        { status: 429 }
      )
    }

    // Validation Zod
    const result = devisSchema.safeParse(body)
    if (!result.success) {
      console.error('[Devis] Validation failed:', result.error.issues)
      return NextResponse.json(
        { message: 'Donnees invalides', errors: result.error.flatten() },
        { status: 400 }
      )
    }

    const data = result.data

    // Verification honeypot
    if (data.website && data.website.length > 0) {
      // Spam detecte, on fait semblant que ca a marche
      console.log('[Devis] Spam detected via honeypot')
      return NextResponse.json({ success: true })
    }

    // Configuration Resend
    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.CONTACT_TO || 'tom.lemeille@beamo.fr'

    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured')
      return NextResponse.json({ message: 'Erreur de configuration du serveur' }, { status: 500 })
    }

    const resend = new Resend(apiKey)

    // Preparation du contenu email
    const isPriority = data.role === 'conseil_syndical'
    const priorityBadge = isPriority ? '[PRIORITE] ' : ''
    const roleLabel = ROLE_LABELS[data.role] || data.role
    const motifsLabels = data.motifs.map(m => MOTIF_LABELS[m] || m)
    const motifsDisplay = motifsLabels.join(' + ')
    const tailleLabel = TAILLE_LABELS[data.nombreLots] || data.nombreLots

    // Envoi de l'email de notification
    const { data: emailData, error } = await resend.emails.send({
      from: 'Beamo Devis <contact@xn--beam-yqa.fr>',
      to: [to],
      replyTo: data.email,
      subject: `${priorityBadge}Nouveau lead a ${data.ville} - ${motifsDisplay}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #FFC300; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #000; margin: 0; font-size: 24px;">Nouvelle demande de devis</h1>
            ${isPriority ? '<span style="background: #000; color: #FFC300; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px;">PRIORITE - Conseil Syndical</span>' : ''}
          </div>

          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #334155; margin-top: 0; font-size: 18px; border-bottom: 2px solid #FFC300; padding-bottom: 10px;">Localisation</h2>
            <p style="margin: 8px 0;"><strong>Ville :</strong> ${data.ville}</p>
            <p style="margin: 8px 0;"><strong>Taille :</strong> ${tailleLabel}</p>

            <h2 style="color: #334155; margin-top: 24px; font-size: 18px; border-bottom: 2px solid #FFC300; padding-bottom: 10px;">Contact</h2>
            <p style="margin: 8px 0;"><strong>Nom :</strong> ${data.prenom} ${data.nom}</p>
            <p style="margin: 8px 0;"><strong>Role :</strong> ${roleLabel}</p>
            <p style="margin: 8px 0;"><strong>Email :</strong> <a href="mailto:${data.email}" style="color: #000;">${data.email}</a></p>
            <p style="margin: 8px 0;"><strong>Telephone :</strong> <a href="tel:${data.telephone}" style="color: #000;">${data.telephone}</a></p>

            <h2 style="color: #334155; margin-top: 24px; font-size: 18px; border-bottom: 2px solid #FFC300; padding-bottom: 10px;">Motivation${data.motifs.length > 1 ? 's' : ''}</h2>
            <div style="background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #FFC300;">
              ${motifsLabels.map(label => `<p style="margin: 4px 0; font-size: 16px; color: #000;"><strong>${label}</strong></p>`).join('')}
              ${data.autreDetail ? `<p style="margin: 12px 0 0 0; padding-top: 12px; border-top: 1px solid #FFC300; font-size: 14px; color: #334155;"><em>Detail : ${data.autreDetail}</em></p>` : ''}
            </div>
          </div>

          <div style="background: #000; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
            <a href="tel:${data.telephone}" style="display: inline-block; background: #FFC300; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 10px;">Appeler</a>
            <a href="mailto:${data.email}" style="display: inline-block; background: #fff; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Repondre</a>
          </div>

          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
            Ce lead a ete genere via le formulaire /devis de beamo.fr
          </p>
        </div>
      `,
      text: `
Nouvelle demande de devis${isPriority ? ' - PRIORITE HAUTE' : ''}

LOCALISATION
- Ville : ${data.ville}
- Taille : ${tailleLabel}

CONTACT
- Nom : ${data.prenom} ${data.nom}
- Role : ${roleLabel}
- Email : ${data.email}
- Telephone : ${data.telephone}

MOTIVATION
${motifsLabels.join('\n')}${data.autreDetail ? `\n\nDetail : ${data.autreDetail}` : ''}
      `.trim(),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ message: "Erreur lors de l'envoi du message" }, { status: 500 })
    }

    console.log('[Devis] Email sent:', emailData?.id)
    return NextResponse.json({ success: true, id: emailData?.id })
  } catch (err: unknown) {
    console.error('Devis form error:', err)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
