/**
 * COMPOSANT BREADCRUMB AVEC SCHEMA.ORG
 *
 * Génère les données structurées BreadcrumbList pour améliorer l'indexation Google.
 * Aide Google à comprendre la hiérarchie du site et améliore l'affichage dans les SERP.
 *
 * UTILISATION:
 * <BreadcrumbSchema items={[
 *   { name: 'Accueil', url: 'https://www.xn--beam-yqa.fr' },
 *   { name: 'Offres', url: 'https://www.xn--beam-yqa.fr/offres' }
 * ]} />
 */

export interface BreadcrumbItem {
  name: string
  url?: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url })
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
  )
}