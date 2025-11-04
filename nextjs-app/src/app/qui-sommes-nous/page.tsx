import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import OfficeMap from '@/components/maps/OfficeMap'

export const metadata: Metadata = {
  title: 'Tom Lemeille | J'ai créé Beamô à Vernon',
  description:
    "J'ai lancé Beamô après avoir vu trop de copropriétaires galérer avec leur syndic. C'est pas compliqué : répondre vite, être clair, tenir parole. Ça devrait être la base.",
  alternates: { canonical: 'https://www.xn--beam-yqa.fr/qui-sommes-nous' },
  openGraph: {
    title: 'Tom Lemeille | J'ai créé Beamô à Vernon',
    description:
      "J'ai lancé Beamô après avoir vu trop de copropriétaires galérer avec leur syndic. Répondre vite, être clair, tenir parole.",
    url: '/qui-sommes-nous',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: { index: true, follow: true },
  keywords: ['Tom Lemeille', 'Beamô', 'syndic indépendant', 'Vernon', 'copropriété', 'fondateur', 'Eure', 'Normandie'],
}

export default function AboutPage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Beamô',
    url: 'https://xn--beam-yqa.fr',
    logo: 'https://xn--beam-yqa.fr/favicon.ico',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Manufacture des Capucins, Place Jean Paul II',
      addressLocality: 'Vernon',
      postalCode: '27200',
      addressCountry: 'FR'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 49.0937,
      longitude: 1.4850
    },
    telephone: '+33-7-75-70-70-99',
    email: 'contact@xn--beam-yqa.fr',
    sameAs: [
      'https://www.linkedin.com/company/beam%C3%B4/posts/?feedView=all&viewAsMember=true',
      'https://www.facebook.com/profile.php?id=61582074458665',
      'https://maps.app.goo.gl/7ySUYESYdiaxkiNX8'
    ],
  }

  return (
    <main>
      {/* Hero */}
      <section className="section bg-primary relative -mt-20 md:-mt-24 pt-20 md:pt-24">
        <div className="container">
          <Card className="border-2 border-black bg-white p-10 shadow-xl">
            <CardContent className="p-0">
              <h1 className="h1">Qui sommes‑nous ?</h1>
              <p className="mt-3 text-muted-foreground">
                Beamô est un syndic de copropriété local et exigeant. Notre objectif est simple :
                une gestion claire, transparente et efficace, avec un interlocuteur unique et des outils digitaux utiles — pas de gadget.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild className="border-2 border-black">
                  <Link href="/offres">Découvrir nos offres</Link>
                </Button>
                <Button asChild variant="outline" className="border-2 border-primary">
                  <Link href="/ressources/contact">Nous contacter</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Notre ambition */}
      <section className="section bg-muted">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Notre ambition</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-2 border-black bg-white p-6 shadow-lg">
              <CardContent className="p-0">
                <p className="text-muted-foreground">
                  <strong>Mettre fin à l'opacité et à la lenteur</strong> dans la gestion de copropriété.
                  Quand on paie pour un service, on mérite de la clarté, des délais tenus et un vrai interlocuteur.
                </p>
                <p className="mt-3 text-muted-foreground">
                  Notre ambition: devenir le référent qualité à Vernon, Évreux et alentours, en prouvant qu'un syndic peut être présent sur le terrain tout en étant très outillé.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-black bg-white p-6 shadow-lg">
              <CardContent className="p-0">
                <h3 className="text-lg font-semibold text-neutral">Notre volonté</h3>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>• Volonté d'être clairs: des honoraires lisibles, pas de « petites lignes ».</li>
                  <li>• Volonté d'être réactifs: délai de réponse garanti (48h ouvrées) et engagements écrits.</li>
                  <li>• Volonté d'être responsables: un interlocuteur dédié qui vous connaît et rend des comptes.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pourquoi Beamô existe */}
      <section className="section bg-primary">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Pourquoi Beamô existe</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-2 border-black bg-white p-6 shadow-lg">
              <CardContent className="p-0">
                <ul className="text-muted-foreground space-y-2">
                  <li>• Des mails sans réponse</li>
                  <li>• Des PV d'AG incompréhensibles</li>
                  <li>• Des frais qui s'empilent</li>
                  <li>• Des changements d'interlocuteurs permanents</li>
                  <li>• Des promesses de digital sans effet sur le quotidien et inutilisable par les copropriétaires</li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  Beamô est né pour <strong>mettre fin</strong> à tout ça. Pas de grand discours: des preuves.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-black bg-white p-6 shadow-lg">
              <CardContent className="p-0">
                <h3 className="text-lg font-semibold text-neutral">Ce que nous faisons différemment</h3>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>• Un seul responsable par copropriété: joignable, identifié, responsable.</li>
                  <li>• Process carrés (sinistres, travaux, AG) avec jalons et délais visibles.</li>
                  <li>• Tableau de bord en ligne: demandes, documents, votes, budgets.</li>
                  <li>• Comptes clairs: factures classées, reporting trimestriel lisible.</li>
                  <li>• Pas de remises marketing: des prix justes et stables.</li>
                  <li>• Tech utile: automatiser les tâches redondantes et chronophages pour libérer du temps terrain.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Position assumée */}
      <section className="section bg-muted">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Notre position</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-2 border-black bg-white p-6 shadow-lg">
              <CardContent className="p-0">
                <p className="text-muted-foreground">Nous choisissons d'être exigeants.</p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li>• Mettre fin aux réponses floues: on dit ce qu'on fait et on fait ce qu'on dit.</li>
                  <li>• Mettre fin aux « on verra plus tard »: on planifie, on suit, on relance.</li>
                  <li>• Mettre fin aux gadgets: chaque outil doit servir votre immeuble.</li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  Ce positionnement ne plaira pas à tout le monde — tant mieux. Il plaira à celles et ceux
                  qui veulent de la rigueur, de la visibilité et des résultats.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Le mot du fondateur + portrait */}
      <section className="section bg-primary">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Le mot du fondateur</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-2 border-black bg-white p-8 shadow-xl">
              <CardContent className="p-0">
                <blockquote className="text-muted-foreground">
                  « J'ai créé Beamô parce que je voyais les mêmes problèmes partout.
                  <br /><br />
                  Des copropriétaires qui attendent 3 semaines une réponse. Des assemblées générales où l'on ne comprend rien.
                  Des changements de gestionnaire permanents.
                  <br /><br />
                  Ma conviction : un bon syndic, c'est quelqu'un de joignable qui fait ce qu'il dit. »
                  <br /><br />— Tom Lemeille, Vernon
                </blockquote>
              </CardContent>
            </Card>
            <figure className="overflow-hidden p-0 rounded-2xl border-0">
              <Image
                src="/images/about/portrait.jpg"
                alt="Tom Lemeille, fondateur Beamô syndic copropriété Vernon - Portrait professionnel au bureau Place Jean Paul II"
                width={886}
                height={886}
                className="h-full w-full object-cover"
                priority
              />
              <figcaption className="px-4 py-3 text-sm text-foreground">Au bureau – implication terrain et proximité.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* (Section "Nos engagements mesurables" supprimée à la demande) */}

      {/* (Section fondateur déplacée ci‑dessus, à côté du portrait) */}

      {/* Attentes */}
      <section className="section bg-muted">
        <div className="container">
          <h2 className="h2 font-semibold text-neutral">Ce à quoi vous pouvez vous attendre</h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <li>
              <Card className="border-2 border-black bg-white p-4 shadow-lg">
                <CardContent className="p-0">Des règles du jeu claires, dès le premier rendez‑vous.</CardContent>
              </Card>
            </li>
            <li>
              <Card className="border-2 border-black bg-white p-4 shadow-lg">
                <CardContent className="p-0">Des explications pédagogiques (Loi de 1965 & co, sans jargon inutile).</CardContent>
              </Card>
            </li>
            <li>
              <Card className="border-2 border-black bg-white p-4 shadow-lg">
                <CardContent className="p-0">Des actions visibles (pas seulement des promesses).</CardContent>
              </Card>
            </li>
            <li>
              <Card className="border-2 border-black bg-white p-4 shadow-lg">
                <CardContent className="p-0">Des AG utiles: ordre du jour concret, décisions applicables, PV lisible.</CardContent>
              </Card>
            </li>
          </ul>
        </div>
      </section>

      {/* Option courte */}
      <section className="section bg-primary">
        <div className="container">
          <Card className="border-2 border-black bg-white p-6 shadow-lg">
            <CardContent className="p-0">
              <h2 className="h2 font-semibold text-neutral">En bref</h2>
              <p className="mt-3 text-muted-foreground">
                <strong>Beamô</strong>, c'est l'ambition de mettre fin à l'opacité et à la lenteur en copropriété.
                Notre volonté: un syndic local, responsable et lisible. Un interlocuteur dédié, des engagements écrits, des comptes clairs.
                Clivant? Oui. Parce qu'on préfère les résultats aux promesses.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Localisation bureau */}
      <section className="section bg-muted">
        <div className="container">
          <OfficeMap />
        </div>
      </section>

      {/* CTA final */}
      <section className="section">
        <div className="container">
          <Card className="border-2 border-black bg-white p-8 shadow-xl text-center">
            <CardContent className="p-0">
              <h2 className="text-2xl font-semibold">Envie d'un syndic qui assume ses résultats ?</h2>
              <p className="mt-3 text-muted-foreground">Parlez‑nous de votre copropriété — on vous répond sous 48h ouvrées.</p>
              <div className="mt-6">
                <Button asChild className="border-2 border-black">
                  <Link href="/ressources/contact">Nous contacter</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="section bg-primary">
        <div className="container">
          <Card className="border-2 border-black bg-white p-8 shadow-xl text-center">
            <CardContent className="p-0">
              <h2 className="text-2xl font-semibold">Prêt à échanger sur votre copropriété ?</h2>
              <p className="mt-3 text-muted-foreground">Contactez‑nous, on vous répond sous 48h et on vous explique notre méthode.</p>
              <div className="mt-6">
                <Button asChild className="border-2 border-black">
                  <Link href="/ressources/contact">Nous contacter</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
    </main>
  )
}
