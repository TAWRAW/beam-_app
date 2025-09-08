import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import Carousel from '@/components/sections/Carousel'
import Features from '@/components/sections/Features'
import Squares from '@/components/sections/Squares'
import Services from '@/components/sections/Services'
import FAQ from '@/components/sections/FAQ'
import NearbyCities from '@/components/sections/NearbyCities'
import FinalCta from '@/components/sections/FinalCta'
import { getCityBySlug, getCitySlugs } from '@/lib/cities'

type Params = { slug: string }

export async function generateStaticParams() {
  return getCitySlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = getCityBySlug(params.slug)
  if (!city) return {}

  const prep = city.displayPrep || city.prep || 'à'
  const name = city.displayName || city.name
  const title = `Syndic de copropriété ${prep} ${name} | Beamô`
  const description = `Beamô, votre syndic de copropriété local ${prep} ${name}${city.department ? ` (${city.department})` : ''}. Proximité, réactivité et écoute au service de votre copropriété.`

  return {
    title,
    description,
    alternates: {
      canonical: `/ville/${city.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/ville/${city.slug}`,
      type: 'website',
      locale: 'fr_FR',
    },
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      'syndic', 'syndic de copropriété', 'gestion copropriété',
      city.name, name, 'Normandie', 'Eure',
    ],
  }
}

export default function CityPage({ params }: { params: Params }) {
  const city = getCityBySlug(params.slug)
  if (!city) notFound()
  const prep = city.displayPrep || city.prep || 'à'
  const label = city.displayName || city.name

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Beamô',
    url: `https://xn--beam-yqa.fr/ville/${city.slug}`,
    areaServed: {
      '@type': 'City',
      name: city.name,
      address: city.department ?? undefined,
    },
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'Syndic de copropriété',
      },
      areaServed: city.name,
    },
    serviceType: 'PropertyManagement',
    knowsAbout: ['syndic', 'copropriété', 'assemblée générale', 'gestion immobilière'],
    sameAs: ['https://xn--beam-yqa.fr'],
  }

  return (
    <main className="min-h-screen">
      <Carousel cityLabel={label} cityPrep={prep} />
      <Features />
      <Squares />
      <section className="section">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Votre syndic {prep} {label}</h2>
          <p className="mt-3 text-gray-700">
            Beamô accompagne les copropriétés {prep} {label}{city.department ? ` (${city.department})` : ''} avec une approche locale,
            transparente et réactive. Nous mettons à votre disposition un interlocuteur unique, des outils digitaux pour le suivi,
            et des process clairs pour la tenue des assemblées générales, la gestion des prestataires et le suivi des travaux.
          </p>
        </div>
      </section>
      <Services />
      <FAQ
        items={[
          { q: `Quel est le délai de réponse ?`, a: 'Nous répondons sous 48h ouvrées et vous pouvez nous joindre directement par téléphone.' },
          { q: `Comment se passe un changement de syndic ?`, a: 'Nous vous accompagnons sur les démarches (AG, documents, transfert), sans surcoût caché.' },
          { q: `Proposez-vous un extranet ?`, a: 'Oui, un espace en ligne pour consulter vos documents, suivre les interventions et échanger.' },
          { q: `Intervenez-vous ${prep} ${label} ?`, a: `Oui, nous couvrons ${label} et ses alentours. Contactez-nous pour une étude de votre copropriété.` },
        ]}
      />
      <NearbyCities currentSlug={city.slug} />
      <FinalCta />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'Quel est le délai de réponse ?', acceptedAnswer: { '@type': 'Answer', text: 'Réponse sous 48h ouvrées.' } },
              { '@type': 'Question', name: 'Comment se passe un changement de syndic ?', acceptedAnswer: { '@type': 'Answer', text: 'Accompagnement complet (AG, documents, transfert) sans surcoût caché.' } },
              { '@type': 'Question', name: 'Proposez-vous un extranet ?', acceptedAnswer: { '@type': 'Answer', text: 'Oui, un espace en ligne pour documents et suivi des interventions.' } },
              { '@type': 'Question', name: `Intervenez-vous ${prep} ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: `Oui, nous couvrons ${label} et ses alentours.` } },
            ],
          }),
        }}
      />
    </main>
  )
}
