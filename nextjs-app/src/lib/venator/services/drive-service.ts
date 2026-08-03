// src/lib/venator/services/drive-service.ts — dossiers et pièces Google Drive.
import type { SupabaseClient } from '@supabase/supabase-js'
import { accessTokenGoogle } from '../google/client'
import { arborescenceType } from '../google/arborescence'
import {
  nomDossierDepuisTitre,
  trouverDossierParNom,
  trouverDossierParReference,
} from '../google/drive-noms'
import { DOSSIER_TYPE_LABELS } from '../labels'
import { VenatorError } from './errors'
import type { DossierType } from '../types'

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'
const MIME_DOSSIER = 'application/vnd.google-apps.folder'

/** Paramètres communs : les Drive partagés doivent être visibles comme les autres. */
const PARAMS_COMMUNS = { supportsAllDrives: 'true', includeItemsFromAllDrives: 'true' }

export interface FichierDrive {
  id: string
  nom: string
  mimeType: string
  url: string | null
  taille: number | null
  modifie: string | null
}

async function driveGet<T>(chemin: string, token: string): Promise<T> {
  const res = await fetch(`${DRIVE_API}${chemin}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new VenatorError('invalid', `Drive ${res.status} ${detail.slice(0, 150)}`)
  }
  return res.json() as Promise<T>
}

/** Sous-dossiers directs d'un dossier Drive. */
async function listerSousDossiers(parentId: string, token: string) {
  const params = new URLSearchParams({
    q: `mimeType = '${MIME_DOSSIER}' and trashed = false and '${parentId}' in parents`,
    fields: 'files(id,name)',
    pageSize: '200',
    ...PARAMS_COMMUNS,
  })
  const { files } = await driveGet<{ files?: { id: string; name: string }[] }>(`?${params}`, token)
  return (files ?? []).map((f) => ({ id: f.id, nom: f.name }))
}

async function creerDossier(nom: string, parentId: string, token: string) {
  const params = new URLSearchParams({ fields: 'id,name,webViewLink', ...PARAMS_COMMUNS })
  const res = await fetch(`${DRIVE_API}?${params}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nom, mimeType: MIME_DOSSIER, parents: [parentId] }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new VenatorError('invalid', `Création du dossier Drive refusée (${res.status}) ${detail.slice(0, 150)}`)
  }
  return res.json() as Promise<{ id: string; name: string; webViewLink?: string }>
}

/** Réutilise un dossier de même nom s'il existe, sinon le crée. */
async function trouverOuCreer(nom: string, parentId: string, token: string) {
  const existants = await listerSousDossiers(parentId, token)
  const trouve = trouverDossierParNom(existants, nom)
  if (trouve) {
    const params = new URLSearchParams({ fields: 'id,name,webViewLink', ...PARAMS_COMMUNS })
    return driveGet<{ id: string; name: string; webViewLink?: string }>(
      `/${trouve.id}?${params}`,
      token
    )
  }
  return creerDossier(nom, parentId, token)
}

export interface ResultatDossierDrive {
  drive_folder_id: string
  drive_folder_url: string | null
  cree: boolean
}

/**
 * Garantit l'existence du dossier Drive d'un dossier Venator, à l'emplacement
 * `Copropriété / Type / Titre` — la même logique que les libellés Gmail.
 *
 * Le dossier de type intermédiaire est retrouvé par son nom, ou créé s'il manque.
 * La correspondance ignore casse, accents et espaces de fin : sans quoi Venator
 * créerait un « Devis » à côté du « Devis » existant.
 */
