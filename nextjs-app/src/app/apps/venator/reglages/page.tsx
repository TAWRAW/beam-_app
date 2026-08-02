'use client'

import Link from 'next/link'
import { ChevronRight, ListChecks, Palette, Plug } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useGabarits } from '@/lib/venator/useVenator'
import { DOSSIER_TYPES } from '@/lib/venator/labels'

interface Rubrique {
  href:
    | '/apps/venator/reglages/dossiers'
    | '/apps/venator/reglages/apparence'
    | '/apps/venator/reglages/connexions'
  titre: string
  description: string
  Icon: LucideIcon
  etat: string
}

/** Index des réglages : une entrée par domaine, l'édition vit dans les sous-pages. */
export default function ReglagesIndexPage() {
  const { data } = useGabarits()

  const typesRegles = DOSSIER_TYPES.filter((t) => (data?.gabarits?.[t]?.length ?? 0) > 0).length

  const rubriques: Rubrique[] = [
    {
      href: '/apps/venator/reglages/dossiers',
      titre: 'Dossiers',
      description: "Étapes créées automatiquement à l'ouverture d'un dossier, par type.",
      Icon: ListChecks,
      etat:
        typesRegles === 0
          ? 'Aucun gabarit défini'
          : `${typesRegles} type${typesRegles > 1 ? 's' : ''} sur ${DOSSIER_TYPES.length} réglé${typesRegles > 1 ? 's' : ''}`,
    },
    {
      href: '/apps/venator/reglages/connexions',
      titre: 'Connexions',
      description: 'Compte Google relié : libellés Gmail des dossiers et pièces Drive.',
      Icon: Plug,
      etat: 'Google',
    },
    {
      href: '/apps/venator/reglages/apparence',
      titre: 'Apparence',
      description: 'Thème clair ou sombre, appliqué à toutes les applications Beamô.',
      Icon: Palette,
      etat: 'Clair, sombre ou système',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-venator-fg">Réglages</h2>
        <p className="mt-0.5 text-[13px] text-venator-fg-muted">Configuration de Venator.</p>
      </div>

      <div className="flex max-w-2xl flex-col gap-1.5">
        {rubriques.map(({ href, titre, description, Icon, etat }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3.5 rounded-[var(--venator-radius-lg)] bg-venator-surface px-4 py-3.5 transition-colors hover:bg-venator-surface-2"
          >
            <Icon className="h-4 w-4 shrink-0 text-venator-fg-faint" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-venator-fg">{titre}</p>
              <p className="mt-0.5 text-[12px] text-venator-fg-muted">{description}</p>
            </div>
            <span className="hidden shrink-0 text-[12px] text-venator-fg-faint sm:block">{etat}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-venator-fg-faint transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
