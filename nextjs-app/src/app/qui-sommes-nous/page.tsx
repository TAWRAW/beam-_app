import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Qui sommes-nous ? | Beamô',
  description:
    "Beamô est un syndic de copropriété local et réactif. Découvrez notre mission, nos valeurs et notre approche de gestion transparente et efficace.",
  alternates: { canonical: '/qui-sommes-nous' },
  openGraph: {
    title: 'Qui sommes-nous ? | Beamô',
    description:
      "Syndic local et réactif. Notre mission : une gestion claire et efficace au service des copropriétaires.",
    url: '/qui-sommes-nous',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: { index: true, follow: true },
  keywords: ['Beamô', 'syndic', 'copropriété', 'équipe', 'valeurs', 'Eure', 'Normandie'],
}

export default function AboutPage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Beamô',
    url: 'https://xn--beam-yqa.fr',
    logo: 'https://xn--beam-yqa.fr/favicon.ico',
    sameAs: ['https://xn--beam-yqa.fr'],
  }

  return (
    <main>
      {/* Hero */}
      <section className="section bg-primary relative -mt-20 md:-mt-24 pt-20 md:pt-24">
        <div className="container">
          <div className="card p-10">
            <h1 className="h1">Qui sommes‑nous ?</h1>
            <p className="mt-3 text-gray-700">
              Beamô est un syndic de copropriété local et réactif. Notre objectif est simple :
              une gestion claire, transparente et efficace, avec un interlocuteur unique et des outils digitaux utiles.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/offres" className="btn">Découvrir nos offres</Link>
              <Link href="/ressources/contact" className="btn btn-extranet">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & valeurs */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Notre mission et nos valeurs</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ['Réactivité', "Des réponses sous 48h ouvrées et une équipe joignable."],
              ['Transparence', "Des suivis clairs, des comptes lisibles, aucun frais caché."],
              ['Proximité', "Une présence terrain et une connaissance fine de la zone."],
            ].map(([title, desc]) => (
              <div key={title} className="card p-6">
                <h3 className="text-lg font-semibold text-neutral">{title}</h3>
                <p className="mt-2 text-gray-700">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Histoire + portrait */}
      <section className="section">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Notre histoire</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-6">
              <p className="text-gray-700">
                Beamô est né d’un constat : les copropriétaires attendent de la clarté, de la réactivité et du respect dans la gestion quotidienne.
                Nous avons conçu un modèle simple, mêlant proximité humaine et outils digitaux, pour apporter une expérience fiable et lisible.
              </p>
            </div>
            <figure className="card overflow-hidden p-0">
              <Image
                src="/images/about/portrait.jpg"
                alt="Portrait au bureau"
                width={886}
                height={886}
                className="h-full w-full object-cover"
                priority
              />
              <figcaption className="px-4 py-3 text-sm text-gray-600">Au bureau – implication terrain et proximité.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Approche */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Notre approche</h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              'Interlocuteur unique et impliqué',
              'Suivi digitalisé et accessible 24/7',
              'Procédures claires (AG, prestataires, travaux)',
              'Engagements de délais et retours',
            ].map((item) => (
              <li key={item} className="card p-4">✅ {item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="section">
        <div className="container">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-semibold">Prêt à échanger sur votre copropriété ?</h2>
            <p className="mt-3 text-gray-700">Contactez‑nous, on vous répond sous 48h et on vous explique notre méthode.</p>
            <div className="mt-6">
              <Link href="/ressources/contact" className="btn">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
    </main>
  )
}
