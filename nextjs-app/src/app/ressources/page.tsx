import Link from 'next/link'
import { strapiConfigured, strapiFetch, type StrapiItem } from '@/lib/strapi'

type Article = {
  title: string
  description?: string
  slug: string
}

export const metadata = {
  title: 'Ressources — Beamô',
  description: "Actualités et contenus de Beamô",
  alternates: { canonical: '/ressources' },
}

export default async function RessourcesPage() {
  let items: StrapiItem<Article>[] = []
  let error: string | null = null
  if (strapiConfigured()) {
    try {
      const data = await strapiFetch<{ data: StrapiItem<Article>[] }>(
        `/api/articles?fields[0]=title&fields[1]=description&fields[2]=slug&sort=createdAt:desc`
      )
      items = data.data
    } catch (e: any) {
      error = e?.message || 'Erreur inconnue'
    }
  } else {
    error = 'Strapi non configuré (STRAPI_URL / STRAPI_TOKEN)'
  }

  return (
    <main className="section">
      <div className="container">
        <h1 className="h1">Ressources</h1>
        {error ? (
          <p className="mt-4 text-gray-600">{error}</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {items.map((it) => (
              <article key={it.id} className="card p-6">
                <h2 className="text-xl font-semibold">{it.attributes.title}</h2>
                {it.attributes.description && (
                  <p className="mt-2 text-gray-700 line-clamp-3">{it.attributes.description}</p>
                )}
                <Link href={`/ressources/${it.attributes.slug}`} className="mt-4 inline-block btn">
                  Lire
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

