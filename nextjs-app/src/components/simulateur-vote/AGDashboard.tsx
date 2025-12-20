'use client'

import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSimulateur } from './SimulateurProvider'
import { getAllMajoritiesStatus } from '@/lib/simulateur-vote/calculations'
import {
  MAJORITY_LABELS,
  MAJORITY_NAMES,
  MAJORITY_DESCRIPTIONS,
  MAJORITY_EXAMPLES,
  HELP_LINKS,
} from '@/lib/simulateur-vote/constants'
import { MajorityType, getLotTantiemes } from '@/lib/simulateur-vote/types'

const STATUS_CONFIG = {
  yes: {
    icon: CheckCircle2,
    label: 'Atteignable',
    className: 'text-green-600 bg-green-50 border-green-200',
    iconClassName: 'text-green-600',
  },
  limit: {
    icon: AlertTriangle,
    label: 'Limite',
    className: 'text-orange-600 bg-orange-50 border-orange-200',
    iconClassName: 'text-orange-600',
  },
  no: {
    icon: XCircle,
    label: 'Non atteignable',
    className: 'text-red-600 bg-red-50 border-red-200',
    iconClassName: 'text-red-600',
  },
}

export function AGDashboard() {
  const { state, agStats } = useSimulateur()

  if (!agStats) return null

  const majoritiesStatus = getAllMajoritiesStatus(state)
  const totalTantiemes = state.lots.reduce((sum, l) => sum + getLotTantiemes(l, state.selectedCleId), 0)
  const maxTantiemes = agStats.tantièmesPresents + agStats.tantièmesRepresentes
  const maxLots = agStats.lotsPresents + agStats.lotsRepresentes

  const majorityTypes: MajorityType[] = ['art24', 'art25', 'art26', 'unanimite']

  const getRequiredText = (type: MajorityType): string => {
    switch (type) {
      case 'art24':
        return `> ${Math.floor(maxTantiemes / 2)} tantièmes exprimés`
      case 'art25':
        return `> ${Math.floor(totalTantiemes / 2)} tantièmes (${Math.floor(totalTantiemes / 2) + 1} min)`
      case 'art26':
        return `> ${Math.floor(state.lots.length / 2)} pers. + ≥ ${Math.ceil((2 * totalTantiemes) / 3)} tant.`
      case 'unanimite':
        return `${state.lots.length} pers. = ${totalTantiemes} tantièmes`
    }
  }

  const getMaxText = (type: MajorityType): string => {
    switch (type) {
      case 'art24':
      case 'art25':
        return `max ${maxTantiemes}`
      case 'art26':
        return `max ${maxLots} pers. / ${maxTantiemes} tant.`
      case 'unanimite':
        return `${maxLots}/${state.lots.length} pers.`
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Votre AG en un coup d'œil
            </CardTitle>
            <CardDescription>
              Majorités atteignables avec les présents actuels
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={HELP_LINKS.majorites} target="_blank">
                  <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>En savoir plus sur les majorités</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {majorityTypes.map((type) => {
            const status = majoritiesStatus[type]
            const config = STATUS_CONFIG[status.status]
            const Icon = config.icon

            return (
              <div
                key={type}
                className={`p-3 sm:p-4 border rounded-lg ${config.className}`}
              >
                {/* Header - empilé sur mobile, horizontal sur desktop */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 sm:block">
                    <Icon className={`h-5 w-5 sm:hidden ${config.iconClassName}`} />
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{MAJORITY_LABELS[type]}</p>
                      <p className="text-xs sm:text-sm opacity-80">{MAJORITY_NAMES[type]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className={`hidden sm:block h-5 w-5 ${config.iconClassName}`} />
                    <Badge
                      variant="outline"
                      className={`${config.className} border-current text-xs`}
                    >
                      {config.label}
                    </Badge>
                  </div>
                </div>

                {/* Seuils - texte plus petit sur mobile */}
                <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <p className="break-words">
                    <span className="opacity-70">Seuil : </span>
                    <span className="font-medium">{getRequiredText(type)}</span>
                  </p>
                  <p className="break-words">
                    <span className="opacity-70">Max : </span>
                    <span className="font-medium">{getMaxText(type)}</span>
                  </p>
                </div>

                {/* Exemple - caché sur mobile, visible au survol sur desktop */}
                <div className="hidden sm:block">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="mt-2 text-xs opacity-60 cursor-help truncate">
                          Ex: {MAJORITY_EXAMPLES[type][0]}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">Exemples de résolutions :</p>
                        <ul className="text-sm space-y-1">
                          {MAJORITY_EXAMPLES[type].map((ex, i) => (
                            <li key={i}>• {ex}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
