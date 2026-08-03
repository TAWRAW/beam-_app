// Carte de coordonnées du Constat amiable DDE.
// Unité : px sur une page de référence 794×1123 (A4 @96dpi, convention preview),
// rendus en % de la page → identique quel que soit le support (aperçu scalé, print 210mm).
// Source de vérité UNIQUE pour l'aperçu ET l'export PDF.

export const PAGE_W = 794
export const PAGE_H = 1123

export type TextSpec = {
  kind: 'text'
  x: number
  y: number
  w?: number
  size?: number
  align?: 'left' | 'center'
  lines?: number // >1 : bloc multi-lignes (whiteSpace pre-line)
  lineHeight?: number
}

export type CheckSpec = {
  kind: 'check'
  x: number
  y: number
  size?: number
}

export type FieldSpec = TextSpec | CheckSpec

const text = (x: number, y: number, w?: number, extra?: Partial<TextSpec>): TextSpec => ({
  kind: 'text', x, y, w, ...extra,
})
const check = (x: number, y: number, size?: number): CheckSpec => ({ kind: 'check', x, y, size })

// Décalage horizontal entre la colonne A et la colonne B (symétriques)
export const COL_B_OFFSET_X = 361

// Champs de la colonne A ; la colonne B est dérivée par offset X.
const PARTIE_A_FIELDS: Record<string, FieldSpec> = {
  'nom': text(143, 290, 224),
  'adresse': text(95, 303, 273),
  'bat': text(263, 320, 25),
  'etage': text(322, 320, 48),
  'mail': text(75, 336, 295),
  'tel': text(254, 352, 115),
  // 2 lignes : la ligne vierge sous « Assureur » sert de continuation pour les noms longs
  'assureur': text(98, 368, 146, { lines: 2, lineHeight: 15, size: 9 }),
  'contratNo': text(296, 369, 76, { size: 9 }),
  'sinistreNo': text(107, 400, 261),
  'agent': text(120, 417, 107),
  'agentTel': text(254, 417, 115),
  'adresseAssureur': text(51, 455, 320),
  'usageHabitation.oui': check(280, 494),
  'usageHabitation.non': check(320, 494),
  'resiliationBail.oui': check(301, 510),
  'resiliationBail.non': check(340, 510),
  'locationMeublee.oui': check(301, 525),
  'locationMeublee.non': check(340, 525),
  'vousEtes.locataire': check(131, 554),
  'proprietaireCoordonnees': text(145, 600, 225, { lines: 2, lineHeight: 24, size: 10 }),
  'vousEtes.proprio': check(131, 651),
  'vousEtes.occupant': check(145, 665),
  'vousEtes.nonOccupant': check(220, 665),
  'vousEtes.syndic': check(131, 688),
  'vousEtes.gerant': check(202, 688),
  'dommages.oui': check(240, 735),
  'dommages.non': check(280, 735),
}

function buildParties(): Record<string, FieldSpec> {
  const out: Record<string, FieldSpec> = {}
  for (const [key, spec] of Object.entries(PARTIE_A_FIELDS)) {
    out[`a.${key}`] = spec
    out[`b.${key}`] = { ...spec, x: spec.x + COL_B_OFFSET_X }
  }
  return out
}

export const CONSTAT_FIELDS: Record<string, FieldSpec> = {
  // En-tête
  'sinistre.date': text(128, 146, 68, { size: 11 }),
  'sinistre.adresse': text(418, 119, 314),
  'sinistre.typeImmeuble.maison': check(268, 157),
  'sinistre.typeImmeuble.copro': check(416, 157),
  'sinistre.typeImmeuble.locatif': check(588, 157),
  'sinistre.moins10Ans.oui': check(340, 177),
  'sinistre.moins10Ans.non': check(380, 177),
  'sinistre.syndicNom': text(281, 196, 452),
  'sinistre.syndicAdresse': text(56, 212, 539),
  'sinistre.syndicTel': text(618, 212, 115),

  // Parties A et B
  ...buildParties(),

  // Cause du dégât des eaux
  'cause.rechercheFuite.non': check(420, 824),
  'cause.rechercheFuite.oui': check(464, 824),
  'cause.rechercheFuiteParQui': text(562, 824, 171),
  'cause.causeIdentifiee.oui': check(179, 838),
  'cause.causeIdentifiee.non': check(220, 838),
  'cause.causeReparee.oui': check(439, 838),
  'cause.causeReparee.non': check(479, 838),
  'cause.origine.A': check(284, 851),
  'cause.origine.B': check(317, 851),
  'cause.origine.ailleurs': check(350, 851),
  'cause.origineAilleursPrecision': text(462, 852, 270),
  'cause.fuiteCanalisation': check(49, 878),
  'cause.canalisationCommune.commune': check(229, 878),
  'cause.canalisationCommune.privative': check(303, 878),
  'cause.canalisationType.alimentation': check(377, 878),
  'cause.canalisationType.evacuation': check(460, 878),
  'cause.canalisationAccessible.accessible': check(548, 878),
  'cause.canalisationAccessible.nonAccessible': check(623, 878),
  'cause.appareilEffetEau': check(49, 891),
  'cause.cheneaux': check(49, 904),
  'cause.infiltration': check(49, 918),
  'cause.infiltrationToiture': check(152, 919),
  'cause.infiltrationTerrasse': check(207, 919),
  'cause.infiltrationFacade': check(271, 919),
  'cause.infiltrationFenetre': check(328, 919),
  'cause.infiltrationJoint': check(467, 919),
  'cause.gel': check(49, 932),
  'cause.autreCause': check(49, 945),
  'cause.autreCauseLabel': text(190, 946, 525),
  'cause.entrepreneurOrigine.non': check(494, 960),
  'cause.entrepreneurOrigine.oui': check(539, 960),
  'cause.entrepreneurPrecision': text(690, 962, 55, { size: 9 }),
  'cause.entrepreneurNomAdresse': text(177, 984, 555),

  // Pied
  'pied.faitA': text(105, 1037, 230),
  'pied.faitLe': text(76, 1065, 104),
}
