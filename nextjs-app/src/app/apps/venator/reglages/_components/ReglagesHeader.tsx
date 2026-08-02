'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

/** En-tête commun aux sous-pages de réglages : retour à l'index + titre. */
export default function ReglagesHeader({ titre, description }: { titre: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/apps/venator/reglages"
        className="inline-flex w-fit items-center gap-1 text-[12px] font-medium text-venator-fg-muted transition-colors hover:text-venator-fg"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Réglages
      </Link>
      <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-venator-fg">{titre}</h2>
      <p className="text-[13px] text-venator-fg-muted">{description}</p>
    </div>
  )
}
