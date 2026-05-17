// src/lib/estale/visit-types.ts
// Types TypeScript pour la brique visites d'immeubles (alignés sur le schéma GraphQL estale).

import type { VisitCategory, VisitPlace, VisitComponent } from './visit-enums'

export interface EstaleVisitFile {
  id: string
  filename: string
  url?: string
  contentType?: string
}

export interface EstaleVisitComment {
  id: string
  rank: number
  content: string
  place: VisitPlace
  component: VisitComponent
  documents: EstaleVisitFile[]
  visitID: string
  deletedAt?: string | null
}

export interface EstaleVisitCollaborator {
  id: string
  fullname?: string
  email?: string
}

export interface EstaleVisitOwner {
  id: string
  fullname?: string
}

export interface EstaleVisit {
  id: string
  category: VisitCategory
  date: string
  period: number
  object: string
  message: string
  archivedAt?: string | null
  condoID: string
  organiser: EstaleVisitCollaborator
  organiserID: string
  collaborators: EstaleVisitCollaborator[]
  owners: EstaleVisitOwner[]
  comments: EstaleVisitComment[]
  reportPDF?: string
  isUpdatable: boolean
  isDeletable: boolean
  isFrozen: boolean
}

// Inputs (alignés sur les mutations GraphQL)

export interface VisitCreateInput {
  category: VisitCategory
  date: string                  // ISO Timestamptz
  period: number
  object: string
  condoID: string
  organiserID: string
  collaboratorIDs: string[]
  ownerIDs: string[]
}

export interface VisitUpdateInput {
  category: VisitCategory
  date: string
  period: number
  object: string
  collaboratorIDs: string[]
  ownerIDs: string[]
  message?: string | null
}

export interface VisitCommentCreateInput {
  place: VisitPlace
  component: VisitComponent
  content: string
  // les fichiers sont attachés via createFile, pas via createComment
}

export interface VisitCommentUpdateInput {
  place: VisitPlace
  component: VisitComponent
  content: string
}
