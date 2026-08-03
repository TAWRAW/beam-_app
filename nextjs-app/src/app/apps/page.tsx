'use client'

import { useEffect, useState } from 'react'
import {
  Euro,
  Building2,
  Users,
  TrendingUp,
  Target,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard, CapacityRadial, RevenueComparison, ProjectionChart, DashboardSkeleton } from '@/components/dashboard'
import type { DashboardKPIs } from '@/types/dashboard'

export default function AppsHome() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchKPIs() {
      try {
        const response = await fetch('/api/dashboard/kpis')
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des KPIs')
        }
        const data = await response.json()
        setKpis(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Tableau de bord</h1>
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Tableau de bord</h1>
        <Card className="border-app-danger-fg/30 bg-app-danger-bg">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-red-500 mt-2">
              Verifiez que le workflow n8n est actif et que la configuration est correcte.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!kpis) {
    return null
  }

  const formatEuro = (value: number) => `${value.toLocaleString('fr-FR')} EUR`
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <div className="flex items-center gap-2 text-sm text-app-fg-muted">
          <Clock className="h-4 w-4" />
          <span>Mis a jour: {formatDate(kpis.updatedAt)}</span>
        </div>
      </div>

      {/* Section: Situation Actuelle */}
      <div>
        <h2 className="text-lg font-medium text-app-fg mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Situation Actuelle
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="CA Annuel Signe"
            value={formatEuro(kpis.situationActuelle.caAnnuel)}
            icon={<Euro className="h-5 w-5" />}
            subtitle={`${kpis.situationActuelle.prixMoyenLot} EUR/lot`}
          />
          <KPICard
            title="Lots Geres"
            value={kpis.situationActuelle.lotsGeres}
            icon={<Building2 className="h-5 w-5" />}
            subtitle={`Moyenne: ${kpis.situationActuelle.tailleMoyenne} lots/copro`}
          />
          <KPICard
            title="Coproprietes Signees"
            value={`${kpis.situationActuelle.coprosSignees}/40`}
            icon={<Users className="h-5 w-5" />}
            subtitle={`${kpis.situationActuelle.capaciteRestante} places restantes`}
          />
          <KPICard
            title="CA Moyen/Copro"
            value={formatEuro(kpis.projections.caMoyenCopro)}
            icon={<Target className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Section: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueComparison
          caSignes={kpis.situationActuelle.caAnnuel}
          caProspects={kpis.pipelineProspects.caProspects}
        />
        <CapacityRadial
          current={kpis.situationActuelle.coprosSignees}
          max={40}
          title="Capacite de gestion"
        />
      </div>

      {/* Section: Projection Signes vs Prospects */}
      <ProjectionChart
        lotsSignes={kpis.situationActuelle.lotsGeres}
        lotsProspects={kpis.pipelineProspects.lotsProspects}
        coprosSignees={kpis.situationActuelle.coprosSignees}
        coprosProspects={kpis.pipelineProspects.nbProspects}
      />

      {/* Section: Projections */}
      <div>
        <h2 className="text-lg font-medium text-app-fg mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Projections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-app-warning-fg/30 bg-app-warning-bg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-app-warning-fg">
                Objectif Minimum: 60 000 EUR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-app-warning-fg">
                    {kpis.projections.coprosNeeded60k} copros
                  </p>
                  <p className="text-sm text-amber-600">
                    ~{kpis.projections.lotsNeeded60k} lots necessaires
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-600">
                    Reste {Math.max(0, kpis.projections.coprosNeeded60k - kpis.situationActuelle.coprosSignees)} copros
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-app-success-fg/30 bg-app-success-bg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-app-success-fg">
                Objectif Stretch: 100 000 EUR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-app-success-fg">
                    {kpis.projections.coprosNeeded100k} copros
                  </p>
                  <p className="text-sm text-green-600">
                    ~{kpis.projections.lotsNeeded100k} lots necessaires
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">
                    Reste {Math.max(0, kpis.projections.coprosNeeded100k - kpis.situationActuelle.coprosSignees)} copros
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section: Pipeline & Total */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Prospects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-app-fg-muted flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pipeline Prospects ({kpis.pipelineProspects.nbProspects})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-app-fg-muted">CA Potentiel</span>
                <span className="font-semibold">{formatEuro(kpis.pipelineProspects.caProspects)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-fg-muted">Lots Potentiels</span>
                <span className="font-semibold">{kpis.pipelineProspects.lotsProspects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-fg-muted">Prix Moyen/Lot</span>
                <span className="font-semibold">{kpis.pipelineProspects.prixMoyenLotProspect} EUR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-fg-muted">Taille Moyenne</span>
                <span className="font-semibold">{kpis.pipelineProspects.tailleMoyenneProspect} lots/copro</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Potentiel */}
        <Card className="border-app-info-fg/30 bg-app-info-bg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-app-info-fg flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Potentiel (Signes + Prospects)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-600">CA Total</span>
                <span className="text-xl font-bold text-app-info-fg">
                  {formatEuro(kpis.totalPotentiel.caTotalPotentiel)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Coproprietes</span>
                <span className="font-semibold text-app-info-fg">
                  {kpis.totalPotentiel.coprosTotalPotentiel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Lots Totaux</span>
                <span className="font-semibold text-app-info-fg">
                  {kpis.totalPotentiel.lotsTotalPotentiel}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