export async function assurerDossierDrive(
  db: SupabaseClient,
  dossierId: string,
  /** Nom voulu pour le dossier Drive. À défaut, le titre du dossier Venator —
   *  qui donne parfois des noms de 97 caractères, illisibles dans Drive. */
  nomVoulu?: string,
  /**
   * Créer un sous-dossier au nom du dossier, ou se rattacher directement au
   * dossier de type ?
   *
   * Tout ne mérite pas son propre dossier : les procès-verbaux se rangent à plat
   * sous « Procès Verbaux », un sous-dossier par assemblée ne ferait qu'ajouter
   * un clic à chaque consultation.
   */
  sousDossier = true
): Promise<ResultatDossierDrive> {
  const { data: dossier } = await db
    .from('venator_dossiers')
    .select('id, titre, type, copro_id, drive_folder_id, drive_folder_url')
    .eq('id', dossierId)
    .maybeSingle()
  if (!dossier) throw new VenatorError('not_found', 'Dossier introuvable')

  // Déjà rattaché : rien à refaire, l'appel est idempotent.
  if (dossier.drive_folder_id) {
    return {
      drive_folder_id: dossier.drive_folder_id,
      drive_folder_url: dossier.drive_folder_url,
      cree: false,
    }
  }

  const { data: copro } = await db
    .from('venator_copros')
    .select('nom, drive_folder_id')
    .eq('id', dossier.copro_id)
    .maybeSingle()
  if (!copro?.drive_folder_id) {
    throw new VenatorError(
      'invalid',
      `Le dossier Drive de « ${copro?.nom ?? 'la copropriété'} » n'est pas renseigné. Le rattacher d'abord.`
    )
  }

  const token = await accessTokenGoogle(db)
  const libelleType = DOSSIER_TYPE_LABELS[dossier.type as DossierType] ?? 'Autre'

  const dossierType = await trouverOuCreer(libelleType, copro.drive_folder_id, token)
  const dossierFinal = sousDossier
    ? await trouverOuCreer(nomDossierDepuisTitre(nomVoulu?.trim() || dossier.titre), dossierType.id, token)
    : dossierType

  await db
    .from('venator_dossiers')
    .update({ drive_folder_id: dossierFinal.id, drive_folder_url: dossierFinal.webViewLink ?? null })
    .eq('id', dossierId)

  return {
    drive_folder_id: dossierFinal.id,
    drive_folder_url: dossierFinal.webViewLink ?? null,
    cree: true,
  }
}

export interface ResultatArborescence {
  crees: string[]
  existants: string[]
}

/**
 * Met en place l'arborescence type sous une copropriété.
 *
 * Ne crée QUE les dossiers manquants et ne déplace aucun fichier : sur un Drive
 * de production, un rangement automatique fondé sur des noms approximatifs
 * égarerait un procès-verbal sans que personne s'en aperçoive.
 *
 * L'appariement ignore casse, accents et espaces — mais pas le pluriel : une
 * copropriété ayant « Contrats » recevra donc aussi un « Contrat ». C'est
 * volontaire : fusionner deux dossiers proches relève d'une décision humaine.
 */
export async function creerArborescenceCopro(
  db: SupabaseClient,
  coproId: string
): Promise<ResultatArborescence> {
  const { data: copro } = await db
    .from('venator_copros')
    .select('nom, drive_folder_id')
    .eq('id', coproId)
    .maybeSingle()
  if (!copro?.drive_folder_id) {
    throw new VenatorError('invalid', "Le dossier Drive de cette copropriété n'est pas rattaché.")
  }

  const token = await accessTokenGoogle(db)
  const existantsDrive = await listerSousDossiers(copro.drive_folder_id, token)

  const crees: string[] = []
  const existants: string[] = []

  for (const nom of arborescenceType()) {
    if (trouverDossierParNom(existantsDrive, nom)) {
      existants.push(nom)
      continue
    }
    await creerDossier(nom, copro.drive_folder_id, token)
    crees.push(nom)
  }

  return { crees, existants }
}

export interface ResultatRattachement {
  rattachees: { reference: string; nom: string; dossier: string }[]
  deja: string[]
  sansCorrespondance: string[]
}

/**
 * Rattache en masse les copropriétés à leur dossier Drive, par référence Estale.
 *
 * Les dossiers du Drive sont nommés `NNNNN — NOM — Adresse` : la référence en
 * tête suffit à les apparier sans ambiguïté. Un précédent essai d'appariement
 * par ressemblance de noms s'était trompé trois fois sur douze — d'où le refus
 * ici de toute approximation : pas de préfixe exact, pas de rattachement.
 *
 * Les copropriétés déjà rattachées ne sont jamais réécrites : la reprise après
 * un rattachement manuel ne doit pas le défaire.
 */
