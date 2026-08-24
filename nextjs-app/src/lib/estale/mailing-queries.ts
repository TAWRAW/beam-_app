// Mailing ciblé Estale — ciblage par clé de répartition / bâtiment, puis création d'un BROUILLON.
//
// Pourquoi ce module existe : l'écran « Ajouter des copropriétaires » d'Estale ne propose aucun
// filtre bâtiment / clé de répartition / escalier (vérifié 22/08/2026, et l'API le confirme :
// upsertRecipientsOwner ne prend qu'une liste d'IDs, sans critère). La donnée de ciblage existe
// pourtant : Owner.buildings, Owner.dks, Condo.buildings, Condo.dks. On la lit ici pour composer
// la liste, puis on la pousse telle quelle dans le module Mailing natif.
//
// ⚠️ ENVOI — RÈGLE DE SÉPARATION ⚠️
// La création d'un brouillon (`creerBrouillonMailing`) n'envoie JAMAIS.
// L'envoi vit dans une fonction distincte (`envoyerMailing`), appelée depuis une route
// séparée, qui exige une confirmation explicite et vérifie l'état avant d'agir.
// Décision Tom du 23/08/2026 : bouton d'envoi ajouté dans l'outil après validation du
// premier brouillon réel. Ne jamais fusionner les deux étapes.
//
// Restent proscrits :
//   - createMailingExpress (son input embarque `send`, donc envoi sans relecture possible)
//   - MailingMutation.print (génère des plis facturés)
//
// Pièges Estale : les variables d'objet doivent être déclarées NON nullables ($input: X!) ;
// le message « Oupss une erreur s'est produite » masque souvent une erreur de validation de
// NOTRE requête (ex. : `condos` n'existe pas sur Query, il est porté par Establishment).

import { estaleGraphQL } from '../estale-api'

// --- Types ----------------------------------------------------------------

export interface MailingCondoRef {
  id: string
  name: string
  reference: string
}

export interface MailingBuilding {
  id: string
  name: string
}

export interface MailingDistributionKey {
  id: string
  name: string
  code: string
  nbOwners: number
}

export interface MailingTargetOwner {
  id: string
  fullname: string
  email?: string | null
  phone?: string | null
  mobile?: string | null
  canReceiveMail: boolean
  canReceiveSMS: boolean
  buildingIDs: string[]
  dkIDs: string[]
}

export interface MailingCiblage {
  condo: MailingCondoRef
  /** Adresse formatée de la copropriété (pour le cartouche du gabarit de note). */
  condoAdresse: string
  establishmentID: string
  buildings: MailingBuilding[]
  dks: MailingDistributionKey[]
  owners: MailingTargetOwner[]
}

export interface BrouillonCree {
  mailingId: string
  title: string
  nbRecipients: number
  isSent: boolean
  isSending: boolean
}

// --- Lecture --------------------------------------------------------------

interface EtablissementResponse {
  me: {
    collaborator: { id: string; email: string; fullname: string }
    establishment: {
      id: string
      condos: MailingCondoRef[]
    }
  }
}

export interface Collaborateur {
  id: string
  email: string
  fullname: string
}

/** Liste les copropriétés actives + l'ID d'établissement + l'identité du collaborateur connecté. */
export async function getCoproprietes(): Promise<{
  establishmentID: string
  condos: MailingCondoRef[]
  collaborateur: Collaborateur
}> {
  // `condos` n'existe PAS sur Query : il est porté par Establishment.
  const data = await estaleGraphQL<EtablissementResponse>(
    `query MailingCopros($archived: Boolean!) {
      me {
        collaborator { id email fullname }
        establishment { id condos(archived: $archived) { id name reference } }
      }
    }`,
    { archived: false },
  )
  const condos = [...data.me.establishment.condos].sort((a, b) =>
    a.reference.localeCompare(b.reference),
  )
  return {
    establishmentID: data.me.establishment.id,
    condos,
    collaborateur: data.me.collaborator,
  }
}

interface CiblageResponse {
  condo: {
    id: string
    name: string
    reference: string
    address?: {
      housenumber?: string | null
      street?: string | null
      postcode?: string | null
      city?: string | null
    } | null
    buildings: MailingBuilding[]
    dks: MailingDistributionKey[]
    owners: {
      id: string
      fullname: string
      email?: string | null
      phone?: string | null
      mobile?: string | null
      canReceiveMail: boolean
      canReceiveSMS: boolean
      buildings?: { id: string }[] | null
      dks?: { id: string }[] | null
    }[]
  }
}

/**
 * Ciblage d'une copropriété : ses bâtiments, ses clés de répartition, et ses copropriétaires
 * avec le rattachement à chacun. Le filtrage lui-même se fait côté appelant (chips bâtiment/clé).
 */
