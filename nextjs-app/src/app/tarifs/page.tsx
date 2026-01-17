/**
 * PAGE TARIFS - Transparence tarifaire totale
 *
 * Page commerciale dédiée aux tarifs de syndic Beamô.
 * Objectif SEO: Capturer requêtes "tarif syndic vernon", "prix syndic eure", etc.
 *
 * STRUCTURE:
 * - Hero avec accroche transparence
 * - 3 grilles tarifaires par taille copropriété
 * - Section "Ce qui est inclus" (checklist visuelle)
 * - Section "Prestations exceptionnelles" (hors forfait)
 * - Comparateur marché
 * - FAQ Tarifs
 * - CTA devis gratuit
 *
 * FONCTIONNALITÉS:
 * - Schema.org Service/AggregateOffer pour Google
 * - Métadonnées SEO optimisées conversion
 * - Design responsive avec cards
 * - Prix placeholders (Tom complètera)
 *
 * MAINTENANCE:
 * - Mettre à jour tarifs annuellement
 * - Ajuster fourchettes selon évolution marché
 * - Actualiser comparatifs concurrence
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CheckCircle2, AlertCircle, TrendingDown } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Tarifs Syndic de Copropriété | Transparence Totale | Beamô',
  description:
    'Découvrez nos tarifs de syndic clairs et transparents pour Vernon, Évreux, Gaillon. Forfaits selon taille copropriété, prestations incluses, aucun frais caché. Devis gratuit.',
  keywords: [
    'tarif syndic', 'prix syndic copropriété', 'honoraires syndic', 'coût syndic vernon',
    'tarif syndic évreux', 'prix syndic gaillon', 'devis syndic', 'transparence tarifaire',
    'forfait syndic', 'grille tarifaire syndic'
  ],
  openGraph: {
    title: 'Tarifs Syndic Copropriété | Transparence Totale | Beamô',
    description: 'Tarifs clairs et transparents : forfaits adaptés, prestations incluses, aucun frais caché. Devis gratuit.',
    url: '/tarifs',
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: '/outils/images/beamocomptearebour.png',
        width: 1200,
        height: 630,
        alt: 'Beamô - Tarifs syndic transparents',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs Syndic | Transparence Totale',
    description: 'Forfaits clairs, prestations incluses, aucun frais caché.',
  },
  alternates: { canonical: '/tarifs' },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TarifsPage() {
  // Schema.org pour tarifs (Service avec AggregateOffer)
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://xn--beam-yqa.fr/tarifs#service',
    name: 'Syndic de Copropriété Beamô',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Beamô',
      url: 'https://xn--beam-yqa.fr',
      telephone: '+33-7-75-70-70-99',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '2 Place Jean Paul II',
        addressLocality: 'Vernon',
        postalCode: '27200',
        addressRegion: 'Normandie',
        addressCountry: 'FR',
      },
    },
    description: 'Services de syndic de copropriété avec tarification transparente et forfaits adaptés à chaque taille de copropriété.',
    serviceType: 'Property Management',
    areaServed: [
      { '@type': 'City', name: 'Vernon' },
      { '@type': 'City', name: 'Évreux' },
      { '@type': 'City', name: 'Gaillon' },
      { '@type': 'City', name: 'Les Andelys' },
    ],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '1200',
      highPrice: '4000',
      offerCount: '3',
      priceSpecification: [
        {
          '@type': 'UnitPriceSpecification',
          price: '1200-2000',
          priceCurrency: 'EUR',
          name: 'Petite Copropriété (5-15 lots)',
          unitText: 'YEAR',
        },
        {
          '@type': 'UnitPriceSpecification',
          price: '2000-3500',
          priceCurrency: 'EUR',
          name: 'Moyenne Copropriété (16-50 lots)',
          unitText: 'YEAR',
        },
        {
          '@type': 'UnitPriceSpecification',
          price: '3500+',
          priceCurrency: 'EUR',
          name: 'Grande Copropriété (50+ lots)',
          unitText: 'YEAR',
        },
      ],
    },
  }

  // FAQ Schema.org
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Comment sont calculés les honoraires de syndic Beamô ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nos honoraires sont calculés selon plusieurs critères : le nombre de lots, la complexité de la copropriété (nombre de bâtiments, équipements communs comme ascenseur ou piscine), et l\'historique des impayés. Nous proposons un forfait annuel tout inclus pour éviter les mauvaises surprises.',
        },
      },
      {
        '@type': 'Question',
        name: 'Y a-t-il des frais de dossier ou de changement de syndic ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Non, Beamô ne facture aucun frais de dossier, aucun frais de mise en concurrence, et aucun frais de changement de syndic. Ces frais sont déjà inclus dans notre engagement de transparence.',
        },
      },
      {
        '@type': 'Question',
        name: 'Que faire si le budget de ma copropriété est trop serré ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nous proposons une offre hybride où le conseil syndical participe à certaines tâches administratives, ce qui permet de réduire le forfait. Nous analysons également votre situation pour identifier les optimisations possibles (renégociation contrats, réduction charges inutiles).',
        },
      },
      {
        '@type': 'Question',
        name: 'Les tarifs augmentent-ils chaque année automatiquement ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Non, nos tarifs sont contractuels et valables pour la durée du mandat (maximum 3 ans selon loi ALUR). Toute évolution tarifaire doit être votée en assemblée générale. Nous privilégions la stabilité des honoraires.',
        },
      },
      {
        '@type': 'Question',
        name: 'Comment comparer vos tarifs avec mon syndic actuel ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Demandez à votre syndic actuel le détail de tous les honoraires facturés sur l\'année (forfait de base + prestations exceptionnelles + frais divers). Comparez ce total avec notre forfait tout inclus. Nous pouvons vous aider à analyser votre contrat actuel gratuitement.',
        },
      },
    ],
  }

  return (
    <main className="bg-primary">
      {/* Breadcrumbs */}
      <section className="section relative -mt-20 md:-mt-24 pt-20 md:pt-24">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'Tarifs' }
            ]}
          />
        </div>
      </section>

      {/* Hero */}
      <section className="section">
        <div className="container">
          <header className="text-center">
            <Badge variant="secondary" className="mb-4">Transparence Totale</Badge>
            <h1 className="h1">Tarifs Syndic de Copropriété</h1>
            <p className="mt-3 text-xl text-muted-foreground max-w-3xl mx-auto">
              Des forfaits clairs adaptés à votre copropriété. Pas de surprise, pas de frais cachés, pas de « petites lignes ».
            </p>
          </header>

          {/* CTA Devis */}
          <div className="mt-8 max-w-2xl mx-auto">
            <Link href="/devis" className="block">
              <div className="bg-[#FFC300] border-2 border-black rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                <p className="font-semibold text-black">
                  Ces tarifs sont indicatifs. Recevez une proposition adaptee a votre copropriete
                </p>
                <span className="inline-block mt-2 text-sm font-medium text-black underline">
                  Demander un devis personnalise →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Grilles tarifaires */}
      <section className="section bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="h2">Nos Forfaits Annuels</h2>
            <p className="mt-2 text-muted-foreground">Tarification selon la taille de votre copropriété</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Petite Copropriété */}
            <PricingCard
              title="Petite Copropriété"
              subtitle="5 à 15 lots"
              priceRange="1 200 - 2 000 €"
              priceUnit="/ an HT"
              description="Idéal pour petites résidences et immeubles de centre-ville"
              features={[
                'Gestion comptable complète',
                'Convocations et PV AG',
                'Suivi contrats maintenance',
                'Déclarations fiscales',
                'Extranet 24/7',
                'Réponse garantie 48h',
                'Interlocuteur dédié',
                'Appels illimités',
              ]}
              recommended={false}
            />

            {/* Moyenne Copropriété */}
            <PricingCard
              title="Moyenne Copropriété"
              subtitle="16 à 50 lots"
              priceRange="2 000 - 3 500 €"
              priceUnit="/ an HT"
              description="Notre spécialité : copropriétés de taille humaine"
              features={[
                'Tout le forfait Petite Copro',
                'Mise en concurrence prestataires',
                'Suivi travaux courants',
                'Reporting trimestriel',
                'Gestion sinistres assurance',
                'Relance impayés systématique',
                'Conseil juridique inclus',
                'Visite sur site régulière',
              ]}
              recommended={true}
            />

            {/* Grande Copropriété */}
            <PricingCard
              title="Grande Copropriété"
              subtitle="50 lots et plus"
              priceRange="Sur devis"
              priceUnit="personnalisé"
              description="Tarification adaptée selon complexité et équipements"
              features={[
                'Tout le forfait Moyenne Copro',
                'Gestionnaire principal + assistant',
                'Suivi travaux d\'ampleur',
                'Reportings mensuels détaillés',
                'Gestion équipements complexes',
                'Accompagnement rénovation énergétique',
                'Interface dédiée conseil syndical',
                'Support prioritaire',
              ]}
              recommended={false}
            />
          </div>

          {/* Note explicative */}
          <Card className="mt-8 border-2 border-primary bg-white p-6">
            <CardContent className="p-0 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Comment est calculé votre forfait précis ?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les fourchettes ci-dessus dépendent de plusieurs critères : nombre exact de lots, présence d'équipements
                  communs (ascenseur, espaces verts, piscine), nombre de bâtiments, historique d'impayés, et état général
                  de la copropriété. Demandez un devis personnalisé gratuit pour obtenir votre tarif exact.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ce qui est INCLUS */}
      <section className="section bg-primary">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="h2">Ce qui est INCLUS dans nos forfaits</h2>
            <p className="mt-2 text-muted-foreground">15 prestations essentielles sans surcoût</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {INCLUDED_SERVICES.map((service, index) => (
              <Card key={index} className="border-2 border-black bg-white p-4 shadow-lg">
                <CardContent className="p-0 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">{service.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Prestations exceptionnelles */}
      <section className="section bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="h2">Prestations Exceptionnelles (hors forfait)</h2>
            <p className="mt-2 text-muted-foreground">
              Transparence totale : ces prestations sont TOUJOURS votées en AG avant réalisation
            </p>
          </div>
          <Card className="border-2 border-black bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary border-b-2 border-black">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Prestation</th>
                      <th className="px-6 py-4 text-left font-semibold">Tarification</th>
                      <th className="px-6 py-4 text-left font-semibold">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {EXCEPTIONAL_SERVICES.map((service, index) => (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-foreground">{service.name}</span>
                          <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{service.pricing}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">{service.validation}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparatif marché */}
      <section className="section bg-primary">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="h2">Beamô vs Marché Traditionnel</h2>
            <p className="mt-2 text-muted-foreground">Comparaison pour une copropriété de 30 lots</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Syndic Traditionnel */}
            <Card className="border-2 border-red-500 bg-white p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-xl">Syndic Traditionnel</CardTitle>
                <CardDescription>Modèle classique avec frais additionnels</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Forfait de base</span>
                  <span className="font-semibold">2 400 € HT</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">+ Frais mise en concurrence</span>
                  <span className="text-red-600">+ 150 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">+ Frais gestion sinistre</span>
                  <span className="text-red-600">+ 200 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">+ Frais suivi travaux courants</span>
                  <span className="text-red-600">+ 180 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">+ Frais administratifs divers</span>
                  <span className="text-red-600">+ 120 €</span>
                </div>
                <div className="pt-3 border-t-2 border-black">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total annuel réel</span>
                    <span className="text-2xl font-bold text-red-600">3 050 € HT</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Beamô */}
            <Card className="border-2 border-primary bg-white p-6 shadow-xl">
              <CardHeader className="p-0 pb-4">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">Beamô</CardTitle>
                  <Badge variant="default">Recommandé</Badge>
                </div>
                <CardDescription>Forfait tout inclus, transparence totale</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Forfait annuel tout inclus</span>
                  <span className="font-semibold">2 500 € HT</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Mise en concurrence incluse
                  </span>
                  <span className="text-primary font-medium">0 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Gestion sinistres incluse
                  </span>
                  <span className="text-primary font-medium">0 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Suivi travaux inclus
                  </span>
                  <span className="text-primary font-medium">0 €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Aucun frais caché
                  </span>
                  <span className="text-primary font-medium">0 €</span>
                </div>
                <div className="pt-3 border-t-2 border-black">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total annuel réel</span>
                    <span className="text-2xl font-bold text-primary">2 500 € HT</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium">Économie : 550 € / an (18%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Tarifs */}
      <section className="section bg-muted">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="h2">Questions Fréquentes sur nos Tarifs</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-2 border-black bg-white rounded-lg px-6 shadow-lg"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section bg-primary">
        <div className="container max-w-3xl">
          <Card className="border-2 border-black bg-white p-8 shadow-xl text-center">
            <CardContent className="p-0">
              <h2 className="text-3xl font-bold">Demandez votre devis personnalisé gratuit</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Décrivez-nous votre copropriété en 2 minutes, nous vous envoyons un devis précis et transparent
                sous 48h ouvrées. Sans engagement.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="border-2 border-black">
                  <Link href="/devis">Demander un devis gratuit</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-primary">
                  <Link href="/offres">Voir nos offres détaillées</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  )
}

// ==================== COMPONENTS ====================

interface PricingCardProps {
  title: string
  subtitle: string
  priceRange: string
  priceUnit: string
  description: string
  features: string[]
  recommended: boolean
}

function PricingCard({
  title,
  subtitle,
  priceRange,
  priceUnit,
  description,
  features,
  recommended,
}: PricingCardProps) {
  return (
    <Card
      className={`border-2 ${
        recommended ? 'border-primary shadow-2xl scale-105' : 'border-black shadow-xl'
      } bg-white p-6 transition-transform hover:-translate-y-1`}
    >
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          {recommended && <Badge variant="default">Recommandé</Badge>}
        </div>
        <CardDescription className="text-base">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mb-4">
          <div className="text-3xl font-bold text-primary">{priceRange}</div>
          <div className="text-sm text-muted-foreground">{priceUnit}</div>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="p-0 pt-6">
        <Button asChild className="w-full border-2 border-black">
          <Link href="/devis">Demander un devis</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ==================== DATA ====================

const INCLUDED_SERVICES = [
  {
    title: 'Gestion comptable complète',
    description: 'Tenue des comptes, budget prévisionnel, appels de fonds trimestriels',
  },
  {
    title: 'Convocations et PV AG',
    description: 'Rédaction, envoi recommandé, procès-verbaux détaillés et lisibles',
  },
  {
    title: 'Suivi contrats maintenance',
    description: 'Vérification prestations, relance prestataires, renouvellements',
  },
  {
    title: 'Déclarations fiscales',
    description: 'Déclarations IFU, liasse fiscale, attestations copropriétaires',
  },
  {
    title: 'Extranet 24/7',
    description: 'Accès permanent documents, demandes, votes, historique',
  },
  {
    title: 'Réponse garantie 48h',
    description: 'Engagement écrit sur tous canaux (mail, téléphone, extranet)',
  },
  {
    title: 'Interlocuteur dédié',
    description: 'Un responsable unique identifié pour votre copropriété',
  },
  {
    title: 'Appels téléphoniques illimités',
    description: 'Aucune facturation aux communications (contrairement à certains syndics)',
  },
  {
    title: 'Mise en concurrence prestataires',
    description: 'Comparaison minimum 2 devis pour tous travaux',
  },
  {
    title: 'Suivi travaux courants',
    description: 'Coordination artisans, vérification factures, réception chantier',
  },
  {
    title: 'Gestion sinistres assurance',
    description: 'Déclaration, suivi dossier, coordination expert et réparations',
  },
  {
    title: 'Relance impayés',
    description: 'Relances amiables systématiques, mise en demeure si nécessaire',
  },
  {
    title: 'Conseil juridique de base',
    description: 'Réponses questions courantes loi 1965, règlement copropriété',
  },
  {
    title: 'Reporting régulier',
    description: 'Points d\'avancement trimestriels avec conseil syndical',
  },
  {
    title: 'Archivage documents',
    description: 'Conservation numérique sécurisée tous documents copropriété',
  },
]

const EXCEPTIONAL_SERVICES = [
  {
    name: 'Suivi travaux d\'ampleur',
    description: 'Ravalement façade, réfection toiture, rénovation parties communes >50k€',
    pricing: 'Forfait selon montant travaux',
    validation: 'Vote AG obligatoire',
  },
  {
    name: 'Dossiers subventions ANAH/CEE',
    description: 'Constitution dossier, suivi administratif, justificatifs',
    pricing: 'Forfait 400-800€ selon complexité',
    validation: 'Vote AG obligatoire',
  },
  {
    name: 'Contentieux judiciaires',
    description: 'Procédure tribunal, suivi avocat, audiences (hors impayés standards)',
    pricing: 'Forfait selon procédure',
    validation: 'Vote AG obligatoire',
  },
  {
    name: 'Expertise technique spécifique',
    description: 'Bureau d\'études thermique, diagnostic structure, etc.',
    pricing: 'Sur devis prestataire externe',
    validation: 'Vote AG obligatoire',
  },
  {
    name: 'Accompagnement projet complexe',
    description: 'Extension résidence, modification règlement copropriété majeur',
    pricing: 'Forfait horaire 80€/h',
    validation: 'Vote AG obligatoire',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Comment sont calculés les honoraires de syndic Beamô ?',
    answer:
      'Nos honoraires sont calculés selon plusieurs critères : le nombre de lots, la complexité de la copropriété (nombre de bâtiments, équipements communs comme ascenseur ou piscine), et l\'historique des impayés. Nous proposons un forfait annuel tout inclus pour éviter les mauvaises surprises. Demandez un devis personnalisé pour obtenir votre tarif exact.',
  },
  {
    question: 'Y a-t-il des frais de dossier ou de changement de syndic ?',
    answer:
      'Non, Beamô ne facture aucun frais de dossier, aucun frais de mise en concurrence, et aucun frais de changement de syndic. Ces frais sont déjà inclus dans notre engagement de transparence. Le changement de syndic est totalement gratuit.',
  },
  {
    question: 'Que faire si le budget de ma copropriété est trop serré ?',
    answer:
      'Nous proposons une offre hybride où le conseil syndical participe à certaines tâches administratives, ce qui permet de réduire le forfait de 20 à 30%. Nous analysons également votre situation pour identifier les optimisations possibles (renégociation contrats, réduction charges inutiles). Contactez-nous pour étudier ensemble les solutions adaptées.',
  },
  {
    question: 'Les tarifs augmentent-ils chaque année automatiquement ?',
    answer:
      'Non, nos tarifs sont contractuels et valables pour la durée du mandat (maximum 3 ans selon loi ALUR). Toute évolution tarifaire doit être votée en assemblée générale. Nous privilégions la stabilité des honoraires. En général, nos tarifs restent stables sauf augmentation significative du périmètre de gestion.',
  },
  {
    question: 'Comment comparer vos tarifs avec mon syndic actuel ?',
    answer:
      'Demandez à votre syndic actuel le détail de TOUS les honoraires facturés sur l\'année : forfait de base + prestations exceptionnelles + frais divers (téléphone, mise en concurrence, gestion sinistre, etc.). Comparez ce total avec notre forfait tout inclus. Nous pouvons vous aider à analyser votre contrat actuel gratuitement pour identifier les surcoûts cachés.',
  },
]
