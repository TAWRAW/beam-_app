/**
 * Extrait le HTML d'un élément DOM en capturant les valeurs saisies par l'utilisateur.
 *
 * Problème résolu : innerHTML ne capture pas les valeurs saisies dans les inputs/textareas,
 * ni l'état des composants Radix UI (Select, Checkbox, etc.).
 *
 * Solution : Clone le noeud DOM et synchronise manuellement les valeurs.
 */
export function extractHtmlWithValues(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement

  // 1. Sync standard inputs & textareas
  const originalInputs = element.querySelectorAll('input, textarea')
  const clonedInputs = clone.querySelectorAll('input, textarea')

  originalInputs.forEach((orig, i) => {
    const cloned = clonedInputs[i] as HTMLInputElement | HTMLTextAreaElement
    if (!cloned) return

    if (orig instanceof HTMLInputElement) {
      cloned.setAttribute('value', orig.value)
      if (orig.type === 'checkbox' || orig.type === 'radio') {
        if (orig.checked) {
          cloned.setAttribute('checked', 'checked')
        } else {
          cloned.removeAttribute('checked')
        }
      }
    }
    if (orig instanceof HTMLTextAreaElement) {
      cloned.textContent = orig.value
    }
  })

  // 2. Sync Radix Select - copier le textContent du trigger affiché
  const originalSelects = element.querySelectorAll('[data-radix-select-trigger], [role="combobox"]')
  const clonedSelects = clone.querySelectorAll('[data-radix-select-trigger], [role="combobox"]')

  originalSelects.forEach((orig, i) => {
    const cloned = clonedSelects[i]
    if (cloned && orig.textContent) {
      cloned.textContent = orig.textContent
    }
  })

  // 3. Sync Radix Checkbox - copier data-state
  const originalCheckboxes = element.querySelectorAll('[data-state][role="checkbox"]')
  const clonedCheckboxes = clone.querySelectorAll('[data-state][role="checkbox"]')

  originalCheckboxes.forEach((orig, i) => {
    const cloned = clonedCheckboxes[i]
    if (cloned) {
      const state = orig.getAttribute('data-state')
      if (state) cloned.setAttribute('data-state', state)
    }
  })

  // 4. Sync tout élément avec data-state (Radix pattern générique)
  const originalDataStates = element.querySelectorAll('[data-state]')
  const clonedDataStates = clone.querySelectorAll('[data-state]')

  originalDataStates.forEach((orig, i) => {
    const cloned = clonedDataStates[i]
    if (cloned) {
      const state = orig.getAttribute('data-state')
      if (state) cloned.setAttribute('data-state', state)
    }
  })

  // 5. Sync les éléments select natifs
  const originalNativeSelects = element.querySelectorAll('select')
  const clonedNativeSelects = clone.querySelectorAll('select')

  originalNativeSelects.forEach((orig, i) => {
    const cloned = clonedNativeSelects[i] as HTMLSelectElement
    if (cloned) {
      cloned.value = orig.value
      // Marquer l'option sélectionnée
      const options = cloned.querySelectorAll('option')
      options.forEach((opt) => {
        if (opt.value === orig.value) {
          opt.setAttribute('selected', 'selected')
        } else {
          opt.removeAttribute('selected')
        }
      })
    }
  })

  return clone.outerHTML
}
