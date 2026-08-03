'use client'

import { useEffect, useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  appliquerPreference,
  lirePreference,
  suivreSysteme,
  type AppThemePreference,
} from '@/components/apps/app-theme'
import ReglagesHeader from '../_components/ReglagesHeader'

const OPTIONS: { valeur: AppThemePreference; label: string; description: string; Icon: LucideIcon }[] = [
  { valeur: 'light', label: 'Clair', description: 'Toujours en clair.', Icon: Sun },
  { valeur: 'dark', label: 'Sombre', description: 'Toujours en sombre.', Icon: Moon },
  {
    valeur: 'system',
    label: 'Système',
    description: 'Suit le réglage de macOS.',
    Icon: Monitor,
  },
]

export default function ReglagesApparencePage() {
  // `null` avant montage : la préférence vit dans le stockage local, que le
  // rendu serveur ne connaît pas. Cocher une option au hasard désynchroniserait
  // l'hydratation.
  const [pref, setPref] = useState<AppThemePreference | null>(null)

  useEffect(() => {
    setPref(lirePreference())
    // En mode « Système », l'affichage doit suivre si macOS bascule pendant la visite.
    return suivreSysteme(() => setPref(lirePreference()))
  }, [])

  function choisir(valeur: AppThemePreference) {
    appliquerPreference(valeur)
    setPref(valeur)
  }

  return (
    <div className="flex flex-col gap-6">
      <ReglagesHeader
        titre="Apparence"
        description="Le thème s'applique à toutes les applications Beamô, pas seulement à Venator. Le site public n'est pas concerné."
      />

      <div className="flex max-w-2xl flex-col gap-1.5">
        {OPTIONS.map(({ valeur, label, description, Icon }) => {
          const actif = pref === valeur
          return (
            <button
              key={valeur}
              type="button"
              onClick={() => choisir(valeur)}
              aria-pressed={actif}
              className={cn(
                'flex items-center gap-3.5 rounded-[var(--venator-radius-lg)] px-4 py-3.5 text-left transition-colors',
                actif ? 'bg-venator-surface-2' : 'bg-venator-surface hover:bg-venator-surface-2'
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', actif ? 'text-venator-accent' : 'text-venator-fg-faint')}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-venator-fg">{label}</p>
                <p className="mt-0.5 text-[12px] text-venator-fg-muted">{description}</p>
              </div>
              {actif && <Check className="h-4 w-4 shrink-0 text-venator-accent" />}
            </button>
          )
        })}
      </div>

      <p className="max-w-2xl text-[12px] text-venator-fg-faint">
        Certaines sections (Visites, Clés, Articles, Documents, Profil, Réglages généraux) restent en clair
        tant qu&apos;elles n&apos;ont pas été reprises : leurs fonds sont encore peints en dur et le mode
        sombre y rendrait le texte illisible.
      </p>
    </div>
  )
}
