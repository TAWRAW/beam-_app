import Link from 'next/link'
import { cities } from '@/lib/cities'
import { Card, CardContent } from '@/components/ui/card'

export default function NearbyCities({ currentSlug }: { currentSlug: string }) {
  const links = cities.filter((c) => c.slug !== currentSlug).slice(0, 8)
  if (!links.length) return null
  return (
    <section className="section">
      <div className="container">
        <h2 className="h2 font-semibold text-neutral">Autres villes desservies</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {links.map((c) => {
            const name = c.displayName ?? c.name
            const prep = c.displayPrep ?? c.prep ?? 'à'
            return (
              <li key={c.slug}>
                <Card className="border-2 border-black bg-white p-4 shadow-lg">
                  <CardContent className="p-0">
                    <Link href={`/ville/${c.slug}`} className="hover:text-primary">
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

