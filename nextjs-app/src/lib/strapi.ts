const STRAPI_URL = process.env.STRAPI_URL
const STRAPI_TOKEN = process.env.STRAPI_TOKEN

export function strapiConfigured() {
  return Boolean(STRAPI_URL && STRAPI_TOKEN)
}

export async function strapiFetch<T>(path: string, revalidate = 300): Promise<T> {
  if (!STRAPI_URL || !STRAPI_TOKEN) {
    throw new Error('STRAPI not configured')
  }
  const url = `${STRAPI_URL}${path}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    next: { revalidate },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Strapi ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export type StrapiItem<T> = {
  id: number
  attributes: T & { slug?: string; createdAt?: string; updatedAt?: string }
}

