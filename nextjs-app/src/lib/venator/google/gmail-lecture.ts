// src/lib/venator/google/gmail-lecture.ts — mise en lecture du corps d'un mail.
// AUCUN import next/* ni appel réseau : logique pure, testable en environnement node.
//
// Un mail affiché tel quel est illisible : quatre lignes utiles y côtoient vingt
// lignes de mentions légales et l'intégralité du fil cité. L'aperçu d'un dossier
// montre donc le message, et replie le reste.
//
// Règle de sûreté : sans marqueur certain, on ne coupe rien. Un découpage
// approximatif masquerait du texte utile sans que personne s'en aperçoive —
// et ce qui est replié reste toujours dépliable, jamais supprimé.

export interface CorpsDecoupe {
  /** Le message proprement dit. */
  message: string
  /** Bloc de signature, `null` si le mail n'en délimite pas. */
  signature: string | null
  /** Fil cité, `null` si le mail n'en contient pas. */
  cite: string | null
}

/** Ligne d'attribution qui introduit une citation (« … a écrit : », « … wrote: »). */
const ATTRIBUTION = /(a\s+écrit|wrote)\s*:?\s*$/i

/** Séparateurs explicites posés par les logiciels de messagerie. */
const SEPARATEUR_CITE = /^\s*-{2,}\s*(message d'origine|original message|forwarded message)\s*-{2,}/i

/** Délimiteur de signature normalisé (RFC 3676) : une ligne « -- ». */
const DELIMITEUR_SIGNATURE = /^--\s*$/

/** Formule de politesse fermant un message. */
const POLITESSE =
  /^\s*(bien\s+)?(cordialement|sincèrement|amicalement|respectueusement|à\s+bientôt|bien\s+à\s+vous|sincères\s+salutations|salutations\s+distinguées|best\s+regards|regards|sincerely)\s*[,.!]?\s*$/i

/** Indices d'un bloc de contact : téléphone, adresse électronique, lien, mentions légales. */
const MARQUEUR_CONTACT =
  /(\b\d{2}[\s.]\d{2}[\s.]\d{2}[\s.]\d{2}[\s.]\d{2}\b|[\w.+-]+@[\w-]+\.[\w.]+|https?:\/\/|\b(siren|siret|sasu|sarl|tva|capital|rcs)\b)/i

/**
 * Retire les artefacts propres au rendu texte de Gmail.
 *
 * Les images deviennent « [image: nom] » et l'emphase est marquée par des
 * astérisques : affichés tels quels, ils passent pour des fautes de frappe.
 */
export function nettoyerTexteBrut(texte: string): string {
  return texte
    .replace(/\[image:[^\]]*\]/gi, '')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Indice de la première ligne du fil cité, ou -1. */
function debutCitation(lignes: string[]): number {
  const separateur = lignes.findIndex((l) => SEPARATEUR_CITE.test(l))
  if (separateur !== -1) return separateur

  const premierChevron = lignes.findIndex((l) => l.startsWith('>'))
  if (premierChevron === -1) return -1

  // La ligne d'attribution appartient à la citation qu'elle introduit. Gmail la
  // replie volontiers sur deux lignes (« … Syndic <a@b.net> a » / « écrit : »),
  // dont aucune ne porte le marqueur à elle seule : on teste donc le bloc de
  // lignes pleines qui précède la citation, recollé.
  let fin = premierChevron - 1
  while (fin >= 0 && lignes[fin].trim() === '') fin--
  let debut = fin
  while (debut > 0 && lignes[debut - 1].trim() !== '' && fin - debut < 3) debut--

  if (debut <= fin && ATTRIBUTION.test(lignes.slice(debut, fin + 1).join(' '))) return debut
  return premierChevron
}

/**
 * Corps découpé en message, signature et fil cité.
 *
 * La signature n'est cherchée qu'avant la citation : un fil cité contient les
 * signatures de tous les échanges précédents, et la première rencontrée
 * amputerait le message de tout ce qui la suit.
 */
export function decouperCorps(texte: string): CorpsDecoupe {
  const lignes = texte.split('\n')

  const iCite = debutCitation(lignes)
  const avantCite = iCite === -1 ? lignes : lignes.slice(0, iCite)
  const cite = iCite === -1 ? null : lignes.slice(iCite).join('\n').trim() || null

  const iDelimiteur = avantCite.findIndex((l) => DELIMITEUR_SIGNATURE.test(l))
  if (iDelimiteur !== -1) {
    return {
      message: avantCite.slice(0, iDelimiteur).join('\n').trim(),
      signature: avantCite.slice(iDelimiteur + 1).join('\n').trim() || null,
      cite,
    }
  }

  const iContact = debutBlocContact(avantCite)
  if (iContact !== -1) {
    return {
      message: avantCite.slice(0, iContact).join('\n').trim(),
      signature: avantCite.slice(iContact).join('\n').trim() || null,
      cite,
    }
  }

  return { message: avantCite.join('\n').trim(), signature: null, cite }
}

/**
 * Début du bloc de contact suivant la formule de politesse, ou -1.
 *
 * Les messages du cabinet ne portent pas le délimiteur normalisé : leur
 * signature se reconnaît à sa position (après la formule de politesse) ET à son
 * contenu (téléphone, adresse électronique, mentions légales). Exiger les deux
 * évite de replier un post-scriptum, qui suit lui aussi la formule.
 *
 * La formule de politesse, elle, reste au message : elle s'adresse au lecteur.
 */
function debutBlocContact(lignes: string[]): number {
  for (let i = lignes.length - 1; i >= 0; i--) {
    if (!POLITESSE.test(lignes[i])) continue

    let debut = i + 1
    while (debut < lignes.length && lignes[debut].trim() === '') debut++
    if (debut >= lignes.length) return -1

    const suite = lignes.slice(debut).join('\n')
    return MARQUEUR_CONTACT.test(suite) ? debut : -1
  }
  return -1
}
