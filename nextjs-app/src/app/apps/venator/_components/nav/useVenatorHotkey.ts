'use client'

import { useEffect, useRef } from 'react'

/** Le raccourci ne doit pas se déclencher pendant une saisie ni dans un dialog. */
function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable ||
    // Radix pose ce rôle sur Dialog/Select/DropdownMenu : la frappe y appartient
    // au composant ouvert, pas à la page en dessous.
    target.closest('[role="dialog"], [role="listbox"], [role="menu"]') !== null
  )
}

interface HotkeyOptions {
  /** Exige ⌘ (macOS) ou Ctrl. Par défaut : touche nue. */
  meta?: boolean
  enabled?: boolean
}

/**
 * Raccourci clavier scopé au module Venator.
 *
 * Les touches nues (L, B, N…) sont volontairement inertes dès qu'un champ ou un
 * dialog a le focus : sans cette garde, taper « Bâtiment C » dans un titre de
 * dossier déclencherait la bascule vers le board.
 *
 * Le handler est gardé dans une ref pour que l'écouteur ne soit pas réattaché à
 * chaque rendu du composant appelant (les handlers sont souvent des closures
 * recréées à l'identique).
 */
export function useVenatorHotkey(key: string, handler: () => void, options: HotkeyOptions = {}) {
  const { meta = false, enabled = true } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== key.toLowerCase()) return

      const hasMeta = e.metaKey || e.ctrlKey
      if (meta !== hasMeta) return
      // Alt/Shift ne font partie d'aucun de nos raccourcis : les laisser passer
      // écraserait des combinaisons système ou de saisie (ex. Shift+L).
      if (e.altKey || e.shiftKey) return
      if (isTypingContext(e.target)) return

      e.preventDefault()
      handlerRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, meta, enabled])
}
