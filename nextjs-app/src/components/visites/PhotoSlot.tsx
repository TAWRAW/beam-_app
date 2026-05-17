// src/components/visites/PhotoSlot.tsx
'use client'

import { useRef, useState } from 'react'

interface Props {
  label: string
  onCapture: (file: File) => void
}

export function PhotoSlot({ label, onCapture }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onCapture(file)
  }

  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="aspect-square bg-white border-2 border-dashed border-black shadow-[3px_3px_0px_0px_#000] flex flex-col items-center justify-center text-black font-semibold transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#000] overflow-hidden"
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="w-full h-full object-cover" />
      ) : (
        <>
          <span className="text-3xl mb-1">📷</span>
          <span className="text-xs uppercase tracking-wide">{label}</span>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </button>
  )
}
