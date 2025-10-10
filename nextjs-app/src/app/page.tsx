/**
 * PAGE D'ACCUEIL PRINCIPALE - Beamô
 *
 * Cette page est le point d'entrée principal du site Beamô.
 * Elle présente les services de syndic de copropriété avec un design moderne
 * et optimisé pour le SEO local (Vernon, Évreux, Les Andelys).
 *
 * STRUCTURE:
 * - Carousel hero avec présentation principale
 * - Section Features (avantages/services)
 * - Section Squares (témoignages/arguments)
 * - CTA final pour conversion
 *
 * SEO:
 * - Métadonnées complètes (title, description, OG, Twitter)
 * - Données structurées JSON-LD pour LocalBusiness et Service
 * - Optimisé pour recherches locales géographiques
 *
 * MAINTENANCE:
 * - Modifier les métadonnées si changement de zones géographiques
 * - Ajuster les données structurées pour nouvelles offres de service
 * - Vérifier les composants sections si changement de layout
 */

import Carousel from '@/components/sections/Carousel'
import Features from '@/components/sections/Features'
import WhyChangeSyndic from '@/components/sections/WhyChangeSyndic'
import InterventionZones from '@/components/sections/InterventionZones'
import Squares from '@/components/sections/Squares'
import FinalCta from '@/components/sections/FinalCta'

// Configuration SEO principale - Point d'entrée du site
export const metadata = {
  title: 'Syndic Copropriété Vernon, Gaillon, Évreux | Réponse 48h | Beamô',
  description:
    "Syndic de copropriété à Vernon, Gaillon et Évreux. Réactivité 48h, transparence totale, tarifs clairs. Votre syndic local en Normandie.",
  keywords: [
    'syndic', 'syndic de copropriété', 'gestion copropriété', 'Vernon', 'Gaillon', 'Évreux', 'Les Andelys',
    'assemblée générale', 'Normandie', 'Eure', 'transparence', 'proximité', 'réactivité', 'syndic local'
  ],
  openGraph: {
    title: 'Syndic Copropriété Vernon, Gaillon, Évreux | Beamô',
    description: "Syndic de copropriété à Vernon, Gaillon et Évreux. Réactivité 48h, transparence totale, tarifs clairs.",
    url: '/',
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: '/outils/images/beamocomptearebour.png',
        width: 1200,
        height: 630,
        alt: 'Beamô - Syndic de copropriété Vernon, Gaillon, Évreux',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Syndic Copropriété Vernon, Gaillon, Évreux | Beamô',
    description: "Syndic local en Normandie : Vernon, Gaillon, Évreux. Réponse garantie sous 48h.",
  },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Page() {
  // Données structurées JSON-LD pour référencement local
  // Type: ProfessionalService - Aide Google à comprendre notre activité professionnelle
  const businessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': 'https://www.xn--beam-yqa.fr/#business',
    name: 'Beamô',
    alternateName: 'Beamo Syndic de Copropriété',
    url: 'https://www.xn--beam-yqa.fr',
    logo: 'https://www.xn--beam-yqa.fr/favicon.png',
    image: [
      'https://www.xn--beam-yqa.fr/outils/images/beamocomptearebour.png'
    ],
    description: 'Syndic de copropriété moderne à Vernon, Evreux et Les Andelys. Réactivité garantie sous 48h, transparence totale, suivi digitalisé 24/7.',
    telephone: '+33775707099',
    email: 'tom.lemeille@beamô.fr',
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Saint-Marcel',
      addressRegion: 'Normandie',
      postalCode: '27950',
      addressCountry: 'FR'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '49.0931',
      longitude: '1.4875'
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Vernon',
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: 'Eure'
        }
      },
      {
        '@type': 'City',
        name: 'Évreux',
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: 'Eure'
        }
      },
      {
        '@type': 'City',
        name: 'Les Andelys',
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: 'Eure'
        }
      },
      {
        '@type': 'City',
        name: 'Louviers'
      },
      {
        '@type': 'City',
        name: 'Gaillon'
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Eure'
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Normandie'
      }
    ],
    sameAs: [
      'https://www.linkedin.com/company/beam%C3%B4/posts/?feedView=all&viewAsMember=true'
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday'
        ],
        opens: '09:00',
        closes: '18:00'
      }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services de gestion de copropriété',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Gestion administrative de copropriété',
            description: 'Gestion complète administrative : convocations AG, procès-verbaux, courriers copropriétaires, suivi conseil syndical.'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Gestion comptable de copropriété',
            description: 'Budget prévisionnel, appels de fonds trimestriels, comptes individuels, clôture annuelle.'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Organisation assemblées générales',
            description: 'Préparation ordre du jour, convocations, animation assemblée, gestion votes, rédaction procès-verbal.'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Suivi des travaux de copropriété',
            description: 'Consultation entreprises, analyse devis, suivi chantier, réception travaux.'
          }
        }
      ]
    },
    founder: {
      '@type': 'Person',
      name: 'Tom Lemeille',
      jobTitle: 'Fondateur'
    }
  }

  // Données structurées JSON-LD pour les services
  // Type: Service - Décrit nos prestations pour les moteurs de recherche
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://www.xn--beam-yqa.fr/#service',
    name: 'Services de Syndic de Copropriété',
    provider: {
      '@id': 'https://www.xn--beam-yqa.fr/#business'
    },
    description: 'Services de gestion de copropriété transparents et réactifs avec réponse garantie sous 48h',
    serviceType: 'Property Management',
    areaServed: [
      {
        '@type': 'State',
        name: 'Normandie'
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Eure'
      }
    ],
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://www.xn--beam-yqa.fr/ressources/contact',
      servicePhone: '+33775707099'
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero section avec slider principal */}
      <Carousel />

      {/* Section avantages et services Beamô */}
      <Features />

      {/* Section "Pourquoi changer de syndic ?" - SEO */}
      <WhyChangeSyndic />

      {/* Section zones d'intervention - SEO local + maillage interne */}
      <InterventionZones />

      {/* Témoignages et arguments de vente */}
      <Squares />

      {/* Call-to-action final pour conversion */}
      <FinalCta />

      {/* Injection des données structurées pour le SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
    </main>
  )
}