export async function rattacherCoprosParReference(
  db: SupabaseClient,
  /** Dossier Drive contenant les dossiers copro (typiquement « Copropriétés »). */
  parentId: string
): Promise<ResultatRattachement> {
  const token = await accessTokenGoogle(db)
  const dossiersDrive = await listerSousDossiers(parentId, token)

  const { data: copros } = await db
    .from('venator_copros')
    .select('id, reference, nom, drive_folder_id')
    .order('reference')

  const resultat: ResultatRattachement = { rattachees: [], deja: [], sansCorrespondance: [] }

  for (const copro of copros ?? []) {
    if (copro.drive_folder_id) {
      resultat.deja.push(copro.reference)
      continue
    }
    const trouve = trouverDossierParReference(dossiersDrive, copro.reference)
    if (!trouve) {
      resultat.sansCorrespondance.push(`${copro.reference} ${copro.nom}`)
      continue
    }
    await db.from('venator_copros').update({ drive_folder_id: trouve.id }).eq('id', copro.id)
    resultat.rattachees.push({ reference: copro.reference, nom: copro.nom, dossier: trouve.nom.trim() })
  }

  return resultat
}

/**
 * Dépose un fichier dans le dossier Drive du dossier.
 *
 * Envoi « multipart » : métadonnées et contenu dans une seule requête, ce qui
 * évite la reprise sur incident du protocole résumable — inutile ici, les pièces
 * d'un dossier de copropriété se comptent en mégaoctets, pas en gigaoctets.
 */
export async function deposerPiece(
  db: SupabaseClient,
  folderId: string,
  fichier: { nom: string; type: string; contenu: ArrayBuffer }
): Promise<FichierDrive> {
  const token = await accessTokenGoogle(db)

  const frontiere = `venator-${Math.random().toString(36).slice(2)}`
  const metadonnees = JSON.stringify({ name: fichier.nom, parents: [folderId] })
  const mime = fichier.type || 'application/octet-stream'

  const corps = Buffer.concat([
    Buffer.from(`--${frontiere}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadonnees}\r\n`),
    Buffer.from(`--${frontiere}\r\nContent-Type: ${mime}\r\n\r\n`),
    Buffer.from(fichier.contenu),
    Buffer.from(`\r\n--${frontiere}--`),
  ])

  const params = new URLSearchParams({
    uploadType: 'multipart',
    fields: 'id,name,mimeType,webViewLink,size,modifiedTime',
    ...PARAMS_COMMUNS,
  })

  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${frontiere}`,
    },
    body: corps,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new VenatorError('invalid', `Dépôt refusé par Drive (${res.status}) ${detail.slice(0, 150)}`)
  }

  const f = (await res.json()) as {
    id: string; name: string; mimeType: string; webViewLink?: string; size?: string; modifiedTime?: string
  }
  return {
    id: f.id,
    nom: f.name,
    mimeType: f.mimeType,
    url: f.webViewLink ?? null,
    taille: f.size ? Number(f.size) : null,
    modifie: f.modifiedTime ?? null,
  }
}

/** Pièces d'un dossier Drive, dossiers exclus. */
export async function listerPieces(db: SupabaseClient, folderId: string): Promise<FichierDrive[]> {
  const token = await accessTokenGoogle(db)
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false and mimeType != '${MIME_DOSSIER}'`,
    fields: 'files(id,name,mimeType,webViewLink,size,modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: '100',
    ...PARAMS_COMMUNS,
  })

  const { files } = await driveGet<{
    files?: { id: string; name: string; mimeType: string; webViewLink?: string; size?: string; modifiedTime?: string }[]
  }>(`?${params}`, token)

  return (files ?? []).map((f) => ({
    id: f.id,
    nom: f.name,
    mimeType: f.mimeType,
    url: f.webViewLink ?? null,
    // Les documents natifs Google (Docs, Sheets) n'ont pas de taille.
    taille: f.size ? Number(f.size) : null,
    modifie: f.modifiedTime ?? null,
  }))
}
