// src/lib/venator/types.ts — types partagés Venator (AUCUN import next/*)
import { z } from 'zod'

export const DOSSIER_TYPES = ['sinistre','travaux','procedure','mutation','ag','conseil_syndical','vie_copro','autre'] as const
export type DossierType = (typeof DOSSIER_TYPES)[number]
export const DOSSIER_STATUTS = ['ouvert','en_cours','en_attente','clos'] as const
export type DossierStatut = (typeof DOSSIER_STATUTS)[number]
export const ETAPE_STATUTS = ['a_faire','en_cours','fait','sautee'] as const
export type EtapeStatut = (typeof ETAPE_STATUTS)[number]
export const TICKET_TYPES = ['intervention','demande','signalement'] as const
export type TicketType = (typeof TICKET_TYPES)[number]
export const TICKET_STATUTS = ['nouveau','os_envoye','planifie','realise','clos'] as const
export type TicketStatut = (typeof TICKET_STATUTS)[number]
export type VenatorRole = 'admin' | 'gestionnaire' | 'invite'
export type FilDirection = 'entrant' | 'sortant' | 'note'
export type FilSource = 'gmail' | 'manuel' | 'ia' | 'venator'

export interface Copro { id: string; estale_id: string; reference: string; nom: string }
export interface Etape { id: string; dossier_id: string; ordre: number; titre: string; statut: EtapeStatut; echeance: string | null; done_at: string | null; notes: string | null }
export interface Dossier { id: string; copro_id: string; type: DossierType; titre: string; statut: DossierStatut; priorite: number; gabarit_key: string | null; estale_refs: Record<string, unknown>; created_at: string; closed_at: string | null }
export interface Ticket { id: string; copro_id: string; dossier_id: string | null; type: TicketType; titre: string; description: string | null; statut: TicketStatut; prestataire_nom: string | null; created_at: string; closed_at: string | null }
export interface FilMessage { id: string; parent_type: 'dossier' | 'ticket'; parent_id: string; direction: FilDirection; source: FilSource; from_email: string | null; sujet: string | null; contenu: string; gmail_message_id: string | null; created_at: string }
export interface Checklist { id: string; copro_id: string; created_at: string }
export interface ChecklistItem { id: string; checklist_id: string; ordre: number; libelle: string; categorie: string; fait: boolean; fait_at: string | null; auto_check_key: string | null }
export interface JournalEntry { id: string; copro_id: string; dossier_id: string | null; ticket_id: string | null; type_evenement: string; contenu: string; acteur: string; created_at: string }

export const dossierCreateSchema = z.object({
  copro_id: z.string().uuid(),
  type: z.enum(DOSSIER_TYPES),
  titre: z.string().min(1).max(200),
  priorite: z.number().int().min(1).max(3).default(2),
})
export type DossierCreateInput = z.infer<typeof dossierCreateSchema>

export const ticketCreateSchema = z.object({
  copro_id: z.string().uuid(),
  dossier_id: z.string().uuid().nullish(),
  type: z.enum(TICKET_TYPES).default('intervention'),
  titre: z.string().min(1).max(200),
  description: z.string().max(5000).nullish(),
  prestataire_nom: z.string().max(200).nullish(),
})
export type TicketCreateInput = z.infer<typeof ticketCreateSchema>

export const filCreateSchema = z.object({
  parent_type: z.enum(['dossier','ticket']),
  parent_id: z.string().uuid(),
  direction: z.enum(['entrant','sortant','note']).default('note'),
  source: z.enum(['gmail','manuel','ia','venator']).default('manuel'),
  from_email: z.string().email().nullish(),
  sujet: z.string().max(300).nullish(),
  contenu: z.string().min(1).max(50000),
  gmail_message_id: z.string().max(200).nullish(),
})
export type FilCreateInput = z.infer<typeof filCreateSchema>

export const etapeUpdateSchema = z.object({
  statut: z.enum(ETAPE_STATUTS).optional(),
  echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  notes: z.string().max(5000).nullish(),
})
export const checklistItemUpdateSchema = z.object({ fait: z.boolean() })
