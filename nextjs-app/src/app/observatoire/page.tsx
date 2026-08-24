/**
 * OBSERVATOIRE DE LA COPROPRIÉTÉ — sommaire.
 *
 * Une ligne par commune couverte, triée par taille de parc, avec l'indicateur qui
 * porte la page : la part des petites copropriétés sans syndic professionnel déclaré.
 */

import Link from 'next/link'
import type { Metadata } from 'next'

import { cities } from '@/lib/cities'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import {
  getMarcheGroupe,
  libelleTrimestre,
  formatNombre,
  SEUIL_PAGE_DEDIEE,
  type MarcheResume,
} from '@/lib/marche-copro'

export const revalidate = 86400

// Le layout applique déjà « %s | Beamô » : pas de marque dans le titre.
export const metadata: Metadata = {
  title: 'Observatoire de la copropriété dans l’Eure et à Rouen',
  description:
    'Le parc de copropriétés commune par commune dans l’Eure et autour de Rouen : nombre, taille, syndics déclarés. Relevé du registre national des copropriétés.',
  keywords: [
    'copropriétés Eure',
    'copropriétés Rouen',
    'nombre de copropriétés',
    'registre national des copropriétés',
    'observatoire copropriété Normandie',
  ],
  alternates: { canonical: 'https://www.xn--beam-yqa.fr/observatoire' },
  openGraph: {
    title: 'Observatoire de la copropriété dans l’Eure et à Rouen',
    description:
      'Le parc de copropriétés commune par commune : nombre, taille, syndics déclarés. Relevé du registre national.',
    url: '/observatoire',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Beamô',
  },
}

export default async function ObservatoirePage() {
  const cibles = cities.filter((c) => c.inseeCode)

  // UN SEUL appel pour les 29 communes (cf. getMarcheCommunes) : la boucle
  // d'appels unitaires saturait le pool PostgreSQL du Comptoir et faisait
  // disparaître silencieusement les deux tiers des communes du tableau.
  const { communes, trimestre } = await getMarcheGroupe(cibles.map((c) => c.inseeCode!))
  const parInsee = new Map(communes.map((r) => [r.insee, r]))

  const releves = cibles
    .map((city) => ({ city, marche: parInsee.get(city.inseeCode!) }))
    .filter((r): r is { city: (typeof cibles)[number]; marche: MarcheResume } => !!r.marche)
    .sort((a, b) => b.marche.total.coproprietes - a.marche.total.coproprietes)

  const totalCopros = releves.reduce((a, r) => a + r.marche.total.coproprietes, 0)
  const totalLots = releves.reduce((a, r) => a + r.marche.total.lots, 0)
  // Communes qui ont réellement une page : la liste structurée ne doit pointer que vers elles.
  const liens = releves
    .filter((r) => r.marche.total.coproprietes >= SEUIL_PAGE_DEDIEE)
    .map((r) => ({ slug: r.city.slug, nom: r.city.name }))

  return (
    <main
      // Le gabarit du site réserve la hauteur de la navbar fixe avec un `pt-20 md:pt-24`
      // posé sur un conteneur sans fond. Sur une page au fond crème, cette réserve
      // apparaît donc en bande claire. On remonte le <main> sous la réserve et on la
      // recrée à l'intérieur : mise en page identique, bande absorbée, aucun autre
      // gabarit touché.
      className="-mt-20 bg-[#F2F1E6] pt-20 text-[#0A0A0A] md:-mt-24 md:pt-24"
    >
      <BreadcrumbSchema
        items={[
          { name: 'Accueil', url: 'https://www.xn--beam-yqa.fr' },
          {
            name: 'Observatoire de la copropriété',
            url: 'https://www.xn--beam-yqa.fr/observatoire',
          },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Communes relevées par l’observatoire de la copropriété Beamô',
            numberOfItems: liens.length,
            itemListElement: liens.map((l, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: l.nom,
              url: `https://www.xn--beam-yqa.fr/observatoire/${l.slug}`,
            })),
          }).replace(/</g, '\\u003c'),
        }}
      />
      <header className="border-b-2 border-[#0A0A0A]">
        <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F4D0F]">
            Registre national des copropriétés
            {trimestre && ` · ${libelleTrimestre(trimestre)}`}
          </p>
          <h1 className="mt-3 text-4xl font-black leading-[1.05] md:text-6xl">
            Observatoire de
            <br />
            la copropriété
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed md:text-xl">
            {formatNombre(totalCopros)} copropriétés et {formatNombre(totalLots)} lots relevés sur{' '}
            {releves.length} communes de l&apos;Eure et de la métropole rouennaise. Commune par
            commune : la taille du parc, son âge, et qui le gère vraiment.
          </p>
        </div>
      </header>

      <section>
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <div className="overflow-x-auto border-2 border-[#0A0A0A] bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-[#0A0A0A] bg-[#0A0A0A] text-white">
                  <th className="px-4 py-3 font-bold">Commune</th>
                  <th className="px-4 py-3 text-right font-bold">Copropriétés</th>
                  <th className="px-4 py-3 text-right font-bold">Taille médiane</th>
                  <th className="px-4 py-3 text-right font-bold">Moins de 50 lots</th>
                  <th className="px-4 py-3 text-right font-bold">…avec syndic pro</th>
                </tr>
              </thead>
              <tbody>
                {releves.map(({ city, marche }, i) => (
                  <tr key={city.slug} className={i % 2 ? 'bg-[#F2F1E6]' : 'bg-white'}>
                    <td className="px-4 py-3">
                      {marche.total.coproprietes >= SEUIL_PAGE_DEDIEE ? (
                        <Link
                          href={`/observatoire/${city.slug}`}
                          className="font-bold underline decoration-[#FFC300] decoration-4 underline-offset-2 hover:text-[#0F4D0F]"
                        >
                          {city.name}
                        </Link>
                      ) : (
                        // Trop peu de copropriétés pour une page dédiée : la donnée
                        // reste dans le tableau, sans lien vers une page vide.
                        <span className="font-bold text-[#5b5b52]">{city.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatNombre(marche.total.coproprietes)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#5b5b52]">
                      {marche.total.taille_mediane} lots
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#5b5b52]">
                      {formatNombre(marche.petites_coproprietes.nb)} ({marche.petites_coproprietes.part} %)
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {/* Une part sur moins de dix copropriétés ne veut rien dire. */}
                      {marche.total.coproprietes >= SEUIL_PAGE_DEDIEE ? (
                        `${marche.petites_coproprietes.part_avec_syndic_professionnel} %`
                      ) : (
                        <span className="text-[#5b5b52]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#5b5b52]">
            Dernière colonne : la part des copropriétés de moins de 50 lots dont un syndic
            professionnel est déclaré au registre. Le reste est géré bénévolement, ou n&apos;a
            simplement jamais mis sa déclaration à jour — le registre est déclaratif et souvent en
            retard.
          </p>
        </div>
      </section>
    </main>
  )
}
