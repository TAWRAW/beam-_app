'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className
}: KPICardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-app-fg-muted">
          {title}
        </CardTitle>
        {icon && <div className="text-app-fg-faint">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-app-fg-muted mt-1">{subtitle}</p>
        )}
        {trend && trendValue && (
          <p className={cn(
            'text-xs mt-1',
            trend === 'up' && 'text-green-600',
            trend === 'down' && 'text-red-600',
            trend === 'neutral' && 'text-app-fg-muted'
          )}>
            {trend === 'up' && '+'}
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
