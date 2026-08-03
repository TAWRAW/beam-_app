// src/components/apps/app-theme.ts — logique de thème des applications internes.
// Partagé entre le bouton de la barre latérale et l'écran Réglages > Apparence,
// pour qu'ils ne puissent pas diverger.

/** Ce que l'utilisateur choisit. `system` suit le réglage du système d'exploitation. */
export type AppThemePreference = 'light' | 'dark' | 'system'
/** Ce qui est réellement appliqué au document. */
export type AppThemeResolved = 'light' | 'dark'

export const APP_THEME_STORAGE_KEY = 'beam-apps-theme'
export const APP_THEME_ATTRIBUTE = 'data-app-theme'

/**
 * Script exécuté avant le premier rendu pour poser le thème sur <html>.
 *
 * Sans lui, la page s'affiche en clair puis bascule — le flash blanc, d'autant
 * plus violent qu'on travaille en sombre. Il reste synchrone et sans dépendance :
 * il tourne avant le chargement de React.
 *
 * L'attribut est posé sur <html>, mais SEULES les descendances de .beam-apps le
 * consomment (cf. apps-theme.css) : la vitrine publique n'est pas affectée.
 */
export const appThemeInitScript = `(function(){try{var p=localStorage.getItem('${APP_THEME_STORAGE_KEY}');var t=(p==='light'||p==='dark')?p:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('${APP_THEME_ATTRIBUTE}',t);}catch(e){document.documentElement.setAttribute('${APP_THEME_ATTRIBUTE}','dark');}})();`

/** Préférence enregistrée. `system` quand rien n'a été choisi explicitement. */
export function lirePreference(): AppThemePreference {
  try {
    const v = localStorage.getItem(APP_THEME_STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** Thème du système d'exploitation. Sombre par défaut, cohérent avec le script d'init. */
export function themeSysteme(): AppThemeResolved {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function resoudre(pref: AppThemePreference): AppThemeResolved {
  return pref === 'system' ? themeSysteme() : pref
}

/** Thème actuellement appliqué au document (source de vérité pour l'affichage). */
export function lireThemeApplique(): AppThemeResolved {
  return document.documentElement.getAttribute(APP_THEME_ATTRIBUTE) === 'light' ? 'light' : 'dark'
}

/**
 * Applique une préférence et la mémorise.
 *
 * `system` retire l'entrée de stockage plutôt que d'y écrire 'system' : le script
 * d'init n'a ainsi qu'un seul cas à traiter — une valeur explicite, ou rien.
 */
export function appliquerPreference(pref: AppThemePreference): AppThemeResolved {
  const effectif = resoudre(pref)
  document.documentElement.setAttribute(APP_THEME_ATTRIBUTE, effectif)
  try {
    if (pref === 'system') localStorage.removeItem(APP_THEME_STORAGE_KEY)
    else localStorage.setItem(APP_THEME_STORAGE_KEY, pref)
  } catch {
    // Navigation privée ou stockage plein : le choix ne vaut que pour la session.
  }
  return effectif
}

/**
 * Suit les changements du système tant qu'aucun choix explicite n'est fait.
 * Retourne la fonction de désabonnement.
 */
export function suivreSysteme(onChange: (theme: AppThemeResolved) => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: light)')
  const handler = () => {
    if (lirePreference() !== 'system') return
    const t = themeSysteme()
    document.documentElement.setAttribute(APP_THEME_ATTRIBUTE, t)
    onChange(t)
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
