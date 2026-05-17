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
      className="aspect-square bg-gray-100 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 active:bg-gray-200"
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="w-full h-full object-cover rounded-lg" />
      ) : (
        <>
          <span className="text-2xl">📷</span>
          <span className="text-xs">{label}</span>
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
