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
  alternates: { canonical: 'https://www.xn--beam-yqa.fr/offres' },
  robots: {
    index: true,
    follow: true,
  },
}

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import Link from 'next/link'
import { CheckCircle2, Shield } from 'lucide-react'

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
            <p className="mt-2 text-muted-foreground">Découvrez nos solutions adaptées aux copropriétés.</p>
          </header>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <OffreCard
              id="syndic"
              title="Offre Standard"
              desc="Gestion classique de votre copropriété avec transparence et efficacité. Tous les services essentiels d'un syndic professionnel, avec notre engagement de réactivité."
              cta="Découvrir"
              showContractType={true}
            />
            <OffreCard
              id="conseil"
              title="Offre Hybride"
              desc="Un modèle participatif avec le conseil syndical pour réduire les coûts. Vous êtes impliqués dans la gestion, nous vous apportons notre expertise technique."
              cta="En savoir plus"
            />
            <OffreCard
              id="gestion"
              title="Offre Clos-Masure"
              desc="En cours de développement..."
              cta={null}
              showLoading
            />
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

function OffreCard({ id, title, desc, cta, showLoading, showContractType }: {
  id: string;
  title: string;
  desc: string;
  cta: string | null;
  showLoading?: boolean;
  showContractType?: boolean;
}) {
  return (
    <Card id={id} className="border-2 border-black bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
      <CardHeader className="p-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl text-foreground">{title}</CardTitle>
          {showLoading && <Badge variant="secondary">Bientôt disponible</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        <CardDescription className="text-base text-muted-foreground">{desc}</CardDescription>

        {showContractType && (
          <div className="mt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="contrat-type" className="border-none">
                <AccordionTrigger className="text-sm font-medium text-primary hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Découvrir le contrat type syndic
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 text-sm text-muted-foreground">
                  <div className="space-y-4">
                    <p className="font-medium text-foreground">
                      Le contrat type de syndic : votre protection garantie par la loi ALUR
                    </p>
                    <p>
                      Chez Beamô, nous appliquons le <strong>contrat type de syndic</strong> imposé par la loi ALUR.
                      Ce cadre légal vous protège et garantit une relation claire et transparente.
                    </p>

                    <div className="space-y-2">
                      <p className="font-medium text-foreground">Pourquoi c'est important pour vous :</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span><strong>Durée limitée</strong> : Maximum 3 ans, non renouvelable tacitement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span><strong>Rémunération claire</strong> : Toutes les prestations détaillées au forfait</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span><strong>Mise en concurrence</strong> : Vous comparez facilement les offres</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span><strong>Résiliation encadrée</strong> : Conditions de sortie définies à l'avance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span><strong>Transmission garantie</strong> : Documents et fonds transmis au syndic suivant</span>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                      <p className="font-medium text-foreground">Ce qui change pour vous :</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Aucune surprise sur les honoraires</li>
                        <li>• Aucune clause abusive cachée</li>
                        <li>• Vous gardez le contrôle sur votre syndic</li>
                        <li>• Vous pouvez comparer notre offre facilement</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {showLoading && (
          <div className="mt-6">
            <div className="loading-bar"><div className="bar" /></div>
          </div>
        )}
      </CardContent>
      {cta && (
        <CardFooter className="mt-6 p-0">
          <Button asChild className="border-2 border-black">
            <Link href="/ressources/contact">{cta}</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
