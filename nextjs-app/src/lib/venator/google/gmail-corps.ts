// src/lib/venator/google/gmail-corps.ts — corps d'un message Gmail, ramené au texte.
// AUCUN import next/* ni appel réseau : logique pure, testable en environnement node.
//
// L'aperçu d'un dossier n'affiche JAMAIS le HTML d'un mail. Un corps de message
// est du contenu non fiable, et le rendre exposerait Venator à l'injection que
// la spec interdit (§10). On en extrait donc le texte, et la mise en forme
// d'origine reste consultable d'un clic dans Gmail.

/** Partie d'un message tel que l'API Gmail le renvoie (`format=full`). */
export interface PartieGmail {
  mimeType?: string
  filename?: string
  body?: { data?: string; attachmentId?: string }
  parts?: PartieGmail[]
}

/** Décode le base64 « url-safe » de Gmail (`-` et `_` au lieu de `+` et `/`). */
function decoder(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8')
}

/**
 * Première partie du type demandé, en parcourant l'arbre en profondeur.
 *
 * Les parties portant un `filename` sont écartées : une pièce jointe .txt est
 * du même type MIME que le corps, et serait sinon affichée à sa place.
 */
function chercherPartie(partie: PartieGmail, mimeType: string): string | null {
  if (partie.mimeType === mimeType && !partie.filename && partie.body?.data) {
    return decoder(partie.body.data)
  }
  for (const enfant of partie.parts ?? []) {
    const trouve = chercherPartie(enfant, mimeType)
    if (trouve !== null) return trouve
  }
  return null
}

/**
 * Texte lisible tiré d'un corps HTML.
 *
 * Les blocs `script` et `style` sont retirés avec leur contenu — sans quoi le
 * code s'afficherait comme du texte. Le balisage restant est supprimé et les
 * entités courantes rétablies.
 */
export function htmlVersTexte(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Corps du message ramené au texte, ou `null` s'il n'en porte aucun.
 *
 * La version texte est cherchée dans tout l'arbre avant la version HTML : un
 * mail ordinaire porte les deux, et le texte évite la conversion.
 */
export function extraireCorpsTexte(payload: PartieGmail | undefined): string | null {
  if (!payload) return null

  const texte = chercherPartie(payload, 'text/plain')
  if (texte !== null && texte.trim()) return texte.trim()

  const html = chercherPartie(payload, 'text/html')
  if (html !== null) {
    const converti = htmlVersTexte(html)
    if (converti) return converti
  }

  return null
}

/**
 * URL du libellé dans l'interface Gmail.
 *
 * Le chemin complet part dans le fragment, séparateurs encodés : laissés bruts,
 * ils seraient lus comme des segments d'URL et le libellé s'ouvrirait vide.
 */
export function urlLibelleGmail(chemin: string): string {
  return `https://mail.google.com/mail/u/0/#label/${encodeURIComponent(chemin)}`
}
