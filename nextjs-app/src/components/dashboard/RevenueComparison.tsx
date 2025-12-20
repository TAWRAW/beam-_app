'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface RevenueComparisonProps {
  caSignes: number
  caProspects: number
}

const chartConfig = {
  signes: {
    label: 'CA Signes',
    color: '#FFC300',
  },
  prospects: {
    label: 'Prospects',
    color: '#DC651F',
  },
} satisfies ChartConfig

export function RevenueComparison({ caSignes, caProspects }: RevenueComparisonProps) {
  const data = [
    {
      name: 'Signes',
      value: caSignes,
      fill: '#FFC300',
    },
    {
      name: 'Prospects',
      value: caProspects,
      fill: '#DC651F',
    },
  ]

  const total = caSignes + caProspects
  const formatEuro = (value: number) => `${value.toLocaleString('fr-FR')} EUR`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          Comparaison CA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              barSize={40}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: number) => formatEuro(value)}
                className="fill-foreground text-xs"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Potentiel</span>
            <span className="text-lg font-bold">{formatEuro(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
