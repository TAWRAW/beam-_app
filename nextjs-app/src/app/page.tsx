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
import Squares from '@/components/sections/Squares'
import FinalCta from '@/components/sections/FinalCta'

// Configuration SEO principale - Point d'entrée du site
export const metadata = {
  title: 'Beamô - Syndic de Copropriété à Vernon, Évreux et Les Andelys',
  description:
    "Beamô, votre syndic de copropriété local à Vernon, Évreux, Les Andelys et ses environs. Proximité, réactivité et écoute au service de votre copropriété. Mettons fin aux lenteurs et aux zones d'ombre.",
  keywords: [
    'syndic', 'syndic de copropriété', 'gestion copropriété', 'Vernon', 'Évreux', 'Les Andelys', 
    'assemblée générale', 'Normandie', 'Eure', 'transparence', 'proximité', 'réactivité'
  ],
  openGraph: {
    title: 'Beamô - Le syndic local et efficace',
    description: "Votre syndic de copropriété local à Vernon, Évreux, Les Andelys. Mettons fin aux lenteurs et aux zones d'ombre.",
    url: '/',
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: '/outils/images/beamocomptearebour.png',
        width: 1200,
        height: 630,
        alt: 'Beamô - Syndic de copropriété local et efficace',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beamô - Le syndic local et efficace',
    description: "Votre syndic de copropriété à Vernon, Évreux, Les Andelys. Proximité, réactivité et transparence.",
  },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Page() {
  // Données structurées JSON-LD pour référencement local
  // Type: LocalBusiness - Aide Google à comprendre notre activité géographique
  const businessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://xn--beam-yqa.fr/#business',
    name: 'Beamô',
    alternateName: 'Beamo',
    url: 'https://xn--beam-yqa.fr',
    logo: 'https://xn--beam-yqa.fr/favicon.png',
    description: 'Syndic de copropriété moderne et transparent à Vernon, Évreux, Les Andelys et leurs environs.',
    telephone: '+33-2-XX-XX-XX-XX',
    email: 'contact@xn--beam-yqa.fr',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Tom Lemeille'
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Vernon',
        addressRegion: 'Normandie'
      },
      {
        '@type': 'City', 
        name: 'Évreux',
        addressRegion: 'Normandie'
      },
      {
        '@type': 'City',
        name: 'Les Andelys',
        addressRegion: 'Normandie'
      }
    ],
    serviceType: 'Property Management',
    makesOffer: [
      {
        '@type': 'Offer',
        name: 'Gestion de copropriété',
        description: 'Gestion complète et transparente de votre copropriété',
        category: 'syndic standard'
      },
      {
        '@type': 'Offer',
        name: 'Gestion hybride',
        description: 'Modèle participatif avec le conseil syndical pour réduire les coûts',
        category: 'syndic hybride'
      }
    ],
    sameAs: [
      'https://www.linkedin.com/company/beam%C3%B4/posts/?feedView=all&viewAsMember=true'
    ],
    knowsAbout: ['syndic', 'copropriété', 'assemblée générale', 'gestion immobilière', 'transparence', 'proximité']
  }

  // Données structurées JSON-LD pour les services
  // Type: Service - Décrit nos prestations pour les moteurs de recherche
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://xn--beam-yqa.fr/#service',
    name: 'Services de Syndic de Copropriété',
    provider: {
      '@id': 'https://xn--beam-yqa.fr/#business'
    },
    description: 'Services de gestion de copropriété transparents et réactifs',
    serviceType: 'Property Management',
    areaServed: 'Normandie',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://xn--beam-yqa.fr/ressources/contact',
      servicePhone: '+33-2-XX-XX-XX-XX'
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero section avec slider principal */}
      <Carousel />

      {/* Section avantages et services Beamô */}
      <Features />

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
