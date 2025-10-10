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
import Features from '@/components/sections/Features'
import Squares from '@/components/sections/Squares'
import Services from '@/components/sections/Services'
import CityStats from '@/components/sections/CityStats'
import CityDetailedContent from '@/components/sections/CityDetailedContent'
import FAQ from '@/components/sections/FAQ'
import NearbyCities from '@/components/sections/NearbyCities'
import FinalCta from '@/components/sections/FinalCta'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { getCityBySlug, getCitySlugs } from '@/lib/cities'
import { getFormattedVilleStats } from '@/lib/ville-stats'

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
  const title = `Syndic Copropriété ${name} | Réponse 48h | Beamô${dept}`
  const description = `Syndic de copropriété ${prep} ${name} : réactivité garantie sous 48h, transparence totale, tarifs sans surprise. Proximité et expertise locale.`

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
      city.name, name, 'Normandie', 'Eure', 'syndic local', 'réactivité', 'transparence'
    ],
  }
}

export default async function CityPage({ params }: { params: Params }) {
  const city = getCityBySlug(params.slug)
  if (!city) notFound()
  const prep = city.displayPrep || city.prep || 'à'
  const label = city.displayName || city.name

  // Fetch stats API avec ISR (revalidate tous les 3 mois)
  const stats = await getFormattedVilleStats(city.slug, city.postalCode)

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
    telephone: '+33-2-XX-XX-XX-XX',
    email: 'contact@xn--beam-yqa.fr',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2 Place Jean Paul II',
      addressLocality: 'Vernon',
      postalCode: '27200',
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
      <div className="container pt-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: `${label}` }
          ]}
        />
      </div>
      <Carousel cityLabel={label} cityPrep={prep} />
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

      {/* Stats copropriétés ANAH - Contenu unique vs concurrence */}
      {stats && <CityStats stats={stats} ville={label} />}

      {/* Contenu enrichi SEO - 800-1000 mots */}
      <CityDetailedContent ville={label} prep={prep} neighborhoods={city.neighborhoods} citySlug={city.slug} />

      <FAQ
        items={[
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
