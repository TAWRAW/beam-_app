import Link from 'next/link'
import { getNearbyCities, getCityBySlug } from '@/lib/cities'
import { Card, CardContent } from '@/components/ui/card'

export default function NearbyCities({ currentSlug }: { currentSlug: string }) {
  const currentCity = getCityBySlug(currentSlug)
  const nearbyCities = getNearbyCities(currentSlug, 8)

  if (!nearbyCities.length) return null

  // Titre dynamique selon le contexte géographique
  const currentName = currentCity?.displayName ?? currentCity?.name ?? ''
  const title = currentCity?.department?.includes('76')
    ? `Syndic dans la métropole de Rouen`
    : `Villes voisines de ${currentName}`

  return (
    <section className="section">
      <div className="container">
        <h2 className="h2 font-semibold text-neutral">{title}</h2>
        <p className="mt-2 text-muted-foreground">
          Beamô intervient également dans les communes voisines avec le même niveau de service et de réactivité.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {nearbyCities.map((c) => {
            const name = c.displayName ?? c.name
            const prep = c.displayPrep ?? c.prep ?? 'à'
            return (
              <li key={c.slug}>
                <Card className="border-2 border-black bg-white p-4 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <Link href={`/ville/${c.slug}`} className="hover:text-primary font-medium">
                      {`Syndic ${prep} ${name}`}
                    </Link>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

