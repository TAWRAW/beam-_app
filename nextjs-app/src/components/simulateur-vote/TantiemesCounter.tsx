'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useSimulateur } from './SimulateurProvider'
import { DEFAULT_TANTIEMES_TOTAL, WARNING_MESSAGES } from '@/lib/simulateur-vote/constants'

export function TantiemesCounter() {
  const { state, getTotalTantièmesPourCle } = useSimulateur()
  const lotsCount = state.lots.length

  // Afficher le total pour chaque clé
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Total des tantièmes par clé</span>
        <span className="text-sm text-muted-foreground">{lotsCount} lot{lotsCount > 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3">
        {state.clesDeCharges
          .filter((cle) => getTotalTantièmesPourCle(cle.id) > 0)
          .map((cle) => {
            const total = getTotalTantièmesPourCle(cle.id)
            const isStandard = total === DEFAULT_TANTIEMES_TOTAL
            const progressValue = Math.min((total / DEFAULT_TANTIEMES_TOTAL) * 100, 100)

            return (
              <div key={cle.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cle.nom}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{total}</span>
                    {isStandard ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                </div>
                <Progress value={progressValue} className="h-1.5" />
              </div>
            )
          })}
      </div>

      {state.clesDeCharges.some(
        (cle) => {
          const total = getTotalTantièmesPourCle(cle.id)
          return total > 0 && total !== DEFAULT_TANTIEMES_TOTAL
        }
      ) && (
        <p className="mt-3 text-xs text-muted-foreground">
          Le simulateur fonctionne avec n'importe quel total de tantièmes.
          La norme est généralement 1000 ou 10000.
        </p>
      )}
    </div>
  )
}
