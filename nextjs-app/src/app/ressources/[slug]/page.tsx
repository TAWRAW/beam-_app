import { notFound } from 'next/navigation'
import { strapiConfigured, strapiFetch, type StrapiItem } from '@/lib/strapi'

type Article = {
  title: string
  description?: string
  slug: string
  RichTexteMarkdown?: string
}

export async function generateStaticParams() {
  if (!strapiConfigured()) return []
  try {
    const data = await strapiFetch<{ data: StrapiItem<Article>[] }>(`/api/articles?fields[0]=slug`, 600)
    return data.data.map((it) => ({ slug: it.attributes.slug }))
  } catch {
    return []
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  if (!strapiConfigured()) notFound()
  const q = new URLSearchParams()
  q.set('filters[slug][$eq]', params.slug)
  q.set('fields[0]', 'title')
  q.set('fields[1]', 'description')
  q.set('fields[2]', 'slug')
  q.set('fields[3]', 'RichTexteMarkdown')
  const data = await strapiFetch<{ data: StrapiItem<Article>[] }>(`/api/articles?${q.toString()}`, 600)
  const item = data.data[0]
  if (!item) notFound()

  const { title, description, RichTexteMarkdown } = item.attributes

  return (
    <main className="section">
      <div className="container">
        <h1 className="h1">{title}</h1>
        {description && <p className="mt-2 text-gray-700">{description}</p>}
        {RichTexteMarkdown && (
          <div className="prose prose-lg mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: RichTexteMarkdown }} />
        )}
      </div>
    </main>
  )
}

