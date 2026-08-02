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
export const COL_B_OFFSET_X = 362

// Champs de la colonne A ; la colonne B est dérivée par offset X.
const PARTIE_A_FIELDS: Record<string, FieldSpec> = {
  'nom': text(126, 282, 241),
  'adresse': text(90, 299, 278),
  'bat': text(263, 316, 25),
  'etage': text(322, 316, 48),
  'mail': text(75, 332, 295),
  'tel': text(254, 348, 115),
  'assureur': text(94, 364, 143),
  'contratNo': text(296, 364, 73),
  'sinistreNo': text(107, 396, 261),
  'agent': text(120, 413, 107),
  'agentTel': text(254, 413, 115),
  'adresseAssureur': text(51, 452, 320),
  'usageHabitation.oui': check(294, 495),
  'usageHabitation.non': check(349, 495),
  'resiliationBail.oui': check(306, 510),
  'resiliationBail.non': check(352, 510),
  'locationMeublee.oui': check(317, 525),
  'locationMeublee.non': check(360, 525),
  'vousEtes.locataire': check(135, 557),
  'proprietaireCoordonnees': text(145, 597, 225, { lines: 2, lineHeight: 24, size: 10 }),
  'vousEtes.proprio': check(135, 654),
  'vousEtes.occupant': check(140, 668),
  'vousEtes.nonOccupant': check(216, 668),
  'vousEtes.syndic': check(135, 690),
  'vousEtes.gerant': check(216, 690),
  'dommages.oui': check(242, 734),
  'dommages.non': check(293, 734),
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
  'sinistre.adresse': text(418, 116, 314),
  'sinistre.typeImmeuble.maison': check(288, 155),
  'sinistre.typeImmeuble.copro': check(428, 155),
  'sinistre.typeImmeuble.locatif': check(683, 155),
  'sinistre.moins10Ans.oui': check(350, 176),
  'sinistre.moins10Ans.non': check(396, 176),
  'sinistre.syndicNom': text(281, 191, 452),
  'sinistre.syndicAdresse': text(56, 209, 539),
  'sinistre.syndicTel': text(618, 209, 115),

  // Parties A et B
  ...buildParties(),

  // Cause du dégât des eaux
  'cause.rechercheFuite.non': check(424, 820),
  'cause.rechercheFuite.oui': check(472, 820),
  'cause.rechercheFuiteParQui': text(562, 801, 171),
  'cause.causeIdentifiee.oui': check(182, 838),
  'cause.causeIdentifiee.non': check(232, 838),
  'cause.causeReparee.oui': check(450, 838),
  'cause.causeReparee.non': check(505, 838),
  'cause.origine.A': check(287, 853),
  'cause.origine.B': check(332, 853),
  'cause.origine.ailleurs': check(380, 853),
  'cause.origineAilleursPrecision': text(440, 847, 290),
  'cause.fuiteCanalisation': check(52, 881),
  'cause.canalisationCommune.commune': check(239, 881),
  'cause.canalisationCommune.privative': check(306, 881),
  'cause.canalisationType.alimentation': check(389, 881),
  'cause.canalisationType.evacuation': check(460, 881),
  'cause.canalisationAccessible.accessible': check(550, 881),
  'cause.canalisationAccessible.nonAccessible': check(625, 881),
  'cause.appareilEffetEau': check(52, 895),
  'cause.cheneaux': check(52, 909),
  'cause.infiltration': check(52, 923),
  'cause.infiltrationToiture': check(139, 923),
  'cause.infiltrationTerrasse': check(204, 923),
  'cause.infiltrationFacade': check(268, 923),
  'cause.infiltrationFenetre': check(337, 923),
  'cause.infiltrationJoint': check(464, 923),
  'cause.gel': check(52, 937),
  'cause.autreCause': check(52, 951),
  'cause.autreCauseLabel': text(160, 943, 555),
  'cause.entrepreneurOrigine.non': check(509, 965),
  'cause.entrepreneurOrigine.oui': check(549, 965),
  'cause.entrepreneurPrecision': text(690, 957, 55, { size: 9 }),
  'cause.entrepreneurNomAdresse': text(177, 984, 555),

  // Pied
  'pied.faitA': text(105, 1037, 230),
  'pied.faitLe': text(76, 1062, 104),
}
