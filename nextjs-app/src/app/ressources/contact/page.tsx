import ContactForm from '@/components/forms/ContactForm'

export const metadata = {
  title: 'Contactez Beamô - Le Syndic Hybride Nouvelle Génération',
  description:
    "Contactez BEAMÔ, votre syndic hybride alliant digitalisation et expertise humaine. Nous répondons à toutes vos questions sur la gestion de votre copropriété.",
  alternates: { canonical: '/ressources/contact' },
}

export default function ContactPage() {
  return (
    <main>
      {/* Hero */}
      <section className="section bg-gray-50 relative -mt-20 md:-mt-24 pt-20 md:pt-24">
        <div className="container">
          <div className="card p-8">
            <h1 className="h1">Contactez Beamô</h1>
            <p className="mt-3 text-gray-700">
              Une question sur votre copropriété ? Envie d'en savoir plus sur notre approche ?
              <br /> Laissez-nous un message, nous vous répondrons sous 48h.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="section">
        <div className="container">
          <div className="card p-8">
            <h2 className="h2">Laissez-nous un message</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              🔒 Vos informations ne sont utilisées que pour répondre à votre message et ne seront jamais partagées avec des tiers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-primary">
        <div className="container">
          <div className="card p-8">
            <h2 className="h2">Discutons de votre projet</h2>
            <p className="mt-2 text-gray-700">Nous sommes à votre écoute pour vous accompagner dans la gestion de votre copropriété.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
