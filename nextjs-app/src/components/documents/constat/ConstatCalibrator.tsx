// Outil de calibration (dev uniquement) : rendu comme enfant de ConstatDdeTemplate.
// - Grille 50px (forte) / 10px (faible) sur la base 794×1123.
// - Clic n'importe où sur la page → « x: NNN, y: NNN » copié dans le presse-papier
//   (corrigé du scale de l'aperçu via getBoundingClientRect).
// - Outline rouge + clé de chaque champ défini dans CONSTAT_FIELDS.
'use client'

import React, { useState } from 'react'
import { CONSTAT_FIELDS, PAGE_W, PAGE_H } from './constat-fields'

export function ConstatCalibrator() {
  const [lastClick, setLastClick] = useState<string | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * PAGE_W)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * PAGE_H)
    const coords = `x: ${x}, y: ${y}`
    setLastClick(coords)
    navigator.clipboard?.writeText(coords).catch(() => {})
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'crosshair',
        backgroundImage: [
          'repeating-linear-gradient(to right, rgba(255,0,0,0.25) 0 1px, transparent 1px 50px)',
          'repeating-linear-gradient(to bottom, rgba(255,0,0,0.25) 0 1px, transparent 1px 50px)',
          'repeating-linear-gradient(to right, rgba(0,0,255,0.08) 0 1px, transparent 1px 10px)',
          'repeating-linear-gradient(to bottom, rgba(0,0,255,0.08) 0 1px, transparent 1px 10px)',
        ].join(', '),
      }}
    >
      {Object.entries(CONSTAT_FIELDS).map(([key, spec]) => {
        const w = spec.kind === 'text' ? (spec.w ?? 60) : (spec.size ?? 10)
        const h = spec.kind === 'text' ? ((spec.lines ?? 1) * (spec.lineHeight ?? 13)) : (spec.size ?? 10)
        return (
          <div
            key={key}
            title={key}
            style={{
              position: 'absolute',
              left: `${(spec.x / PAGE_W) * 100}%`,
              top: `${(spec.y / PAGE_H) * 100}%`,
              width: `${(w / PAGE_W) * 100}%`,
              height: `${(h / PAGE_H) * 100}%`,
              outline: '1px solid rgba(255,0,0,0.7)',
              backgroundColor: spec.kind === 'check' ? 'rgba(255,0,0,0.15)' : 'rgba(255,200,0,0.12)',
              pointerEvents: 'none',
            }}
          />
        )
      })}
      {lastClick && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            padding: '2px 8px',
            backgroundColor: '#000',
            color: '#FFC300',
            fontSize: 12,
            fontFamily: 'monospace',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          {lastClick} (copié)
        </div>
      )}
    </div>
  )
}
