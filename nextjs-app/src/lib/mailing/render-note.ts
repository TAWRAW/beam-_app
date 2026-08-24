// Rendu des « notes d'information Beamô » : texte saisi dans l'outil → HTML email.
//
// Syntaxe du champ Message (voulue minimale, un bouton l'insère dans l'UI) :
//   - ligne vide            → nouveau paragraphe
//   - **gras**              → gras
//   - === TITRE             → ouvre un encadré crème à bord noir, TITRE en petites capitales
//     - élément             → puce carrée dans l'encadré
//     ===                   → ferme l'encadré
//
// Le gabarit est la transposition email de la charte beamô.fr (24/08/2026) :
// crème #F2F1E6, noir #0A0A0A, gris #5b5b52, jaune #FFC300, bords noirs 2px,
// puces carrées, objet surligné jaune. Tables + styles inline (Outlook).
// Ombre portée sur le titre : testée puis retirée (décision Tom 24/08).

const FONT = 'Arial,Helvetica,sans-serif'

export interface NoteInput {
  coproNom: string
  coproAdresse: string
  /** Ex. « NOTE D'INFORMATION », « AVIS DE TRAVAUX », « RAPPEL D'AG ». */
  typeNote: string
  /** Ex. « BÂTIMENT A ». Omise ou vide = envoi général, la pastille n'apparaît pas. */
  cible?: string
  objet: string
  /** Texte brut saisi dans l'outil, syntaxe ci-dessus. */
  corps: string
  /** Date affichée dans le pied, format JJ/MM/AAAA. */
  date: string
  signatureNom?: string
  signatureRole?: string
  signatureContact?: string
}

