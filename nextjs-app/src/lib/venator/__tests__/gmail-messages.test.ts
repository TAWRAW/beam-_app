import { describe, it, expect } from 'vitest'
import {
  construireRequeteGmail,
  directionMessage,
  enTete,
  extraireEmail,
  normaliserEmail,
  versLigneFil,
} from '../google/gmail-messages'

const COMPTE = 'tom.lemeille@xn--beam-yqa.fr'

function message(headers: Record<string, string>, extra: Record<string, unknown> = {}) {
  return {
    id: 'm1',
    snippet: 'Bonjour Tom, voici le devis…',
    internalDate: '1785600000000',
    payload: { headers: Object.entries(headers).map(([name, value]) => ({ name, value })) },
    ...extra,
  }
}

describe('google/gmail-messages', () => {
  it('ne relève que les messages postérieurs, avec un recouvrement d’une minute', () => {
    expect(construireRequeteGmail(null)).toBe('')
    const q = construireRequeteGmail('2026-08-01T10:00:00.000Z')
    // Gmail indexe avec un léger décalage : sans ce recul, un message arrivé
    // pile à l'instant du dernier passage serait sauté définitivement.
    expect(q).toBe(`after:${Math.floor(Date.parse('2026-08-01T10:00:00.000Z') / 1000) - 60}`)
  })

  it('ignore une date de dernier passage illisible plutôt que de produire NaN', () => {
    expect(construireRequeteGmail('pas-une-date')).toBe('')
  })

  it('lit les en-têtes quelle que soit la casse', () => {
    expect(enTete(message({ from: 'a@b.fr' }), 'From')).toBe('a@b.fr')
    expect(enTete(message({ Subject: 'Devis' }), 'subject')).toBe('Devis')
    expect(enTete(message({}), 'From')).toBeNull()
  })

  it('extrait l’adresse du nom d’affichage', () => {
    expect(extraireEmail('Tom LEMEILLE <Tom@Beamo.fr>')).toBe('tom@beamo.fr')
    expect(extraireEmail('brut@exemple.fr')).toBe('brut@exemple.fr')
    expect(extraireEmail(null)).toBeNull()
  })

  it('distingue entrant et sortant sur l’adresse, pas sur le libellé affiché', () => {
    // Le nom d'affichage varie (« Tom LEMEILLE », « Beamô »…) : s'y fier
    // classerait des messages du cabinet comme entrants.
    expect(directionMessage(`Beamô <${COMPTE}>`, COMPTE)).toBe('sortant')
    expect(directionMessage(COMPTE.toUpperCase(), COMPTE)).toBe('sortant')
    expect(directionMessage('g.amaury@vimmo-conseil.fr', COMPTE)).toBe('entrant')
    // Expéditeur absent : entrant par défaut, plutôt que d'attribuer au cabinet.
    expect(directionMessage(null, COMPTE)).toBe('entrant')
  })

  it('reconnaît le cabinet malgré le domaine accentué', () => {
    // Cas réel : Gmail renvoie « @beamô.fr » dans les en-têtes, alors que le
    // compte relié est enregistré « @xn--beam-yqa.fr ». Sans normalisation IDN,
    // tous les messages envoyés par Tom étaient classés « entrants ».
    expect(directionMessage('Tom LEMEILLE <tom.lemeille@beamô.fr>', COMPTE)).toBe('sortant')
    expect(directionMessage('tom.lemeille@xn--beam-yqa.fr', 'tom.lemeille@beamô.fr')).toBe('sortant')
    expect(normaliserEmail('Tom.Lemeille@beamô.fr')).toBe('tom.lemeille@xn--beam-yqa.fr')
    // Une adresse d'un autre domaine reste entrante.
    expect(directionMessage('contact@beamo.fr', COMPTE)).toBe('entrant')
  })

  it('convertit un message en ligne de fil sans rapatrier le corps', () => {
    const ligne = versLigneFil(
      message({ From: 'g.amaury@vimmo-conseil.fr', Subject: 'ETATS DES LIEUX' }),
      COMPTE
    )
    expect(ligne).toMatchObject({
      direction: 'entrant',
      from_email: 'g.amaury@vimmo-conseil.fr',
      sujet: 'ETATS DES LIEUX',
      contenu: 'Bonjour Tom, voici le devis…',
      gmail_message_id: 'm1',
    })
    expect(ligne.created_at).toBe(new Date(1785600000000).toISOString())
  })

  it('garantit un contenu non vide — la colonne est NOT NULL', () => {
    // Sans extrait, on retombe sur l'objet ; sans objet non plus, sur un texte
    // explicite. Une insertion nulle ferait échouer toute la relève.
    expect(versLigneFil(message({ Subject: 'Relance' }, { snippet: '   ' }), COMPTE).contenu).toBe('Relance')
    expect(versLigneFil(message({}, { snippet: '' }), COMPTE).contenu).toBe('(message sans aperçu)')
  })

  it('se rabat sur l’heure courante si internalDate manque', () => {
    const avant = Date.now()
    const ligne = versLigneFil(message({ From: 'x@y.fr' }, { internalDate: undefined }), COMPTE)
    expect(new Date(ligne.created_at).getTime()).toBeGreaterThanOrEqual(avant)
  })
})
