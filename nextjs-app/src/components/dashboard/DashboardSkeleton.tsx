'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-2" />
      </CardContent>
    </Card>
  )
}

function SkeletonChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section Situation Actuelle */}
      <div>
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      {/* Section Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Section Projections */}
      <div>
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      {/* Section Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
