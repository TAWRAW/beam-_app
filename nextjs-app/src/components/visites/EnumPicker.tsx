// src/components/visites/EnumPicker.tsx
'use client'

import { useState } from 'react'

interface Props<K extends string> {
  label: string
  options: Record<K, string>
  value: K | null
  onChange: (k: K) => void
  required?: boolean
}

export function EnumPicker<K extends string>({
  label,
  options,
  value,
  onChange,
  required,
}: Props<K>) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const entries = Object.entries(options) as Array<[K, string]>
  const filtered = filter
    ? entries.filter(([, v]) => v.toLowerCase().includes(filter.toLowerCase()))
    : entries

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full text-left bg-app-surface border-2 border-app-border-strong shadow-[3px_3px_0px_0px_var(--app-border-strong)] px-3 py-2 font-medium transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--app-border-strong)] ${
          value ? 'text-app-fg' : 'text-app-fg-muted'
        }`}
        aria-label={label}
      >
        {value ? options[value] : `Sélectionner… ${required ? '*' : ''}`}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-[#F2F1E6] flex flex-col">
          <div className="border-b-2 border-app-border-strong p-3 flex items-center gap-2 bg-app-surface">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border-2 border-app-border-strong bg-app-surface px-3 py-1 font-bold shadow-[2px_2px_0px_0px_var(--app-border-strong)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_var(--app-border-strong)]"
            >
              Annuler
            </button>
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 border-2 border-app-border-strong bg-app-surface px-3 py-2 font-medium focus:outline-none focus:shadow-[2px_2px_0px_0px_var(--app-border-strong)]"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onChange(k)
                  setOpen(false)
                  setFilter('')
                }}
                className={`block w-full text-left px-4 py-3 border-b-2 border-app-border-strong font-medium hover:bg-primary active:bg-primary ${
                  value === k ? 'bg-primary' : 'bg-app-surface'
                }`}
              >
                {v}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="p-4 text-app-fg-muted font-medium">Aucun résultat.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
