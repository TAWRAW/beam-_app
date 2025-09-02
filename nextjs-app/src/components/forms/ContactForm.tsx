"use client";
import { useEffect, useState } from 'react'

declare global {
  interface Window { emailjs?: any }
}

const PUB_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID

export default function ContactForm() {
  const [status, setStatus] = useState<null | { ok: boolean; message: string }>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.emailjs && PUB_KEY) {
      try { window.emailjs.init(PUB_KEY) } catch {}
    }
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

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
      phone: (formData.get('phone') as string) || 'Non spécifié',
      copro: (formData.get('copro') as string) || 'Non spécifié',
      message: (formData.get('message') as string) || '',
      to_email: process.env.NEXT_PUBLIC_EMAIL_TO || 'tom.lemeille@beamô.fr',
    }

    if (!window.emailjs || !PUB_KEY || !SERVICE_ID || !TEMPLATE_ID) {
      setStatus({ ok: false, message: 'Configuration EmailJS manquante. Merci de réessayer plus tard.' })
      return
    }

    try {
      await window.emailjs.send(SERVICE_ID, TEMPLATE_ID, payload)
      setStatus({ ok: true, message: 'Votre message a été envoyé avec succès !' })
      form.reset()
    } catch (err: any) {
      let message = "Une erreur est survenue lors de l'envoi de votre message."
      const status = err?.status
      if (status === 400) message = 'Erreur de configuration EmailJS (400).'
      else if (status === 401) message = 'Clé EmailJS invalide (401).'
      else if (status === 403) message = 'Service EmailJS non autorisé (403).'
      else if (status === 404) message = 'Service ou template EmailJS introuvable (404).'
      setStatus({ ok: false, message })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Honeypot */}
      <div className="hidden">
        <label>Company<input name="company" autoComplete="off" /></label>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="name">Nom & Prénom</label>
        <input id="name" name="name" required className="mt-1 w-full rounded border px-3 py-2" placeholder="Ex: Tom LEMEILLE" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium" htmlFor="email">Adresse email</label>
          <input id="email" type="email" name="email" required className="mt-1 w-full rounded border px-3 py-2" placeholder="Ex: tom.lemeille@beamo.fr" />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="phone">Téléphone (optionnel)</label>
          <input id="phone" type="tel" name="phone" className="mt-1 w-full rounded border px-3 py-2" placeholder="Ex: 07 75 70 70 99" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="copro">Nom de votre copropriété (optionnel)</label>
        <input id="copro" name="copro" className="mt-1 w-full rounded border px-3 py-2" placeholder="Ex: Résidence Le Lavoir" />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="message">Votre message</label>
        <textarea id="message" name="message" required rows={6} className="mt-1 w-full rounded border px-3 py-2" placeholder="Votre question ou demande..." />
      </div>

      <button className="rounded bg-primary px-4 py-2 text-white" type="submit">Envoyer mon message</button>
      {status && (
        <p className={`mt-2 text-sm ${status.ok ? 'text-green-600' : 'text-red-600'}`}>{status.message}</p>
      )}
    </form>
  )
}
