'use client'

import { CheckCircle2, XCircle, ArrowRight, Info, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useSimulateur } from './SimulateurProvider'
import {
  MAJORITY_LABELS,
  MAJORITY_NAMES,
  HELP_LINKS,
  RESULT_TEXTS,
} from '@/lib/simulateur-vote/constants'
import { getLotTantiemes } from '@/lib/simulateur-vote/types'

export function VoteResult() {
  const { state, voteStats, voteResult } = useSimulateur()

  if (!voteResult || !voteStats) {
    return null
  }

  const { majority, passerelle25_1, passerelle26_1 } = voteResult
  const totalTantiemes = state.lots.reduce((sum, l) => sum + getLotTantiemes(l, state.selectedCleId), 0)

  // Progression vers le seuil
  const progressValue = majority.pourRequired > 0
    ? Math.min((majority.pourActuel / majority.pourRequired) * 100, 100)
    : 0

  const passerelle = passerelle25_1 || passerelle26_1

  return (
    <div className="space-y-4">
      {/* Résultat principal */}
      <Card
        className={
          majority.isAchieved
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Résultat du vote - {MAJORITY_LABELS[majority.type]}
              </CardTitle>
              <CardDescription className={majority.isAchieved ? 'text-green-700' : 'text-red-700'}>
                {MAJORITY_NAMES[majority.type]}
              </CardDescription>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                majority.isAchieved
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {majority.isAchieved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {RESULT_TEXTS.adopted}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {RESULT_TEXTS.rejected}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistiques des votes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{voteStats.pour}</p>
              <p className="text-sm text-muted-foreground">
                Pour ({voteStats.lotsPour} lot{voteStats.lotsPour > 1 ? 's' : ''})
              </p>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{voteStats.contre}</p>
              <p className="text-sm text-muted-foreground">
                Contre ({voteStats.lotsContre} lot{voteStats.lotsContre > 1 ? 's' : ''})
              </p>
            </div>
            {state.selectedMajority === 'art24' && voteStats.abstention > 0 && (
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{voteStats.abstention}</p>
                <p className="text-sm text-muted-foreground">
                  Abstention ({voteStats.lotsAbstention} lot{voteStats.lotsAbstention > 1 ? 's' : ''})
                </p>
              </div>
            )}
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <p className="text-2xl font-bold">{voteStats.exprimes}</p>
              <p className="text-sm text-muted-foreground">Exprimés</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pour : {majority.pourActuel} tantièmes</span>
              <span>Seuil : {majority.pourRequired} tantièmes</span>
            </div>
            <Progress
              value={progressValue}
              className={`h-3 ${majority.isAchieved ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
            />
          </div>

          {/* Détails */}
          <p className="text-sm">{majority.details}</p>

          {/* Écart */}
          {!majority.isAchieved && (
            <p className="text-sm font-medium text-red-700">
              Il manque {majority.pourRequired - majority.pourActuel} tantièmes
              pour atteindre la majorité.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Passerelle */}
      {passerelle && passerelle.applicable && (
        <Card
          className={
            passerelle.canTrigger
              ? 'border-orange-200 bg-orange-50'
              : 'border-gray-200 bg-gray-50'
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {passerelle.canTrigger ? (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              ) : (
                <Info className="h-5 w-5 text-gray-500" />
              )}
              <CardTitle className="text-base">
                Passerelle {state.selectedMajority === 'art25' ? '25-1' : '26-1'}
              </CardTitle>
              <Badge
                variant={passerelle.canTrigger ? 'default' : 'secondary'}
                className={passerelle.canTrigger ? 'bg-orange-500' : ''}
              >
                {passerelle.canTrigger
                  ? RESULT_TEXTS.passerelle_applicable
                  : RESULT_TEXTS.passerelle_not_applicable}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{passerelle.explanation}</p>

            {/* Résultat avec la passerelle */}
            {passerelle.canTrigger && passerelle.newResult && (
              <div className="p-4 bg-white/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Second vote à l'{MAJORITY_LABELS[passerelle.nextMajority]}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span
                    className={
                      passerelle.newResult.isAchieved
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {passerelle.newResult.isAchieved
                      ? RESULT_TEXTS.adopted
                      : RESULT_TEXTS.rejected}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {passerelle.newResult.details}
                </p>

                {passerelle.newResult.isAchieved && (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      La résolution serait adoptée avec un second vote immédiat
                    </span>
                  </div>
                )}
              </div>
            )}

            <Link
              href={HELP_LINKS.passerelles}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Info className="h-4 w-4" />
              En savoir plus sur les passerelles
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Note sur la réduction des voix */}
      {state.lots.some((l) => getLotTantiemes(l, state.selectedCleId) > totalTantiemes / 2) && (
        <div className="flex items-start gap-2 p-3 text-sm bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-800">
            <strong>Réduction des voix appliquée (Art. 22)</strong> : un
            copropriétaire détenant plus de 50% des tantièmes voit ses voix
            réduites à la somme des voix des autres copropriétaires.
          </p>
        </div>
      )}
    </div>
  )
}
