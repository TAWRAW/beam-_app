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
        className={`w-full text-left border rounded px-3 py-2 ${
          value ? 'text-gray-900' : 'text-gray-400'
        }`}
        aria-label={label}
      >
        {value ? options[value] : `Sélectionner… ${required ? '*' : ''}`}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="border-b p-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-blue-600"
            >
              Annuler
            </button>
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filtered.map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onChange(k)
                  setOpen(false)
                  setFilter('')
                }}
                className="block w-full text-left px-4 py-3 active:bg-gray-100"
              >
                {v}
              </button>
            ))}
            {filtered.length === 0 && <p className="p-4 text-gray-500">Aucun résultat.</p>}
          </div>
        </div>
      )}
    </>
  )
}
