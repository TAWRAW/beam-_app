import Link from 'next/link'
import { Metadata } from 'next'
import { Route } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Calculator, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Outils Gratuits pour la Copropriété — Beamô',
  description:
    'Découvrez nos outils gratuits pour la gestion de copropriété : simulateur de vote AG, calculateurs de majorités et bien plus.',
  keywords: [
    'outils copropriété',
    'simulateur vote AG',
    'calcul majorité copropriété',
    'outils syndic',
    'gestion copropriété',
  ],
  openGraph: {
    title: 'Outils Gratuits pour la Copropriété — Beamô',
    description:
      'Simulateur de vote, calculateurs de majorités et autres outils gratuits pour faciliter la gestion de votre copropriété.',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const tools = [
  {
    id: 'simulateur-vote',
    title: 'Simulateur de Vote AG',
    description:
      'Simulez les votes de votre assemblée générale de copropriété. Calculez les majorités (article 24, 25, 26) et anticipez les résultats avant votre AG.',
    href: '/outils/simulateur-vote' as Route,
    icon: Calculator,
    features: [
      'Calcul automatique des majorités',
      'Gestion des représentations',
      'Passerelles 25-1 et 26-1',
      '100% gratuit et confidentiel',
    ],
    cta: 'Lancer le simulateur',
  },
]

export default function OutilsPage() {
  return (
    <main className="section">
      <div className="container max-w-5xl">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Outils' },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="h1">Nos outils gratuits</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Des outils pratiques et gratuits pour vous accompagner dans la
            gestion de votre copropriété.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => (
            <Card
              key={tool.id}
              className="flex flex-col hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{tool.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {tool.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 mb-6 flex-1">
                  {tool.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <Link href={tool.href}>
                    {tool.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Placeholder pour futurs outils */}
          <Card className="flex flex-col border-dashed bg-muted/30">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <span className="text-2xl">🚧</span>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl text-muted-foreground">
                    Bientôt disponible
                  </CardTitle>
                  <CardDescription className="mt-2">
                    De nouveaux outils sont en cours de développement pour vous
                    aider dans la gestion de votre copropriété.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <p className="text-sm text-muted-foreground">
                Vous avez une idée d'outil ?{' '}
                <Link href={'/ressources/contact' as Route} className="text-primary hover:underline">
                  Contactez-nous
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
