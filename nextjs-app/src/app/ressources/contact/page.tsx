import ContactForm from '@/components/forms/ContactForm'
import { Card, CardContent } from '@/components/ui/card'
import OfficeMap from '@/components/maps/OfficeMap'

export const metadata = {
  title: 'Contactez Beamô - Le Syndic Hybride Nouvelle Génération',
  description:
    "Contactez Beamô, votre syndic hybride alliant digitalisation et expertise humaine. Nous répondons à toutes vos questions sur la gestion de votre copropriété sous 48h.",
  keywords: [
    'contact syndic', 'devis syndic', 'Vernon', 'Évreux', 'Les Andelys', 
    'question copropriété', 'assemblée générale', '48h', 'réponse rapide'
  ],
  openGraph: {
    title: 'Contactez Beamô - Réponse sous 48h garantie',
    description: "Une question sur votre copropriété ? Laissez-nous un message, nous vous répondrons sous 48h.",
    url: '/ressources/contact',
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: '/outils/images/beamocomptearebour.png',
        width: 1200,
        height: 630,
        alt: 'Contactez Beamô - Syndic de copropriété',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contactez Beamô - Réponse sous 48h',
    description: "Une question sur votre copropriété ? Nous vous répondons sous 48h.",
  },
  alternates: { canonical: '/ressources/contact' },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ContactPage() {
  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': 'https://xn--beam-yqa.fr/ressources/contact',
    name: 'Contactez Beamô',
    description: 'Contactez Beamô pour toutes vos questions sur la gestion de copropriété. Réponse garantie sous 48h.',
    mainEntity: {
      '@type': 'LocalBusiness',
      name: 'Beamô',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '2 Place d\'Evreux, BP 110',
        addressLocality: 'Vernon Cedex',
        postalCode: '27201',
        addressCountry: 'FR'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 49.0937,
        longitude: 1.4850
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+33-7-75-70-70-99',
        contactType: 'customer service',
        email: 'contact@xn--beam-yqa.fr',
        availableLanguage: 'French',
        areaServed: ['Vernon', 'Évreux', 'Les Andelys', 'Normandie'],
        contactOption: 'TollFree',
        serviceType: 'Property Management'
      },
      openingHours: 'Mo-Fr by appointment',
      hasMap: 'https://maps.app.goo.gl/7ySUYESYdiaxkiNX8',
      sameAs: [
        'https://www.linkedin.com/company/beam%C3%B4/posts/?feedView=all&viewAsMember=true',
        'https://www.facebook.com/profile.php?id=61582074458665',
        'https://maps.app.goo.gl/7ySUYESYdiaxkiNX8'
      ]
    },
    potentialAction: {
      '@type': 'ContactAction',
      name: 'Contacter Beamô',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://xn--beam-yqa.fr/ressources/contact',
        inLanguage: 'fr',
        actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform']
      }
    }
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Beamô',
    url: 'https://xn--beam-yqa.fr',
    email: 'contact@xn--beam-yqa.fr',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+33-7-75-70-70-99',
      contactType: 'customer support',
      areaServed: 'FR',
      availableLanguage: 'French'
    },
    sameAs: [
      'https://www.linkedin.com/company/beam%C3%B4/posts/?feedView=all&viewAsMember=true'
    ]
  }

  return (
    <main>
      {/* Hero */}
      <section className="section bg-muted relative -mt-20 md:-mt-24 pt-20 md:pt-24">
        <div className="container">
          <Card className="border-2 border-black bg-white p-8 shadow-xl">
            <CardContent className="p-0">
              <h1 className="h1">Contactez Beamô</h1>
              <p className="mt-3 text-muted-foreground">
                Une question sur votre copropriété ? Envie d'en savoir plus sur notre approche ?
                <br /> Laissez-nous un message, nous vous répondrons sous 48h.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Form */}
      <section className="section">
        <div className="container">
          <Card className="border-2 border-black bg-white p-8 shadow-xl">
            <CardContent className="p-0">
              <h2 className="h2">Laissez-nous un message</h2>
              <div className="mt-6">
                <ContactForm />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                🔒 Vos informations ne sont utilisées que pour répondre à votre message et ne seront jamais partagées avec des tiers.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Localisation bureau */}
      <section className="section bg-muted">
        <div className="container">
          <OfficeMap />
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-primary">
        <div className="container">
          <Card className="border-2 border-black bg-white p-8 shadow-xl">
            <CardContent className="p-0">
              <h2 className="h2">Discutons de votre projet</h2>
              <p className="mt-2 text-muted-foreground">Nous sommes à votre écoute pour vous accompagner dans la gestion de votre copropriété.</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </main>
  )
}
