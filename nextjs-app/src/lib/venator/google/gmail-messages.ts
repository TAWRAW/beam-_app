// src/lib/venator/google/gmail-messages.ts — lecture des messages d'un libellé.
// AUCUN import next/* ni appel réseau : logique pure, testable en environnement node.

import type { FilDirection } from '../types'

/** Nombre de messages repris au maximum par dossier et par relève.
 *  Un libellé peut porter des années d'échanges : sans borne, la première relève
 *  d'un dossier fraîchement lié partirait chercher des centaines de messages. */
export const MAX_MESSAGES_PAR_RELEVE = 25

export interface EnTeteGmail {
  name: string
  value: string
}

export interface MessageGmail {
  id: string
  snippet?: string
  internalDate?: string
  payload?: { headers?: EnTeteGmail[] }
}

/**
 * Requête Gmail restreignant la relève aux messages postérieurs au dernier passage.
 *
 * `after:` attend un timestamp en secondes. On retranche une minute : Gmail
 * indexe avec un léger décalage, et un message arrivé pile à l'instant du dernier
 * passage serait sinon sauté définitivement. La contrainte d'unicité sur
 * gmail_message_id absorbe le doublon que ce recouvrement peut produire.
 */
export function construireRequeteGmail(dernierSync: string | null): string {
  if (!dernierSync) return ''
  const ms = new Date(dernierSync).getTime()
  if (Number.isNaN(ms)) return ''
  return `after:${Math.floor(ms / 1000) - 60}`
}

/** Valeur d'un en-tête, insensible à la casse (Gmail alterne « From » et « from »). */
export function enTete(message: MessageGmail, nom: string): string | null {
  const h = message.payload?.headers?.find((x) => x.name.toLowerCase() === nom.toLowerCase())
  return h?.value ?? null
}

/** Adresse seule, extraite d'un « Tom LEMEILLE <tom@beamo.fr> ». */
export function extraireEmail(from: string | null): string | null {
  if (!from) return null
  const m = from.match(/<([^>]+)>/)
  return (m ? m[1] : from).trim().toLowerCase()
}

/**
 * Adresse comparable, domaine ramené en punycode.
 *
 * Le domaine du cabinet est accentué : Gmail renvoie « tom.lemeille@beamô.fr »
 * dans les en-têtes, alors que l'API expose le compte sous sa forme ASCII
 * « tom.lemeille@xn--beam-yqa.fr ». Comparées telles quelles, ces deux écritures
 * de la même adresse diffèrent — et tous les messages envoyés par Tom étaient
 * classés « entrants » (constaté à l'écran).
 */
export function normaliserEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at === -1) return email.trim().toLowerCase()
  const local = email.slice(0, at).trim().toLowerCase()
  const domaine = email.slice(at + 1).trim()
  try {
    // L'API URL applique la conversion IDN → ASCII (norme WHATWG).
    return `${local}@${new URL(`http://${domaine}`).hostname}`
  } catch {
    return `${local}@${domaine.toLowerCase()}`
  }
}

/**
 * Un message parti du cabinet est « sortant », les autres « entrants ».
 *
 * La comparaison porte sur l'adresse normalisée, jamais sur la chaîne complète :
 * le nom d'affichage varie (« Tom LEMEILLE », « Beamô », « tom.lemeille »).
 */
export function directionMessage(from: string | null, emailCompte: string): FilDirection {
  const expediteur = extraireEmail(from)
  if (!expediteur) return 'entrant'
  return normaliserEmail(expediteur) === normaliserEmail(emailCompte) ? 'sortant' : 'entrant'
}

export interface LigneFil {
  direction: FilDirection
  from_email: string | null
  sujet: string | null
  contenu: string
  gmail_message_id: string
  created_at: string
}

/**
 * Message Gmail transformé en ligne de fil.
 *
 * Seul le `snippet` est repris — jamais le corps : conformément au choix retenu,
 * les échanges restent chez Google, Venator n'en garde qu'une trace consultable.
 */
export function versLigneFil(message: MessageGmail, emailCompte: string): LigneFil {
  const from = enTete(message, 'From')
  const sujet = enTete(message, 'Subject')
  // internalDate (ms epoch) fait foi : l'en-tête Date est déclaratif et parfois faux.
  const date = message.internalDate
    ? new Date(Number(message.internalDate)).toISOString()
    : new Date().toISOString()

  return {
    direction: directionMessage(from, emailCompte),
    from_email: extraireEmail(from),
    sujet,
    // `contenu` est NOT NULL en base : un message sans extrait ni objet doit
    // tout de même laisser une trace lisible dans le fil.
    contenu: message.snippet?.trim() || sujet || '(message sans aperçu)',
    gmail_message_id: message.id,
    created_at: date,
  }
}
