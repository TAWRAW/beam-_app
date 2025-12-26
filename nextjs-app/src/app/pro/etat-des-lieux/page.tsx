/**
 * PAGE ÉTAT DES LIEUX - Service professionnel
 *
 * Page destinée aux professionnels de l'immobilier pour présenter
 * le service d'externalisation des états des lieux.
 *
 * STRUCTURE:
 * - Hero avec accroche principale
 * - 4 avantages en cards
 * - Prestations détaillées avec tarifs
 * - Remises fidélité
 * - Grille tarifaire complète
 * - CTA de contact
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'État des Lieux Professionnel Rouen, Vernon, Mantes-la-Jolie | Dès 70€',
  description: 'Externalisation d\'états des lieux conforme loi ALUR. Service professionnel à Rouen, Vernon, Mantes-la-Jolie. Rapport PDF 24h, signature électronique, photos illimitées. Tarifs dès 70€ HT. Remises -30%.',
  keywords: [
    'état des lieux professionnel',
    'externalisation état des lieux',
    'état des lieux Rouen',
    'état des lieux Vernon',
    'état des lieux Mantes-la-Jolie',
    'agence immobilière',
    'loi ALUR',
    'signature électronique',
    'location meublée',
    'inventaire mobilier',
    'rapport PDF',
    'Seine-Maritime',
    'Eure',
    'Yvelines',
    'Normandie',
    'Île-de-France',
  ],
  openGraph: {
    title: 'État des Lieux Professionnel - Rouen, Vernon, Mantes-la-Jolie',
    description: 'Service d\'externalisation conforme loi ALUR. Rapport 24h, signature électronique. Tarifs dès 70€ HT, remises jusqu\'à -30%.',
    type: 'website',
    url: '/pro/etat-des-lieux',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: { canonical: '/pro/etat-des-lieux' },
}

export default function EtatDesLieuxPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-primary py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              Externalisation état des lieux
            </h1>
            <p className="text-xl text-foreground md:text-2xl">
              <strong>Gagnez du temps et maîtrisez vos coûts !</strong> Déléguez vos états des lieux
              d'entrée/sortie. Nous intervenons dans votre portefeuille d'appartements avec
              professionnalisme et réactivité sur <strong>Rouen et son agglomération</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Coûts maîtrisés',
                description: 'Tarifs transparents',
              },
              {
                title: 'Gain de temps',
                description: 'Libérez vos équipes',
              },
              {
                title: '100% Digital',
                description: 'Signature électronique',
              },
              {
                title: 'Réactivité',
                description: 'Lundi au samedi\nOption sous 24h',
              },
            ].map((item, index) => (
              <Card key={index} className="border-2 border-black bg-white p-8 text-center shadow-xl transition-transform hover:scale-105">
                <CardHeader className="p-0">
                  <CardTitle className="text-2xl text-foreground">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <CardDescription className="whitespace-pre-line text-lg text-muted-foreground">{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nos Prestations */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="inline-block rounded-3xl border-4 border-black bg-primary px-12 py-4">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">Nos prestations</h2>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* État des lieux */}
            <Card className="relative border-2 border-black bg-white p-8 shadow-xl">
              <div className="absolute -top-6 right-6 rounded-2xl bg-primary px-6 py-3 text-xl font-bold text-foreground shadow-lg">
                Dès 70€ HT
              </div>
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-2xl text-foreground">État des lieux</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Inspection complète</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Photos illimitées</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Rapport PDF sous 24h</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Gestion des clés et compteurs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Options meublé */}
            <Card className="relative border-2 border-black bg-white p-8 shadow-xl">
              <div className="absolute -top-6 right-6 rounded-2xl bg-primary px-6 py-3 text-xl font-bold text-foreground shadow-lg">
                + 20€ HT
              </div>
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-2xl text-foreground">Options meublé</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Inventaire mobilier complet</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>État des équipements</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Vaisselle et ustensiles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Photos de tout le mobilier</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Gestion intégrale rendez-vous */}
            <Card className="relative border-2 border-black bg-white p-8 shadow-xl">
              <div className="absolute -top-6 right-6 rounded-2xl bg-primary px-6 py-3 text-xl font-bold text-foreground shadow-lg">
                + 10 € HT
              </div>
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-2xl text-foreground">Gestion intégrale rendez-vous</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Contact direct avec le locataire</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Planification complète</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Confirmation et rappels</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Gestion des imprévus</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Intervention urgente */}
            <Card className="relative border-2 border-black bg-white p-8 shadow-xl">
              <div className="absolute -top-6 right-6 rounded-2xl bg-primary px-6 py-3 text-xl font-bold text-foreground shadow-lg">
                + 15 € HT
              </div>
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-2xl text-foreground">Intervention urgente</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Disponibilité sous 24h</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Désistement de dernière minute</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Absence imprévue</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">●</span>
                    <span>Votre solution de secours</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Remises Fidélité */}
      <section className="bg-[#222] py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-primary md:text-4xl">
            Remises fidélité automatiques
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { discount: '-10%', condition: '3 EDL le même\njour' },
              { discount: '-10%', condition: '10 EDL le même\nmois' },
              { discount: '-20%', condition: '20 EDL le même\nmois' },
              { discount: '-30%', condition: '30 EDL le même\nmois' },
            ].map((item, index) => (
              <Card key={index} className="border-2 border-white bg-white p-8 text-center">
                <CardHeader className="p-0">
                  <CardTitle className="text-4xl text-black">{item.discount}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-3">
                  <CardDescription className="whitespace-pre-line text-lg text-black">{item.condition}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Grille Tarifaire */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="inline-block rounded-3xl border-4 border-black bg-primary px-12 py-4">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">Grille Tarifaire</h2>
            </div>
          </div>

          <div className="mx-auto max-w-4xl space-y-12">
            {/* Tarif par pièces */}
            <div>
              <h3 className="mb-6 text-2xl font-bold text-foreground">État des lieux entrée ou sortie</h3>
              <p className="mb-4 text-lg font-semibold text-muted-foreground">Tarif par pièces</p>
              <div className="overflow-hidden rounded-2xl border-4 border-black shadow-lg">
                <table className="w-full">
                  <thead className="bg-primary">
                    <tr>
                      <th className="border-b-4 border-black p-4 text-left text-lg font-bold text-foreground">
                        Nombre de pièce(s)
                      </th>
                      <th className="border-b-4 border-black p-4 text-right text-lg font-bold text-foreground">
                        Tarif € HT
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      { pieces: 1, tarif: 70 },
                      { pieces: 2, tarif: 90 },
                      { pieces: 3, tarif: 110 },
                      { pieces: 4, tarif: 130 },
                      { pieces: 5, tarif: 150 },
                    ].map((row) => (
                      <tr key={row.pieces} className="border-b border-border last:border-0">
                        <td className="p-4 text-lg text-muted-foreground">{row.pieces}</td>
                        <td className="p-4 text-right text-lg font-semibold text-foreground">
                          {row.tarif}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pourcentage de remise */}
            <div>
              <p className="mb-4 text-lg font-semibold text-muted-foreground">Pourcentage de remise</p>
              <div className="overflow-hidden rounded-2xl border-4 border-black shadow-lg">
                <table className="w-full">
                  <thead className="bg-primary">
                    <tr>
                      <th className="border-b-4 border-black p-4 text-left text-lg font-bold text-foreground">
                        Nombre
                      </th>
                      <th className="border-b-4 border-black p-4 text-left text-lg font-bold text-foreground">
                        Récurrence
                      </th>
                      <th className="border-b-4 border-black p-4 text-right text-lg font-bold text-foreground">
                        Pourcentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      { nombre: 3, recurrence: 'même journée', pourcentage: '10%' },
                      { nombre: 10, recurrence: 'même mois', pourcentage: '10%' },
                      { nombre: 20, recurrence: 'même mois', pourcentage: '20%' },
                      { nombre: 30, recurrence: 'même mois', pourcentage: '30%' },
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-border last:border-0">
                        <td className="p-4 text-lg text-muted-foreground">{row.nombre}</td>
                        <td className="p-4 text-lg text-muted-foreground">{row.recurrence}</td>
                        <td className="p-4 text-right text-lg font-semibold text-foreground">
                          {row.pourcentage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prestations Supplémentaires */}
            <div>
              <p className="mb-4 text-lg font-semibold text-primary">Prestations Supplémentaires</p>
              <div className="overflow-hidden rounded-2xl border-4 border-black shadow-lg">
                <table className="w-full">
                  <thead className="bg-primary">
                    <tr>
                      <th className="border-b-4 border-black p-4 text-left text-lg font-bold text-foreground">
                        Type
                      </th>
                      <th className="border-b-4 border-black p-4 text-right text-lg font-bold text-foreground">
                        Euros HT
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      { type: 'Location meublée', tarif: 20 },
                      { type: 'Gestion rendez-vous intégral', tarif: 10 },
                      { type: 'Rendez-vous sous 24h', tarif: 15 },
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-border last:border-0">
                        <td className="p-4 text-lg text-muted-foreground">{row.type}</td>
                        <td className="p-4 text-right text-lg font-semibold text-foreground">
                          {row.tarif}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zones d'intervention - SEO */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
              Nos zones d'intervention pour vos états des lieux
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Service d'externalisation d'états des lieux disponible dans toute la Normandie et l'Île-de-France.
              Déplacements rapides et professionnalisme garanti.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-2 border-black bg-muted p-8">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-2xl text-foreground">Rouen et agglomération</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <p className="text-muted-foreground">
                  Intervention rapide sur Rouen, Sotteville-lès-Rouen, Mont-Saint-Aignan, Bois-Guillaume,
                  Canteleu, Petit-Quevilly, Grand-Quevilly, Saint-Étienne-du-Rouvray, Maromme, Darnétal,
                  Bihorel et toute la métropole rouennaise.
                </p>
                <p className="text-sm font-semibold text-primary">
                  📍 Disponible 7j/7 • Option urgence 24h
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black bg-muted p-8">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-2xl text-foreground">Vernon et ses alentours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <p className="text-muted-foreground">
                  Service d'états des lieux à Vernon, Saint-Marcel, Pacy-sur-Eure, Gasny, Giverny,
                  La Chapelle-Longueville, Saint-Just, Pressagny-l'Orgueilleux et toutes les communes
                  de la vallée de la Seine.
                </p>
                <p className="text-sm font-semibold text-primary">
                  📍 Déplacement inclus • Tarifs dégressifs
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black bg-muted p-8">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-2xl text-foreground">Mantes-la-Jolie et environs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <p className="text-muted-foreground">
                  États des lieux professionnels à Mantes-la-Jolie, Mantes-la-Ville, Limay, Rosny-sur-Seine,
                  Buchelay, Magnanville, Les Mureaux, Meulan-en-Yvelines et l'ensemble du Mantois.
                </p>
                <p className="text-sm font-semibold text-primary">
                  📍 Lundi au samedi • Remises fidélité
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="mt-8 text-center text-muted-foreground">
            Vous gérez un portefeuille dans une autre zone ? Contactez-nous pour étudier votre demande.
          </p>
        </div>
      </section>

      {/* FAQ - SEO & AI SEO optimisé */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
            Questions fréquentes sur l'externalisation des états des lieux
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Pourquoi externaliser mes états des lieux à un prestataire ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                L'externalisation des états des lieux permet aux agences immobilières et gestionnaires de{' '}
                <strong>gagner un temps précieux</strong> tout en <strong>maîtrisant leurs coûts</strong>.
                Plutôt que de mobiliser vos équipes internes, vous déléguez cette tâche chronophage à un
                professionnel formé. Résultat : vos collaborateurs se concentrent sur des missions à plus
                forte valeur ajoutée (prospection, négociation, relation client), tandis que nous assurons
                des états des lieux conformes à la réglementation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Quelle est la réglementation pour un état des lieux conforme ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Depuis la <strong>loi ALUR de 2014</strong>, l'état des lieux doit suivre un modèle obligatoire
                (décret n°2016-382). Il doit être <strong>contradictoire</strong> (réalisé en présence du
                propriétaire/bailleur et du locataire), <strong>détaillé pièce par pièce</strong>, et mentionner
                l'état de chaque élément (revêtements, équipements, clés, compteurs). L'état des lieux d'entrée
                et de sortie doivent être comparables pour déterminer les éventuelles dégradations. Nos rapports
                respectent scrupuleusement ce cadre légal.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Combien de temps dure un état des lieux professionnel ?
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-muted-foreground">
                <p>
                  La durée varie selon la surface et le type de bien. <strong>Pour un logement en bon état
                  général</strong>, comptez <strong>30 à 45 minutes pour un studio ou T1</strong>,{' '}
                  <strong>45 minutes à 1h pour un T2-T3</strong>, et <strong>1h à 1h30 pour un T4-T5</strong>.
                  Pour une location meublée, ajoutez 15 à 30 minutes pour l'inventaire complet du mobilier
                  et des équipements.
                </p>
                <p>
                  Ces durées sont <strong>indicatives et peuvent varier selon l'état du bien et sa
                  typologie</strong> (présence de dégradations, nombre de pièces annexes, vétusté, etc.).
                  Nous privilégions la rigueur à la rapidité : chaque élément est inspecté et photographié
                  pour éviter tout litige ultérieur. <strong>Aucun surcoût n'est facturé en cas de
                  dépassement</strong> de cette fourchette horaire : le tarif reste fixe selon le nombre
                  de pièces.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Quand vais-je recevoir le rapport d'état des lieux ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Nos rapports sont livrés sous <strong>24 heures maximum</strong> après la visite. Vous recevez
                un document PDF professionnel, signé électroniquement par toutes les parties, avec photos
                illimitées en haute définition. Le rapport est prêt à être archivé et opposable en cas de
                contentieux. Si besoin urgent, nous proposons une option <strong>livraison express sous 12h</strong>.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Comment fonctionne la signature électronique de l'état des lieux ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                La signature électronique est <strong>100% légale et reconnue juridiquement</strong> (règlement
                eIDAS). Après la visite, nous envoyons le rapport par email au propriétaire et au locataire.
                Chaque partie peut relire le document et le signer en ligne via un lien sécurisé. Une fois
                toutes les signatures collectées, le PDF final horodaté est envoyé à tous. Gain de temps garanti :
                plus besoin de rendez-vous supplémentaire juste pour signer !
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Que se passe-t-il en cas de désistement de dernière minute ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Nous comprenons que les imprévus arrivent (locataire absent, retard de remise des clés, etc.).
                C'est pourquoi nous proposons une <strong>option intervention urgente à +15€ HT</strong>.
                Elle vous garantit une disponibilité sous 24h pour reprogrammer l'état des lieux. Vous évitez
                ainsi les vacances locatives prolongées et les retards de paiement. Pour les portefeuilles
                importants, nous pouvons même convenir d'un système de créneaux prioritaires.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Proposez-vous des remises pour les gros volumes ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Oui ! Nos <strong>remises fidélité sont automatiques</strong> : <strong>-10% dès 3 états
                des lieux le même jour</strong>, <strong>-10% pour 10 EDL dans le mois</strong>,{' '}
                <strong>-20% pour 20 EDL/mois</strong>, et <strong>-30% dès 30 EDL/mois</strong>. Idéal
                pour les administrateurs de biens et les agences avec un portefeuille important. Plus vous
                nous confiez de missions, plus vous économisez. Pas de négociation, pas de contrat complexe :
                la remise s'applique directement sur votre facture.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Intervenez-vous pour les locations meublées et saisonnières ?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolument ! Nous réalisons des états des lieux spécifiques pour les{' '}
                <strong>locations meublées</strong> avec un <strong>inventaire exhaustif du mobilier</strong> :
                meubles, électroménager, vaisselle, linge, ustensiles de cuisine, décoration, etc. Chaque
                élément est listé, photographié et son état est décrit précisément. Ce service est proposé
                en option à <strong>+20€ HT</strong>. Parfait pour les locations Airbnb, résidences étudiantes,
                logements meublés touristiques ou résidences de fonction.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="rounded-2xl border-2 border-black bg-white px-6">
              <AccordionTrigger className="text-xl font-bold text-foreground hover:no-underline">
                Proposez-vous des pré-visites d'état des lieux ?
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-muted-foreground">
                <p>
                  Oui ! La <strong>pré-visite d'état des lieux</strong> est un service très apprécié qui permet
                  de <strong>réduire considérablement les conflits et les litiges</strong> lors de l'état des
                  lieux de sortie définitif. Nous intervenons <strong>quelques jours avant la fin du bail</strong>
                  pour dresser un constat anticipé de l'état du logement. Cette visite permet d'identifier en
                  amont les <strong>éventuelles dégradations ou réparations locatives</strong> à effectuer.
                </p>
                <p>
                  Le locataire peut ainsi <strong>effectuer les réparations nécessaires avant la remise des
                  clés</strong>, évitant les retenues sur caution et les contentieux. Pour le propriétaire ou
                  l'agence, c'est l'assurance d'une <strong>récupération du bien en bon état</strong> et d'une
                  transition locative fluide. La pré-visite est facturée selon la même grille tarifaire qu'un
                  état des lieux classique. Un investissement qui évite souvent des coûts bien plus élevés en
                  litiges et vacances locatives.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Réglementation - SEO informationnel */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground md:text-4xl">
            La réglementation de l'état des lieux en France
          </h2>
          <div className="space-y-6 text-muted-foreground">
            <Card className="border-2 border-primary bg-primary/5 p-6">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-xl text-foreground">
                  📋 Le cadre légal : loi ALUR et décret de 2016
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p>
                  L'état des lieux est encadré par la <strong>loi ALUR du 24 mars 2014</strong> et le{' '}
                  <strong>décret n°2016-382 du 30 mars 2016</strong>. Ces textes imposent l'utilisation
                  d'un modèle-type pour garantir l'<strong>égalité de traitement entre propriétaires et
                  locataires</strong>. L'état des lieux doit être établi <strong>contradictoirement</strong> :
                  les deux parties doivent être présentes (ou représentées) et signer le document. En cas
                  d'absence de signature, l'état des lieux peut être contesté en justice.
                </p>
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-3 text-xl font-bold text-foreground">
                ✅ Les mentions obligatoires dans un état des lieux
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">●</span>
                  <span>
                    <strong>Date et heure</strong> de réalisation de l'état des lieux
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">●</span>
                  <span>
                    <strong>Identité et signature</strong> des parties (bailleur, locataire, mandataire)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">●</span>
                  <span>
                    <strong>Adresse complète du logement</strong> concerné
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">●</span>
                  <span>
                    <strong>Description détaillée pièce par pièce</strong> : sols, murs, plafonds, portes,
                    fenêtres, équipements
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">●</span>
                  <span>
                    <strong>État de propreté</strong> de chaque élément et pièce
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">●</span>
                  <span>
                    <strong>Relevé des compteurs</strong> (eau, gaz, électricité)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">●</span>
                  <span>
                    <strong>Nombre et type de clés remises</strong> au locataire
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">●</span>
                  <span>
                    Pour les locations meublées : <strong>inventaire exhaustif du mobilier</strong> et des
                    équipements fournis
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-xl font-bold text-foreground">
                ⚖️ État des lieux d'entrée vs sortie : l'importance de la comparaison
              </h3>
              <p className="mb-4">
                L'état des lieux de sortie doit être <strong>strictement comparable</strong> à l'état des
                lieux d'entrée. C'est en confrontant les deux documents que l'on détermine si le locataire
                a causé des <strong>dégradations locatives</strong> (au-delà de l'usure normale). Si l'état
                de sortie révèle des dommages non mentionnés à l'entrée, le propriétaire peut{' '}
                <strong>retenir une partie de la caution</strong> pour financer les réparations.
              </p>
              <p>
                <strong>Attention :</strong> la notion d'<strong>"usure normale"</strong> est encadrée par
                la loi. Un parquet qui se raye légèrement après 3 ans d'occupation = usure normale. Une
                porte défoncée = dégradation locative. En cas de désaccord, c'est le juge qui tranchera
                en s'appuyant sur les deux états des lieux.
              </p>
            </div>

            <Card className="border-2 border-primary bg-primary/5 p-6">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-xl text-foreground">
                  💡 Pourquoi faire appel à un professionnel pour vos états des lieux ?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p>
                  Un état des lieux réalisé par un <strong>prestataire indépendant et formé</strong> présente
                  plusieurs avantages majeurs : <strong>impartialité totale</strong> entre les parties,{' '}
                  <strong>connaissance à jour de la réglementation</strong>, <strong>rédaction précise et
                  exhaustive</strong> qui limite les litiges, <strong>photos professionnelles en nombre
                  illimité</strong>, et <strong>gain de temps</strong> pour les agences et gestionnaires.
                  De plus, en cas de contentieux devant un tribunal, un état des lieux professionnel a une{' '}
                  <strong>valeur probante renforcée</strong>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* JSON-LD - Données structurées pour SEO et AI */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Externalisation État des Lieux Professionnel',
            description:
              'Service professionnel d\'externalisation d\'états des lieux pour agences immobilières et gestionnaires. Intervention rapide, tarifs transparents dès 70€ HT, rapport PDF sous 24h, photos illimitées, signature électronique.',
            provider: {
              '@type': 'Organization',
              name: 'SASU Beamo Immobilier',
              telephone: '+33775707099',
              email: 'bonjour@beamo-copro.fr',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '8 rue du général Leclerc',
                postalCode: '27950',
                addressLocality: 'Saint-Marcel',
                addressRegion: 'Normandie',
                addressCountry: 'FR',
              },
            },
            areaServed: [
              {
                '@type': 'City',
                name: 'Rouen',
                containedInPlace: {
                  '@type': 'AdministrativeArea',
                  name: 'Seine-Maritime',
                },
              },
              {
                '@type': 'City',
                name: 'Vernon',
                containedInPlace: {
                  '@type': 'AdministrativeArea',
                  name: 'Eure',
                },
              },
              {
                '@type': 'City',
                name: 'Mantes-la-Jolie',
                containedInPlace: {
                  '@type': 'AdministrativeArea',
                  name: 'Yvelines',
                },
              },
              {
                '@type': 'AdministrativeArea',
                name: 'Normandie',
              },
              {
                '@type': 'AdministrativeArea',
                name: 'Île-de-France',
              },
            ],
            serviceType: 'État des lieux locatif',
            availableChannel: {
              '@type': 'ServiceChannel',
              serviceUrl: 'https://www.xn--beam-yqa.fr/pro/etat-des-lieux',
              servicePhone: '+33775707099',
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'EUR',
              lowPrice: '70',
              highPrice: '150',
              offerCount: '4',
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Pourquoi externaliser mes états des lieux à un prestataire ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'L\'externalisation des états des lieux permet aux agences immobilières et gestionnaires de gagner un temps précieux tout en maîtrisant leurs coûts. Plutôt que de mobiliser vos équipes internes, vous déléguez cette tâche chronophage à un professionnel formé.',
                },
              },
              {
                '@type': 'Question',
                name: 'Quelle est la réglementation pour un état des lieux conforme ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Depuis la loi ALUR de 2014, l\'état des lieux doit suivre un modèle obligatoire (décret n°2016-382). Il doit être contradictoire, détaillé pièce par pièce, et mentionner l\'état de chaque élément.',
                },
              },
              {
                '@type': 'Question',
                name: 'Combien de temps dure un état des lieux professionnel ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'La durée varie selon la surface : 30 à 45 minutes pour un studio, 45 minutes à 1h pour un T2-T3, et 1h à 1h30 pour un T4-T5. Pour une location meublée, ajoutez 15 à 30 minutes.',
                },
              },
              {
                '@type': 'Question',
                name: 'Quand vais-je recevoir le rapport d\'état des lieux ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Nos rapports sont livrés sous 24 heures maximum après la visite. Vous recevez un document PDF professionnel, signé électroniquement, avec photos illimitées en haute définition.',
                },
              },
              {
                '@type': 'Question',
                name: 'Comment fonctionne la signature électronique de l\'état des lieux ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'La signature électronique est 100% légale et reconnue juridiquement (règlement eIDAS). Après la visite, nous envoyons le rapport par email. Chaque partie peut relire et signer en ligne via un lien sécurisé.',
                },
              },
              {
                '@type': 'Question',
                name: 'Proposez-vous des remises pour les gros volumes ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Oui ! Nos remises fidélité sont automatiques : -10% dès 3 états des lieux le même jour, -10% pour 10 EDL/mois, -20% pour 20 EDL/mois, et -30% dès 30 EDL/mois.',
                },
              },
              {
                '@type': 'Question',
                name: 'Intervenez-vous pour les locations meublées et saisonnières ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Absolument ! Nous réalisons des états des lieux spécifiques pour les locations meublées avec un inventaire exhaustif du mobilier pour +20€ HT.',
                },
              },
              {
                '@type': 'Question',
                name: 'Proposez-vous des pré-visites d\'état des lieux ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Oui ! La pré-visite d\'état des lieux permet de réduire considérablement les conflits et litiges. Nous intervenons quelques jours avant la fin du bail pour identifier les dégradations. Le locataire peut ainsi effectuer les réparations nécessaires avant la remise des clés, évitant retenues sur caution et contentieux.',
                },
              },
            ],
          }),
        }}
      />

      {/* CTA Final */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
            Prêt à externaliser vos états des lieux ?
          </h2>
          <p className="mb-8 text-xl text-foreground">
            Contactez-nous pour un devis personnalisé ou pour toute question sur nos services.
          </p>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="secondary" className="border-2 border-black text-lg">
              <Link href="/ressources/contact">Demander un devis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-black text-lg">
              <a href="tel:0775707099">07 75 70 70 99</a>
            </Button>
          </div>
          <div className="mt-8 text-sm text-foreground/80">
            <p>SASU Beamo Immobilier - Capital social de 2 500€</p>
            <p>RCS Évreux - SIREN 989 101 829</p>
            <p>8 rue du général Leclerc 27950 Saint-Marcel</p>
          </div>
        </div>
      </section>
    </main>
  )
}
