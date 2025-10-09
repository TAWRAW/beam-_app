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

export const metadata: Metadata = {
  title: 'Externalisation État des Lieux - Service Professionnel',
  description: 'Service d\'externalisation d\'états des lieux pour professionnels de l\'immobilier. Tarifs transparents dès 70€ HT, réactivité 24h, 100% digital. Remises fidélité automatiques.',
  keywords: ['état des lieux', 'externalisation', 'professionnel', 'immobilier', 'Rouen', 'gestion locative', 'rapport PDF'],
  openGraph: {
    title: 'Externalisation État des Lieux - Beamô',
    description: 'Déléguez vos états des lieux avec professionnalisme et réactivité. Tarifs transparents et remises fidélité.',
    type: 'website',
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
            <h1 className="mb-6 text-4xl font-bold text-black md:text-5xl lg:text-6xl">
              Externalisation état des lieux
            </h1>
            <p className="text-xl text-black md:text-2xl">
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
              <div
                key={index}
                className="rounded-3xl border-4 border-black bg-white p-8 text-center shadow-lg transition-transform hover:scale-105"
              >
                <h3 className="mb-2 text-2xl font-bold text-black">{item.title}</h3>
                <p className="whitespace-pre-line text-lg text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nos Prestations */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="inline-block rounded-3xl border-4 border-black bg-primary px-12 py-4">
              <h2 className="text-3xl font-bold text-black md:text-4xl">Nos prestations</h2>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* État des lieux */}
            <div className="relative rounded-3xl border-4 border-black bg-white p-8 shadow-lg">
              <div className="absolute -top-6 right-6 rounded-2xl bg-primary px-6 py-3 text-xl font-bold text-black shadow-lg">
                Dès 70€ HT
              </div>
              <h3 className="mb-6 text-2xl font-bold text-black">État des lieux</h3>
              <ul className="space-y-3 text-lg text-gray-700">
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
            </div>

            {/* Options meublé */}
            <div className="relative rounded-3xl border-4 border-black bg-white p-8 shadow-lg">
              <div className="absolute -top-6 right-6 rounded-2xl bg-primary px-6 py-3 text-xl font-bold text-black shadow-lg">
                + 20€ HT
              </div>
              <h3 className="mb-6 text-2xl font-bold text-black">Options meublé</h3>
              <ul className="space-y-3 text-lg text-gray-700">
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
            </div>

            {/* Gestion intégrale rendez-vous */}
            <div className="relative rounded-3xl border-4 border-black bg-white p-8 shadow-lg">
              <div className="absolute -top-6 right-6 rounded-2xl bg-primary px-6 py-3 text-xl font-bold text-black shadow-lg">
                + 10 € HT
              </div>
              <h3 className="mb-6 text-2xl font-bold text-black">Gestion intégrale rendez-vous</h3>
              <ul className="space-y-3 text-lg text-gray-700">
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
            </div>

            {/* Intervention urgente */}
            <div className="relative rounded-3xl border-4 border-black bg-white p-8 shadow-lg">
              <div className="absolute -top-6 right-6 rounded-2xl bg-primary px-6 py-3 text-xl font-bold text-black shadow-lg">
                + 15 € HT
              </div>
              <h3 className="mb-6 text-2xl font-bold text-black">Intervention urgente</h3>
              <ul className="space-y-3 text-lg text-gray-700">
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
            </div>
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
              <div
                key={index}
                className="rounded-3xl border-4 border-white bg-white p-8 text-center shadow-lg"
              >
                <div className="mb-3 text-4xl font-bold text-black">{item.discount}</div>
                <p className="whitespace-pre-line text-lg text-gray-700">{item.condition}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grille Tarifaire */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="inline-block rounded-3xl border-4 border-black bg-primary px-12 py-4">
              <h2 className="text-3xl font-bold text-black md:text-4xl">Grille Tarifaire</h2>
            </div>
          </div>

          <div className="mx-auto max-w-4xl space-y-12">
            {/* Tarif par pièces */}
            <div>
              <h3 className="mb-6 text-2xl font-bold text-black">État des lieux entrée ou sortie</h3>
              <p className="mb-4 text-lg font-semibold text-gray-700">Tarif par pièces</p>
              <div className="overflow-hidden rounded-2xl border-4 border-black shadow-lg">
                <table className="w-full">
                  <thead className="bg-primary">
                    <tr>
                      <th className="border-b-4 border-black p-4 text-left text-lg font-bold text-black">
                        Nombre de pièce(s)
                      </th>
                      <th className="border-b-4 border-black p-4 text-right text-lg font-bold text-black">
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
                      <tr key={row.pieces} className="border-b border-gray-200 last:border-0">
                        <td className="p-4 text-lg text-gray-700">{row.pieces}</td>
                        <td className="p-4 text-right text-lg font-semibold text-black">
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
              <p className="mb-4 text-lg font-semibold text-gray-700">Pourcentage de remise</p>
              <div className="overflow-hidden rounded-2xl border-4 border-black shadow-lg">
                <table className="w-full">
                  <thead className="bg-primary">
                    <tr>
                      <th className="border-b-4 border-black p-4 text-left text-lg font-bold text-black">
                        Nombre
                      </th>
                      <th className="border-b-4 border-black p-4 text-left text-lg font-bold text-black">
                        Récurrence
                      </th>
                      <th className="border-b-4 border-black p-4 text-right text-lg font-bold text-black">
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
                      <tr key={index} className="border-b border-gray-200 last:border-0">
                        <td className="p-4 text-lg text-gray-700">{row.nombre}</td>
                        <td className="p-4 text-lg text-gray-700">{row.recurrence}</td>
                        <td className="p-4 text-right text-lg font-semibold text-black">
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
                      <th className="border-b-4 border-black p-4 text-left text-lg font-bold text-black">
                        Type
                      </th>
                      <th className="border-b-4 border-black p-4 text-right text-lg font-bold text-black">
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
                      <tr key={index} className="border-b border-gray-200 last:border-0">
                        <td className="p-4 text-lg text-gray-700">{row.type}</td>
                        <td className="p-4 text-right text-lg font-semibold text-black">
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

      {/* CTA Final */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-3xl font-bold text-black md:text-4xl">
            Prêt à externaliser vos états des lieux ?
          </h2>
          <p className="mb-8 text-xl text-black">
            Contactez-nous pour un devis personnalisé ou pour toute question sur nos services.
          </p>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <Link
              href="/ressources/contact"
              className="rounded-full bg-black px-8 py-4 text-lg font-semibold text-primary transition-transform hover:scale-105"
            >
              Demander un devis
            </Link>
            <a
              href="tel:0775707099"
              className="rounded-full border-4 border-black bg-white px-8 py-4 text-lg font-semibold text-black transition-transform hover:scale-105"
            >
              07 75 70 70 99
            </a>
          </div>
          <div className="mt-8 text-sm text-black/80">
            <p>SASU Beamo Immobilier - Capital social de 2 500€</p>
            <p>RCS Évreux - SIREN 989 101 829</p>
            <p>8 rue du général Leclerc 27950 Saint-Marcel</p>
          </div>
        </div>
      </section>
    </main>
  )
}
