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
      <div>
        <h1 className="text-2xl font-semibold mb-6">Tableau de bord</h1>
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Tableau de bord</h1>
        <Card className="border-red-200 bg-red-50">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Mis a jour: {formatDate(kpis.updatedAt)}</span>
        </div>
      </div>

      {/* Section: Situation Actuelle */}
      <div>
        <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
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
        <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Projections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">
                Objectif Minimum: 60 000 EUR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-amber-900">
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

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Objectif Stretch: 100 000 EUR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-green-900">
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
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pipeline Prospects ({kpis.pipelineProspects.nbProspects})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">CA Potentiel</span>
                <span className="font-semibold">{formatEuro(kpis.pipelineProspects.caProspects)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lots Potentiels</span>
                <span className="font-semibold">{kpis.pipelineProspects.lotsProspects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prix Moyen/Lot</span>
                <span className="font-semibold">{kpis.pipelineProspects.prixMoyenLotProspect} EUR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taille Moyenne</span>
                <span className="font-semibold">{kpis.pipelineProspects.tailleMoyenneProspect} lots/copro</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Potentiel */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Potentiel (Signes + Prospects)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-600">CA Total</span>
                <span className="text-xl font-bold text-blue-900">
                  {formatEuro(kpis.totalPotentiel.caTotalPotentiel)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Coproprietes</span>
                <span className="font-semibold text-blue-900">
                  {kpis.totalPotentiel.coprosTotalPotentiel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Lots Totaux</span>
                <span className="font-semibold text-blue-900">
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
