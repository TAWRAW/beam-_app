import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import type { Route } from 'next'

export interface BreadcrumbItem {
  label: string
  href?: Route | string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Données structurées Schema.org pour breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `https://www.xn--beam-yqa.fr${item.href}` }),
    })),
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {/* Icône home pour le premier élément */}
          {items[0]?.href === '/' && (
            <li>
              <Link
                href={'/' as Route}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">{items[0].label}</span>
              </Link>
            </li>
          )}

          {items.map((item, index) => {
            const isFirst = index === 0
            const isLast = index === items.length - 1

            // Skip premier si c'est home (déjà affiché avec icône)
            if (isFirst && item.href === '/') return null

            return (
              <li key={index} className="flex items-center gap-2">
                {!isFirst && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}

                {item.href && !isLast ? (
                  <Link
                    href={item.href as Route}
                    className="hover:text-foreground transition-colors hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'font-medium text-foreground' : ''}>
                    {item.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}
