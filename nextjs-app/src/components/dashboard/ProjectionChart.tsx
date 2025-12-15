'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProjectionChartProps {
  lotsSignes: number
  lotsProspects: number
  coprosSignees: number
  coprosProspects: number
}

export function ProjectionChart({
  lotsSignes,
  lotsProspects,
  coprosSignees,
  coprosProspects
}: ProjectionChartProps) {
  const data = [
    {
      name: 'Copropriétés',
      signes: coprosSignees,
      prospects: coprosProspects,
      total: coprosSignees + coprosProspects,
    },
    {
      name: 'Lots',
      signes: lotsSignes,
      prospects: lotsProspects,
      total: lotsSignes + lotsProspects,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          Projection: Signés vs Prospects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
            />
            <Legend />
            <Bar
              dataKey="signes"
              name="Signés"
              stackId="a"
              fill="#FFC300"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="prospects"
              name="Prospects"
              stackId="a"
              fill="#DC651F"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Résumé */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">Si 100% conversion</div>
            <div className="text-lg font-bold" style={{ color: '#DC651F' }}>
              {coprosSignees + coprosProspects} copros
            </div>
            <div className="text-sm text-gray-500">
              {lotsSignes + lotsProspects} lots
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Croissance potentielle</div>
            <div className="text-lg font-bold" style={{ color: '#FFC300' }}>
              +{coprosProspects} copros
            </div>
            <div className="text-sm text-gray-500">
              +{lotsProspects} lots
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
