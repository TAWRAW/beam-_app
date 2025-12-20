'use client'

import { Users, UserCheck, UserX, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useSimulateur } from './SimulateurProvider'
import { PresenceSelector } from './PresenceSelector'
import { AGDashboard } from './AGDashboard'
import { MandatWarningBanner } from './MandatWarningBanner'

export function TabsAG() {
  const { state, agStats, setSelectedCle, getTotalTantièmesPourCle } = useSimulateur()
  const hasLots = state.lots.length > 0

  if (!hasLots) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            Ajoutez d'abord des lots dans l'onglet "Ma copropriété"
          </p>
        </CardContent>
      </Card>
    )
  }

  const lotsPresentsRepresentes = agStats
    ? agStats.lotsPresents + agStats.lotsRepresentes
    : 0
  const tantièmesPresentsRepresentes = agStats
    ? agStats.tantièmesPresents + agStats.tantièmesRepresentes
    : 0

  const handleCleChange = (cleId: string) => {
    setSelectedCle(cleId)
  }

  const selectedCle = state.clesDeCharges.find((c) => c.id === state.selectedCleId)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-lg font-semibold">Simuler une assemblée générale</h2>
        <p className="text-sm text-muted-foreground">
          Définissez qui est présent, représenté ou absent à l'AG
        </p>
      </div>

      {/* Sélection de la clé de charges */}
      {state.clesDeCharges.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clé de répartition</CardTitle>
            <CardDescription>
              Les statistiques de présence sont calculées selon cette clé de charges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={state.selectedCleId}
              onValueChange={handleCleChange}
            >
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.clesDeCharges.map((cle) => (
                  <SelectItem key={cle.id} value={cle.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">{cle.nom}</span>
                      <span className="text-muted-foreground text-sm">
                        {getTotalTantièmesPourCle(cle.id)} tantièmes
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Warnings de mandats */}
      {agStats && agStats.mandatWarnings.length > 0 && (
        <MandatWarningBanner warnings={agStats.mandatWarnings} />
      )}

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Présents</p>
                <p className="text-2xl font-bold">{agStats?.lotsPresents || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {agStats?.tantièmesPresents || 0} tantièmes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Représentés</p>
                <p className="text-2xl font-bold">{agStats?.lotsRepresentes || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {agStats?.tantièmesRepresentes || 0} tantièmes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <UserX className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Participation</p>
                <p className="text-2xl font-bold">
                  {agStats?.pourcentagePresence.toFixed(0) || 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {lotsPresentsRepresentes} / {state.lots.length} lots
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des lots avec sélecteur de présence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Présence des copropriétaires</CardTitle>
          <CardDescription>
            Pour chaque lot, indiquez s'il est présent, représenté ou absent.
            Si représenté, choisissez le lot qui le représente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PresenceSelector />
        </CardContent>
      </Card>

      {/* Dashboard des majorités atteignables */}
      {lotsPresentsRepresentes > 0 && (
        <AGDashboard />
      )}
    </div>
  )
}
