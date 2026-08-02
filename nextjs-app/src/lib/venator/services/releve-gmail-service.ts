// src/lib/venator/services/releve-gmail-service.ts — relève des libellés Gmail liés.
import type { SupabaseClient } from '@supabase/supabase-js'
import { accessTokenGoogle, lireConnexion } from '../google/client'
import {
  MAX_MESSAGES_PAR_RELEVE,
  construireRequeteGmail,
  versLigneFil,
  type MessageGmail,
} from '../google/gmail-messages'
import { dernierSegment } from '../google/labels'

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

export interface ResultatDossier {
  dossier_id: string
  titre: string
  label: string
  nouveaux: number
  erreur?: string
}

export interface ResultatReleve {
  dossiers: number
  nouveaux: number
  details: ResultatDossier[]
}

/** Levée quand le libellé lié n'existe plus côté Gmail. */
class LabelIntrouvable extends Error {}

async function gmail<T>(chemin: string, token: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${chemin}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    if (res.status === 404) throw new LabelIntrouvable('Libellé introuvable dans Gmail')
    const detail = await res.text().catch(() => '')
    throw new Error(`Gmail ${res.status} ${detail.slice(0, 150)}`)
  }
  return res.json() as Promise<T>
}

/**
 * Relève les libellés liés et alimente le fil des dossiers.
 *
 * Idempotente : la contrainte d'unicité sur `gmail_message_id` écarte les
 * doublons, ce qui permet de rejouer une relève sans précaution.
 *
 * Un dossier en échec (libellé supprimé côté Gmail, par exemple) n'interrompt pas
 * les autres : son erreur est remontée dans le résultat, et le cron continue.
 */
export async function releverLibellesGmail(db: SupabaseClient): Promise<ResultatReleve> {
  const connexion = await lireConnexion(db)
  if (!connexion) throw new Error('Aucun compte Google relié.')

  const token = await accessTokenGoogle(db)

  // Les dossiers clos sont écartés : leur libellé peut encore recevoir des
  // messages sans qu'on ait à les rouvrir.
  const { data: dossiers } = await db
    .from('venator_dossiers')
    .select('id, titre, copro_id, gmail_label_id, gmail_label_chemin, gmail_last_sync')
    .not('gmail_label_id', 'is', null)
    .neq('statut', 'clos')

  const details: ResultatDossier[] = []

  for (const d of dossiers ?? []) {
    let label = dernierSegment(d.gmail_label_chemin ?? '')
    try {
      // Le libellé existe-t-il toujours ? Gmail répond par une liste vide à un
      // identifiant inconnu : sans cette vérification, une liaison rompue reste
      // parfaitement silencieuse. L'appel sert aussi à récupérer le nom courant,
      // que Tom a pu renommer entre-temps (l'identifiant, lui, ne bouge pas).
      const infos = await gmail<{ name?: string }>(`/labels/${d.gmail_label_id}`, token)
      const cheminActuel = infos.name ?? d.gmail_label_chemin
      label = dernierSegment(cheminActuel ?? '')

      const q = construireRequeteGmail(d.gmail_last_sync)
      const params = new URLSearchParams({
        labelIds: d.gmail_label_id,
        maxResults: String(MAX_MESSAGES_PAR_RELEVE),
      })
      if (q) params.set('q', q)

      const liste = await gmail<{ messages?: { id: string }[] }>(`/messages?${params}`, token)
      const ids = (liste.messages ?? []).map((m) => m.id)

      let nouveaux = 0
      if (ids.length > 0) {
        // `format=metadata` : Gmail renvoie les en-têtes et le snippet, jamais le
        // corps. Le choix de ne pas rapatrier les échanges est donc tenu jusque
        // dans la requête, pas seulement au moment d'écrire en base.
        const messages = await Promise.all(
          ids.map((id) =>
            gmail<MessageGmail>(
              `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
              token
            )
          )
        )

        const lignes = messages.map((m) => ({
          ...versLigneFil(m, connexion.email),
          parent_type: 'dossier' as const,
          parent_id: d.id,
          source: 'gmail' as const,
        }))

        // Insertion une par une : une contrainte violée sur un message déjà connu
        // ferait échouer tout le lot en insertion groupée.
        for (const ligne of lignes) {
          const { error } = await db.from('venator_fil_messages').insert(ligne)
          if (!error) nouveaux++
          else if (error.code !== '23505') throw new Error(error.message)
        }
      }

      await db
        .from('venator_dossiers')
        .update({
          gmail_last_sync: new Date().toISOString(),
          gmail_label_chemin: cheminActuel,
          gmail_label_erreur: null, // la liaison fonctionne : on efface un ancien signalement
        })
        .eq('id', d.id)

      details.push({ dossier_id: d.id, titre: d.titre, label, nouveaux })
    } catch (e) {
      const motif = e instanceof Error ? e.message : 'erreur inconnue'

      // Une liaison rompue est consignée sur le dossier, pour être visible dans
      // la fiche plutôt que seulement dans la réponse du cron, que personne ne lit.
      if (e instanceof LabelIntrouvable) {
        await db.from('venator_dossiers').update({ gmail_label_erreur: motif }).eq('id', d.id)
      }

      details.push({ dossier_id: d.id, titre: d.titre, label, nouveaux: 0, erreur: motif })
    }
  }

  return {
    dossiers: details.length,
    nouveaux: details.reduce((n, d) => n + d.nouveaux, 0),
    details,
  }
}
