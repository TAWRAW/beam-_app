import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

export default function InterventionZones() {
  const zones = [
    {
      slug: 'vernon',
      name: 'Vernon',
      department: '27',
      description: 'Syndic de proximité pour Vernon et ses quartiers (Centre-ville, Vernonnet, Bizy)',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      slug: 'gaillon',
      name: 'Gaillon',
      department: '27',
      description: 'Votre syndic local à Gaillon et alentours (A13, Château)',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      slug: 'evreux',
      name: 'Évreux',
      department: '27',
      description: 'Gestion de copropriété à Évreux (Madeleine, Nétreville, Centre préfecture)',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ]

  return (
    <section className="section bg-muted">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nos zones d'intervention privilégiées
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Beamô est votre syndic de copropriété local dans l'Eure.
            Proximité géographique, connaissance du marché immobilier et réactivité garantie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <Link key={zone.slug} href={`/ville/${zone.slug}`}>
              <Card className="border-2 border-black bg-white shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl h-full">
                <CardHeader className="pb-4">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${zone.iconBg}`}>
                    <MapPin className={`h-7 w-7 ${zone.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {zone.name}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({zone.department})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {zone.description}
                  </CardDescription>
                  <p className="mt-4 text-sm font-semibold text-primary hover:underline">
                    Découvrir nos services à {zone.name} →
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Nous intervenons également dans <strong className="text-foreground">47 villes de l'Eure</strong> :
            Les Andelys, Louviers, Pacy-sur-Eure, Gasny, Val-de-Reuil et bien d'autres.
          </p>
        </div>
      </div>
    </section>
  )
}
