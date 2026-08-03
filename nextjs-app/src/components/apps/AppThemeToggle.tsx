'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  appliquerPreference,
  lireThemeApplique,
  suivreSysteme,
  type AppThemeResolved,
} from './app-theme'

export { appThemeInitScript } from './app-theme'

/**
 * Bascule clair / sombre des applications internes.
 *
 * Volontairement minuscule et sans libellé : c'est un réglage qu'on touche une
 * fois, il ne doit pas concurrencer la navigation. Le choix détaillé (dont le
 * retour au suivi du système) vit dans Réglages > Apparence.
 */
export default function AppThemeToggle({ className }: { className?: string }) {
  // `null` tant que le composant n'est pas monté : le serveur ignore le choix
  // stocké côté client, afficher une icône au hasard produirait une hydratation
  // incohérente. On réserve la place pour éviter le saut de mise en page.
  const [theme, setTheme] = useState<AppThemeResolved | null>(null)

  useEffect(() => {
    setTheme(lireThemeApplique())
    return suivreSysteme(setTheme)
  }, [])

  function basculer() {
    const courant = theme ?? lireThemeApplique()
    setTheme(appliquerPreference(courant === 'dark' ? 'light' : 'dark'))
  }

  const label = theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-[var(--app-radius-btn)]',
        'text-app-fg-faint transition-colors hover:bg-app-surface-2 hover:text-app-fg',
        className
      )}
    >
      {theme === null ? null : theme === 'dark' ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