function echapper(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** **gras** → <strong>, après échappement HTML. */
function inline(s: string): string {
  return echapper(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

const P_STYLE = `margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:23px;color:#0A0A0A;`

function rendreParagraphe(lignes: string[]): string {
  return `<p style="${P_STYLE}">${lignes.map(inline).join('<br>')}</p>`
}

function rendreEncadre(titre: string, items: string[], libres: string[]): string {
  const puces = items
    .map(
      (t) => `<tr>
        <td style="vertical-align:top;padding:2px 10px 6px 0;"><span style="display:inline-block;width:8px;height:8px;background-color:#0A0A0A;"></span></td>
        <td style="font-family:${FONT};font-size:14px;line-height:21px;color:#0A0A0A;padding-bottom:6px;">${inline(t)}</td>
      </tr>`,
    )
    .join('')
  const texteLibre = libres.length
    ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:14px;line-height:21px;color:#0A0A0A;">${libres.map(inline).join('<br>')}</p>`
    : ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
    <tr><td style="background-color:#F2F1E6;border:2px solid #0A0A0A;border-radius:10px;padding:16px 18px;">
      ${titre ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#5b5b52;">${echapper(titre.toUpperCase())}</p>` : ''}
      ${texteLibre}
      ${puces ? `<table role="presentation" cellpadding="0" cellspacing="0">${puces}</table>` : ''}
    </td></tr>
  </table>`
}

/** Convertit le texte saisi (paragraphes, **gras**, encadrés ===) en blocs HTML email. */
export function convertirCorps(corps: string): string {
  const blocs: string[] = []
  let paragraphe: string[] = []
  let encadre: { titre: string; items: string[]; libres: string[] } | null = null

  const viderParagraphe = () => {
    if (paragraphe.length) blocs.push(rendreParagraphe(paragraphe))
    paragraphe = []
  }

  for (const brute of corps.replace(/\r\n/g, '\n').split('\n')) {
    const ligne = brute.trimEnd()
    const t = ligne.trim()

    if (encadre) {
      if (t === '===') {
        blocs.push(rendreEncadre(encadre.titre, encadre.items, encadre.libres))
        encadre = null
      } else if (t.startsWith('- ')) {
        encadre.items.push(t.slice(2))
      } else if (t !== '') {
        encadre.libres.push(t)
      }
      continue
    }

    if (t.startsWith('===')) {
      viderParagraphe()
      encadre = { titre: t.slice(3).trim(), items: [], libres: [] }
      continue
    }

    if (t === '') viderParagraphe()
    else paragraphe.push(t)
  }

  viderParagraphe()
  // Encadré jamais refermé : on le rend quand même plutôt que de perdre le texte.
  if (encadre) blocs.push(rendreEncadre(encadre.titre, encadre.items, encadre.libres))

  return blocs.join('\n')
}

/** Assemble le gabarit complet « note d'information Beamô ». */
export function rendreNote(input: NoteInput): string {
  const {
    coproNom,
    coproAdresse,
    typeNote,
    cible,
    objet,
    corps,
    date,
    signatureNom = 'Tom LEMEILLE',
    signatureRole = 'Gestionnaire de copropriétés · Beamô',
    signatureContact = '07 75 70 70 99 · tom.lemeille@beamô.fr',
  } = input

  const pastilleCible = cible?.trim()
    ? `<span style="display:inline-block;background-color:#0A0A0A;color:#FFFFFF;border:1px solid #FFFFFF;font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:1.5px;padding:4px 12px;border-radius:8px;">${echapper(cible.trim().toUpperCase())}</span>`
    : ''

  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${echapper(objet)}</title></head>
<body style="margin:0;padding:0;background-color:#F2F1E6;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${echapper(objet)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F1E6;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">

        <tr><td style="background-color:#FFFFFF;border:2px solid #0A0A0A;border-radius:14px;padding:12px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td align="left" style="vertical-align:middle;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:middle;"><img src="https://www.xn--beam-yqa.fr/logo_beamo_rond_syndic.png" width="48" height="48" alt="Beamô" style="display:block;border-radius:50%;"></td>
                <td style="vertical-align:middle;padding-left:10px;font-family:${FONT};font-weight:bold;font-size:24px;color:#0A0A0A;letter-spacing:0.5px;">Beamô</td>
              </tr></table>
            </td>
            <td align="right" style="vertical-align:middle;font-family:${FONT};font-size:11px;line-height:15px;color:#0A0A0A;font-weight:bold;">
              2 Place d'Evreux · BP 110<br>27201 VERNON CEDEX<br>07 75 70 70 99
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>

        <tr><td style="background-color:#0A0A0A;border:2px solid #0A0A0A;border-radius:14px;padding:16px 20px;" align="center">
          <p style="margin:0;font-family:${FONT};font-size:18px;font-weight:bold;color:#FFFFFF;">${echapper(coproNom)}</p>
          <p style="margin:6px 0 0;font-family:${FONT};font-size:13px;color:#F2F1E6;">${echapper(coproAdresse)}</p>
          <p style="margin:10px 0 0;">
            <span style="display:inline-block;background-color:#FFC300;color:#0A0A0A;font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:1.5px;padding:4px 12px;border-radius:8px;">${echapper(typeNote.toUpperCase())}</span>
            ${pastilleCible}
          </p>
        </td></tr>

        <tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>

        <tr><td style="background-color:#FFFFFF;border:2px solid #0A0A0A;border-radius:14px;padding:26px 28px;">
          <p style="margin:0 0 18px;font-family:${FONT};font-size:20px;line-height:30px;font-weight:bold;color:#0A0A0A;">
            <span style="background-color:#FFC300;padding:2px 6px;">${echapper(objet)}</span>
          </p>
          ${convertirCorps(corps)}
          <p style="margin:22px 0 0;font-family:${FONT};font-size:15px;line-height:23px;color:#0A0A0A;font-weight:bold;">${echapper(signatureNom)}</p>
          <p style="margin:2px 0 0;font-family:${FONT};font-size:13px;line-height:19px;color:#5b5b52;">${echapper(signatureRole)}<br>${echapper(signatureContact)}</p>
        </td></tr>

        <tr><td style="height:14px;line-height:14px;font-size:0;">&nbsp;</td></tr>

        <tr><td style="padding:0 18px;" align="center">
          <p style="margin:0;font-family:${FONT};font-size:10px;line-height:15px;color:#5b5b52;">
            Beamô SASU — BEAMO IMMOBILIER · SIREN 989 101 829 Évreux · Carte professionnelle « Syndic de Copropriété »
            CPI27012025000000013, CCI Porte de Normandie · Garantie financière SO.CA.F · RC professionnelle ALLIANZ.<br>
            Vous recevez ce message en qualité de copropriétaire de ${echapper(coproNom)}. Note envoyée le ${echapper(date)}.
          </p>
          <p style="margin:8px 0 0;font-family:${FONT};font-size:10px;color:#5b5b52;">💡 Beamô se prononce «&nbsp;Bimo&nbsp;»</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
