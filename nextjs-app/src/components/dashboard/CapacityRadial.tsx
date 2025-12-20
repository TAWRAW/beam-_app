'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CapacityRadialProps {
  current: number
  max: number
  title?: string
}

export function CapacityRadial({ current, max, title = 'Capacite' }: CapacityRadialProps) {
  const percentage = Math.round((current / max) * 100)
  const remaining = max - current

  // Couleur basée sur le pourcentage (palette Beamô)
  const color = percentage < 50 ? '#FFC300' : percentage < 80 ? '#DC651F' : '#2E8484'

  // Calcul pour le cercle SVG
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-[160px] h-[160px]">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Cercle de fond */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="16"
            />
            {/* Cercle de progression */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          {/* Pourcentage centré */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-3xl font-bold">{percentage}%</div>
          </div>
        </div>
        {/* Texte en dessous */}
        <div className="text-center mt-3">
          <div className="text-sm text-gray-500">{current}/{max} copros</div>
          <div className="text-xs text-gray-400 mt-1">{remaining} places restantes</div>
        </div>
      </CardContent>
    </Card>
  )
}
