import Link from 'next/link'
import { Metadata } from 'next'
import { Route } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import {
  Calculator,
  ArrowRight,
  CheckCircle2,
  Users,
  Vote,
  Scale,
  FileText,
  Shield,
  Clock
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Simulateur de Vote en AG de Copropriété — Guide Complet | Beamô',
  description:
    'Découvrez notre simulateur de vote gratuit pour les assemblées générales de copropriété. Calculez les majorités article 24, 25, 26 et anticipez les résultats de vos votes.',
  keywords: [
    'simulateur vote copropriété',
    'assemblée générale copropriété',
    'majorité article 24',
    'majorité article 25',
    'majorité article 26',
    'tantièmes copropriété',
    'calcul majorité AG',
    'passerelle 25-1',
    'passerelle 26-1',
    'syndic copropriété',
    'vote AG copropriété',
  ],
  openGraph: {
    title: 'Simulateur de Vote en AG de Copropriété — Beamô',
    description:
      'Simulez gratuitement les votes de votre assemblée générale. Calculez les majorités et anticipez les résultats avant votre AG.',
    type: 'article',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulateur de Vote en AG — Beamô',
    description:
      'Simulez gratuitement les votes de votre assemblée générale de copropriété.',
  },
  alternates: {
    canonical: '/outils/simulateur-vote-guide',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const features = [
  {
    icon: Calculator,
    title: 'Calcul automatique des majorités',
    description: 'Le simulateur calcule instantanément si vos résolutions peuvent être adoptées selon la majorité requise.',
  },
  {
    icon: Users,
    title: 'Gestion des représentations',
    description: 'Gérez facilement les pouvoirs et mandats entre copropriétaires avec contrôle des limites légales.',
  },
  {
    icon: Scale,
    title: 'Passerelles 25-1 et 26-1',
    description: 'Découvrez automatiquement si une passerelle peut permettre l\'adoption d\'une résolution rejetée.',
  },
  {
    icon: Shield,
    title: '100% confidentiel',
    description: 'Vos données restent sur votre appareil. Aucune information n\'est envoyée à nos serveurs.',
  },
]

const majorites = [
  {
    title: 'Article 24 — Majorité simple',
    description: 'Majorité des voix exprimées des copropriétaires présents ou représentés.',
    examples: ['Approbation des comptes', 'Travaux d\'entretien courant', 'Désignation du syndic'],
    color: 'bg-green-100 text-green-800',
  },
  {
    title: 'Article 25 — Majorité absolue',
    description: 'Majorité de toutes les voix de l\'ensemble des copropriétaires (présents, représentés et absents).',
    examples: ['Travaux d\'économie d\'énergie', 'Installation de bornes électriques', 'Autorisation de travaux privatifs'],
    color: 'bg-blue-100 text-blue-800',
  },
  {
    title: 'Article 26 — Double majorité',
    description: 'Majorité des copropriétaires ET au moins 2/3 des tantièmes.',
    examples: ['Modification du règlement', 'Aliénation de parties communes', 'Suppression du poste de gardien'],
    color: 'bg-orange-100 text-orange-800',
  },
  {
    title: 'Unanimité',
    description: 'Accord de tous les copropriétaires, y compris les absents.',
    examples: ['Changement de destination de l\'immeuble', 'Aliénation de parties communes nécessaires'],
    color: 'bg-purple-100 text-purple-800',
  },
]

export default function SimulateurVoteGuidePage() {
  return (
    <main className="section">
      <div className="container max-w-4xl">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Outils', href: '/outils' as Route },
            { label: 'Simulateur de vote' },
          ]}
        />

        {/* Hero */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
            <Calculator className="h-10 w-10 text-primary" />
          </div>
          <h1 className="h1">Simulateur de Vote en Assemblée Générale</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Anticipez les résultats de vos votes en AG de copropriété.
            Calculez les majorités, gérez les représentations et découvrez
            les passerelles possibles.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href={'/outils/simulateur-vote' as Route}>
                Lancer le simulateur
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={'/outils/simulateur-vote/notice' as Route}>
                Voir la notice
              </Link>
            </Button>
          </div>
        </div>

        {/* Fonctionnalités */}
        <section className="mt-16">
          <h2 className="h2 text-center mb-8">Fonctionnalités du simulateur</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, i) => (
              <Card key={i} className="p-6">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 h-fit">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="mt-16">
          <h2 className="h2 text-center mb-8">Comment utiliser le simulateur ?</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg">Configurez votre copropriété</h3>
                <p className="mt-1 text-muted-foreground">
                  Ajoutez les lots de votre copropriété avec leurs tantièmes.
                  Vous pouvez importer un fichier CSV ou saisir les données manuellement.
                  Gérez plusieurs clés de répartition si nécessaire.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg">Simulez votre AG</h3>
                <p className="mt-1 text-muted-foreground">
                  Définissez les présences à l'assemblée générale : présents,
                  représentés ou absents. Configurez les pouvoirs et mandats
                  entre copropriétaires.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg">Testez vos votes</h3>
                <p className="mt-1 text-muted-foreground">
                  Choisissez la majorité requise et testez différents scénarios de vote.
                  Le résultat s'affiche en temps réel avec les passerelles applicables.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Les majorités */}
        <section className="mt-16">
          <h2 className="h2 text-center mb-4">Comprendre les majorités en copropriété</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Chaque type de décision en AG nécessite une majorité spécifique.
            Notre simulateur les calcule automatiquement.
          </p>
          <div className="grid gap-4">
            {majorites.map((maj, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{maj.title}</h3>
                      <p className="mt-1 text-muted-foreground">{maj.description}</p>
                    </div>
                    <div className="md:w-1/3">
                      <p className="text-sm font-medium mb-2">Exemples de décisions :</p>
                      <ul className="space-y-1">
                        {maj.examples.map((ex, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Passerelles */}
        <section className="mt-16">
          <h2 className="h2 text-center mb-4">Les passerelles 25-1 et 26-1</h2>
          <Card className="p-6">
            <CardContent className="p-0 space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Vote className="h-5 w-5 text-primary" />
                  Passerelle 25-1
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Si une résolution n'est pas adoptée à la majorité de l'article 25
                  mais obtient <strong>au moins 1/3 des voix</strong>, l'assemblée peut
                  immédiatement procéder à un second vote à la majorité de l'article 24.
                </p>
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Vote className="h-5 w-5 text-primary" />
                  Passerelle 26-1
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Si une résolution n'est pas adoptée à la majorité de l'article 26
                  mais obtient <strong>la majorité des voix de l'article 25</strong>,
                  l'assemblée peut convoquer une nouvelle AG dans les 3 mois pour
                  voter à la majorité de l'article 25.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Avantages */}
        <section className="mt-16">
          <h2 className="h2 text-center mb-8">Pourquoi utiliser notre simulateur ?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold">Gagnez du temps</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Préparez votre AG en quelques minutes et anticipez les résultats.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold">Évitez les erreurs</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Le calcul automatique élimine les risques d'erreur de comptage.
                </p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold">100% gratuit</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aucune inscription requise, aucune limite d'utilisation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Final */}
        <section className="mt-16 mb-8">
          <Card className="p-8 bg-primary/5 border-primary/20">
            <CardContent className="p-0 text-center">
              <h2 className="h2 mb-4">Prêt à simuler votre prochaine AG ?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Notre simulateur est entièrement gratuit et ne nécessite aucune inscription.
                Vos données restent confidentielles et stockées uniquement sur votre appareil.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link href={'/outils/simulateur-vote' as Route}>
                    <Calculator className="h-5 w-5" />
                    Lancer le simulateur
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={'/outils/simulateur-vote/notice' as Route}>
                    Consulter la notice
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Avertissement */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Ce simulateur est fourni à titre indicatif et ne constitue pas un conseil juridique.
          Pour toute question relative aux règles de vote en copropriété, consultez un professionnel du droit immobilier.
        </p>
      </div>
    </main>
  )
}
