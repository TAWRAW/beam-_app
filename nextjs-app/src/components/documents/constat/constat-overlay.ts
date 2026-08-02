// Transforme les valeurs du formulaire en items à superposer sur le fond du constat.
import type { ConstatFormInput } from './constat-schema'

export type OverlayItem =
  | { fieldKey: string; kind: 'text'; value: string }
  | { fieldKey: string; kind: 'check' }

type PartieInput = ConstatFormInput['partieA']

function pushText(items: OverlayItem[], fieldKey: string, value: string | undefined) {
  if (value && value.trim() !== '') items.push({ fieldKey, kind: 'text', value })
}

function pushEnumCheck(items: OverlayItem[], prefix: string, value: string | undefined) {
  if (value && value !== '') items.push({ fieldKey: `${prefix}.${value}`, kind: 'check' })
}

function pushBoolCheck(items: OverlayItem[], fieldKey: string, value: boolean | undefined) {
  if (value) items.push({ fieldKey, kind: 'check' })
}

function partieItems(prefix: 'a' | 'b', p: PartieInput): OverlayItem[] {
  const items: OverlayItem[] = []
  pushText(items, `${prefix}.nom`, p.nom)
  pushText(items, `${prefix}.adresse`, p.adresse)
  pushText(items, `${prefix}.bat`, p.bat)
  pushText(items, `${prefix}.etage`, p.etage)
  pushText(items, `${prefix}.mail`, p.mail)
  pushText(items, `${prefix}.tel`, p.tel)
  pushText(items, `${prefix}.assureur`, p.assureur)
  pushText(items, `${prefix}.contratNo`, p.contratNo)
  pushText(items, `${prefix}.sinistreNo`, p.sinistreNo)
  pushText(items, `${prefix}.agent`, p.agent)
  pushText(items, `${prefix}.agentTel`, p.agentTel)
  pushText(items, `${prefix}.adresseAssureur`, p.adresseAssureur)
  pushEnumCheck(items, `${prefix}.usageHabitation`, p.usageHabitation)
  pushEnumCheck(items, `${prefix}.resiliationBail`, p.resiliationBail)
  pushEnumCheck(items, `${prefix}.locationMeublee`, p.locationMeublee)
  pushEnumCheck(items, `${prefix}.dommages`, p.dommages)
  pushText(items, `${prefix}.proprietaireCoordonnees`, p.proprietaireCoordonnees)
  switch (p.vousEtes) {
    case 'locataire':
      items.push({ fieldKey: `${prefix}.vousEtes.locataire`, kind: 'check' })
      break
    case 'proprioOccupant':
      items.push({ fieldKey: `${prefix}.vousEtes.proprio`, kind: 'check' })
      items.push({ fieldKey: `${prefix}.vousEtes.occupant`, kind: 'check' })
      break
    case 'proprioNonOccupant':
      items.push({ fieldKey: `${prefix}.vousEtes.proprio`, kind: 'check' })
      items.push({ fieldKey: `${prefix}.vousEtes.nonOccupant`, kind: 'check' })
      break
    case 'syndic':
      items.push({ fieldKey: `${prefix}.vousEtes.syndic`, kind: 'check' })
      break
    case 'gerant':
      items.push({ fieldKey: `${prefix}.vousEtes.gerant`, kind: 'check' })
      break
  }
  return items
}

export function computeOverlay(data: ConstatFormInput): OverlayItem[] {
  const items: OverlayItem[] = []
  const { sinistre, cause, pied } = data

  // En-tête
  pushText(items, 'sinistre.date', sinistre.date)
  pushText(items, 'sinistre.adresse', sinistre.adresse)
  pushEnumCheck(items, 'sinistre.typeImmeuble', sinistre.typeImmeuble)
  pushEnumCheck(items, 'sinistre.moins10Ans', sinistre.moins10Ans)
  pushText(items, 'sinistre.syndicNom', sinistre.syndicNom)
  pushText(items, 'sinistre.syndicAdresse', sinistre.syndicAdresse)
  pushText(items, 'sinistre.syndicTel', sinistre.syndicTel)

  // Parties
  items.push(...partieItems('a', data.partieA))
  items.push(...partieItems('b', data.partieB))

  // Cause
  pushEnumCheck(items, 'cause.rechercheFuite', cause.rechercheFuite)
  pushText(items, 'cause.rechercheFuiteParQui', cause.rechercheFuiteParQui)
  pushEnumCheck(items, 'cause.causeIdentifiee', cause.causeIdentifiee)
  pushEnumCheck(items, 'cause.causeReparee', cause.causeReparee)
  pushEnumCheck(items, 'cause.origine', cause.origine)
  pushText(items, 'cause.origineAilleursPrecision', cause.origineAilleursPrecision)
  pushBoolCheck(items, 'cause.fuiteCanalisation', cause.fuiteCanalisation)
  pushEnumCheck(items, 'cause.canalisationCommune', cause.canalisationCommune)
  pushEnumCheck(items, 'cause.canalisationType', cause.canalisationType)
  pushEnumCheck(items, 'cause.canalisationAccessible', cause.canalisationAccessible)
  pushBoolCheck(items, 'cause.appareilEffetEau', cause.appareilEffetEau)
  pushBoolCheck(items, 'cause.cheneaux', cause.cheneaux)
  pushBoolCheck(items, 'cause.infiltration', cause.infiltration)
  pushBoolCheck(items, 'cause.infiltrationToiture', cause.infiltrationToiture)
  pushBoolCheck(items, 'cause.infiltrationTerrasse', cause.infiltrationTerrasse)
  pushBoolCheck(items, 'cause.infiltrationFacade', cause.infiltrationFacade)
  pushBoolCheck(items, 'cause.infiltrationFenetre', cause.infiltrationFenetre)
  pushBoolCheck(items, 'cause.infiltrationJoint', cause.infiltrationJoint)
  pushBoolCheck(items, 'cause.gel', cause.gel)
  pushBoolCheck(items, 'cause.autreCause', cause.autreCause)
  pushText(items, 'cause.autreCauseLabel', cause.autreCauseLabel)
  pushEnumCheck(items, 'cause.entrepreneurOrigine', cause.entrepreneurOrigine)
  pushText(items, 'cause.entrepreneurPrecision', cause.entrepreneurPrecision)
  pushText(items, 'cause.entrepreneurNomAdresse', cause.entrepreneurNomAdresse)

  // Pied
  pushText(items, 'pied.faitA', pied.faitA)
  pushText(items, 'pied.faitLe', pied.faitLe)

  return items
}
