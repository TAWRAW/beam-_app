// src/lib/venator/google/drive-noms.ts — appariement des noms de dossiers Drive.
// AUCUN import next/* ni appel réseau : logique pure.

/**
 * Forme comparable d'un nom de dossier Drive.
 *
 * Les dossiers du cabinet portent des espaces de fin (« Devis », « PV AG »,
 * « Carnet d'entretien ») et une casse variable (« nouveau SYNDIC »). Sans cette
 * normalisation, Venator ne reconnaîtrait pas « Devis » en cherchant « Devis » et
 * créerait un doublon juste à côté — le pire résultat possible pour un classement.
 */
export function normaliserNomDossier(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function memeNomDossier(a: string, b: string): boolean {
  return normaliserNomDossier(a) === normaliserNomDossier(b)
}

/** Retrouve un dossier par son nom, quelles que soient casse, accents et espaces. */
export function trouverDossierParNom<T extends { nom: string }>(
  dossiers: T[],
  nom: string
): T | undefined {
  return dossiers.find((d) => memeNomDossier(d.nom, nom))
}

/**
 * Retrouve le dossier Drive d'une copropriété par sa référence Estale.
 *
 * Les dossiers copro ont été renommés `NNNNN — NOM — Adresse` (02/08/2026) : la
 * référence en tête rend l'appariement déterministe, là où une comparaison de
 * noms se trompait (« LE LAVOIR » apparié à 00010, « CLOS AUX DUCS » à 00008).
 *
 * Un séparateur est exigé après la référence : sans lui, « 0001 » rattraperait
 * « 00010 ». Ce n'est pas théorique — 00001 et 00010 coexistent au portefeuille.
 */
export function trouverDossierParReference<T extends { nom: string }>(
  dossiers: T[],
  reference: string
): T | undefined {
  const ref = reference.trim()
  if (!ref) return undefined
  return dossiers.find((d) => {
    const suite = d.nom.trim().slice(ref.length)
    return d.nom.trim().startsWith(ref) && (suite === '' || /^[\s—–-]/.test(suite))
  })
}

/**
 * Nom de dossier Drive acceptable, dérivé du titre du dossier Venator.
 *
 * Drive tolère presque tout sauf « / », qui y désigne une séparation de chemin —
 * un titre comme « Toiture / Étanchéité » y créerait une arborescence fantôme.
 * La longueur est bornée : certains titres font deux lignes et donneraient des
 * noms de dossiers impossibles à lire dans l'interface Drive.
 */
export function nomDossierDepuisTitre(titre: string): string {
  const propre = titre.replace(/\//g, '-').replace(/\s+/g, ' ').trim()
  return propre.length > 120 ? `${propre.slice(0, 117).trimEnd()}…` : propre
}
