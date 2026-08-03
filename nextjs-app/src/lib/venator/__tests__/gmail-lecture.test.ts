import { describe, it, expect } from 'vitest'
import { decouperCorps, nettoyerTexteBrut } from '../google/gmail-lecture'

describe('google/gmail-lecture', () => {
  it('sépare la citation introduite par « a écrit : »', () => {
    // Cas réel d'un fil Gmail français : la ligne d'attribution appartient à la
    // citation, pas au message — la laisser au message ferait finir l'aperçu
    // sur une phrase coupée en deux.
    const { message, cite } = decouperCorps(
      [
        'Bonjour Madame,',
        '',
        'Je vous remercie pour votre aide.',
        '',
        'Le ven. 12 juin 2026 à 11:28, Clé en main Syndic <syndic@cle.net> a',
        'écrit :',
        '',
        '> Bonjour Monsieur,',
        '> Je vais bien merci.',
      ].join('\n'),
    )
    expect(message).toBe('Bonjour Madame,\n\nJe vous remercie pour votre aide.')
    expect(cite).toContain('Le ven. 12 juin 2026')
    expect(cite).toContain('> Bonjour Monsieur,')
  })

  it('sépare une citation sans ligne d’attribution', () => {
    const { message, cite } = decouperCorps('Ma réponse.\n\n> Le message d’origine.')
    expect(message).toBe('Ma réponse.')
    expect(cite).toBe('> Le message d’origine.')
  })

  it('sépare la signature au délimiteur normalisé', () => {
    const { message, signature } = decouperCorps('Bien cordialement,\n\n--\nTom LEMEILLE\nBeamô')
    expect(message).toBe('Bien cordialement,')
    expect(signature).toBe('Tom LEMEILLE\nBeamô')
  })

  it('replie le bloc de contact qui suit la formule de politesse', () => {
    // Cas réel : les mails du cabinet n'ont pas le délimiteur « -- », mais leur
    // signature suit toujours la formule de politesse et porte des mentions
    // légales — vingt lignes qui noient quatre lignes utiles.
    const { message, signature } = decouperCorps(
      [
        'Bonjour Madame,',
        '',
        'Je vous remercie pour votre aide.',
        '',
        'Bien Cordialement,',
        '',
        'Tom LEMEILLE',
        'Gestionnaire de Copropriétés',
        '07 75 70 70 99 | tom.lemeille@beamô.fr',
        'Beamô SASU au capital de 2 500 € — SIREN 989 101 829',
      ].join('\n'),
    )
    // La formule de politesse reste au message : elle s'adresse au lecteur.
    expect(message).toContain('Bien Cordialement,')
    expect(message).not.toContain('SIREN')
    expect(signature).toContain('Tom LEMEILLE')
    expect(signature).toContain('SIREN')
  })

  it('ne replie rien quand la formule est suivie de texte ordinaire', () => {
    // Sans marqueur de contact (téléphone, adresse, mentions légales), ce qui
    // suit est du message : le replier masquerait une phrase utile.
    const texte = 'Cordialement,\n\nPS : je vous rappelle demain matin.'
    const { message, signature } = decouperCorps(texte)
    expect(message).toBe(texte)
    expect(signature).toBeNull()
  })

  it('laisse le message entier quand rien n’est détecté', () => {
    // Règle de sûreté : sans marqueur certain, on n'ampute rien. Un découpage
    // approximatif masquerait du texte utile sans que personne s'en aperçoive.
    const texte = 'Bonjour,\n\nLe devis est accepté.\n\nCordialement'
    const { message, cite, signature } = decouperCorps(texte)
    expect(message).toBe(texte)
    expect(cite).toBeNull()
    expect(signature).toBeNull()
  })

  it('retire les artefacts du courriel en texte brut', () => {
    // Gmail rend les images par « [image: nom] » et l'emphase par des astérisques :
    // affichés tels quels, ils passent pour des fautes de frappe.
    expect(nettoyerTexteBrut('[image: Beamô]\n*Tom LEMEILLE*\nGestionnaire')).toBe(
      'Tom LEMEILLE\nGestionnaire',
    )
  })

  it('resserre les lignes vides en excès', () => {
    expect(nettoyerTexteBrut('Bonjour,\n\n\n\n\nCordialement')).toBe('Bonjour,\n\nCordialement')
  })
})
