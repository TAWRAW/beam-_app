import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Qui sommes-nous ? | Beamô',
  description:
    "Beamô est un syndic de copropriété local et réactif. Découvrez notre mission, nos valeurs et notre approche de gestion transparente et efficace.",
  alternates: { canonical: '/qui-sommes-nous' },
  openGraph: {
    title: 'Qui sommes-nous ? | Beamô',
    description:
      "Syndic local et réactif. Notre mission : une gestion claire et efficace au service des copropriétaires.",
    url: '/qui-sommes-nous',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: { index: true, follow: true },
  keywords: ['Beamô', 'syndic', 'copropriété', 'équipe', 'valeurs', 'Eure', 'Normandie'],
}

export default function AboutPage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Beamô',
    url: 'https://xn--beam-yqa.fr',
    logo: 'https://xn--beam-yqa.fr/favicon.ico',
    sameAs: ['https://xn--beam-yqa.fr'],
  }

  return (
    <main>
      {/* Hero */}
      <section className="section bg-primary relative -mt-20 md:-mt-24 pt-20 md:pt-24">
        <div className="container">
          <div className="card p-10">
            <h1 className="h1">Qui sommes‑nous ?</h1>
            <p className="mt-3 text-gray-700">
              Beamô est un syndic de copropriété local et exigeant. Notre objectif est simple :
              une gestion claire, transparente et efficace, avec un interlocuteur unique et des outils digitaux utiles — pas de gadget.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/offres" className="btn">Découvrir nos offres</Link>
              <Link href="/ressources/contact" className="btn btn-extranet">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Notre ambition */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Notre ambition</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-6">
              <p className="text-gray-700">
                <strong>Mettre fin à l’opacité et à la lenteur</strong> dans la gestion de copropriété.
                Quand on paie pour un service, on mérite de la clarté, des délais tenus et un vrai interlocuteur.
              </p>
              <p className="mt-3 text-gray-700">
                Notre ambition: devenir le référent qualité à Vernon, Évreux et alentours, en prouvant qu’un syndic peut être présent sur le terrain tout en étant très outillé.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral">Notre volonté</h3>
              <ul className="mt-2 space-y-2 text-gray-700">
                <li>• Volonté d’être clairs: des honoraires lisibles, pas de « petites lignes ».</li>
                <li>• Volonté d’être réactifs: délai de réponse garanti (48h ouvrées) et engagements écrits.</li>
                <li>• Volonté d’être responsables: un interlocuteur dédié qui vous connaît et rend des comptes.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi Beamô existe */}
      <section className="section">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Pourquoi Beamô existe</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-6">
              <ul className="text-gray-700 space-y-2">
                <li>• Des mails sans réponse</li>
                <li>• Des PV d’AG incompréhensibles</li>
                <li>• Des frais qui s’empilent</li>
                <li>• Des changements d’interlocuteurs permanents</li>
                <li>• Des promesses de digital sans effet sur le quotidien</li>
              </ul>
              <p className="mt-3 text-gray-700">
                Beamô est né pour <strong>mettre fin</strong> à tout ça. Pas de grand discours: des preuves.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral">Ce que nous faisons différemment</h3>
              <ul className="mt-2 space-y-2 text-gray-700">
                <li>• Un seul responsable par copropriété: joignable, identifié, responsable.</li>
                <li>• Process carrés (sinistres, travaux, AG) avec jalons et délais visibles.</li>
                <li>• Tableau de bord en ligne: demandes, documents, votes, budgets.</li>
                <li>• Comptes clairs: factures classées, reporting trimestriel lisible.</li>
                <li>• Pas de remises marketing: des prix justes et stables.</li>
                <li>• Tech utile: automatiser la paperasse pour libérer du temps terrain.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Position assumée */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Notre position (assumée et clivante)</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-6">
              <p className="text-gray-700">Nous choisissons d’être exigeants.</p>
              <ul className="mt-3 space-y-2 text-gray-700">
                <li>• Mettre fin aux réponses floues: on dit ce qu’on fait et on fait ce qu’on dit.</li>
                <li>• Mettre fin aux « on verra plus tard »: on planifie, on suit, on relance.</li>
                <li>• Mettre fin aux « options cachées »: contrat type ALUR + annexes lisibles.</li>
                <li>• Mettre fin aux gadgets: chaque outil doit servir votre immeuble.</li>
              </ul>
              <p className="mt-3 text-gray-700">
                Ce positionnement ne plaira pas à tout le monde — tant mieux. Il plaira à celles et ceux
                qui veulent de la rigueur, de la visibilité et des résultats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Histoire + portrait */}
      <section className="section">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Notre histoire</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-6">
              <ul className="text-gray-700 space-y-2">
                <li>• 2024–2025 — constat: trop d’attente, trop d’opacité, pas assez d’explications.</li>
                <li>• 2025 — création de Beamô: transparence, délais, responsable unique.</li>
                <li>• 2025 — outillage: portail documents, suivi des tickets, modèles d’AG clairs.</li>
                <li>• 2026 → cap: excellence locale, élargir sans diluer la qualité.</li>
              </ul>
            </div>
            <figure className="card overflow-hidden p-0">
              <Image
                src="/images/about/portrait.jpg"
                alt="Portrait au bureau"
                width={886}
                height={886}
                className="h-full w-full object-cover"
                priority
              />
              <figcaption className="px-4 py-3 text-sm text-gray-600">Au bureau – implication terrain et proximité.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Engagements mesurables */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Nos engagements mesurables</h2>
          <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 list-decimal pl-6">
            <li className="card p-4">Réponse en 48h ouvrées aux sollicitations du conseil syndical.</li>
            <li className="card p-4">Calendrier des actions partagé après chaque AG (qui fait quoi, pour quand).</li>
            <li className="card p-4">Reporting trimestriel: travaux, sinistres, impayés, budget, décisions.</li>
            <li className="card p-4">Documents accessibles 24/7 (contrat, annexes, devis, PV, appels de fonds).</li>
            <li className="card p-4">Transparence tarifaire: pas de frais « surprise », tout est écrit.</li>
            <li className="card p-4">Interlocuteur dédié et back‑up clairement nommé.</li>
          </ol>
        </div>
      </section>

      {/* Le mot du fondateur */}
      <section className="section">
        <div className="container">
          <div className="card p-8">
            <h2 className="h2 font-semibold text-neutral">Le mot du fondateur</h2>
            <blockquote className="mt-4 text-gray-700">
              « Beamô est né d’une idée simple: si c’était ma copropriété, qu’est‑ce que j’exigerais? De la visibilité, des délais tenus et des comptes propres.
              Mon ambition est claire: mettre fin aux habitudes qui font perdre du temps et de l’argent aux copropriétaires. Ma volonté: un syndic local, responsable, lisible. »
              <br />— Tom, fondateur de Beamô
            </blockquote>
          </div>
        </div>
      </section>

      {/* Attentes */}
      <section className="section bg-gray-50">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Ce à quoi vous pouvez vous attendre</h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <li className="card p-4">Des règles du jeu claires, dès le premier rendez‑vous.</li>
            <li className="card p-4">Des explications pédagogiques (Loi de 1965 & co, sans jargon inutile).</li>
            <li className="card p-4">Des actions visibles (pas seulement des promesses).</li>
            <li className="card p-4">Des AG utiles: ordre du jour concret, décisions applicables, PV lisible.</li>
          </ul>
        </div>
      </section>

      {/* Option courte */}
      <section className="section">
        <div className="container">
          <div className="card p-6">
            <h2 className="h2 font-semibold text-neutral">En bref</h2>
            <p className="mt-3 text-gray-700">
              <strong>Beamô</strong>, c’est l’ambition de mettre fin à l’opacité et à la lenteur en copropriété.
              Notre volonté: un syndic local, responsable et lisible. Un interlocuteur dédié, des engagements écrits, des comptes clairs.
              Clivant? Oui. Parce qu’on préfère les résultats aux promesses.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="section">
        <div className="container">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-semibold">Envie d’un syndic qui assume ses résultats ?</h2>
            <p className="mt-3 text-gray-700">Parlez‑nous de votre copropriété — on vous répond sous 48h ouvrées.</p>
            <div className="mt-6">
              <Link href="/ressources/contact" className="btn">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-semibold">Prêt à échanger sur votre copropriété ?</h2>
            <p className="mt-3 text-gray-700">Contactez‑nous, on vous répond sous 48h et on vous explique notre méthode.</p>
            <div className="mt-6">
              <Link href="/ressources/contact" className="btn">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
    </main>
  )
}
