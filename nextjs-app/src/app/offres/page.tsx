/**
 * PAGE OFFRES - Présentation des services Beamô
 *
 * Page commerciale présentant les différentes offres de syndic de copropriété.
 * Optimisée pour la conversion et le référencement local.
 *
 * OFFRES PROPOSÉES:
 * - Standard: Gestion classique complète
 * - Hybride: Modèle participatif avec conseil syndical
 * - Clos-Masure: En développement (spécialisé maisons normandes)
 *
 * FONCTIONNALITÉS:
 * - Cartes d'offres avec descriptions détaillées
 * - Métadonnées SEO optimisées pour conversion
 * - Données structurées OfferCatalog pour Google
 * - Design responsive avec animations loading
 * - CTA vers pages de détail/contact
 *
 * MAINTENANCE:
 * - Ajouter nouvelles offres dans offersJsonLd et grid
 * - Modifier tarifs/descriptions selon évolution commerciale
 * - Mettre à jour statut Clos-Masure quand disponible
 * - Vérifier liens CTA vers pages de détail
 */

export const metadata = {
  title: 'Offres de Syndic de Copropriété à Vernon, Évreux, Les Andelys | Beamô',
  description:
    'Découvrez nos offres de syndic de copropriété à Vernon, Évreux et Les Andelys. Services transparents et réactifs adaptés à vos besoins. Changez facilement de syndic.',
  keywords: [
    'offres syndic', 'tarifs syndic', 'prix syndic copropriété', 'Vernon', 'Évreux', 'Les Andelys', 
    'changement syndic', 'gestion hybride', 'transparence', 'devis syndic'
  ],
  openGraph: {
    title: 'Nos Offres Syndic - Transparence totale | Beamô',
    description: 'Offres de syndic transparentes à Vernon, Évreux, Les Andelys. Standard, Hybride, Clos-Masure. Aucune ligne illisible.',
    url: '/offres',
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: '/outils/images/beamocomptearebour.png',
        width: 1200,
        height: 630,
        alt: 'Beamô - Offres de syndic transparentes',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nos Offres Syndic - Transparence totale',
    description: 'Offres de syndic transparentes : Standard, Hybride, Clos-Masure. Aucune ligne illisible.',
  },
  alternates: { canonical: '/offres' },
  robots: {
    index: true,
    follow: true,
  },
}

export default function OffresPage() {
  const offersJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://xn--beam-yqa.fr/offres#services',
    name: 'Offres de Syndic de Copropriété',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Beamô',
      url: 'https://xn--beam-yqa.fr'
    },
    description: 'Découvrez nos solutions adaptées aux copropriétés : Standard, Hybride et Clos-Masure.',
    serviceType: 'Property Management',
    areaServed: [
      { '@type': 'City', name: 'Vernon' },
      { '@type': 'City', name: 'Évreux' },
      { '@type': 'City', name: 'Les Andelys' }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Offres Syndic Beamô',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Offre Standard',
          description: 'Gestion classique de votre copropriété avec transparence et efficacité. Tous les services essentiels d\'un syndic professionnel.',
          category: 'Syndic de copropriété',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Beamô'
          }
        },
        {
          '@type': 'Offer',
          name: 'Offre Hybride',
          description: 'Un modèle participatif avec le conseil syndical pour réduire les coûts. Vous êtes impliqués dans la gestion.',
          category: 'Syndic hybride',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Beamô'
          }
        },
        {
          '@type': 'Offer',
          name: 'Offre Clos-Masure',
          description: 'En cours de développement',
          category: 'Syndic spécialisé',
          availability: 'https://schema.org/PreOrder',
          seller: {
            '@type': 'Organization',
            name: 'Beamô'
          }
        }
      ]
    }
  }

  return (
    <main className="bg-primary">
      <section className="section relative -mt-20 md:-mt-24 pt-20 md:pt-24">
        <div className="container">
          <header className="text-center">
            <h1 className="h1">Nos Offres</h1>
            <p className="mt-2 text-gray-700">Découvrez nos solutions adaptées aux copropriétés.</p>
          </header>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <OffreCard id="syndic" title="Offre Standard" desc="Gestion classique de votre copropriété avec transparence et efficacité. Tous les services essentiels d'un syndic professionnel, avec notre engagement de réactivité." cta="Découvrir" />
            <OffreCard id="conseil" title="Offre Hybride" desc="Un modèle participatif avec le conseil syndical pour réduire les coûts. Vous êtes impliqués dans la gestion, nous vous apportons notre expertise technique." cta="En savoir plus" />
            <OffreCard id="gestion" title="Offre Clos-Masure" desc="En cours de développement..." cta={null} showLoading />
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offersJsonLd) }}
      />
    </main>
  )
}

function OffreCard({ id, title, desc, cta, showLoading }: { id: string; title: string; desc: string; cta: string | null; showLoading?: boolean }) {
  return (
    <div id={id} className="card p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-gray-700">{desc}</p>
      {showLoading && (
        <div className="mt-6">
          <div className="emoji-wave mb-2 flex gap-2 text-2xl"><span>🏢</span><span>🏠</span><span>🏗️</span><span>🏤</span><span>🏬</span><span>🏘️</span><span>🏛️</span><span>🏣</span></div>
          <div className="loading-bar"><div className="bar" /></div>
        </div>
      )}
      {cta && <a className="mt-6 btn" href="#">{cta}</a>}
    </div>
  )
}
