// Une page A4 du Constat amiable DDE : fond officiel (PNG) + valeurs superposées.
// Utilisé tel quel dans l'aperçu live et dans l'export PDF (styles de position inline
// uniquement : le rendu est identique partout, y compris sous le Tailwind CDN de /api/pdf).
// Positions en % de la page (794×1123 de référence) ; tailles de police en px
// (en print la page fait 210mm = 793,7px : écart négligeable).
import React from 'react'
import { CONSTAT_FIELDS, PAGE_W, PAGE_H, type TextSpec, type CheckSpec } from './constat-fields'
import { computeOverlay } from './constat-overlay'
import { ConstatCalibrator } from './ConstatCalibrator'
import type { ConstatFormInput } from './constat-schema'

const PAGE_BACKGROUNDS = [
  '/images/constat-dde/page-1.png', // Exemplaire pour A
  '/images/constat-dde/page-2.png', // Exemplaire pour B
  '/images/constat-dde/page-3.png', // Exemplaire GÉRANT SYNDIC
]

const FONT = 'Helvetica, Arial, sans-serif'
const INK = '#1a1a8c' // bleu stylo : se distingue du noir imprimé du formulaire

const pctX = (v: number) => `${(v / PAGE_W) * 100}%`
const pctY = (v: number) => `${(v / PAGE_H) * 100}%`

function TextItem({ spec, value }: { spec: TextSpec; value: string }) {
  const baseSize = spec.size ?? 11
  const lines = spec.lines ?? 1
  // Rétrécit la police pour que le texte tienne dans la largeur du champ
  // (Helvetica : largeur moyenne ≈ 0,52 em par caractère), plancher lisible à 6,5px.
  let size = baseSize
  if (spec.w && lines === 1 && value.length > 0) {
    const estimated = value.length * baseSize * 0.52
    if (estimated > spec.w) {
      size = Math.max(6.5, spec.w / (value.length * 0.52))
    }
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: pctX(spec.x),
        top: pctY(spec.y),
        width: spec.w ? pctX(spec.w) : undefined,
        fontSize: `${size}px`,
        fontFamily: FONT,
        color: INK,
        lineHeight: spec.lineHeight ? `${spec.lineHeight}px` : 1.1,
        textAlign: spec.align ?? 'left',
        whiteSpace: lines > 1 ? 'pre-line' : 'nowrap',
        overflow: 'hidden',
        maxHeight: lines > 1 && spec.lineHeight ? `${lines * spec.lineHeight}px` : undefined,
      }}
    >
      {value}
    </div>
  )
}

function CheckItem({ spec }: { spec: CheckSpec }) {
  const size = spec.size ?? 10
  return (
    <div
      style={{
        position: 'absolute',
        left: pctX(spec.x),
        top: pctY(spec.y),
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size + 2}px`,
        fontFamily: FONT,
        fontWeight: 700,
        color: INK,
        lineHeight: 1,
      }}
    >
      ×
    </div>
  )
}

export interface ConstatDdeTemplateProps {
  data: ConstatFormInput
  pageIndex: 0 | 1 | 2
  children?: React.ReactNode // calibrateur en dev
}

export function ConstatDdeTemplate({ data, pageIndex, children }: ConstatDdeTemplateProps) {
  const items = computeOverlay(data)
  return (
    <div
      className="constat-page"
      style={{
        position: 'relative',
        width: `${PAGE_W}px`,
        height: `${PAGE_H}px`,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PAGE_BACKGROUNDS[pageIndex]}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      {items.map((item, i) => {
        const spec = CONSTAT_FIELDS[item.fieldKey]
        if (!spec) return null
        return item.kind === 'text' && spec.kind === 'text' ? (
          <TextItem key={`${item.fieldKey}-${i}`} spec={spec} value={item.value} />
        ) : spec.kind === 'check' ? (
          <CheckItem key={`${item.fieldKey}-${i}`} spec={spec} />
        ) : null
      })}
      {process.env.NODE_ENV === 'development' &&
        (data as ConstatFormInput & { _calibrate?: boolean })._calibrate && <ConstatCalibrator />}
      {children}
    </div>
  )
}
