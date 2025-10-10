/**
 * SECTION "POURQUOI CHANGER DE SYNDIC ?" - Landing Page
 *
 * Section SEO détaillant les principales raisons de changer de syndic.
 * Optimisée pour les mots-clés : "changer de syndic", "problèmes syndic",
 * "mauvais syndic", "nouveau syndic".
 *
 * Sources :
 * - Étude IFOP/Bellman : 1/3 des copropriétaires insatisfaits
 * - CLCV : Enquête satisfaction copropriétaires 2021
 * - IRC : Études et rapports copropriété
 */

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function WhyChangeSyndic() {
  return (
    <section className="bg-gradient-to-b from-white to-muted py-20">
      <div className="mx-auto max-w-[1400px] px-6">
        {/* En-tête de section */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Pourquoi changer de syndic de copropriété ?
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Selon une étude IFOP/Bellman<sup className="text-primary">1</sup>, <strong>un tiers des copropriétaires se disent insatisfaits</strong> de la gestion de leur syndic.
            Manque de réactivité, transparence insuffisante et facturation excessive sont les reproches les plus fréquents.
          </p>
        </div>

        {/* Grille des problèmes courants */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Problème 1 : Manque de réactivité */}
          <Card className="border-2 border-black bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="p-0">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="mb-3 text-xl text-foreground">Manque de réactivité</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <p className="text-muted-foreground">
                Absence de réponses rapides aux demandes d'entretien, retards dans la résolution des incidents,
                pannes non traitées. Un syndic peu réactif nuit à la qualité de vie et à la valeur de votre bien.
              </p>
            </CardContent>
          </Card>

          {/* Problème 2 : Mauvaise gestion */}
          <Card className="border-2 border-black bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="p-0">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <CardTitle className="mb-3 text-xl text-foreground">Gestion défaillante</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <p className="text-muted-foreground">
                Travaux en retard, parties communes mal entretenues, dégradation progressive de l'immeuble.
                Une mauvaise gestion entraîne souvent une baisse de la valeur de votre patrimoine immobilier.
              </p>
            </CardContent>
          </Card>

          {/* Problème 3 : Facturation excessive */}
          <Card className="border-2 border-black bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="p-0">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="mb-3 text-xl text-foreground">Frais excessifs</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <p className="text-muted-foreground">
                Honoraires trop élevés, prestations surfacturées, frais cachés incompatibles avec le forfait légal.
                Les charges de copropriété augmentent sans justification claire ni transparence.
              </p>
            </CardContent>
          </Card>

          {/* Problème 4 : Manque de transparence */}
          <Card className="border-2 border-black bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="p-0">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <CardTitle className="mb-3 text-xl text-foreground">Opacité financière</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <p className="text-muted-foreground">
                Comptes peu clairs, décisions en assemblée générale mal expliquées, gestion financière jugée injuste.
                Le manque de transparence génère méfiance et conflits entre copropriétaires.
              </p>
            </CardContent>
          </Card>

          {/* Problème 5 : Non-respect des obligations */}
          <Card className="border-2 border-black bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="p-0">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <CardTitle className="mb-3 text-xl text-foreground">Obligations non respectées</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <p className="text-muted-foreground">
                Assemblées générales bâclées ou en retard, comptes non conformes, nouvelles normes 2025 ignorées
                (DPE collectif, plan pluriannuel de travaux). Votre copropriété se retrouve en difficulté légale.
              </p>
            </CardContent>
          </Card>

          {/* Problème 6 : Conflits récurrents */}
          <Card className="border-2 border-black bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader className="p-0">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <CardTitle className="mb-3 text-xl text-foreground">Relations dégradées</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <p className="text-muted-foreground">
                Tensions permanentes entre syndic et copropriétaires, conseil syndical ignoré,
                communication inexistante. Une relation conflictuelle nuit à la bonne marche de la copropriété.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Encart "Le moment idéal" */}
        <Card className="mb-12 border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5 p-8 md:p-10">
          <CardContent className="p-0">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-bold text-foreground">
                  Le moment idéal pour changer de syndic
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Le changement de syndic se fait en assemblée générale lors du vote de renouvellement du mandat.
                  Il est donc essentiel d'<strong>anticiper cette démarche plusieurs mois avant l'AG</strong> pour préparer
                  les documents, consulter les candidats et communiquer avec les copropriétaires.
                </p>
                <p className="text-muted-foreground">
                  Avec les <strong>nouvelles obligations 2025</strong> (DPE collectif, plan pluriannuel de travaux,
                  interdiction des passoires thermiques), il devient crucial d'avoir un syndic compétent capable
                  d'anticiper et de piloter ces démarches réglementaires.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avantages du changement */}
        <div className="mb-10 text-center">
          <h3 className="mb-6 text-3xl font-bold text-foreground">
            Les bénéfices d'un changement de syndic
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 border-black bg-white p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="p-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <CardTitle className="mb-2 text-base text-foreground">Meilleure gestion</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <CardDescription className="text-sm">Suivi rigoureux, travaux anticipés, immeuble valorisé</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-2 border-black bg-white p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="p-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <CardTitle className="mb-2 text-base text-foreground">Communication claire</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <CardDescription className="text-sm">Réponses rapides, relation de confiance, écoute active</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-2 border-black bg-white p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="p-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="mb-2 text-base text-foreground">Charges optimisées</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <CardDescription className="text-sm">Honoraires transparents, budget maîtrisé, pas de surprises</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-2 border-black bg-white p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="p-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <CardTitle className="mb-2 text-base text-foreground">Conformité légale</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <CardDescription className="text-sm">Respect des normes 2025, AG conformes, gestion sans faille</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="mb-6 text-lg text-muted-foreground">
            Changer de syndic est souvent <strong>le moyen de retrouver une gestion saine, transparente
            et adaptée aux attentes réelles des résidents</strong>, tant sur le plan financier qu'organisationnel.
          </p>
          <Button asChild size="lg" className="border-2 border-black">
            <Link href="/ressources/contact" className="inline-flex items-center gap-2">
              Parlons de votre copropriété
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>
        </div>

        {/* Sources */}
        <div className="mt-12 border-t border-border pt-6">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Sources :</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>
              <sup>1</sup> Étude IFOP/Bellman sur la satisfaction des copropriétaires -
              <a
                href="https://www.informationsrapidesdelacopropriete.fr/etudes-et-rapports/5943-copropriete-enquete"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                Informations Rapides de la Copropriété
              </a>
            </li>
            <li>
              <sup>2</sup> Enquête CLCV 2021 sur la copropriété -
              <a
                href="https://www.clcv.org/storage/app/media/uploaded-files/Dossier%20de%20presse%20Enqu%C3%AAte%202021.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                CLCV (PDF)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
