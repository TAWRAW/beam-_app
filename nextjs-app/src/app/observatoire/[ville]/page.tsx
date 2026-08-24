/**
 * OBSERVATOIRE DE LA COPROPRIÉTÉ — une page par commune.
 *
 * Intention distincte des pages `/ville/[slug]` : celles-ci vendent le syndic Beamô,
 * celle-ci publie l'état du parc. Le lecteur cherche des chiffres, pas un devis —
 * d'où un titre, un contenu et un maillage différents, pour ne pas se cannibaliser.
 *
 * Données : registre national des copropriétés (ANAH), via l'API du Comptoir de la
 * Copropriété, interrogée par code INSEE (cf. src/lib/marche-copro.ts).
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { aLaVille, cities, deLaVille, getCityBySlug, getNearbyCities } from '@/lib/cities'
import {
  getMarcheCommune,
  libelleTrimestre,
  formatNombre,
  SEUIL_PAGE_DEDIEE,
  type MarcheCommune,
} from '@/lib/marche-copro'
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema'
import BarreTranches from './_components/BarreTranches'
import Lecture from './_components/Lecture'
import QuestionsChiffrees from './_components/QuestionsChiffrees'

type Params = { ville: string }

// Les communes sous le seuil sont écartées au rendu (cf. SEUIL_PAGE_DEDIEE) ;
// on les pré-génère quand même pour que Next serve un 404 propre et stable.
export async function generateStaticParams() {
  return cities.filter((c) => c.inseeCode).map((c) => ({ ville: c.slug }))
}

// Le registre est publié chaque trimestre : une régénération quotidienne suffit.
export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { ville } = await params
  const city = getCityBySlug(ville)
  if (!city?.inseeCode) return {}

  const marche = await getMarcheCommune(city.inseeCode)
  if (marche && marche.total.coproprietes < SEUIL_PAGE_DEDIEE) return {}
  const nom = city.name
  const nb = marche ? formatNombre(marche.total.coproprietes) : ''

  // Le layout applique le gabarit « %s | Beamô » : ne pas répéter la marque ici.
  const annee = marche ? marche.trimestre.actuel.slice(0, 4) : ''
  const title = marche
    ? `${nb} copropriétés ${aLaVille(nom)} : les chiffres ${annee}`
    : `Les copropriétés ${deLaVille(nom)} en chiffres`
  // Description : le chiffre d'abord, puis l'angle qui donne envie de cliquer
  // (la part de petites copropriétés sans syndic professionnel).
  const description = marche
    ? `${nb} copropriétés ${aLaVille(nom)}, ${marche.total.taille_mediane} lots en médiane. ${marche.petites_coproprietes.part} % font moins de 50 lots, et ${marche.petites_coproprietes.part_avec_syndic_professionnel} % seulement ont un syndic professionnel déclaré.`
    : `Le parc de copropriétés ${deLaVille(nom)} : nombre, taille, syndics déclarés et plus grandes résidences. Relevé du registre national des copropriétés.`

  return {
    title,
    description,
    keywords: [
      `copropriétés ${nom}`,
      `nombre de copropriétés ${nom}`,
      `syndic ${nom}`,
      `parc immobilier ${nom}`,
      'registre national des copropriétés',
    ],
    alternates: { canonical: `https://www.xn--beam-yqa.fr/observatoire/${city.slug}` },
    openGraph: {
      title,
      description,
      url: `/observatoire/${city.slug}`,
      type: 'article',
      locale: 'fr_FR',
      siteName: 'Beamô',
      ...(marche
        ? {
            publishedTime: `${annee}-01-01`,
            modifiedTime: new Date().toISOString(),
          }
        : {}),
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

function Chiffre({
  valeur,
  libelle,
  precision,
}: {
  valeur: string
  libelle: string
  precision?: string
}) {
  return (
    <div className="border-2 border-[#0A0A0A] bg-white p-5 shadow-[4px_4px_0_#0A0A0A]">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#5b5b52]">{libelle}</p>
      <p className="mt-2 text-4xl font-black leading-none text-[#0A0A0A] tabular-nums">{valeur}</p>
      {precision && <p className="mt-2 text-sm text-[#5b5b52]">{precision}</p>}
    </div>
  )
}

function schemaDataset(city: { name: string; slug: string }, m: MarcheCommune) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Copropriétés ${deLaVille(city.name)} — relevé ${libelleTrimestre(m.trimestre.actuel)}`,
    description: `Nombre de copropriétés, taille du parc, répartition par tranche de taille et type de syndic déclaré ${aLaVille(city.name)}.`,
    url: `https://www.xn--beam-yqa.fr/observatoire/${city.slug}`,
    creator: { '@type': 'Organization', name: 'Beamô' },
    isBasedOn: 'https://www.registre-coproprietes.gouv.fr/',
    spatialCoverage: { '@type': 'Place', name: city.name },
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Copropriétés recensées', value: m.total.coproprietes },
      { '@type': 'PropertyValue', name: 'Lots recensés', value: m.total.lots },
      { '@type': 'PropertyValue', name: 'Taille médiane (lots)', value: m.total.taille_mediane },
    ],
  }
}

export default async function ObservatoireVillePage({ params }: { params: Promise<Params> }) {
  const { ville } = await params
  const city = getCityBySlug(ville)
  if (!city?.inseeCode) notFound()

  const m = await getMarcheCommune(city.inseeCode)
  if (!m || m.total.coproprietes < SEUIL_PAGE_DEDIEE) notFound()

  const nom = city.name
  const aVille = aLaVille(nom)
  const deVille = deLaVille(nom)
  const voisines = getNearbyCities(city.slug, 6).filter((c) => c.inseeCode)
  const petites = m.petites_coproprietes
  const sansPro = petites.nb - petites.avec_syndic_professionnel
  const maxConstruction = Math.max(...m.construction.map((c) => c.nb), 1)

  return (
    <main
      // Le gabarit du site réserve la hauteur de la navbar fixe avec un `pt-20 md:pt-24`
      // posé sur un conteneur sans fond. Sur une page au fond crème, cette réserve
      // apparaît donc en bande claire. On remonte le <main> sous la réserve et on la
      // recrée à l'intérieur : mise en page identique, bande absorbée, aucun autre
      // gabarit touché.
      className="-mt-20 bg-[#F2F1E6] pt-20 text-[#0A0A0A] md:-mt-24 md:pt-24"
    >
      <script
        type="application/ld+json"
        // Les noms viennent du registre : on neutralise « < » pour qu'aucune valeur
        // ne puisse refermer la balise script.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaDataset(city, m)).replace(/</g, '\\u003c'),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Accueil', url: 'https://www.xn--beam-yqa.fr' },
          { name: 'Observatoire de la copropriété', url: 'https://www.xn--beam-yqa.fr/observatoire' },
          { name: nom, url: `https://www.xn--beam-yqa.fr/observatoire/${city.slug}` },
        ]}
      />

      {/* ---------------- En-tête : la thèse, pas le décor ---------------- */}
      <header className="border-b-2 border-[#0A0A0A]">
        <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
          <nav className="mb-8 text-sm text-[#5b5b52]">
            <Link href="/observatoire" className="underline hover:text-[#0A0A0A]">
              Observatoire de la copropriété
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#0A0A0A]">{nom}</span>
          </nav>

          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F4D0F]">
            Relevé du registre national · {libelleTrimestre(m.trimestre.actuel)}
          </p>

          <h1 className="mt-3 text-4xl font-black leading-[1.05] md:text-6xl">
            Les copropriétés
            <br />
            {deVille} en chiffres
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#0A0A0A] md:text-xl">
            {nom} compte{' '}
            <mark className="bg-[#FFC300] px-1 font-bold decoration-clone">
              {formatNombre(m.total.coproprietes)} copropriétés
            </mark>{' '}
            immatriculées, pour {formatNombre(m.total.lots)} lots. La moitié d&apos;entre elles
            font moins de {m.total.taille_mediane} lots.{' '}
            {sansPro > 0 && (
              <>
                Et sur les {formatNombre(petites.nb)} copropriétés de moins de {petites.seuil_lots} lots,{' '}
                <strong>{formatNombre(sansPro)} n&apos;ont pas de syndic professionnel déclaré</strong> au
                registre.
              </>
            )}
          </p>
        </div>
      </header>

      {/* ---------------- Les quatre chiffres ---------------- */}
      <section className="border-b-2 border-[#0A0A0A]">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Chiffre
              valeur={formatNombre(m.total.coproprietes)}
              libelle="Copropriétés"
              precision={
                m.evolution
                  ? `${m.evolution.delta >= 0 ? '+' : ''}${m.evolution.delta} depuis ${libelleTrimestre(m.trimestre.compare)}`
                  : undefined
              }
            />
            <Chiffre
              valeur={formatNombre(m.total.lots)}
              libelle="Lots recensés"
              precision={`dont ${formatNombre(m.total.lots_habitation)} lots d’habitation`}
            />
            <Chiffre
              valeur={String(m.total.taille_mediane)}
              libelle="Taille médiane"
              precision={`lots — la moyenne, tirée par les grandes résidences, est de ${m.total.taille_moyenne}`}
            />
            <Chiffre
              valeur={`${petites.part} %`}
              libelle={`Moins de ${petites.seuil_lots} lots`}
              precision={`${formatNombre(petites.nb)} copropriétés sur ${formatNombre(m.total.coproprietes)}`}
            />
          </div>

          {m.evolution && m.evolution.delta !== 0 && (
            <p className="mt-6 text-sm leading-relaxed text-[#5b5b52]">
              Entre {libelleTrimestre(m.trimestre.compare)} et{' '}
              {libelleTrimestre(m.trimestre.actuel)}, le parc immatriculé{' '}
              {m.evolution.delta > 0 ? 'a gagné' : 'a perdu'}{' '}
              <strong className="text-[#0A0A0A]">{Math.abs(m.evolution.delta)}</strong>{' '}
              copropriété{Math.abs(m.evolution.delta) > 1 ? 's' : ''}
              {m.evolution.delta_pct !== null && (
                <>
                  , soit {m.evolution.delta_pct > 0 ? '+' : ''}
                  {m.evolution.delta_pct.toString().replace('.', ',')} %
                </>
              )}
              . Une immatriculation nouvelle ne signale pas toujours un immeuble neuf : c&apos;est
              souvent une copropriété ancienne qui se déclare enfin.
            </p>
          )}
        </div>
      </section>

      {/* ---------------- La pièce centrale : taille × syndic ---------------- */}
      <section className="border-b-2 border-[#0A0A0A] bg-white">
        <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-black md:text-3xl">
            Plus la copropriété est petite, moins elle a de syndic professionnel
          </h2>
          <p className="mt-3 max-w-3xl text-[#5b5b52]">
            Chaque barre représente une tranche de taille {aVille}, et la façon dont s&apos;y
            répartissent les syndics déclarés au registre.
          </p>

          <div className="mt-8">
            <BarreTranches tranches={m.tranches} />
          </div>

          <div className="mt-8 border-2 border-[#0A0A0A] bg-[#F2F1E6] p-5">
            <p className="text-sm leading-relaxed">
              <strong>Comment lire « syndic non déclaré »</strong> — la case du registre est vide
              pour cette copropriété au trimestre considéré. Cela ne veut pas dire qu&apos;elle
              n&apos;a pas de syndic : beaucoup de petites copropriétés sont gérées par un
              copropriétaire sans que la déclaration ait suivi, et le registre est souvent en
              retard sur la réalité. C&apos;est un indicateur de parc mal suivi, pas un décompte
              de copropriétés abandonnées.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Lecture du relevé ---------------- */}
      <Lecture m={m} deVille={deVille} />

      {/* ---------------- Les plus grandes ---------------- */}
      {m.top.length > 0 && (
        <section className="border-b-2 border-[#0A0A0A]">
          <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
            <h2 className="text-2xl font-black md:text-3xl">
              Les plus grandes copropriétés {deVille}
            </h2>
            <p className="mt-3 text-[#5b5b52]">
              Classées par nombre total de lots (habitation, stationnement et annexes).
            </p>

            <div className="mt-8 overflow-x-auto border-2 border-[#0A0A0A] bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-[#0A0A0A] bg-[#0A0A0A] text-white">
                    <th className="px-4 py-3 font-bold">Copropriété</th>
                    <th className="px-4 py-3 text-right font-bold">Lots</th>
                    <th className="px-4 py-3 text-right font-bold">dont habitation</th>
                    <th className="px-4 py-3 font-bold">Syndic déclaré</th>
                  </tr>
                </thead>
                <tbody>
                  {m.top.map((c, i) => (
                    <tr
                      key={`${c.nom}-${i}`}
                      className={i % 2 ? 'bg-[#F2F1E6]' : 'bg-white'}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold">{c.nom || 'Sans nom déclaré'}</span>
                        {c.adresse && (
                          <span className="block text-xs text-[#5b5b52]">{c.adresse}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {formatNombre(c.lots)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#5b5b52]">
                        {c.lots_habitation ? formatNombre(c.lots_habitation) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {c.syndic_nom ? (
                          c.syndic_nom
                        ) : (
                          <span className="text-[#5b5b52]">Non déclaré</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Âge du bâti ---------------- */}
      {m.construction.length > 0 && (
        <section className="border-b-2 border-[#0A0A0A] bg-white">
          <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
            <h2 className="text-2xl font-black md:text-3xl">L&apos;âge du parc {deVille}</h2>
            <p className="mt-3 max-w-3xl text-[#5b5b52]">
              La période de construction commande l&apos;essentiel des travaux à venir : ravalement
              et réseaux pour l&apos;ancien, isolation et chauffage pour les décennies
              d&apos;après-guerre.
            </p>

            <ul className="mt-8 space-y-3">
              {m.construction.map((c) => {
                // Une absence de donnée n'est pas une période : elle ne prend pas la
                // couleur des vraies tranches, sinon la barre la plus longue de la page
                // serait « on ne sait pas ».
                const inconnue = c.periode === 'Non renseignée'
                return (
                  <li
                    key={c.periode}
                    className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span
                      className={`text-sm font-bold sm:w-40 sm:shrink-0 ${inconnue ? 'text-[#5b5b52]' : ''}`}
                    >
                      {c.periode}
                    </span>
                    <span className="h-7 flex-1 border-2 border-[#0A0A0A] bg-[#F2F1E6]">
                      <span
                        className={`block h-full ${inconnue ? '' : 'bg-[#0F4D0F]'}`}
                        style={{
                          width: `${Math.round((c.nb / maxConstruction) * 100)}%`,
                          ...(inconnue
                            ? {
                                backgroundImage:
                                  'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(10,10,10,0.18) 5px, rgba(10,10,10,0.18) 10px)',
                              }
                            : {}),
                        }}
                      />
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-[#5b5b52] sm:w-24 sm:text-right">
                      {formatNombre(c.nb)} ({c.part} %)
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ---------------- Questions chiffrées (FAQPage) ---------------- */}
      <QuestionsChiffrees m={m} aVille={aVille} deVille={deVille} nom={nom} />

      {/* ---------------- Méthode ---------------- */}
      <section className="border-b-2 border-[#0A0A0A]">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-xl font-black">D&apos;où viennent ces chiffres</h2>
          <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-[#5b5b52]">
            <p>
              Du{' '}
              <a
                href="https://www.registre-coproprietes.gouv.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#0A0A0A]"
              >
                registre national des copropriétés
              </a>{' '}
              tenu par l&apos;ANAH, où toute copropriété à destination partielle ou totale
              d&apos;habitation doit être immatriculée. Relevé du{' '}
              {libelleTrimestre(m.trimestre.actuel)}
              {m.trimestre.compare && (
                <>, comparé au {libelleTrimestre(m.trimestre.compare)} avec la même méthode</>
              )}
              .
            </p>
            <p>
              Les copropriétés sont identifiées par le code INSEE de la commune ({m.commune.insee}
              ), et non par leur nom : les noms de communes du registre ne sont pas normalisés et
              plusieurs communes françaises partagent le même nom. Les doublons
              d&apos;immatriculation sont écartés.
            </p>
            <p>
              Le registre reste déclaratif. Il sous-estime le parc réel, en particulier les très
              petites copropriétés jamais immatriculées, et ses données de syndic accusent souvent
              un retard d&apos;un ou deux trimestres.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Beamô ---------------- */}
      <section className="border-b-2 border-[#0A0A0A] bg-[#0A0A0A] text-[#F2F1E6]">
        <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
          <h2 className="text-2xl font-black md:text-3xl">
            Beamô est le syndic des petites copropriétés
          </h2>
          {/* L'accroche suit la donnée de la commune : là où la couverture professionnelle
              est déjà large, parler de copropriétés « prises en dernier » contredirait le
              graphique situé juste au-dessus. */}
          <p className="mt-4 max-w-2xl leading-relaxed text-[#F2F1E6]/85">
            {sansPro > 0 && petites.part_avec_syndic_professionnel < 50 ? (
              <>
                Ces {formatNombre(sansPro)} petites copropriétés {aVille} sans syndic professionnel
                déclaré, ce sont celles que les grands cabinets prennent en dernier.
              </>
            ) : (
              <>
                Les {formatNombre(petites.nb)} copropriétés de moins de {petites.seuil_lots} lots{' '}
                {aVille} n&apos;ont pas les mêmes besoins qu&apos;une résidence de 400 lots, ni les
                mêmes moyens.
              </>
            )}{' '}
            C&apos;est notre métier : syndic indépendant basé à Vernon, sans franchise, avec un
            interlocuteur unique.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/ressources/contact"
              className="border-2 border-[#0A0A0A] bg-[#FFC300] px-6 py-3 font-bold text-[#0A0A0A] shadow-[4px_4px_0_#F2F1E6] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#F2F1E6]"
            >
              Demander un devis
            </Link>
            <Link
              href={`/ville/${city.slug}`}
              className="border-2 border-[#F2F1E6] px-6 py-3 font-bold text-[#F2F1E6] transition-colors hover:bg-[#F2F1E6] hover:text-[#0A0A0A]"
            >
              Notre offre {aVille}
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- Communes voisines ---------------- */}
      {voisines.length > 0 && (
        <section>
          <div className="container mx-auto max-w-5xl px-4 py-12">
            <h2 className="text-xl font-black">Les communes voisines</h2>
            <ul className="mt-5 flex flex-wrap gap-3">
              {voisines.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/observatoire/${v.slug}`}
                    className="inline-block border-2 border-[#0A0A0A] bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0_#0A0A0A] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0A0A0A]"
                  >
                    {v.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  )
}
