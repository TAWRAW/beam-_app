// Les 3 exemplaires du Constat amiable DDE (A / B / Gérant-Syndic) pour la
// page /documents/preview et l'export PDF. Le .page-gap est masqué à l'impression
// et le .constat-page force 210mm×297mm + break-after (même pattern que le Règlement).
import React from 'react'
import { ConstatDdeTemplate } from './ConstatDdeTemplate'
import type { ConstatFormInput } from './constat-schema'

export function ConstatDdeDocument({ data }: { data: ConstatFormInput }) {
  // Retire le flag transient du calibrateur dev pour qu'il ne parte jamais à l'export
  const cleanData = { ...data } as ConstatFormInput & { _calibrate?: boolean }
  delete cleanData._calibrate
  return (
    <>
      {([0, 1, 2] as const).map((pageIndex) => (
        <React.Fragment key={pageIndex}>
          {pageIndex > 0 && <div className="page-gap" style={{ height: 24 }} />}
          <ConstatDdeTemplate data={cleanData} pageIndex={pageIndex} />
        </React.Fragment>
      ))}
    </>
  )
}
