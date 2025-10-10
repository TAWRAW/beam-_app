import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, TrendingUp, Award } from 'lucide-react'
import type { VilleStatsFormatted } from '@/types/ville-stats'

interface CityStatsProps {
  stats: VilleStatsFormatted
  ville: string
}

export default function CityStats({ stats, ville }: CityStatsProps) {
  return (
    <section className="section bg-muted">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Le marché de la copropriété à {ville}
          </h2>
          <p className="text-muted-foreground">
            Données officielles du{' '}
            <a
              href="https://www.registre-coproprietes.gouv.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Registre National des Copropriétés
            </a>{' '}
            (ANAH) - Mise à jour trimestrielle
          </p>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Nombre copropriétés */}
          <Card className="border-2 border-black bg-white shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Copropriétés recensées
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats.nbCoproprietes}
              </div>
              {stats.rangDepartemental && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.rangDepartemental}
                  <sup>e</sup> ville de l'Eure
                </p>
              )}
            </CardContent>
          </Card>

          {/* Taille moyenne */}
          <Card className="border-2 border-black bg-white shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taille moyenne
                </CardTitle>
                <div className="p-2 bg-green-100 rounded-full">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats.tailleMoyenne}
              </div>
              <p className="text-xs text-muted-foreground mt-1">lots par copropriété</p>
            </CardContent>
          </Card>

          {/* Syndics pros */}
          <Card className="border-2 border-black bg-white shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Syndics professionnels
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats.pourcentageSyndicPro}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pourcentageSyndicBenevole}% bénévole
              </p>
            </CardContent>
          </Card>

          {/* Période construction */}
          <Card className="border-2 border-black bg-white shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Période principale
                </CardTitle>
                <div className="p-2 bg-orange-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-foreground leading-tight">
                {stats.periodePrincipalConstruction}
              </div>
              <p className="text-xs text-muted-foreground mt-1">de construction</p>
            </CardContent>
          </Card>
        </div>

        {/* Texte explicatif SEO */}
        <Card className="border-2 border-black bg-white p-6 shadow-lg">
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              <strong className="text-foreground">{ville}</strong> compte actuellement{' '}
              <strong className="text-foreground">{stats.nbCoproprietes} copropriétés</strong>{' '}
              enregistrées au registre national. La taille moyenne est de{' '}
              <strong className="text-foreground">{stats.tailleMoyenne} lots</strong>, avec une
              moyenne de {stats.nbLotsHabitation} lots d'habitation.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong className="text-foreground">{stats.pourcentageSyndicPro}% des copropriétés</strong>{' '}
              sont gérées par un syndic professionnel, contre {stats.pourcentageSyndicBenevole}% en
              gestion bénévole. La majorité des immeubles ont été construits{' '}
              <strong className="text-foreground">{stats.periodePrincipalConstruction.toLowerCase()}</strong>.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong className="text-foreground">Beamô</strong> accompagne les copropriétés de{' '}
              {ville}, quelle que soit leur taille ou leur année de construction, avec une{' '}
              <strong className="text-foreground">réponse garantie sous 48h</strong> et un{' '}
              <strong className="text-foreground">suivi transparent digitalisé</strong>.
            </p>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Source : Registre National des Copropriétés (ANAH) • Données mises à jour
          trimestriellement
        </p>
      </div>
    </section>
  )
}
