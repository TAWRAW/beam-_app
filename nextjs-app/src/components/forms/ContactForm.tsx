"use client";
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/components/analytics/GA'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export default function ContactForm() {
  const [status, setStatus] = useState<null | { ok: boolean; message: string }>(null)
  const [rgpdConsent, setRgpdConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    // Vérification du consentement RGPD
    if (!rgpdConsent) {
      setStatus({ ok: false, message: 'Vous devez accepter la politique de confidentialité pour envoyer votre message.' })
      return
    }

    // Honeypot
    const hp = (formData.get('company') as string) || ''
    if (hp.trim().length > 0) {
      setStatus({ ok: true, message: 'Merci !' })
      form.reset()
      return
    }

    const payload = {
      name: (formData.get('name') as string) || '',
      email: (formData.get('email') as string) || '',
      phone: (formData.get('phone') as string) || '',
      copro: (formData.get('copro') as string) || '',
      message: (formData.get('message') as string) || '',
      hp,
    }

    setIsSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle error responses - show server error message if available
        let errorMessage = "Une erreur est survenue lors de l'envoi de votre message."

        if (response.status === 429) {
          errorMessage = 'Trop de tentatives. Veuillez patienter 30 secondes.'
        } else if (response.status === 400) {
          // Show validation errors from server
          if (data.error) {
            errorMessage = `Erreur: ${data.error}`
          }
          if (data.issues && Array.isArray(data.issues)) {
            const issueMessages = data.issues.map((issue: any) =>
              `${issue.path?.join('.')}: ${issue.message}`
            ).join(', ')
            errorMessage = `Veuillez corriger: ${issueMessages}`
          }
        } else if (data.error) {
          errorMessage = `Erreur: ${data.error}`
        }

        console.error('Contact form error:', { status: response.status, data })
        setStatus({ ok: false, message: errorMessage })
        setIsSubmitting(false)
        return
      }

      // Success
      setStatus({ ok: true, message: 'Votre message a été envoyé avec succès !' })
      form.reset()
      setRgpdConsent(false)

      // Analytics event (if GA enabled)
      trackEvent('contact_submit_success', { location: 'contact_page' })

      // Redirect to thank you page after a short delay
      setTimeout(() => router.push('/merci'), 300)
    } catch (err: any) {
      console.error('Contact form error:', err)
      setStatus({ ok: false, message: "Une erreur est survenue. Veuillez réessayer plus tard." })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Honeypot */}
      <div className="hidden">
        <Label>Company<Input name="company" autoComplete="off" /></Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nom & Prénom</Label>
        <Input id="name" name="name" required placeholder="Ex: Tom LEMEILLE" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input id="email" type="email" name="email" required placeholder="Ex: tom.lemeille@beamo.fr" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (optionnel)</Label>
          <Input id="phone" type="tel" name="phone" placeholder="Ex: 07 75 70 70 99" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="copro">Nom de votre copropriété (optionnel)</Label>
        <Input id="copro" name="copro" placeholder="Ex: Résidence Le Lavoir" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Votre message</Label>
        <Textarea id="message" name="message" required rows={6} placeholder="Votre question ou demande..." />
      </div>

      {/* Checkbox RGPD */}
      <div className="flex items-start space-x-3 rounded-md border border-muted p-4">
        <Checkbox
          id="rgpd-consent"
          checked={rgpdConsent}
          onCheckedChange={(checked) => setRgpdConsent(checked === true)}
          required
        />
        <div className="flex-1">
          <Label
            htmlFor="rgpd-consent"
            className="text-sm font-normal leading-relaxed cursor-pointer"
          >
            J'accepte que mes données personnelles soient collectées et utilisées par Beamô pour répondre à ma demande de contact.
            Conformément au Règlement Général sur la Protection des Données (RGPD), je dispose d'un droit d'accès,
            de rectification, de suppression et d'opposition au traitement de mes données.{' '}
            <Link href="/mentions-legales" className="underline text-primary hover:text-primary/80">
              En savoir plus sur la gestion de vos données
            </Link>.
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="border-2 border-black"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Envoi en cours...' : 'Envoyer mon message'}
      </Button>
      {status && (
        <p className={`mt-2 text-sm ${status.ok ? 'text-green-600' : 'text-red-600'}`}>{status.message}</p>
      )}
    </form>
  )
}
