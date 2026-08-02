// src/lib/venator/google/labels.ts — mise en forme de l'arborescence de libellés Gmail.
// AUCUN import next/* ni appel réseau : logique pure, testable en environnement node.
//
// Gmail n'expose pas d'arbre : les libellés imbriqués sont des noms plats séparés
// par « / » (« 20 rue d'Albuféra 27200/Travaux/Toiture »). C'est ici qu'on
// reconstruit la hiérarchie.

export interface GmailLabelBrut {
  id: string
  name: string
  type?: string
}

export interface LabelArbre {
  id: string
  /** Chemin complet, tel que Gmail le stocke. Désambiguïse « Toiture » entre copros. */
  chemin: string
  /** Dernier segment — le seul affiché, conformément au choix de Tom. */
  feuille: string
  /** Profondeur (0 = racine), pour l'indentation du sélecteur. */
  niveau: number
  /** Un libellé sans enfant. Seules les feuilles se rattachent à un dossier. */
  estFeuille: boolean
}

/** Dernier segment d'un chemin de libellé. */
export function dernierSegment(chemin: string): string {
  const i = chemin.lastIndexOf('/')
  return i === -1 ? chemin : chemin.slice(i + 1)
}

/**
 * Libellés personnels mis en forme, triés par chemin.
 *
 * Les libellés système (INBOX, SENT, CATEGORY_*…) sont écartés : ils ne
 * correspondent à aucun dossier métier et noieraient le sélecteur.
 */
export function construireArbre(labels: GmailLabelBrut[]): LabelArbre[] {
  const perso = labels.filter((l) => l.type !== 'system' && l.name)
  const chemins = new Set(perso.map((l) => l.name))

  return perso
    .map((l) => ({
      id: l.id,
      chemin: l.name,
      feuille: dernierSegment(l.name),
      niveau: l.name.split('/').length - 1,
      // Un libellé est une feuille si aucun autre ne le prolonge d'un « / ».
      estFeuille: ![...chemins].some((c) => c.startsWith(`${l.name}/`)),
    }))
    .sort((a, b) => a.chemin.localeCompare(b.chemin, 'fr'))
}

/**
 * Minuscules sans accents ni signes diacritiques.
 *
 * Les libellés du cabinet mélangent les deux orthographes — « 20 rue d'Albuféra »
 * et « 75 rue d'Albufera » — et l'on ne se souvient pas de laquelle porte
 * l'accent. Sans cette normalisation, taper « albufera » ne remontait que l'une
 * des deux copropriétés (constaté). Vaut aussi pour LÉPOUZÉ, CHÊNES, Général.
 */
function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Filtre de recherche : porte sur le chemin complet, pas seulement la feuille.
 *
 * Taper « Albuféra » doit remonter tous les sujets de cette copropriété, alors
 * que le mot n'apparaît que dans le segment racine.
 */
export function filtrerLabels(arbre: LabelArbre[], requete: string): LabelArbre[] {
  const q = normaliser(requete.trim())
  if (!q) return arbre
  return arbre.filter((l) => normaliser(l.chemin).includes(q))
}
