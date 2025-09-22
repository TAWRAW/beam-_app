import Link from 'next/link'
import { FileText, FileSignature, Calculator, Scale, Newspaper, type LucideIcon } from 'lucide-react'

type Cat = {
  key: string
  label: string
  description: string
  href: string
  Icon: LucideIcon
}

const CATEGORIES: Cat[] = [
  {
    key: 'articles',
    label: 'Articles',
    description: 'Conseils et actualités copropriété',
    href: '/ressources?cat=articles',
    Icon: Newspaper,
  },
  {
    key: 'modeles',
    label: 'Modèles',
    description: 'Documents prêts à l’emploi',
    href: '/ressources?cat=modeles',
    Icon: FileSignature,
  },
  {
    key: 'applications',
    label: 'Applications',
    description: 'Outils et utilitaires en ligne',
    href: '/ressources?cat=applications',
    Icon: Calculator,
  },
  {
    key: 'juridique',
    label: 'Juridique',
    description: 'Textes et obligations',
    href: '/ressources?cat=juridique',
    Icon: Scale,
  },
  {
    key: 'documentation',
    label: 'Documentation',
    description: 'Références et dossiers',
    href: '/ressources?cat=documentation',
    Icon: FileText,
  },
]

export default function CategoryGallery() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map(({ key, label, description, href, Icon }) => (
        <Link
          key={key}
          href={href as any}
          className="group flex items-center gap-4 rounded-lg border p-5 transition hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 transition group-hover:bg-primary group-hover:text-white">
            <Icon size={28} />
          </div>
          <div>
            <div className="font-semibold">{label}</div>
            <div className="text-sm text-neutral-600">{description}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
