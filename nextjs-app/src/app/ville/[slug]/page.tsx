/**
 * PAGES VILLES DYNAMIQUES - SEO Local Géographique
 *
 * Génère automatiquement des pages optimisées pour chaque ville/commune
 * des zones de couverture Beamô (47 villes générées).
 *
 * FONCTIONNALITÉS:
 * - Génération statique (SSG) pour performance optimale
 * - Métadonnées SEO personnalisées par ville
 * - Données structurées LocalBusiness + FAQPage
 * - Contenu adapté avec prépositions grammaticales correctes
 * - Section "villes voisines" pour maillage interne
 * - FAQ personnalisée par zone géographique
 *
 * GÉNÉRATION:
 * - generateStaticParams() crée les routes au build
 * - generateMetadata() génère SEO personnalisé
 * - Données villes dans /lib/cities.ts
 * - Routes: /ville/vernon, /ville/evreux, etc.
 *
 * MAINTENANCE:
 * - Ajouter nouvelles villes dans cities.ts
 * - Modifier template métadonnées si repositionnement
 * - Vérifier données structurées si changement schema.org
 * - Adapter FAQ selon retours terrain par zone
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import Carousel from '@/components/sections/Carousel'
import PartnersLogos from '@/components/sections/PartnersLogos'
import Features from '@/components/sections/Features'
import Squares from '@/components/sections/Squares'
import Services from '@/components/sections/Services'
import CityStats from '@/components/sections/CityStats'
import CityDetailedContent from '@/components/sections/CityDetailedContent'
import FAQ from '@/components/sections/FAQ'
import NearbyCities from '@/components/sections/NearbyCities'
import FinalCta from '@/components/sections/FinalCta'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import { getCityBySlug, getCitySlugs } from '@/lib/cities'
import { getFormattedVilleStats } from '@/lib/ville-stats'
import { getMarcheCommune, marcheVersStatsVille } from '@/lib/marche-copro'

type Params = { slug: string }

export async function generateStaticParams() {
  return getCitySlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = getCityBySlug(params.slug)
  if (!city) return {}

  const prep = city.displayPrep || city.prep || 'à'
  const name = city.displayName || city.name
  const dept = city.department ? ` ${city.department.split('(')[1]?.replace(')', '') || ''}` : ''

  // Titre unique et optimisé pour chaque ville - Double ciblage forme courte + longue
  const title = city.slug === 'rouen'
    ? `Syndic de copropriété à Rouen | Beamô Normandie`
    : `Syndic ${name} | Syndic de Copropriété ${prep} ${name} | Beamô`

  // Description enrichie avec "nouveau" et éléments différenciants
  const description = city.slug === 'rouen'
    ? `2 785 copropriétés à Rouen cherchent réactivité et transparence. Beamô propose un syndic tech, local et accessible, spécialisé dans les copros de 11-50 lots.`
    : `Nouveau syndic de copropriété pour ${name}, basé à Vernon. Indépendant, sans franchise, proximité garantie. L'alternative locale et moderne. Devis gratuit.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.xn--beam-yqa.fr/ville/${city.slug}`,
    },
    openGraph: {
      title: `Syndic ${name} | Syndic de Copropriété ${prep} ${name}`,
      description,
      url: `/ville/${city.slug}`,
      type: 'website',
      locale: 'fr_FR',
      images: [
        {
          url: '/outils/images/beamocomptearebour.png',
          width: 1200,
          height: 630,
          alt: `Beamô - Syndic de copropriété ${prep} ${name}`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Syndic ${name} | Beamô`,
      description,
      images: ['/outils/images/beamocomptearebour.png'],
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
    keywords: [
      `syndic copropriété ${city.name}`,
      `syndic ${city.name} ${city.postalCode || ''}`,
      `changement syndic ${city.name}`,
      `gestion copropriété ${city.name}`,
      `syndic local ${city.name}`,
      `syndic proximité ${city.name} ${city.department?.split('(')[0].trim() || ''}`,
      `assemblée générale ${city.name}`,
      `tarif syndic ${city.name}`,
      `conseil syndical ${city.name}`,
      `charges copropriété ${city.name}`,
      `syndic petite copropriété ${city.name}`,
      `gestionnaire copropriété ${city.name}`,
      ...(city.neighborhoods || [])
    ],
  }
}

export default async function CityPage({ params }: { params: Params }) {
  const city = getCityBySlug(params.slug)
  if (!city) notFound()
  const prep = city.displayPrep || city.prep || 'à'
  const label = city.displayName || city.name

  // Fetch stats API avec ISR (revalidate tous les 3 mois)
  const anciennesStats = await getFormattedVilleStats(city.slug, city.postalCode)

  // Le relevé de l'observatoire fait foi quand il existe : l'ancienne source est
  // restée au 4ᵉ trimestre 2025 et filtre par nom de commune, ce qui sous-compte.
  // Sans ça, cette page et /observatoire/<ville> annonçaient deux nombres différents
  // pour la même commune tout en se liant l'une à l'autre.
  const marche = city.inseeCode ? await getMarcheCommune(city.inseeCode) : null
  const stats = marche
    ? marcheVersStatsVille(marche, label, {
        departement: anciennesStats?.departement,
        rangDepartemental: anciennesStats?.rangDepartemental,
        rangNational: anciennesStats?.rangNational,
      })
    : anciennesStats

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://www.xn--beam-yqa.fr/#organization',
    name: 'Beamô - Syndic de Copropriété',
    alternateName: 'Beamô',
    description: `Syndic de copropriété ${prep} ${label} - Réactivité 48h garantie, transparence totale, tarifs clairs`,
    url: `https://www.xn--beam-yqa.fr/ville/${city.slug}`,
    logo: 'https://www.xn--beam-yqa.fr/logo.png',
    image: 'https://www.xn--beam-yqa.fr/og-image.jpg',
    priceRange: '€€',
    telephone: '+33-7-75-70-70-99',
    email: 'contact@xn--beam-yqa.fr',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2 Place d\'Evreux, BP 110',
      addressLocality: 'Vernon Cedex',
      postalCode: '27201',
      addressRegion: 'Normandie',
      addressCountry: 'FR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 49.0928,
      longitude: 1.4850,
    },
    areaServed: [
      {
        '@type': 'City',
        name: city.name,
        ...(city.department && { containedIn: city.department }),
      },
      ...(city.neighborhoods
        ? city.neighborhoods.map((neighborhood) => ({
          '@type': 'Place',
          name: neighborhood,
        }))
        : []),
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services de syndic de copropriété',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Gestion administrative de copropriété',
            description: 'Tenue de la comptabilité, préparation AG, rédaction PV, gestion impayés',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Gestion technique de copropriété',
            description: 'Suivi contrats maintenance, organisation travaux, gestion urgences 24h/24',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Accompagnement conseil',
            description: 'Conseil rénovation, demandes subventions ANAH/CEE, optimisation énergétique',
          },
        },
      ],
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    paymentAccepted: 'Virement bancaire, Prélèvement automatique',
    currenciesAccepted: 'EUR',
    knowsAbout: [
      'Syndic de copropriété',
      'Gestion immobilière',
      'Assemblée générale',
      'Travaux copropriété',
      'Comptabilité copropriété',
      'Rénovation énergétique',
      'Subventions ANAH',
    ],
    sameAs: [
      'https://www.xn--beam-yqa.fr',
    ],
  }

  return (
    <main className="min-h-screen">
      <Carousel cityLabel={label} cityPrep={prep} showCta={true} />
      <PartnersLogos />

      <div className="sr-only">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: `${label}` }
          ]}
        />
      </div>
      <Features />
      <Squares />
      <section className="section">
        <div className="container">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Syndic de Copropriété {prep} {label} - Beamô
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-3">
            Votre syndic local {prep} {label}{city.department ? ` (${city.department})` : ''} - Réactivité 48h garantie
          </p>
          <p className="mt-3 text-muted-foreground">
            Beamô accompagne les copropriétés {prep} {label}{city.department ? ` (${city.department})` : ''} avec une approche locale,
            transparente et réactive. Nous mettons à votre disposition un interlocuteur unique, des outils digitaux pour le suivi,
            et des process clairs pour la tenue des assemblées générales, la gestion des prestataires et le suivi des travaux.
          </p>
        </div>
      </section>
      <Services />

      {/* Stats copropriétés ANAH - Contenu unique vs concurrence.
          Rouen était masqué depuis novembre 2025 (« données API incorrectes ») : le
          relevé de l'observatoire, filtré par code INSEE, corrige la cause. */}
      {stats && (marche || city.slug !== 'rouen') && <CityStats stats={stats} ville={label} />}

      {/* Renvoi vers le relevé détaillé : maillage réciproque avec l'observatoire,
          qui porte les chiffres complets (tranches, syndics, plus grandes copros). */}
      {city.inseeCode && (
        <section className="section">
          <div className="container">
            <div className="mx-auto max-w-3xl border-2 border-black bg-white p-6 text-center shadow-lg">
              <h2 className="text-xl font-bold text-neutral">
                Le parc de copropriétés {prep} {label}, en détail
              </h2>
              <p className="mt-2 text-muted-foreground">
                Nombre de copropriétés, taille médiane, répartition par tranche, syndics déclarés
                et plus grandes résidences : notre relevé du registre national, mis à jour chaque
                trimestre.
              </p>
              <Link
                href={`/observatoire/${city.slug}`}
                className="mt-5 inline-block border-2 border-black bg-primary px-6 py-3 font-bold text-primary-foreground shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000]"
              >
                Voir les chiffres {prep} {label}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contenu enrichi SEO - 800-1000 mots */}
      <CityDetailedContent ville={label} prep={prep} neighborhoods={city.neighborhoods} citySlug={city.slug} />

      <FAQ
        items={city.slug === 'rouen' ? [
          { q: `Combien coûte un syndic de copropriété à ${label} ?`, a: 'À Rouen, les honoraires de syndic varient généralement entre 15 et 30 € par lot/an pour une copropriété moyenne (11-50 lots). Beamô pratique une tarification transparente, sans frais cachés ni prestations facturées en supplément. Nous détaillons chaque poste dans le contrat, conformément à la loi ALUR.' },
          { q: `Pourquoi changer de syndic à ${label} ?`, a: 'Sur 2 785 copropriétés rouennaises, beaucoup rencontrent les mêmes difficultés : gestionnaire injoignable, facturation opaque, manque de réactivité sur les urgences (fuites, pannes ascenseur). La loi ALUR facilite le changement : il suffit d\'un vote en assemblée générale à la majorité absolue.' },
          { q: `Quelle est votre zone d'intervention autour de ${label} ?`, a: 'Depuis notre siège à Vernon, nous couvrons toute la métropole Rouen Normandie et les communes limitrophes (Bois-Guillaume, Mont-Saint-Aignan, Sotteville-lès-Rouen, Le Petit-Quevilly, etc.). Notre organisation moderne nous permet d\'assurer la même réactivité qu\'un syndic local, avec des visites régulières programmées et des interventions d\'urgence sous 24h.' },
          { q: `Proposez-vous un extranet pour gérer la copropriété ?`, a: 'Oui, nous mettons à disposition un extranet moderne accessible 24h/24 où vous pouvez consulter tous les documents de votre copropriété (PV, contrats, factures), suivre les interventions en temps réel, et communiquer avec votre gestionnaire.' },
          { q: `Intervenez-vous ${prep} ${label} et dans quels quartiers ?`, a: `Oui, nous couvrons ${label} et tous ses quartiers${city.neighborhoods ? ` (${city.neighborhoods.join(', ')})` : ''}, ainsi que les communes limitrophes. Notre proximité nous permet d'intervenir rapidement partout dans la zone.` },
          { q: `Organisez-vous les assemblées générales ${prep} ${label} ?`, a: `Oui, nous nous occupons de toute l'organisation : convocations dans les délais légaux, préparation de l'ordre du jour avec le conseil syndical, rédaction du budget prévisionnel, tenue de l'AG (en présentiel ou visioconférence), et rédaction du procès-verbal dans les délais impartis.` },
        ] : [
          { q: `Quel est le délai de réponse de votre syndic ${prep} ${label} ?`, a: 'Nous nous engageons à répondre sous 48h ouvrées maximum à toutes vos demandes. Pour les urgences (fuite d\'eau, problème de chauffage, sécurité), nous intervenons dans les plus brefs délais, souvent le jour même.' },
          { q: `Comment se passe un changement de syndic ${prep} ${label} ?`, a: `Le changement de syndic est simple : après un audit gratuit de votre copropriété, nous préparons la résolution pour l'assemblée générale. Une fois votée en AG (majorité simple), nous récupérons tous les documents auprès de votre ancien syndic et prenons le relais immédiatement. Aucun frais de changement ne vous sera facturé.` },
          { q: `Proposez-vous un extranet pour gérer la copropriété ?`, a: 'Oui, nous mettons à disposition un extranet moderne accessible 24h/24 où vous pouvez consulter tous les documents de votre copropriété (PV, contrats, factures), suivre les interventions en temps réel, et communiquer avec votre gestionnaire.' },
          { q: `Intervenez-vous ${prep} ${label} et dans quels quartiers ?`, a: `Oui, nous couvrons ${label} et tous ses quartiers${city.neighborhoods ? ` (${city.neighborhoods.join(', ')})` : ''}, ainsi que les communes limitrophes. Notre proximité nous permet d'intervenir rapidement partout dans la zone.` },
          { q: `Quels sont vos honoraires de syndic ${prep} ${label} ?`, a: 'Nos honoraires sont fixes et transparents, adaptés à la taille de votre copropriété. Nous proposons un devis détaillé gratuit après analyse de vos besoins. Pas de frais cachés : toutes les prestations exceptionnelles sont validées en AG avant réalisation.' },
          { q: `Gérez-vous les petites copropriétés ${prep} ${label} ?`, a: 'Absolument ! Nous gérons des copropriétés de toutes tailles, des plus petites (quelques lots) aux plus importantes. Notre service est adapté à chaque taille : vous bénéficiez du même niveau de réactivité et de transparence quelle que soit la taille de votre immeuble.' },
          { q: `Comment sont sélectionnés vos prestataires (plombiers, électriciens...) ?`, a: `Nous travaillons exclusivement avec un réseau de prestataires locaux de confiance, sélectionnés pour leur sérieux et leurs tarifs compétitifs. Pour chaque intervention importante, nous mettons systématiquement en concurrence plusieurs devis que nous soumettons au conseil syndical.` },
          { q: `Organisez-vous les assemblées générales ${prep} ${label} ?`, a: `Oui, nous nous occupons de toute l'organisation : convocations dans les délais légaux, préparation de l'ordre du jour avec le conseil syndical, rédaction du budget prévisionnel, tenue de l'AG (en présentiel ou visioconférence), et rédaction du procès-verbal dans les délais impartis.` },
          { q: `Aidez-vous pour les demandes de subventions (ANAH, CEE) ?`, a: 'Oui, nous accompagnons les copropriétés dans la recherche et le montage des dossiers de subventions pour les travaux de rénovation énergétique : aides ANAH, certificats d\'économie d\'énergie (CEE), MaPrimeRénov\' Copropriétés. Notre objectif est de maximiser les aides dont vous pouvez bénéficier.' },
          { q: `Comment gérez-vous les impayés de charges ?`, a: 'Nous assurons un suivi rigoureux des paiements et mettons en place un processus de recouvrement gradué : relances amiables, mise en demeure, puis si nécessaire procédure judiciaire. Nous tenons le conseil syndical informé régulièrement de l\'état des impayés.' },
        ]}
      />
      <NearbyCities currentSlug={city.slug} />
      <FinalCta />

      {/* Breadcrumb Schema pour améliorer l'indexation */}
      <BreadcrumbSchema
        items={[
          { name: 'Accueil', url: 'https://www.xn--beam-yqa.fr' },
          { name: 'Villes', url: 'https://www.xn--beam-yqa.fr' },
          { name: label, url: `https://www.xn--beam-yqa.fr/ville/${city.slug}` }
        ]}
      />

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
            mainEntity: city.slug === 'rouen' ? [
              { '@type': 'Question', name: `Combien coûte un syndic de copropriété à ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: 'À Rouen, les honoraires de syndic varient généralement entre 15 et 30 € par lot/an pour une copropriété moyenne (11-50 lots). Beamô pratique une tarification transparente, sans frais cachés ni prestations facturées en supplément.' } },
              { '@type': 'Question', name: `Pourquoi changer de syndic à ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: 'Sur 2 785 copropriétés rouennaises, beaucoup rencontrent les mêmes difficultés : gestionnaire injoignable, facturation opaque, manque de réactivité. La loi ALUR facilite le changement : vote en AG à la majorité absolue.' } },
              { '@type': 'Question', name: `Quelle est votre zone d'intervention autour de ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: 'Depuis notre siège à Vernon, nous couvrons toute la métropole Rouen Normandie et communes limitrophes avec la même réactivité qu\'un syndic local.' } },
              { '@type': 'Question', name: 'Proposez-vous un extranet pour gérer la copropriété ?', acceptedAnswer: { '@type': 'Answer', text: 'Oui, extranet accessible 24h/24 pour consulter documents, suivre interventions et communiquer avec votre gestionnaire.' } },
              { '@type': 'Question', name: `Intervenez-vous ${prep} ${label} et dans quels quartiers ?`, acceptedAnswer: { '@type': 'Answer', text: `Oui, nous couvrons ${label} et tous ses quartiers${city.neighborhoods ? ` (${city.neighborhoods.join(', ')})` : ''}, ainsi que les communes limitrophes.` } },
              { '@type': 'Question', name: `Organisez-vous les assemblées générales ${prep} ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: 'Oui, organisation complète : convocations, ordre du jour, budget, tenue AG (présentiel ou visio), PV dans les délais.' } },
            ] : [
              { '@type': 'Question', name: `Quel est le délai de réponse de votre syndic ${prep} ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: 'Nous nous engageons à répondre sous 48h ouvrées maximum à toutes vos demandes. Pour les urgences, nous intervenons dans les plus brefs délais, souvent le jour même.' } },
              { '@type': 'Question', name: `Comment se passe un changement de syndic ${prep} ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: `Audit gratuit, préparation de la résolution AG, vote en assemblée (majorité simple), récupération des documents, prise en main immédiate. Aucun frais de changement facturé.` } },
              { '@type': 'Question', name: 'Proposez-vous un extranet pour gérer la copropriété ?', acceptedAnswer: { '@type': 'Answer', text: 'Oui, extranet accessible 24h/24 pour consulter documents, suivre interventions et communiquer avec votre gestionnaire.' } },
              { '@type': 'Question', name: `Intervenez-vous ${prep} ${label} et dans quels quartiers ?`, acceptedAnswer: { '@type': 'Answer', text: `Oui, nous couvrons ${label} et tous ses quartiers${city.neighborhoods ? ` (${city.neighborhoods.join(', ')})` : ''}, ainsi que les communes limitrophes.` } },
              { '@type': 'Question', name: `Quels sont vos honoraires de syndic ${prep} ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: 'Honoraires fixes et transparents, adaptés à la taille de votre copropriété. Devis détaillé gratuit. Pas de frais cachés.' } },
              { '@type': 'Question', name: `Gérez-vous les petites copropriétés ${prep} ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: 'Oui, nous gérons des copropriétés de toutes tailles avec le même niveau de réactivité et de transparence.' } },
              { '@type': 'Question', name: 'Comment sont sélectionnés vos prestataires ?', acceptedAnswer: { '@type': 'Answer', text: 'Réseau de prestataires locaux de confiance. Mise en concurrence systématique pour les interventions importantes.' } },
              { '@type': 'Question', name: `Organisez-vous les assemblées générales ${prep} ${label} ?`, acceptedAnswer: { '@type': 'Answer', text: 'Oui, organisation complète : convocations, ordre du jour, budget, tenue AG (présentiel ou visio), PV dans les délais.' } },
              { '@type': 'Question', name: 'Aidez-vous pour les demandes de subventions (ANAH, CEE) ?', acceptedAnswer: { '@type': 'Answer', text: "Accompagnement complet pour les dossiers de subventions : ANAH, CEE, MaPrimeRénov' Copropriétés." } },
              { '@type': 'Question', name: 'Comment gérez-vous les impayés de charges ?', acceptedAnswer: { '@type': 'Answer', text: 'Suivi rigoureux et processus de recouvrement gradué : relances amiables, mise en demeure, procédure judiciaire si nécessaire.' } },
            ],
          }),
        }}
      />
    </main>
  )
}
