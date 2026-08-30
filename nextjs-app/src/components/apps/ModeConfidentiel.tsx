'use client'

// Mode confidentiel — brouillage « table d'enchantement Minecraft » des
// données sensibles (noms de copropriétés, adresses, références…) pour
// pouvoir partager des captures d'écran sans exposer les données réelles.
//
// Usage :
//   1. <ModeConfidentielProvider> englobe les apps (posé dans apps/layout.tsx) ;
//   2. le bouton <ModeConfidentielToggle> vit dans la sidebar ;
//   3. chaque donnée sensible s'affiche via <Masque>{texte}</Masque> —
//      lettres remplacées par des lettres aléatoires (casse préservée),
//      chiffres par des chiffres, ponctuation/espaces conservés, et le tirage
//      change toutes les secondes (ticker PARTAGÉ : un seul setInterval pour
//      toute la page, pas un par composant).
//
// Le brouillage est purement visuel et côté client : les vraies valeurs
// restent dans le DOM virtuel/state. C'est un outil de capture d'écran,
// PAS une fonctionnalité de sécurité.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'beamo-mode-confidentiel'

const MINUSCULES = 'abcdefghijklmnopqrstuvwxyz'
const MAJUSCULES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const CHIFFRES = '0123456789'

function tirer(alphabet: string): string {
  return alphabet[Math.floor(Math.random() * alphabet.length)]
}

function brouiller(texte: string): string {
  let sortie = ''
  for (const c of texte) {
    if (/[a-zà-öø-ÿ]/.test(c)) sortie += tirer(MINUSCULES)
    else if (/[A-ZÀ-ÖØ-Þ]/.test(c)) sortie += tirer(MAJUSCULES)
    else if (/[0-9]/.test(c)) sortie += tirer(CHIFFRES)
    else sortie += c
  }
  return sortie
}

interface ModeConfidentielContexte {
  actif: boolean
  basculer: () => void
  /** Incrémenté chaque seconde quand le mode est actif — les <Masque> re-tirent dessus. */
  tick: number
}

const Contexte = createContext<ModeConfidentielContexte>({
  actif: false,
  basculer: () => {},
  tick: 0,
})

export function useModeConfidentiel() {
  return useContext(Contexte)
}

export function ModeConfidentielProvider({ children }: { children: ReactNode }) {
  const [actif, setActif] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setActif(true)
    } catch {}
  }, [])

  useEffect(() => {
    if (!actif) return
    // 100 ms : le flicker rapide de la table d'enchantement Minecraft —
    // à 1 s l'effet paraissait figé (retour Tom).
    const id = setInterval(() => setTick((t) => t + 1), 100)
    return () => clearInterval(id)
  }, [actif])

  const basculer = useCallback(() => {
    setActif((a) => {
      try {
        localStorage.setItem(STORAGE_KEY, a ? '0' : '1')
      } catch {}
      return !a
    })
  }, [])

  const valeur = useMemo(() => ({ actif, basculer, tick }), [actif, basculer, tick])

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

/** Enveloppe une donnée sensible : brouillée quand le mode confidentiel est actif. */
export function Masque({ children, className }: { children: string | null | undefined; className?: string }) {
  const { actif, tick } = useModeConfidentiel()
  const texte = children ?? ''

  // useMemo sur (texte, tick) : chaque seconde le tick change et force un
  // nouveau tirage — l'effet « enchantement » vient de là.
  const affiche = useMemo(
    () => (actif ? brouiller(texte) : texte),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actif, texte, tick],
  )

  if (!actif) return <>{texte}</>
  return (
    <span className={cn('select-none', className)} aria-label="donnée masquée">
      {affiche}
    </span>
  )
}

/** Bouton de bascule, même grammaire que AppThemeToggle (posé dans la sidebar). */
export function ModeConfidentielToggle({ className }: { className?: string }) {
  const { actif, basculer } = useModeConfidentiel()
  return (
    <button
      onClick={basculer}
      aria-pressed={actif}
      title={actif ? 'Désactiver le mode confidentiel' : 'Mode confidentiel (brouille les données sensibles pour les captures d’écran)'}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-[var(--app-radius-btn)] transition',
        actif
          ? 'bg-app-accent text-app-accent-foreground'
          : 'text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg',
        className,
      )}
    >
      <EyeOff className="h-4 w-4" />
    </button>
  )
}