export async function getCiblage(condoID: string): Promise<MailingCiblage & { collaborateur: Collaborateur }> {
  const { establishmentID, collaborateur } = await getCoproprietes()
  const data = await estaleGraphQL<CiblageResponse>(
    `query MailingCiblage($id: ID!) {
      condo(id: $id) {
        id
        name
        reference
        address { housenumber street postcode city }
        buildings { id name }
        dks { id name code nbOwners }
        owners {
          id
          fullname
          email
          phone
          mobile
          canReceiveMail
          canReceiveSMS
          buildings { id }
          dks { id }
        }
      }
    }`,
    { id: condoID },
  )

  const c = data.condo
  const a = c.address
  const condoAdresse = a
    ? [
        [a.housenumber, a.street].filter(Boolean).join(' '),
        [a.postcode, a.city].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join(', ')
    : ''
  return {
    condo: { id: c.id, name: c.name, reference: c.reference },
    condoAdresse,
    establishmentID,
    collaborateur,
    buildings: [...c.buildings].sort((a, b) => a.name.localeCompare(b.name)),
    dks: [...c.dks].sort((a, b) => a.code.localeCompare(b.code)),
    owners: c.owners.map((o) => ({
      id: o.id,
      fullname: o.fullname,
      email: o.email,
      phone: o.phone,
      mobile: o.mobile,
      canReceiveMail: o.canReceiveMail,
      canReceiveSMS: o.canReceiveSMS,
      buildingIDs: (o.buildings ?? []).map((b) => b.id),
      dkIDs: (o.dks ?? []).map((d) => d.id),
    })),
  }
}

/**
 * Filtre les copropriétaires par bâtiments et/ou clés (union : un copropriétaire est retenu
 * s'il appartient à AU MOINS un des critères cochés, à l'image de l'opérateur « Ou » d'Estale).
 * Sans aucun critère, retourne la liste complète.
 */
export function filtrerOwners(
  owners: MailingTargetOwner[],
  buildingIDs: string[],
  dkIDs: string[],
): MailingTargetOwner[] {
  if (buildingIDs.length === 0 && dkIDs.length === 0) return owners
  const bats = new Set(buildingIDs)
  const cles = new Set(dkIDs)
  return owners.filter(
    (o) =>
      o.buildingIDs.some((id) => bats.has(id)) || o.dkIDs.some((id) => cles.has(id)),
  )
}

// --- Écriture : BROUILLON UNIQUEMENT --------------------------------------

interface CreateMailingResponse {
  createMailing: { id: string }
}

interface MailingEtatResponse {
  condo: {
    mailing: {
      item: {
        id: string
        title: string
        nbRecipients: number
        isSent: boolean
        isSending: boolean
      }
    }
  }
}

export interface BrouillonInput {
  establishmentID: string
  condoID: string
  /** Titre interne de la campagne, visible dans la liste des mailings Estale. */
  title: string
  /** Objet du courriel vu par le destinataire. */
  object: string
  /** Corps du courriel (HTML accepté par Estale). */
  content: string
  ownerIDs: string[]
  replyto?: string
  /**
   * Mise en copie du gestionnaire : ajouté comme destinataire libre (« externe ») du mailing.
   * Estale n'expose pas de champ CC ; c'est le seul moyen de recevoir le message soi-même.
   */
  copie?: { name: string; email: string }
}

/** Adresse du cabinet — `AddressInput` exige postcode, city et country. */
const ADRESSE_CABINET = {
  label: 'Beamô',
  street: "2 Place d'Evreux BP 110",
  postcode: '27201',
  city: 'Vernon Cedex',
  country: 'France',
}

/**
 * Crée un mailing Estale À L'ÉTAT DE BROUILLON : campagne + paramètres + contenu + destinataires.
 * N'appelle jamais `send`. Le mailing reste à envoyer manuellement depuis Estale.
 */
export async function creerBrouillonMailing(input: BrouillonInput): Promise<BrouillonCree> {
  if (input.ownerIDs.length === 0) {
    throw new Error('Aucun destinataire sélectionné : brouillon non créé.')
  }

  // 1) Création de la campagne
  const created = await estaleGraphQL<CreateMailingResponse>(
    `mutation MailingCreer($input: MailingCreateInput!) {
      createMailing(input: $input) { id }
    }`,
    { input: { establishmentID: input.establishmentID, title: input.title } },
  )
  const mailingId = created.createMailing.id

  // 2) Paramètres de la campagne (catégorie INFORMATIVE : ce n'est pas du marketing)
  await estaleGraphQL(
    `mutation MailingParams($id: ID!, $input: MailingUpdateInput!) {
      updateMailing(id: $id) { update(input: $input) { id } }
    }`,
    {
      id: mailingId,
      input: { title: input.title, category: 'INFORMATIVE', preferRentalAgent: false },
    },
  )

  // 3) Contenu du courriel
  await estaleGraphQL(
    `mutation MailingContenu($id: ID!, $input: MailingMailInput!) {
      updateMailing(id: $id) { updateMail(input: $input) { id } }
    }`,
    {
      id: mailingId,
      input: {
        object: input.object,
        content: input.content,
        ...(input.replyto ? { replyto: input.replyto } : {}),
      },
    },
  )

  // 4) Destinataires
  await estaleGraphQL(
    `mutation MailingDestinataires($id: ID!, $ownerIDs: [ID!]!) {
      updateMailing(id: $id) {
        upsertRecipientsOwner(ownerIDs: $ownerIDs) { mailing { id nbRecipients } }
      }
    }`,
    { id: mailingId, ownerIDs: input.ownerIDs },
  )

  // 4 bis) Mise en copie du gestionnaire, en destinataire libre.
  //        Échec non bloquant : le brouillon reste valide sans la copie, on ne perd pas le travail.
  if (input.copie?.email) {
    try {
      await estaleGraphQL(
        `mutation MailingCopie($id: ID!, $input: MailingRecipientInput!) {
          updateMailing(id: $id) { upsertRecipient(input: $input) { mailing { id } } }
        }`,
        {
          id: mailingId,
          input: {
            name: input.copie.name,
            email: input.copie.email,
            mode: 'MAIL',
            address: ADRESSE_CABINET,
          },
        },
      )
    } catch (e) {
      console.error('Mailing : mise en copie impossible, brouillon conservé.', e)
    }
  }

  // 4 ter) NORMALISATION DES CANAUX — piège Estale découvert le 23/08/2026.
  //
  // Estale n'assigne PAS le canal d'un destinataire selon l'adresse disponible mais selon
  // la PRÉFÉRENCE DE RÉCEPTION de sa fiche : un copropriétaire avec email peut arriver en
  // mode HAND (remise en main propre) si sa fiche le préfère. Or un seul destinataire sur
  // canal physique impose un modèle Word (`isWordRequired`) et rend TOUT le mailing
  // inexpédiable (`isSendable: false`), partie courriel comprise. L'envoi échoue sans
  // message. Ce module ne faisant que du courriel :
  //   - ceux qui ont une adresse ET acceptent MAIL → mode forcé à MAIL ;
  //   - ceux qui restent sur un canal physique (pas d'adresse) → retirés.
  const listeRecipients = await estaleGraphQL<{
    me: {
      collaborator: {
        mailing: {
          item: {
            recipients: {
              resourceID: string
              email?: string | null
              sendingMode: string
              acceptModes: string[]
            }[]
          }
        }
      }
    }
  }>(
    `query MailingRecipients($id: ID!) {
      me { collaborator { mailing { item(id: $id) {
        recipients { resourceID email sendingMode acceptModes }
      } } } }
    }`,
    { id: mailingId },
  )

  const recipients = listeRecipients.me.collaborator.mailing.item.recipients
  const aForcerEnMail = recipients
    .filter((r) => r.email && r.sendingMode !== 'MAIL' && r.acceptModes.includes('MAIL'))
    .map((r) => r.resourceID)
  const aRetirer = recipients.filter((r) => !r.email).map((r) => r.resourceID)

  if (aForcerEnMail.length > 0) {
    await estaleGraphQL(
      `mutation MailingModeMail($id: ID!, $ids: [ID!]!, $mode: ChannelCategory) {
        updateMailing(id: $id) { updateRecipientsMode(resourceIDs: $ids, mode: $mode) { mailing { id } } }
      }`,
      { id: mailingId, ids: aForcerEnMail, mode: 'MAIL' },
    )
  }

  if (aRetirer.length > 0) {
    await estaleGraphQL(
      `mutation MailingPurge($id: ID!, $ids: [ID!]!) {
        updateMailing(id: $id) { removeRecipients(resourceIDs: $ids) { id nbRecipients } }
      }`,
      { id: mailingId, ids: aRetirer },
    )
  }

  // 5) Relecture de l'état — sert de garde-fou : on affiche isSent/isSending à l'utilisateur.
  //    AUCUN appel à send() ici, ni ailleurs dans ce fichier.
  const item = await lireEtatMailing(mailingId)
  return {
    mailingId: item.id,
    title: item.title,
    nbRecipients: item.nbRecipients,
    isSent: item.isSent,
    isSending: item.isSending,
  }
}

export interface MailingResume {
  id: string
  title: string
  object?: string | null
  nbRecipients: number
  isSent: boolean
  isSending: boolean
  createdAt?: string | null
  sentAt?: string | null
}

/**
 * Mailings récents du collaborateur connecté, les plus récents d'abord.
 *
 * ⚠️ Les mailings ne sont PAS rattachés à une copropriété : `createMailing` ne prend
 * qu'un `establishmentID`. Passer par `condo.mailing.items` retourne donc toujours vide.
 * Le bon chemin est `me.collaborator.mailing`, celui qu'utilise l'URL d'Estale
 * (`/intranet/collaborator/<id>/mailings/<id>`).
 */
export async function listerMailings(): Promise<MailingResume[]> {
  const data = await estaleGraphQL<{
    me: {
      collaborator: {
        mailing: {
          items: {
            nodes: (MailingResume & { mail?: { object?: string | null } | null })[]
          }
        }
      }
    }
  }>(
    `query MailingListe($page: PaginationLimitInput!) {
      me {
        collaborator {
          mailing {
            items(page: $page) {
              nodes {
                id title nbRecipients isSent isSending createdAt sentAt
                mail { object }
              }
            }
          }
        }
      }
    }`,
    // ⚠️ `page` est indexée à partir de ZÉRO. Avec page:1 on saute la première page et
    // Estale renvoie silencieusement moins d'éléments, voire aucun, sans la moindre erreur.
    { page: { page: 0, limit: 30 } },
  )
  const nodes = data.me.collaborator.mailing.items.nodes.map((n) => ({
    id: n.id,
    title: n.title,
    object: n.mail?.object ?? null,
    nbRecipients: n.nbRecipients,
    isSent: n.isSent,
    isSending: n.isSending,
    createdAt: n.createdAt ?? null,
    sentAt: n.sentAt ?? null,
  }))

  // Les brouillons en attente d'abord : ce sont les seuls sur lesquels on peut agir.
  // À statut égal, les plus récents en tête.
  const rang = (m: MailingResume) => (m.isSent ? 2 : m.isSending ? 1 : 0)
  return nodes.sort(
    (a, b) =>
      rang(a) - rang(b) ||
      (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  )
}

export interface EtatMailing {
  id: string
  title: string
  object?: string | null
  nbRecipients: number
  isSent: boolean
  isSending: boolean
  /** Estale refuse l'envoi tant que ce drapeau est faux. */
  isSendable: boolean
  /** Vrai si un destinataire est sur un canal physique : impose un modèle Word. */
  isWordRequired: boolean
}

/** Relit l'état d'un mailing. Sert de contrôle avant envoi. Portée collaborateur. */
export async function lireEtatMailing(mailingId: string): Promise<EtatMailing> {
  const data = await estaleGraphQL<{
    me: {
      collaborator: {
        mailing: { item: EtatMailing & { mail?: { object?: string | null } | null } }
      }
    }
  }>(
    `query MailingEtatComplet($id: ID!) {
      me {
        collaborator {
          mailing {
            item(id: $id) {
              id title nbRecipients isSent isSending isSendable isWordRequired
              mail { object }
            }
          }
        }
      }
    }`,
    { id: mailingId },
  )
  const it = data.me.collaborator.mailing.item
  return {
    id: it.id,
    title: it.title,
    object: it.mail?.object ?? null,
    nbRecipients: it.nbRecipients,
    isSent: it.isSent,
    isSending: it.isSending,
    isSendable: it.isSendable,
    isWordRequired: it.isWordRequired,
  }
}

/**
 * ENVOI RÉEL. Irréversible : les courriels partent chez les copropriétaires.
 * Vérifie l'état avant d'agir et refuse un mailing déjà parti, sans destinataire,
 * ou dont l'envoi est en cours.
 */
export async function envoyerMailing(mailingId: string): Promise<EtatMailing> {
  const avant = await lireEtatMailing(mailingId)
  if (avant.isSent) throw new Error('Ce mailing a déjà été envoyé.')
  if (avant.isSending) throw new Error('Un envoi est déjà en cours pour ce mailing.')
  if (avant.nbRecipients === 0) throw new Error('Ce mailing n’a aucun destinataire.')
  if (!avant.isSendable) {
    throw new Error(
      avant.isWordRequired
        ? 'Estale refuse l’envoi : un destinataire est sur un canal papier, ce qui impose un modèle Word. Retirez-le ou ajoutez le modèle dans Estale.'
        : 'Estale refuse l’envoi de ce mailing (isSendable = false). Ouvrez-le dans Estale pour voir ce qui manque.',
    )
  }

  await estaleGraphQL(
    `mutation MailingEnvoyer($id: ID!) {
      updateMailing(id: $id) { send { id } }
    }`,
    { id: mailingId },
  )

  return lireEtatMailing(mailingId)
}

/** Supprime un mailing (utilisé pour nettoyer les brouillons de test). */
export async function supprimerMailing(mailingId: string): Promise<void> {
  await estaleGraphQL(
    `mutation MailingSupprimer($id: ID!) {
      updateMailing(id: $id) { delete { id } }
    }`,
    { id: mailingId },
  )
}
