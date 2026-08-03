import { describe, it, expect } from 'vitest'
import { extraireCorpsTexte, urlLibelleGmail } from '../google/gmail-corps'

/** Encode comme Gmail : base64 « url-safe », sans remplissage. */
function b64(texte: string) {
  return Buffer.from(texte, 'utf8').toString('base64url')
}

describe('google/gmail-corps', () => {
  it('lit le corps d’un message d’une seule partie', () => {
    const corps = extraireCorpsTexte({
      mimeType: 'text/plain',
      body: { data: b64('Bonjour Tom,\nvoici le devis.') },
    })
    expect(corps).toBe('Bonjour Tom,\nvoici le devis.')
  })

  it('préfère le texte au HTML quand les deux versions existent', () => {
    // Un mail ordinaire est multipart/alternative : même contenu, deux formats.
    // Prendre le HTML obligerait à le rendre — ce que l'aperçu refuse de faire.
    const corps = extraireCorpsTexte({
      mimeType: 'multipart/alternative',
      parts: [
        { mimeType: 'text/plain', body: { data: b64('Version texte') } },
        { mimeType: 'text/html', body: { data: b64('<p>Version HTML</p>') } },
      ],
    })
    expect(corps).toBe('Version texte')
  })

  it('descend dans les parties imbriquées', () => {
    // Un mail avec pièce jointe emboîte l'alternative sous un multipart/mixed :
    // sans récursion, l'aperçu d'un mail à pièce jointe resterait vide.
    const corps = extraireCorpsTexte({
      mimeType: 'multipart/mixed',
      parts: [
        {
          mimeType: 'multipart/alternative',
          parts: [{ mimeType: 'text/plain', body: { data: b64('Le devis est joint.') } }],
        },
        { mimeType: 'application/pdf', filename: 'devis.pdf', body: { attachmentId: 'a1' } },
      ],
    })
    expect(corps).toBe('Le devis est joint.')
  })

  it('replie le HTML en texte lisible quand il n’y a pas de version texte', () => {
    // Certains expéditeurs n'envoient que du HTML. Plutôt qu'un aperçu vide,
    // on en tire le texte — sans jamais rendre le balisage.
    const corps = extraireCorpsTexte({
      mimeType: 'text/html',
      body: { data: b64('<p>Bonjour,</p><br><p>ci-joint le devis &amp; le planning.</p><script>alert(1)</script>') },
    })
    expect(corps).toContain('Bonjour,')
    expect(corps).toContain('ci-joint le devis & le planning.')
    expect(corps).not.toContain('<p>')
    expect(corps).not.toContain('alert(1)')
  })

  it('renvoie null quand le message ne porte aucun corps', () => {
    expect(extraireCorpsTexte({ mimeType: 'multipart/mixed', parts: [] })).toBeNull()
    expect(extraireCorpsTexte(undefined)).toBeNull()
  })

  it('encode le chemin d’un libellé imbriqué dans l’URL Gmail', () => {
    // Gmail attend le chemin complet dans le fragment, les séparateurs encodés :
    // laissés bruts, ils seraient lus comme des segments d'URL et le libellé
    // s'ouvrirait vide.
    expect(urlLibelleGmail('Copropriétés/00010/Toiture')).toBe(
      'https://mail.google.com/mail/u/0/#label/Copropri%C3%A9t%C3%A9s%2F00010%2FToiture',
    )
  })
})
