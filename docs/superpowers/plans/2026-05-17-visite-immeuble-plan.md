# Visite Immeuble — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire dans beam-app une brique « Visites d'immeubles » responsive mobile (Chrome iOS), qui pousse en continu vers l'API GraphQL d'estale, avec persistance locale IndexedDB pour résilience offline.

**Architecture:** Page Next.js classique sous `/apps/visites/*` ⇒ stores IndexedDB (`idb`) pour cache offline ⇒ sync engine continu vers routes API beam-app `/api/estale/visits/**` ⇒ `estale-api.ts` ⇒ GraphQL `api.estale.app`. Gating `role === 'admin'`. Garde-fou : heartbeat Supabase + cron quotidien email Resend.

**Tech Stack:** Next.js 14.2.5 App Router, React 18.3, Supabase (auth + heartbeat), Resend (alerte), `idb` (IndexedDB wrapper, à installer), Radix UI, react-hook-form + zod, uuid.

**Specification source:** `docs/superpowers/specs/2026-05-17-visite-immeuble-design.md`

---

## File map

### À créer

| Fichier | Responsabilité |
|---|---|
| `nextjs-app/supabase/migrations/20260517_visite_sync_heartbeat.sql` | Table heartbeat + RLS |
| `nextjs-app/src/lib/estale/visit-enums.ts` | Mapping FR ↔ enums estale |
| `nextjs-app/src/lib/estale/visit-types.ts` | Types TS (Visit, VisitComment, inputs) |
| `nextjs-app/src/lib/estale/visit-mutations.ts` | Helper de mutations GraphQL (graphql-multipart) |
| `nextjs-app/src/lib/server-auth.ts` | Helper `requireAdmin()` côté serveur |
| `nextjs-app/src/app/api/estale/visits/route.ts` | GET liste + POST create |
| `nextjs-app/src/app/api/estale/visits/[visitId]/route.ts` | GET détail + PATCH update |
| `nextjs-app/src/app/api/estale/visits/[visitId]/comments/route.ts` | POST createComment |
| `nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/route.ts` | PATCH + DELETE comment |
| `nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/files/route.ts` | POST multipart photo |
| `nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/files/[fileId]/route.ts` | DELETE photo |
| `nextjs-app/src/app/api/visites/heartbeat/route.ts` | POST (update) heartbeat |
| `nextjs-app/src/app/api/cron/visites-sync-alert/route.ts` | Cron quotidien email alerte |
| `nextjs-app/src/lib/visites/db.ts` | Wrapper IndexedDB (idb) |
| `nextjs-app/src/lib/visites/sync-engine.ts` | Logique de sync continu |
| `nextjs-app/src/lib/visites/heartbeat-client.ts` | Push de heartbeat depuis le client |
| `nextjs-app/src/hooks/useVisitesSync.ts` | Hook React qui expose l'état sync |
| `nextjs-app/src/app/apps/visites/layout.tsx` | Garde admin + chip sync permanent |
| `nextjs-app/src/app/apps/visites/page.tsx` | Liste copros |
| `nextjs-app/src/app/apps/visites/[condoId]/page.tsx` | Liste visites |
| `nextjs-app/src/app/apps/visites/[condoId]/new/page.tsx` | Formulaire entête |
| `nextjs-app/src/app/apps/visites/[condoId]/[visitId]/page.tsx` | Vue visite + lignes |
| `nextjs-app/src/app/apps/visites/[condoId]/[visitId]/lignes/new/page.tsx` | Nouvelle ligne |
| `nextjs-app/src/app/apps/visites/[condoId]/[visitId]/lignes/[id]/page.tsx` | Édition ligne |
| `nextjs-app/src/components/visites/SyncIndicator.tsx` | Chip header |
| `nextjs-app/src/components/visites/SyncDrawer.tsx` | Détail items en attente |
| `nextjs-app/src/components/visites/PhotoSlot.tsx` | Capture photo + thumbnail |
| `nextjs-app/src/components/visites/EnumPicker.tsx` | Dropdown full-screen pour enums |
| `nextjs-app/scripts/test-visite-flow.mjs` | Script E2E manuel pour valider chaque étape |

### À modifier

| Fichier | Changement |
|---|---|
| `nextjs-app/package.json` | + `idb` |
| `nextjs-app/src/lib/estale-api.ts` | + 8 fonctions visites + re-export types |
| `nextjs-app/src/components/layout/Header.tsx` | + lien « Visites » (admin only) |
| `nextjs-app/src/components/layout/MobileQuickNav.tsx` | + lien « Visites » (admin only) |
| `nextjs-app/vercel.json` | + entrée cron pour alerte sync |
| `nextjs-app/.env.example` | + `VISITES_ALERT_EMAIL`, `VISITES_ALERT_THRESHOLD_DAYS` |

---

## Phase 0 — Préliminaires (fondations)

### Task 0.1 : Migration Supabase `visite_sync_heartbeat`

**Files:**
- Create: `nextjs-app/supabase/migrations/20260517_visite_sync_heartbeat.sql`

- [ ] **Step 1 — Créer le fichier SQL**

```sql
-- Migration: visite_sync_heartbeat
-- Stocke le compte d'items en attente de sync vers estale,
-- alimenté par le client beam-app à chaque sauvegarde locale.

create table if not exists visite_sync_heartbeat (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pending_count int not null default 0 check (pending_count >= 0),
  oldest_pending_at timestamptz,
  last_alert_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table visite_sync_heartbeat is
  'Heartbeat client beam-app pour alerte cron en cas de visites non synchronisées vers estale.';

-- RLS : un user ne voit / modifie que sa propre ligne ;
-- le cron côté serveur utilise service_role et bypasse.
alter table visite_sync_heartbeat enable row level security;

create policy "user reads own heartbeat"
  on visite_sync_heartbeat for select
  using (auth.uid() = user_id);

create policy "user upserts own heartbeat"
  on visite_sync_heartbeat for insert
  with check (auth.uid() = user_id);

create policy "user updates own heartbeat"
  on visite_sync_heartbeat for update
  using (auth.uid() = user_id);
```

- [ ] **Step 2 — Appliquer la migration sur Supabase**

Via MCP Supabase (cf. `.mcp.json`) ou via dashboard Supabase :
1. Aller sur https://supabase.com/dashboard → projet beam-app → SQL Editor
2. Coller le contenu du fichier `.sql` ci-dessus
3. Exécuter
4. Vérifier que la table apparaît dans Table Editor

Critère : `select count(*) from visite_sync_heartbeat;` renvoie `0` sans erreur.

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/supabase/migrations/20260517_visite_sync_heartbeat.sql
git commit -m "feat(visites): migration heartbeat sync supabase"
```

---

### Task 0.2 : Constantes & enums FR

**Files:**
- Create: `nextjs-app/src/lib/estale/visit-enums.ts`

- [ ] **Step 1 — Créer le fichier**

```ts
// src/lib/estale/visit-enums.ts
// Mapping FR ↔ enums GraphQL d'estale pour la brique visites.
// Source : introspection live le 2026-05-17.

export const VISIT_CATEGORY_FR = {
  CONTRACTUAL: 'Contractuelle',
  NON_CONTRACTUAL: 'Hors contrat',
} as const

export type VisitCategory = keyof typeof VISIT_CATEGORY_FR

export const VISIT_PLACE_FR = {
  ELEVATOR: 'Ascenseur',
  CELLARS: 'Caves',
  BOILER_ROOM: 'Chaufferie',
  CORRIDOR: 'Couloir',
  COURT_YARD: 'Cour',
  HALL: 'Hall',
  STAIRS: 'Escaliers',
  EXTERIORS: 'Extérieurs',
  GARAGE: 'Garage',
  BIKE_ROOM: 'Local vélos',
  TECHNICAL_AREA: 'Local technique',
  GARBAGE_DISPOSAL_AREA: 'Local poubelles',
  LEVEL_1: 'Niveau 1',
  LEVEL_2: 'Niveau 2',
  LANDING: 'Palier',
  CAR_PARK: 'Parking',
  SWIMMING_POOL: 'Piscine',
  ROOF_PLACE: 'Toiture',
  ACCESS_ROAD: 'Voie d\'accès',
  OTHER: 'Autre',
} as const

export type VisitPlace = keyof typeof VISIT_PLACE_FR

export const VISIT_COMPONENT_FR = {
  ANTENNA: 'Antenne',
  WATER_INLET: 'Arrivée d\'eau',
  SANDBOX: 'Bac à sable',
  FENCE: 'Barrière',
  EMERGENCY_BLOCK: 'BAES (bloc secours)',
  LETTER_BOX: 'Boîte aux lettres',
  CABIN: 'Cabine',
  CHANNELING: 'Canalisation',
  CHAIN: 'Chaîne',
  FENCING: 'Clôture',
  WATER_METER: 'Compteur eau',
  ELECTRIC_METER: 'Compteur électrique',
  GAS_METER: 'Compteur gaz',
  SHOWER: 'Douche',
  LIGHTING: 'Éclairage',
  EXTINGUISHER: 'Extincteur',
  FACADE: 'Façade',
  WINDOW: 'Fenêtre',
  GROOM: 'Ferme-porte',
  INTERCOM: 'Interphone',
  SWITCHER: 'Interrupteur',
  PLANTER: 'Jardinière',
  WALL: 'Mur',
  NEON: 'Néon',
  DOORMAT: 'Paillasson',
  LAWN: 'Pelouse',
  CEILING: 'Plafond',
  CEILING_LIGHT: 'Plafonnier',
  EVACUATION_PLAN: 'Plan d\'évacuation',
  STUDS: 'Plots',
  LIFT_PUMP: 'Pompe de relevage',
  GATE: 'Portail',
  ACCES_DOOR: 'Porte d\'accès',
  ELEVATOR_DOOR: 'Porte d\'ascenseur',
  FRONT_DOOR: 'Porte d\'entrée',
  LANDING_DOOR: 'Porte palière',
  SOCKET: 'Prise',
  RAMP: 'Rampe',
  FAUCET: 'Robinet',
  SKYDOME: 'Skydome',
  FLOOR: 'Sol',
  OTHERS: 'Autres',
} as const

export type VisitComponent = keyof typeof VISIT_COMPONENT_FR

export const VISIT_CATEGORIES: VisitCategory[] = Object.keys(VISIT_CATEGORY_FR) as VisitCategory[]
export const VISIT_PLACES: VisitPlace[] = Object.keys(VISIT_PLACE_FR) as VisitPlace[]
export const VISIT_COMPONENTS: VisitComponent[] = Object.keys(VISIT_COMPONENT_FR) as VisitComponent[]
```

- [ ] **Step 2 — Vérification rapide**

```bash
cd "nextjs-app" && npx tsc --noEmit src/lib/estale/visit-enums.ts
```

Attendu : aucune erreur. Si erreur sur `tsc --noEmit` sur un seul fichier, utiliser `npm run build` plus tard à la place — mais l'import dans un autre fichier suffira à valider.

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/src/lib/estale/visit-enums.ts
git commit -m "feat(visites): mapping FR enums estale (Category/Place/Component)"
```

---

### Task 0.3 : Types TS visites

**Files:**
- Create: `nextjs-app/src/lib/estale/visit-types.ts`

- [ ] **Step 1 — Créer les types**

```ts
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
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/lib/estale/visit-types.ts
git commit -m "feat(visites): types TS alignes sur schema GraphQL estale"
```

---

### Task 0.4 : Helper GraphQL `graphqlRequest`

`estale-api.ts` contient déjà `executeQuery` (privé, sans support multipart). On va exposer une variante publique et créer un helper multipart séparé pour les uploads.

**Files:**
- Modify: `nextjs-app/src/lib/estale-api.ts` (rendre `executeQuery` exporté ou créer un alias)
- Create: `nextjs-app/src/lib/estale/visit-mutations.ts`

- [ ] **Step 1 — Exposer `executeQuery` en tant que `estaleGraphQL`**

Dans `nextjs-app/src/lib/estale-api.ts`, ajouter juste avant le `/** Récupère les copropriétés ... */` :

```ts
/**
 * Exécute une requête GraphQL arbitraire vers estale (public).
 * Utilisé par les helpers spécifiques (visites, etc.).
 */
export async function estaleGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return executeQuery<T>(query, variables)
}
```

- [ ] **Step 2 — Créer le helper multipart pour upload photo**

Spec : https://github.com/jaydenseric/graphql-multipart-request-spec

Dans `nextjs-app/src/lib/estale/visit-mutations.ts` :

```ts
// src/lib/estale/visit-mutations.ts
// Helpers GraphQL pour les visites d'immeubles : query/mutation simples + upload multipart.

import type { EstaleVisitFile } from './visit-types'

const BASE = process.env.ESTALE_API_BASE_URL || 'https://api.estale.app'
const COMMON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Origin: 'https://app.estale.app',
  Referer: 'https://app.estale.app/',
}

/**
 * Upload d'une photo vers estale via la mutation createFile.
 *
 * Le binding GraphQL d'estale supporte spec graphql-multipart-request : on envoie un
 * FormData avec 3 parts (operations, map, 0) et fetch natif.
 *
 * @param sessionAuth header Cookie OU "Bearer xxx" — récupéré par l'appelant via estale-api
 * @returns le File créé côté estale
 */
export async function uploadCommentFileMultipart(
  sessionAuth: string,
  visitId: string,
  commentId: string,
  file: Blob,
  filename: string,
): Promise<EstaleVisitFile> {
  const operations = {
    query: `mutation($visitId: ID!, $commentId: ID!, $file: Upload!) {
      updateVisit(id: $visitId) {
        updateComment(id: $commentId) {
          createFile(file: $file) {
            id
            documents {
              id
              filename
            }
          }
        }
      }
    }`,
    variables: {
      visitId,
      commentId,
      file: null, // placeholder remplacé par le mapping
    },
  }

  const map = { '0': ['variables.file'] }

  const form = new FormData()
  form.append('operations', JSON.stringify(operations))
  form.append('map', JSON.stringify(map))
  form.append('0', file, filename)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...COMMON_HEADERS,
  }
  if (sessionAuth.startsWith('Bearer ')) {
    headers['Authorization'] = sessionAuth
  } else {
    headers['Cookie'] = sessionAuth
  }

  const response = await fetch(`${BASE}/graphql/intranet`, {
    method: 'POST',
    headers,
    body: form,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Estale upload failed: ${response.status} — ${body.slice(0, 200)}`)
  }

  const json = await response.json()
  if (json.errors?.length) {
    throw new Error(`Estale upload GraphQL error: ${json.errors[0].message}`)
  }

  const docs: EstaleVisitFile[] = json.data?.updateVisit?.updateComment?.createFile?.documents || []
  // Le dernier document inséré est celui qu'on vient d'uploader
  const uploaded = docs[docs.length - 1]
  if (!uploaded) {
    throw new Error('Estale upload : aucun document retourné')
  }
  return uploaded
}
```

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/src/lib/estale-api.ts nextjs-app/src/lib/estale/visit-mutations.ts
git commit -m "feat(visites): helpers estaleGraphQL public + upload multipart"
```

---

### Task 0.5 : Fonctions visites dans `estale-api.ts`

**Files:**
- Modify: `nextjs-app/src/lib/estale-api.ts`

- [ ] **Step 1 — Ajouter les imports en tête de fichier**

Juste après les imports existants (si présents) ou en tout début si pur Node :

```ts
import type {
  EstaleVisit,
  EstaleVisitComment,
  VisitCreateInput,
  VisitUpdateInput,
  VisitCommentCreateInput,
  VisitCommentUpdateInput,
} from './estale/visit-types'
import { uploadCommentFileMultipart } from './estale/visit-mutations'

// Re-export pour permettre import depuis @/lib/estale-api
export type {
  EstaleVisit,
  EstaleVisitComment,
  VisitCreateInput,
  VisitUpdateInput,
  VisitCommentCreateInput,
  VisitCommentUpdateInput,
}
```

- [ ] **Step 2 — Ajouter `getCondoVisits()`**

À la fin du fichier `estale-api.ts` :

```ts
/**
 * Récupère les visites d'une copropriété.
 */
export async function getCondoVisits(
  condoId: string,
  archived: boolean = false,
): Promise<EstaleVisit[]> {
  const query = `
    query($condoId: ID!, $archived: Boolean!) {
      me {
        collaborator {
          condo(id: $condoId) {
            visits(archived: $archived) {
              id
              category
              date
              period
              object
              message
              archivedAt
              condoID
              organiserID
              organiser { id fullname email }
              collaborators { id fullname email }
              owners { id fullname }
              comments {
                id rank content place component visitID deletedAt
                documents { id filename }
              }
              reportPDF
              isUpdatable
              isDeletable
              isFrozen
            }
          }
        }
      }
    }
  `

  const data = await estaleGraphQL<{
    me?: { collaborator?: { condo?: { visits?: EstaleVisit[] } } }
  }>(query, { condoId, archived })

  return data.me?.collaborator?.condo?.visits || []
}
```

- [ ] **Step 3 — Ajouter `getVisitDetail()`**

```ts
/**
 * Détail d'une visite (par id de visite + copro).
 */
export async function getVisitDetail(
  condoId: string,
  visitId: string,
): Promise<EstaleVisit | null> {
  const query = `
    query($condoId: ID!, $visitId: ID!) {
      me {
        collaborator {
          condo(id: $condoId) {
            visit(id: $visitId) {
              id category date period object message archivedAt condoID organiserID
              organiser { id fullname email }
              collaborators { id fullname email }
              owners { id fullname }
              comments {
                id rank content place component visitID deletedAt
                documents { id filename }
              }
              reportPDF isUpdatable isDeletable isFrozen
            }
          }
        }
      }
    }
  `
  const data = await estaleGraphQL<{
    me?: { collaborator?: { condo?: { visit?: EstaleVisit | null } } }
  }>(query, { condoId, visitId })
  return data.me?.collaborator?.condo?.visit || null
}
```

- [ ] **Step 4 — Ajouter `createVisit()`**

```ts
/**
 * Création d'une visite (entête uniquement, sans lignes).
 */
export async function createVisit(input: VisitCreateInput): Promise<EstaleVisit> {
  const mutation = `
    mutation($input: VisitCreateInput!) {
      createVisit(input: $input) {
        id category date period object message condoID organiserID
        organiser { id fullname email }
        collaborators { id fullname email }
        owners { id fullname }
        comments { id rank content place component documents { id filename } }
        isUpdatable isDeletable isFrozen
      }
    }
  `
  const data = await estaleGraphQL<{ createVisit: EstaleVisit }>(mutation, { input })
  if (!data.createVisit) throw new Error('createVisit : pas de visite retournée')
  return data.createVisit
}
```

- [ ] **Step 5 — Ajouter `updateVisit()`**

```ts
/**
 * Mise à jour de l'entête d'une visite.
 */
export async function updateVisit(
  visitId: string,
  input: VisitUpdateInput,
): Promise<EstaleVisit> {
  const mutation = `
    mutation($visitId: ID!, $input: VisitUpdateInput!) {
      updateVisit(id: $visitId) {
        update(input: $input) {
          id category date period object message condoID organiserID
          organiser { id fullname email }
          collaborators { id fullname email }
          owners { id fullname }
          comments { id rank content place component documents { id filename } }
          isUpdatable isDeletable isFrozen
        }
      }
    }
  `
  const data = await estaleGraphQL<{ updateVisit: { update: EstaleVisit } }>(
    mutation,
    { visitId, input },
  )
  return data.updateVisit.update
}
```

- [ ] **Step 6 — Ajouter `createVisitComment()`**

```ts
/**
 * Ajout d'une ligne (comment) à une visite.
 */
export async function createVisitComment(
  visitId: string,
  input: VisitCommentCreateInput,
): Promise<EstaleVisitComment> {
  const mutation = `
    mutation($visitId: ID!, $input: VisitCommentCreateInput!) {
      updateVisit(id: $visitId) {
        createComment(input: $input) {
          id rank content place component visitID
          documents { id filename }
        }
      }
    }
  `
  // Le schéma exige files: [...!]! dans VisitCommentCreateInput.
  // On envoie un tableau vide ; les vraies photos arrivent par uploadCommentFileMultipart.
  const payload = { ...input, files: [] }
  const data = await estaleGraphQL<{
    updateVisit: { createComment: EstaleVisitComment }
  }>(mutation, { visitId, input: payload })
  return data.updateVisit.createComment
}
```

- [ ] **Step 7 — Ajouter `updateVisitComment()` et `deleteVisitComment()`**

```ts
/**
 * Mise à jour d'une ligne.
 */
export async function updateVisitComment(
  visitId: string,
  commentId: string,
  input: VisitCommentUpdateInput,
): Promise<EstaleVisitComment> {
  const mutation = `
    mutation($visitId: ID!, $commentId: ID!, $input: VisitCommentUpdateInput!) {
      updateVisit(id: $visitId) {
        updateComment(id: $commentId) {
          update(input: $input) {
            id rank content place component visitID
            documents { id filename }
          }
        }
      }
    }
  `
  const data = await estaleGraphQL<{
    updateVisit: { updateComment: { update: EstaleVisitComment } }
  }>(mutation, { visitId, commentId, input })
  return data.updateVisit.updateComment.update
}

/**
 * Suppression d'une ligne (soft delete côté estale).
 */
export async function deleteVisitComment(
  visitId: string,
  commentId: string,
): Promise<void> {
  const mutation = `
    mutation($visitId: ID!, $commentId: ID!) {
      updateVisit(id: $visitId) {
        updateComment(id: $commentId) {
          delete { id }
        }
      }
    }
  `
  await estaleGraphQL(mutation, { visitId, commentId })
}
```

- [ ] **Step 8 — Ajouter les helpers fichiers**

```ts
/**
 * Upload d'une photo attachée à une ligne.
 * Délègue à uploadCommentFileMultipart qui gère le protocole multipart GraphQL.
 */
export async function uploadVisitCommentFile(
  visitId: string,
  commentId: string,
  file: Blob,
  filename: string,
): Promise<{ id: string; filename: string }> {
  const isAuth = await ensureAuthenticated()
  if (!isAuth) throw new Error('Impossible de se connecter à Estale')
  // sessionCookie est interne au module ; on passe sa valeur courante.
  // Note : ensureAuthenticated garantit sessionCookie != null.
  return uploadCommentFileMultipart(sessionCookie!, visitId, commentId, file, filename)
}

/**
 * Suppression d'une photo attachée à une ligne.
 */
export async function deleteVisitCommentFile(
  visitId: string,
  commentId: string,
  fileId: string,
): Promise<void> {
  const mutation = `
    mutation($visitId: ID!, $commentId: ID!, $fileId: ID!) {
      updateVisit(id: $visitId) {
        updateComment(id: $commentId) {
          deleteFile(fileID: $fileId) {
            id
          }
        }
      }
    }
  `
  await estaleGraphQL(mutation, { visitId, commentId, fileId })
}
```

- [ ] **Step 9 — Commit**

```bash
git add nextjs-app/src/lib/estale-api.ts
git commit -m "feat(visites): 8 fonctions estale (visits queries + mutations + upload)"
```

---

### Task 0.6 : Script de validation manuelle E2E

**Files:**
- Create: `nextjs-app/scripts/test-visite-flow.mjs`

- [ ] **Step 1 — Écrire le script**

```js
#!/usr/bin/env node
// Script de validation manuelle de bout en bout pour les helpers visites.
// Crée une visite test, ajoute une ligne, upload une photo factice, puis supprime tout.
// Usage : node scripts/test-visite-flow.mjs <condoId>

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

// Charge .env.local
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }),
)
for (const [k, v] of Object.entries(env)) process.env[k] = v

const [, , condoId] = process.argv
if (!condoId) {
  console.error('Usage : node scripts/test-visite-flow.mjs <condoId>')
  process.exit(1)
}

// import dynamique du module TS via tsx — ou re-implem fetch directe pour simplicité.
// Ici on fait du fetch direct pour ne pas dépendre de tsx au runtime.

const BASE = process.env.ESTALE_API_BASE_URL
const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0',
  Origin: 'https://app.estale.app',
  Referer: 'https://app.estale.app/',
}

async function login() {
  const r = await fetch(`${BASE}/api/login`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ email: process.env.ESTALE_EMAIL, password: process.env.ESTALE_PASSWORD }),
  })
  if (!r.ok) throw new Error(`Login ${r.status}`)
  const cookies = r.headers.getSetCookie?.() || [r.headers.get('set-cookie')].filter(Boolean)
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

async function gql(cookie, query, variables) {
  const r = await fetch(`${BASE}/graphql/intranet`, {
    method: 'POST', headers: { ...HEADERS, Cookie: cookie },
    body: JSON.stringify({ query, variables }),
  })
  const j = await r.json()
  if (j.errors?.length) throw new Error(j.errors[0].message)
  return j.data
}

const cookie = await login()
console.log('[1/6] login OK')

// 1. récup l'id du collaborateur connecté
const meData = await gql(cookie, '{ me { collaborator { id condos(archived:false) { id name } } } }')
const meId = meData.me.collaborator.id
const condo = meData.me.collaborator.condos.find((c) => c.id === condoId)
if (!condo) throw new Error(`Condo ${condoId} introuvable parmi : ${meData.me.collaborator.condos.map((c) => c.id).join(', ')}`)
console.log(`[2/6] organiser=${meId} condo=${condo.name}`)

// 2. créer visite
const visit = (await gql(cookie, `
  mutation($input: VisitCreateInput!) {
    createVisit(input: $input) { id object date period }
  }
`, {
  input: {
    category: 'NON_CONTRACTUAL',
    date: new Date().toISOString(),
    period: 30,
    object: '[TEST AUTO] visite scriptée',
    condoID: condoId,
    organiserID: meId,
    collaboratorIDs: [],
    ownerIDs: [],
  },
})).createVisit
console.log(`[3/6] visite créée : ${visit.id}`)

// 3. ajouter une ligne
const comment = (await gql(cookie, `
  mutation($visitId: ID!, $input: VisitCommentCreateInput!) {
    updateVisit(id: $visitId) {
      createComment(input: $input) { id place component content }
    }
  }
`, {
  visitId: visit.id,
  input: { place: 'HALL', component: 'INTERCOM', content: '[TEST] commentaire scripté', files: [] },
})).updateVisit.createComment
console.log(`[4/6] ligne créée : ${comment.id}`)

// 4. supprimer la ligne
await gql(cookie, `
  mutation($visitId: ID!, $commentId: ID!) {
    updateVisit(id: $visitId) { updateComment(id: $commentId) { delete { id } } }
  }
`, { visitId: visit.id, commentId: comment.id })
console.log(`[5/6] ligne supprimée`)

// 5. archiver la visite test (pour ne pas polluer)
await gql(cookie, `
  mutation($visitId: ID!) { updateVisit(id: $visitId) { archive { id archivedAt } } }
`, { visitId: visit.id })
console.log(`[6/6] visite archivée`)

console.log('\nFlow E2E OK ✓')
```

- [ ] **Step 2 — Exécuter le script**

```bash
cd "nextjs-app"
# Récupérer un condoId valide via :
node -e "import('./src/lib/estale-api.ts').then(...)"
# OU plus simplement : faire un GET sur /api/estale/condos quand l'app tourne.
# Pour cette validation initiale on peut récupérer la liste via :
node scripts/test-visite-flow.mjs <UN_CONDO_ID_VALIDE>
```

Attendu : 6 lignes "OK", puis "Flow E2E OK ✓". Vérifier dans estale desktop que la visite "[TEST AUTO]" apparaît bien archivée.

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/scripts/test-visite-flow.mjs
git commit -m "test(visites): script E2E manuel validation flow estale"
```

---

## Phase 1 — Routes API beam-app

### Task 1.1 : Helper `requireAdmin()`

**Files:**
- Create: `nextjs-app/src/lib/server-auth.ts`

- [ ] **Step 1 — Créer le helper**

```ts
// src/lib/server-auth.ts
// Garde côté serveur : exige que l'utilisateur courant ait le role 'admin'.
// Compatible avec route handlers App Router.

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface RequireAdminResult {
  ok: boolean
  userId?: string
  email?: string
  response?: NextResponse
}

export async function requireAdmin(): Promise<RequireAdminResult> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    }
  }

  // Lecture du role depuis la table public.profiles (pattern existant beam-app).
  // Si le champ role est ailleurs, adapter ici.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    }
  }

  return { ok: true, userId: user.id, email: user.email }
}
```

- [ ] **Step 2 — Vérifier le nom de table/colonne pour les rôles**

Lire `src/app/api/user/role/route.ts` pour confirmer que `profiles.role` est bien le pattern utilisé. Si le pattern diffère (ex. `user_metadata.role`, table `user_roles`, etc.), adapter le `from('profiles').select('role')` ci-dessus.

```bash
cd "nextjs-app"
cat src/app/api/user/role/route.ts
```

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/src/lib/server-auth.ts
git commit -m "feat(visites): helper requireAdmin pour gating server-side"
```

---

### Task 1.2 : Route GET + POST `/api/estale/visits`

**Files:**
- Create: `nextjs-app/src/app/api/estale/visits/route.ts`

- [ ] **Step 1 — Implémenter la route**

```ts
// src/app/api/estale/visits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import {
  getCondoVisits,
  createVisit,
  isEstaleConfigured,
  type VisitCreateInput,
} from '@/lib/estale-api'
import { z } from 'zod'

const CreateBody = z.object({
  category: z.enum(['CONTRACTUAL', 'NON_CONTRACTUAL']),
  date: z.string(),
  period: z.number().int().positive(),
  object: z.string().min(1),
  condoID: z.string().min(1),
  organiserID: z.string().min(1),
  collaboratorIDs: z.array(z.string()),
  ownerIDs: z.array(z.string()),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json(
      { configured: false, error: 'API Estale non configurée', visits: [] },
      { status: 200 },
    )
  }

  const condoId = request.nextUrl.searchParams.get('condoId')
  const archived = request.nextUrl.searchParams.get('archived') === 'true'
  if (!condoId) {
    return NextResponse.json({ error: 'condoId requis' }, { status: 400 })
  }

  try {
    const visits = await getCondoVisits(condoId, archived)
    return NextResponse.json({ configured: true, visits })
  } catch (error) {
    console.error('GET /api/estale/visits :', error)
    return NextResponse.json(
      { configured: true, error: error instanceof Error ? error.message : 'Erreur inconnue', visits: [] },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  let body: VisitCreateInput
  try {
    body = CreateBody.parse(await request.json())
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  try {
    const visit = await createVisit(body)
    return NextResponse.json({ visit }, { status: 201 })
  } catch (error) {
    console.error('POST /api/estale/visits :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2 — Tester avec un cookie de session beam-app valide**

```bash
# Démarrer le dev server
cd "nextjs-app" && npm run dev
# Dans un autre terminal, se loguer dans beam-app via le navigateur,
# puis copier le cookie sb-... pour curl :
curl -s "http://localhost:3000/api/estale/visits?condoId=<X>" \
  -H "Cookie: sb-access-token=..." | head -50
```

Attendu : `{ configured: true, visits: [...] }`.

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/src/app/api/estale/visits/route.ts
git commit -m "feat(visites): route GET/POST /api/estale/visits"
```

---

### Task 1.3 : Route GET + PATCH `/api/estale/visits/[visitId]`

**Files:**
- Create: `nextjs-app/src/app/api/estale/visits/[visitId]/route.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/app/api/estale/visits/[visitId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getVisitDetail, updateVisit, isEstaleConfigured, type VisitUpdateInput } from '@/lib/estale-api'
import { z } from 'zod'

const UpdateBody = z.object({
  category: z.enum(['CONTRACTUAL', 'NON_CONTRACTUAL']),
  date: z.string(),
  period: z.number().int().positive(),
  object: z.string().min(1),
  collaboratorIDs: z.array(z.string()),
  ownerIDs: z.array(z.string()),
  message: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { visitId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })

  const condoId = request.nextUrl.searchParams.get('condoId')
  if (!condoId) return NextResponse.json({ error: 'condoId requis' }, { status: 400 })

  try {
    const visit = await getVisitDetail(condoId, params.visitId)
    if (!visit) return NextResponse.json({ error: 'visite non trouvée' }, { status: 404 })
    return NextResponse.json({ visit })
  } catch (error) {
    console.error(`GET /api/estale/visits/${params.visitId} :`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { visitId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })

  let body: VisitUpdateInput
  try {
    body = UpdateBody.parse(await request.json())
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  try {
    const visit = await updateVisit(params.visitId, body)
    return NextResponse.json({ visit })
  } catch (error) {
    console.error(`PATCH /api/estale/visits/${params.visitId} :`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2 — Test manuel**

```bash
curl -s "http://localhost:3000/api/estale/visits/<VID>?condoId=<CID>" -H "Cookie: ..." | head
```

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/src/app/api/estale/visits/[visitId]/route.ts
git commit -m "feat(visites): route GET/PATCH /api/estale/visits/[visitId]"
```

---

### Task 1.4 : Route POST `/api/estale/visits/[visitId]/comments`

**Files:**
- Create: `nextjs-app/src/app/api/estale/visits/[visitId]/comments/route.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/app/api/estale/visits/[visitId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { createVisitComment, isEstaleConfigured, type VisitCommentCreateInput } from '@/lib/estale-api'
import { z } from 'zod'

const Body = z.object({
  place: z.string().min(1),
  component: z.string().min(1),
  content: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })

  let body: VisitCommentCreateInput
  try {
    body = Body.parse(await request.json()) as VisitCommentCreateInput
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  try {
    const comment = await createVisitComment(params.visitId, body)
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error(`POST comments :`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/api/estale/visits/[visitId]/comments/route.ts
git commit -m "feat(visites): route POST /api/estale/visits/[visitId]/comments"
```

---

### Task 1.5 : Routes PATCH + DELETE `/api/estale/visits/[visitId]/comments/[commentId]`

**Files:**
- Create: `nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/route.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/app/api/estale/visits/[visitId]/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { updateVisitComment, deleteVisitComment, isEstaleConfigured } from '@/lib/estale-api'
import { z } from 'zod'

const Body = z.object({
  place: z.string().min(1),
  component: z.string().min(1),
  content: z.string().min(1),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { visitId: string; commentId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })

  let body
  try {
    body = Body.parse(await request.json())
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  try {
    const comment = await updateVisitComment(params.visitId, params.commentId, body as any)
    return NextResponse.json({ comment })
  } catch (error) {
    console.error('PATCH comment :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { visitId: string; commentId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })

  try {
    await deleteVisitComment(params.visitId, params.commentId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE comment :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/route.ts
git commit -m "feat(visites): routes PATCH/DELETE comment"
```

---

### Task 1.6 : Route POST multipart photo

**Files:**
- Create: `nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/files/route.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/app/api/estale/visits/[visitId]/comments/[commentId]/files/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { uploadVisitCommentFile, isEstaleConfigured } from '@/lib/estale-api'

// Important : la route doit accepter du multipart/form-data avec un champ "file".
// Sur Vercel Functions le body limit par défaut est 4.5 MB ; on configure runtime nodejs
// pour passer en streaming (config.runtime / maxDuration).
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string; commentId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })

  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'multipart attendu' }, { status: 400 })
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'champ file manquant' }, { status: 400 })

  try {
    const blob = file as Blob
    const uploaded = await uploadVisitCommentFile(params.visitId, params.commentId, blob, file.name)
    return NextResponse.json({ file: uploaded }, { status: 201 })
  } catch (error) {
    console.error('POST file :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2 — Vérifier la limite de payload Vercel**

Lire la doc à `https://vercel.com/docs/functions/runtimes/node-js#request-body-size-limit` — par défaut 4.5 MB pour Functions Node. Si on prévoit des photos brutes ~5 MB, on a 2 options :
- Augmenter via `export const maxDuration` + config Edge (mais Edge ne supporte pas tout le code Node)
- Accepter 4.5 MB et compresser côté client SI on déborde

Vu que la spec dit "pleine résolution" + iPhone récent = ~3-5 MB par photo, on est en limite. **Décision pragmatique** : laisser ainsi pour l'instant. Si rejet en prod, mettre un message d'erreur clair côté UI ("photo > 4.5 MB, recadrer ou réduire").

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/files/route.ts
git commit -m "feat(visites): route POST multipart photo (limite 4.5MB Vercel a surveiller)"
```

---

### Task 1.7 : Route DELETE photo

**Files:**
- Create: `nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/files/[fileId]/route.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/app/api/estale/visits/[visitId]/comments/[commentId]/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { deleteVisitCommentFile, isEstaleConfigured } from '@/lib/estale-api'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { visitId: string; commentId: string; fileId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })

  try {
    await deleteVisitCommentFile(params.visitId, params.commentId, params.fileId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE file :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/api/estale/visits/[visitId]/comments/[commentId]/files/[fileId]/route.ts
git commit -m "feat(visites): route DELETE photo"
```

---

### Task 1.8 : Route POST heartbeat

**Files:**
- Create: `nextjs-app/src/app/api/visites/heartbeat/route.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/app/api/visites/heartbeat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

const Body = z.object({
  pendingCount: z.number().int().min(0),
  oldestPendingAt: z.string().nullable(),
})

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  let body
  try {
    body = Body.parse(await request.json())
  } catch (e) {
    return NextResponse.json({ error: 'payload invalide', details: String(e) }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    },
  )

  const { error } = await supabase
    .from('visite_sync_heartbeat')
    .upsert({
      user_id: guard.userId!,
      pending_count: body.pendingCount,
      oldest_pending_at: body.oldestPendingAt,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('heartbeat upsert :', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/api/visites/heartbeat/route.ts
git commit -m "feat(visites): route heartbeat sync supabase"
```

---

## Phase 2 — IndexedDB & sync engine

### Task 2.1 : Installer `idb`

**Files:**
- Modify: `nextjs-app/package.json`

- [ ] **Step 1 — Installer la dépendance**

```bash
cd "nextjs-app"
npm install idb@^8
```

- [ ] **Step 2 — Vérifier**

```bash
grep '"idb"' package.json
```

Attendu : ligne avec idb ^8.

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/package.json nextjs-app/package-lock.json
git commit -m "chore(visites): install idb pour IndexedDB"
```

---

### Task 2.2 : DB layer `src/lib/visites/db.ts`

**Files:**
- Create: `nextjs-app/src/lib/visites/db.ts`

- [ ] **Step 1 — Implémenter le wrapper**

```ts
// src/lib/visites/db.ts
// Couche d'accès IndexedDB pour les visites — wrappers typés au-dessus d'idb.

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { v4 as uuid } from 'uuid'

import type {
  VisitCreateInput,
  VisitCommentCreateInput,
  VisitCommentUpdateInput,
} from '@/lib/estale-api'

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'

export interface VisitDraft {
  localId: string
  estaleVisitId: string | null
  condoId: string
  entete: VisitCreateInput
  syncStatus: SyncStatus
  createdAt: string
  lastSyncAttempt?: string
  syncError?: string
}

export interface CommentDraft {
  localId: string
  visitLocalId: string
  estaleCommentId: string | null
  payload: VisitCommentCreateInput | VisitCommentUpdateInput
  syncStatus: SyncStatus
  createdAt: string
  lastSyncAttempt?: string
  syncError?: string
}

export interface PhotoDraft {
  localId: string
  commentLocalId: string
  estaleFileId: string | null
  blob: Blob
  filename: string
  mimeType: string
  capturedAt: string
  syncStatus: SyncStatus
  lastSyncAttempt?: string
  syncError?: string
}

interface BeamoVisitesDB extends DBSchema {
  visits_drafts: { key: string; value: VisitDraft }
  comments_drafts: { key: string; value: CommentDraft; indexes: { 'by-visit': string } }
  photos_drafts: { key: string; value: PhotoDraft; indexes: { 'by-comment': string } }
}

const DB_NAME = 'beamo-visites-v1'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<BeamoVisitesDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<BeamoVisitesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('visits_drafts')) {
          db.createObjectStore('visits_drafts', { keyPath: 'localId' })
        }
        if (!db.objectStoreNames.contains('comments_drafts')) {
          const c = db.createObjectStore('comments_drafts', { keyPath: 'localId' })
          c.createIndex('by-visit', 'visitLocalId')
        }
        if (!db.objectStoreNames.contains('photos_drafts')) {
          const p = db.createObjectStore('photos_drafts', { keyPath: 'localId' })
          p.createIndex('by-comment', 'commentLocalId')
        }
      },
    })
  }
  return dbPromise
}

// --- Visits ---

export async function addVisitDraft(condoId: string, entete: VisitCreateInput): Promise<VisitDraft> {
  const draft: VisitDraft = {
    localId: uuid(),
    estaleVisitId: null,
    condoId,
    entete,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  }
  const db = await getDB()
  await db.put('visits_drafts', draft)
  return draft
}

export async function getAllVisitDrafts(): Promise<VisitDraft[]> {
  const db = await getDB()
  return db.getAll('visits_drafts')
}

export async function updateVisitDraft(localId: string, patch: Partial<VisitDraft>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('visits_drafts', localId)
  if (!existing) throw new Error(`VisitDraft ${localId} introuvable`)
  await db.put('visits_drafts', { ...existing, ...patch })
}

export async function getVisitDraft(localId: string): Promise<VisitDraft | undefined> {
  const db = await getDB()
  return db.get('visits_drafts', localId)
}

// --- Comments ---

export async function addCommentDraft(
  visitLocalId: string,
  payload: VisitCommentCreateInput,
): Promise<CommentDraft> {
  const draft: CommentDraft = {
    localId: uuid(),
    visitLocalId,
    estaleCommentId: null,
    payload,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  }
  const db = await getDB()
  await db.put('comments_drafts', draft)
  return draft
}

export async function getCommentsForVisit(visitLocalId: string): Promise<CommentDraft[]> {
  const db = await getDB()
  return db.getAllFromIndex('comments_drafts', 'by-visit', visitLocalId)
}

export async function updateCommentDraft(localId: string, patch: Partial<CommentDraft>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('comments_drafts', localId)
  if (!existing) throw new Error(`CommentDraft ${localId} introuvable`)
  await db.put('comments_drafts', { ...existing, ...patch })
}

// --- Photos ---

export async function addPhotoDraft(
  commentLocalId: string,
  blob: Blob,
  filename: string,
): Promise<PhotoDraft> {
  const draft: PhotoDraft = {
    localId: uuid(),
    commentLocalId,
    estaleFileId: null,
    blob,
    filename,
    mimeType: blob.type,
    capturedAt: new Date().toISOString(),
    syncStatus: 'pending',
  }
  const db = await getDB()
  await db.put('photos_drafts', draft)
  return draft
}

export async function getPhotosForComment(commentLocalId: string): Promise<PhotoDraft[]> {
  const db = await getDB()
  return db.getAllFromIndex('photos_drafts', 'by-comment', commentLocalId)
}

export async function updatePhotoDraft(localId: string, patch: Partial<PhotoDraft>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('photos_drafts', localId)
  if (!existing) throw new Error(`PhotoDraft ${localId} introuvable`)
  await db.put('photos_drafts', { ...existing, ...patch })
}

// --- Cleanup ---

export async function purgeSyncedOlderThan(hours: number): Promise<number> {
  const db = await getDB()
  const cutoff = Date.now() - hours * 3600_000
  let deleted = 0

  for (const store of ['visits_drafts', 'comments_drafts', 'photos_drafts'] as const) {
    const all = await db.getAll(store as any) as Array<{ localId: string; syncStatus: SyncStatus; createdAt?: string; capturedAt?: string }>
    for (const item of all) {
      if (item.syncStatus !== 'synced') continue
      const ts = item.createdAt || item.capturedAt
      if (!ts) continue
      if (new Date(ts).getTime() < cutoff) {
        await db.delete(store as any, item.localId)
        deleted++
      }
    }
  }
  return deleted
}

// --- Stats pour heartbeat ---

export async function getSyncStats(): Promise<{ pendingCount: number; oldestPendingAt: string | null }> {
  const db = await getDB()
  let pending = 0
  let oldest: string | null = null
  for (const store of ['visits_drafts', 'comments_drafts', 'photos_drafts'] as const) {
    const all = await db.getAll(store as any) as Array<{ syncStatus: SyncStatus; createdAt?: string; capturedAt?: string }>
    for (const item of all) {
      if (item.syncStatus === 'pending' || item.syncStatus === 'error') {
        pending++
        const ts = item.createdAt || item.capturedAt
        if (ts && (!oldest || ts < oldest)) oldest = ts
      }
    }
  }
  return { pendingCount: pending, oldestPendingAt: oldest }
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/lib/visites/db.ts
git commit -m "feat(visites): couche IndexedDB (drafts visits/comments/photos)"
```

---

### Task 2.3 : Sync engine

**Files:**
- Create: `nextjs-app/src/lib/visites/sync-engine.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/lib/visites/sync-engine.ts
// Moteur de synchronisation : pousse les drafts IndexedDB vers les routes API beam-app
// dans l'ordre topologique (visite → comments → photos). Retry exponentiel.

import {
  getAllVisitDrafts,
  getCommentsForVisit,
  getPhotosForComment,
  updateVisitDraft,
  updateCommentDraft,
  updatePhotoDraft,
  getSyncStats,
} from './db'

function backoffMs(attempts: number): number {
  const table = [5_000, 15_000, 60_000, 300_000, 1_800_000]
  return table[Math.min(attempts, table.length - 1)]
}

async function pushVisit(localId: string): Promise<string | null> {
  const drafts = await getAllVisitDrafts()
  const draft = drafts.find((d) => d.localId === localId)
  if (!draft || draft.estaleVisitId) return draft?.estaleVisitId || null

  await updateVisitDraft(localId, { syncStatus: 'syncing', lastSyncAttempt: new Date().toISOString() })
  const res = await fetch('/api/estale/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft.entete),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await updateVisitDraft(localId, { syncStatus: 'error', syncError: `HTTP ${res.status} ${err.slice(0, 100)}` })
    return null
  }
  const json = await res.json()
  const visitId = json.visit?.id
  if (!visitId) {
    await updateVisitDraft(localId, { syncStatus: 'error', syncError: 'pas d\'id retourné' })
    return null
  }
  await updateVisitDraft(localId, { estaleVisitId: visitId, syncStatus: 'synced', syncError: undefined })
  return visitId
}

async function pushComment(visitLocalId: string, commentLocalId: string): Promise<string | null> {
  const drafts = await getCommentsForVisit(visitLocalId)
  const draft = drafts.find((d) => d.localId === commentLocalId)
  if (!draft) return null
  if (draft.estaleCommentId) return draft.estaleCommentId

  const visitDraft = (await getAllVisitDrafts()).find((v) => v.localId === visitLocalId)
  if (!visitDraft?.estaleVisitId) return null // attendre que la visite soit synced

  await updateCommentDraft(commentLocalId, { syncStatus: 'syncing', lastSyncAttempt: new Date().toISOString() })
  const res = await fetch(`/api/estale/visits/${visitDraft.estaleVisitId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft.payload),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await updateCommentDraft(commentLocalId, { syncStatus: 'error', syncError: `HTTP ${res.status} ${err.slice(0, 100)}` })
    return null
  }
  const json = await res.json()
  const commentId = json.comment?.id
  if (!commentId) {
    await updateCommentDraft(commentLocalId, { syncStatus: 'error', syncError: 'pas d\'id retourné' })
    return null
  }
  await updateCommentDraft(commentLocalId, { estaleCommentId: commentId, syncStatus: 'synced', syncError: undefined })
  return commentId
}

async function pushPhoto(commentLocalId: string, photoLocalId: string): Promise<void> {
  const photos = await getPhotosForComment(commentLocalId)
  const photo = photos.find((p) => p.localId === photoLocalId)
  if (!photo || photo.estaleFileId) return

  // remonter au comment + visit pour avoir les ids estale
  const commentDrafts = await Promise.all(
    (await getAllVisitDrafts()).map(async (v) => ({ visit: v, comments: await getCommentsForVisit(v.localId) })),
  )
  let estaleVisitId: string | null = null
  let estaleCommentId: string | null = null
  for (const c of commentDrafts) {
    const found = c.comments.find((cm) => cm.localId === commentLocalId)
    if (found) {
      estaleVisitId = c.visit.estaleVisitId
      estaleCommentId = found.estaleCommentId
      break
    }
  }
  if (!estaleVisitId || !estaleCommentId) return

  await updatePhotoDraft(photoLocalId, { syncStatus: 'syncing', lastSyncAttempt: new Date().toISOString() })
  const form = new FormData()
  form.append('file', photo.blob, photo.filename)
  const res = await fetch(
    `/api/estale/visits/${estaleVisitId}/comments/${estaleCommentId}/files`,
    { method: 'POST', body: form },
  )
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    await updatePhotoDraft(photoLocalId, { syncStatus: 'error', syncError: `HTTP ${res.status} ${err.slice(0, 100)}` })
    return
  }
  const json = await res.json()
  await updatePhotoDraft(photoLocalId, {
    estaleFileId: json.file?.id || null,
    syncStatus: 'synced',
    syncError: undefined,
  })
}

/**
 * Pousse tous les drafts pending/error dans l'ordre topologique.
 * À appeler à chaque event "online", à chaque sauvegarde locale, et toutes les 30s.
 */
export async function flushAll(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  // 1. visites
  const visits = await getAllVisitDrafts()
  for (const v of visits) {
    if (v.syncStatus !== 'synced') {
      await pushVisit(v.localId).catch((e) => console.error('pushVisit:', e))
    }
  }

  // 2. comments (uniquement ceux dont la visit est synced)
  const visits2 = await getAllVisitDrafts()
  for (const v of visits2) {
    if (!v.estaleVisitId) continue
    const comments = await getCommentsForVisit(v.localId)
    for (const c of comments) {
      if (c.syncStatus !== 'synced') {
        await pushComment(v.localId, c.localId).catch((e) => console.error('pushComment:', e))
      }
    }
  }

  // 3. photos (uniquement celles dont le comment est synced)
  const visits3 = await getAllVisitDrafts()
  for (const v of visits3) {
    const comments = await getCommentsForVisit(v.localId)
    for (const c of comments) {
      if (!c.estaleCommentId) continue
      const photos = await getPhotosForComment(c.localId)
      for (const p of photos) {
        if (p.syncStatus !== 'synced') {
          await pushPhoto(c.localId, p.localId).catch((e) => console.error('pushPhoto:', e))
        }
      }
    }
  }
}

let intervalHandle: ReturnType<typeof setInterval> | null = null

export function startSyncLoop(): void {
  if (intervalHandle) return
  if (typeof window === 'undefined') return
  window.addEventListener('online', () => { flushAll() })
  intervalHandle = setInterval(() => flushAll(), 30_000)
  // 1er flush immédiat
  flushAll()
}

export function stopSyncLoop(): void {
  if (intervalHandle) clearInterval(intervalHandle)
  intervalHandle = null
}

export async function snapshotStats() {
  return getSyncStats()
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/lib/visites/sync-engine.ts
git commit -m "feat(visites): sync engine drafts → estale (topological order + retry)"
```

---

### Task 2.4 : Hook React `useVisitesSync`

**Files:**
- Create: `nextjs-app/src/hooks/useVisitesSync.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/hooks/useVisitesSync.ts
'use client'

import { useEffect, useState } from 'react'
import { startSyncLoop, snapshotStats } from '@/lib/visites/sync-engine'

export interface SyncSnapshot {
  pendingCount: number
  oldestPendingAt: string | null
  online: boolean
}

export function useVisitesSync(): SyncSnapshot {
  const [snap, setSnap] = useState<SyncSnapshot>({
    pendingCount: 0,
    oldestPendingAt: null,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  })

  useEffect(() => {
    startSyncLoop()

    const tick = async () => {
      const stats = await snapshotStats()
      setSnap({
        pendingCount: stats.pendingCount,
        oldestPendingAt: stats.oldestPendingAt,
        online: navigator.onLine,
      })
    }
    const intv = setInterval(tick, 3_000)
    tick()

    const onOnline = () => setSnap((s) => ({ ...s, online: true }))
    const onOffline = () => setSnap((s) => ({ ...s, online: false }))
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      clearInterval(intv)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return snap
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/hooks/useVisitesSync.ts
git commit -m "feat(visites): hook useVisitesSync (snapshot + boot sync loop)"
```

---

### Task 2.5 : Push heartbeat depuis le client

**Files:**
- Create: `nextjs-app/src/lib/visites/heartbeat-client.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/lib/visites/heartbeat-client.ts
// Envoie périodiquement l'état sync vers /api/visites/heartbeat
// afin que le cron quotidien sache si Tom a des items en retard.

import { snapshotStats } from './sync-engine'

let lastSent: string = ''
let intv: ReturnType<typeof setInterval> | null = null

async function pushHeartbeat() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  const stats = await snapshotStats()
  const signature = `${stats.pendingCount}|${stats.oldestPendingAt || ''}`
  if (signature === lastSent) return
  try {
    await fetch('/api/visites/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingCount: stats.pendingCount,
        oldestPendingAt: stats.oldestPendingAt,
      }),
    })
    lastSent = signature
  } catch (e) {
    // silencieux : c'est juste un heartbeat
    console.warn('heartbeat failed', e)
  }
}

export function startHeartbeat(): void {
  if (intv) return
  if (typeof window === 'undefined') return
  intv = setInterval(pushHeartbeat, 60_000)
  pushHeartbeat()
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/lib/visites/heartbeat-client.ts
git commit -m "feat(visites): client heartbeat (1/min, dedup signature)"
```

---

## Phase 3 — UI mobile

### Task 3.1 : Layout admin gate + sync chip

**Files:**
- Create: `nextjs-app/src/components/visites/SyncIndicator.tsx`
- Create: `nextjs-app/src/app/apps/visites/layout.tsx`

- [ ] **Step 1 — Composant `SyncIndicator`**

```tsx
// src/components/visites/SyncIndicator.tsx
'use client'

import { useVisitesSync } from '@/hooks/useVisitesSync'

export function SyncIndicator() {
  const { pendingCount, oldestPendingAt, online } = useVisitesSync()
  if (!online) {
    return <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">📴 Hors-ligne</span>
  }
  if (pendingCount === 0) {
    return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">✓ Sync</span>
  }
  const oldHours = oldestPendingAt
    ? (Date.now() - new Date(oldestPendingAt).getTime()) / 3_600_000
    : 0
  const isLate = oldHours > 24
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        isLate ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {isLate ? '⚠️' : '⏳'} {pendingCount} en attente
    </span>
  )
}
```

- [ ] **Step 2 — Layout**

```tsx
// src/app/apps/visites/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { SyncIndicator } from '@/components/visites/SyncIndicator'
import { startHeartbeat } from '@/lib/visites/heartbeat-client'

export default function VisitesLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useUserRole()
  const router = useRouter()

  useEffect(() => {
    if (!loading && role !== 'admin') router.replace('/apps')
  }, [role, loading, router])

  useEffect(() => {
    startHeartbeat()
  }, [])

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Chargement…</div>
  }
  if (role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Visites</h1>
        <SyncIndicator />
      </header>
      <main className="p-4 max-w-2xl mx-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/src/components/visites/SyncIndicator.tsx nextjs-app/src/app/apps/visites/layout.tsx
git commit -m "feat(visites): layout admin gate + sync chip header"
```

---

### Task 3.2 : Page liste copros

**Files:**
- Create: `nextjs-app/src/app/apps/visites/page.tsx`

- [ ] **Step 1 — Implémenter**

```tsx
// src/app/apps/visites/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Condo { id: string; name: string; address?: string; zipCode?: string; city?: string }

export default function VisitesIndex() {
  const [condos, setCondos] = useState<Condo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/estale/condos')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setCondos(d.condos || [])
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Chargement des copropriétés…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (condos.length === 0) return <p>Aucune copropriété trouvée.</p>

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Sélectionne une copropriété pour voir / créer une visite.</p>
      {condos.map((c) => (
        <Link
          key={c.id}
          href={`/apps/visites/${c.id}`}
          className="block bg-white rounded-lg border p-4 shadow-sm active:bg-gray-100"
        >
          <div className="font-medium">{c.name}</div>
          {(c.address || c.city) && (
            <div className="text-sm text-gray-500">
              {[c.address, c.zipCode, c.city].filter(Boolean).join(' ')}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/apps/visites/page.tsx
git commit -m "feat(visites): page liste copros mobile"
```

---

### Task 3.3 : Page liste visites + bouton « Nouvelle »

**Files:**
- Create: `nextjs-app/src/app/apps/visites/[condoId]/page.tsx`

- [ ] **Step 1 — Implémenter**

```tsx
// src/app/apps/visites/[condoId]/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { EstaleVisit } from '@/lib/estale-api'

export default function VisitesCondoPage({ params }: { params: { condoId: string } }) {
  const [visits, setVisits] = useState<EstaleVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/estale/visits?condoId=${encodeURIComponent(params.condoId)}&archived=false`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setVisits(d.visits || [])
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [params.condoId])

  return (
    <div className="space-y-4">
      <Link
        href={`/apps/visites/${params.condoId}/new`}
        className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-medium active:bg-blue-700"
      >
        + Nouvelle visite
      </Link>

      <h2 className="font-semibold">Visites en cours</h2>
      {loading && <p>Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && visits.length === 0 && <p className="text-gray-500">Aucune visite en cours.</p>}
      <div className="space-y-2">
        {visits.map((v) => (
          <Link
            key={v.id}
            href={`/apps/visites/${params.condoId}/${v.id}`}
            className="block bg-white rounded-lg border p-3 shadow-sm active:bg-gray-100"
          >
            <div className="font-medium">{v.object || '(sans objet)'}</div>
            <div className="text-sm text-gray-500">
              {new Date(v.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
              {' • '}
              {v.comments?.length || 0} ligne{(v.comments?.length || 0) > 1 ? 's' : ''}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/apps/visites/[condoId]/page.tsx
git commit -m "feat(visites): page liste visites + bouton nouvelle"
```

---

### Task 3.4 : Formulaire entête nouvelle visite

**Files:**
- Create: `nextjs-app/src/app/apps/visites/[condoId]/new/page.tsx`

- [ ] **Step 1 — Implémenter**

```tsx
// src/app/apps/visites/[condoId]/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { VISIT_CATEGORY_FR, type VisitCategory } from '@/lib/estale/visit-enums'
import { addVisitDraft } from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'

export default function NewVisitePage({ params }: { params: { condoId: string } }) {
  const router = useRouter()
  const [category, setCategory] = useState<VisitCategory>('NON_CONTRACTUAL')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [period, setPeriod] = useState(60)
  const [object, setObject] = useState('')
  const [organiserID, setOrganiserID] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!organiserID) {
      setError('Renseigne ton organiserID (id Collaborator estale)')
      return
    }
    setSaving(true)
    const draft = await addVisitDraft(params.condoId, {
      category,
      date: new Date(date).toISOString(),
      period,
      object,
      condoID: params.condoId,
      organiserID,
      collaboratorIDs: [],
      ownerIDs: [],
    })
    flushAll() // sync immédiate si online
    router.push(`/apps/visites/${params.condoId}/${draft.localId}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Catégorie</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as VisitCategory)}
          className="w-full border rounded px-3 py-2"
        >
          {Object.entries(VISIT_CATEGORY_FR).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date & heure</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Durée (min)</label>
        <input
          type="number"
          min={5}
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value || '0', 10))}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Objet</label>
        <input
          type="text"
          value={object}
          onChange={(e) => setObject(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Visite annuelle obligatoire…"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Organiser (id collaborator estale)</label>
        <input
          type="text"
          value={organiserID}
          onChange={(e) => setOrganiserID(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="cl_xxx"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Récupérable via la page <code>/api/estale/condos</code> (champ <code>gestionnaire.id</code>),
          ou copié depuis estale desktop. À automatiser plus tard.
        </p>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Créer la visite'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/apps/visites/[condoId]/new/page.tsx
git commit -m "feat(visites): formulaire entete nouvelle visite"
```

---

### Task 3.5 : Composant `EnumPicker` full-screen

**Files:**
- Create: `nextjs-app/src/components/visites/EnumPicker.tsx`

- [ ] **Step 1 — Implémenter**

```tsx
// src/components/visites/EnumPicker.tsx
'use client'

import { useState } from 'react'

interface Props<K extends string> {
  label: string
  options: Record<K, string>   // key → label FR
  value: K | null
  onChange: (k: K) => void
  required?: boolean
}

export function EnumPicker<K extends string>({ label, options, value, onChange, required }: Props<K>) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const entries = Object.entries(options) as Array<[K, string]>
  const filtered = filter
    ? entries.filter(([, v]) => v.toLowerCase().includes(filter.toLowerCase()))
    : entries

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full text-left border rounded px-3 py-2 ${value ? 'text-gray-900' : 'text-gray-400'}`}
        aria-label={label}
      >
        {value ? options[value] : `Sélectionner… ${required ? '*' : ''}`}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="border-b p-3 flex items-center gap-2">
            <button type="button" onClick={() => setOpen(false)} className="text-blue-600">Annuler</button>
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filtered.map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => { onChange(k); setOpen(false); setFilter('') }}
                className="block w-full text-left px-4 py-3 active:bg-gray-100"
              >
                {v}
              </button>
            ))}
            {filtered.length === 0 && <p className="p-4 text-gray-500">Aucun résultat.</p>}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/components/visites/EnumPicker.tsx
git commit -m "feat(visites): EnumPicker full-screen avec recherche"
```

---

### Task 3.6 : Composant `PhotoSlot`

**Files:**
- Create: `nextjs-app/src/components/visites/PhotoSlot.tsx`

- [ ] **Step 1 — Implémenter**

```tsx
// src/components/visites/PhotoSlot.tsx
'use client'

import { useRef, useState } from 'react'

interface Props {
  label: string
  onCapture: (file: File) => void
}

export function PhotoSlot({ label, onCapture }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onCapture(file)
  }

  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className="aspect-square bg-gray-100 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 active:bg-gray-200"
    >
      {preview ? (
        <img src={preview} alt={label} className="w-full h-full object-cover rounded-lg" />
      ) : (
        <>
          <span className="text-2xl">📷</span>
          <span className="text-xs">{label}</span>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </button>
  )
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/components/visites/PhotoSlot.tsx
git commit -m "feat(visites): PhotoSlot capture native avec preview"
```

---

### Task 3.7 : Vue visite (entête + liste lignes)

**Files:**
- Create: `nextjs-app/src/app/apps/visites/[condoId]/[visitId]/page.tsx`

- [ ] **Step 1 — Implémenter**

```tsx
// src/app/apps/visites/[condoId]/[visitId]/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { VISIT_PLACE_FR, VISIT_COMPONENT_FR, VISIT_CATEGORY_FR } from '@/lib/estale/visit-enums'
import { getVisitDraft, getCommentsForVisit, type VisitDraft, type CommentDraft } from '@/lib/visites/db'
import type { EstaleVisit } from '@/lib/estale-api'

export default function VisitDetailPage({ params }: { params: { condoId: string; visitId: string } }) {
  // visitId peut être un localId (draft non sync) OU un id estale (visite remote)
  const [draft, setDraft] = useState<VisitDraft | null>(null)
  const [draftComments, setDraftComments] = useState<CommentDraft[]>([])
  const [remoteVisit, setRemoteVisit] = useState<EstaleVisit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      // 1) on tente d'abord en local
      const local = await getVisitDraft(params.visitId).catch(() => null)
      if (local) {
        setDraft(local)
        setDraftComments(await getCommentsForVisit(local.localId))
        setLoading(false)
        return
      }
      // 2) fallback : fetch depuis estale
      const res = await fetch(`/api/estale/visits/${params.visitId}?condoId=${params.condoId}`)
      const json = await res.json()
      setRemoteVisit(json.visit || null)
      setLoading(false)
    })()
  }, [params.condoId, params.visitId])

  if (loading) return <p>Chargement…</p>

  const entete = draft?.entete || remoteVisit
  if (!entete) return <p className="text-red-600">Visite introuvable.</p>

  const localComments = draftComments
  const remoteComments = remoteVisit?.comments || []

  return (
    <div className="space-y-4">
      <section className="bg-white border rounded-lg p-4">
        <div className="font-semibold">{entete.object}</div>
        <div className="text-sm text-gray-600">
          {new Date(entete.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
          {' • '}{entete.period} min{' • '}{VISIT_CATEGORY_FR[entete.category]}
        </div>
        {draft && !draft.estaleVisitId && (
          <div className="text-xs text-amber-700 mt-2">⏳ Visite pas encore poussée vers estale</div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Lignes</h2>
        <div className="space-y-2">
          {localComments.map((c, idx) => {
            const p = c.payload as { place: keyof typeof VISIT_PLACE_FR; component: keyof typeof VISIT_COMPONENT_FR; content: string }
            return (
              <Link
                key={c.localId}
                href={`/apps/visites/${params.condoId}/${params.visitId}/lignes/${c.localId}`}
                className="block bg-white border rounded-lg p-3 active:bg-gray-100"
              >
                <div className="text-sm font-medium">
                  {idx + 1}. {VISIT_PLACE_FR[p.place]} → {VISIT_COMPONENT_FR[p.component]}
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">{p.content}</div>
                {c.syncStatus !== 'synced' && (
                  <span className="text-xs text-amber-700">⏳ pas synced</span>
                )}
              </Link>
            )
          })}
          {remoteComments.map((c, idx) => (
            <div key={c.id} className="bg-white border rounded-lg p-3">
              <div className="text-sm font-medium">
                {idx + 1 + localComments.length}. {VISIT_PLACE_FR[c.place]} → {VISIT_COMPONENT_FR[c.component]}
              </div>
              <div className="text-sm text-gray-600 line-clamp-2">{c.content}</div>
              <div className="text-xs text-gray-400">{c.documents.length} photo(s)</div>
            </div>
          ))}
        </div>
      </section>

      <Link
        href={`/apps/visites/${params.condoId}/${params.visitId}/lignes/new`}
        className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-medium active:bg-blue-700"
      >
        + Ajouter une ligne
      </Link>
    </div>
  )
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/apps/visites/[condoId]/[visitId]/page.tsx
git commit -m "feat(visites): vue visite avec lignes locales + remote"
```

---

### Task 3.8 : Formulaire nouvelle ligne

**Files:**
- Create: `nextjs-app/src/app/apps/visites/[condoId]/[visitId]/lignes/new/page.tsx`

- [ ] **Step 1 — Implémenter**

```tsx
// src/app/apps/visites/[condoId]/[visitId]/lignes/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { VISIT_PLACE_FR, VISIT_COMPONENT_FR, type VisitPlace, type VisitComponent } from '@/lib/estale/visit-enums'
import { EnumPicker } from '@/components/visites/EnumPicker'
import { PhotoSlot } from '@/components/visites/PhotoSlot'
import { addCommentDraft, addPhotoDraft } from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'

export default function NewLignePage({ params }: { params: { condoId: string; visitId: string } }) {
  const router = useRouter()
  const [place, setPlace] = useState<VisitPlace | null>(null)
  const [component, setComponent] = useState<VisitComponent | null>(null)
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!place || !component) {
      setError('Sélectionne un lieu et un équipement.')
      return
    }
    setSaving(true)
    const draft = await addCommentDraft(params.visitId, { place, component, content })
    for (const f of photos) {
      await addPhotoDraft(draft.localId, f, f.name)
    }
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${params.visitId}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Lieu *</label>
        <EnumPicker label="Lieu" options={VISIT_PLACE_FR} value={place} onChange={setPlace} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Équipement *</label>
        <EnumPicker label="Équipement" options={VISIT_COMPONENT_FR} value={component} onChange={setComponent} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Commentaire *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded px-3 py-2 min-h-[120px]"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Photos</label>
        <div className="grid grid-cols-3 gap-2">
          <PhotoSlot label="Cadrage" onCapture={(f) => setPhotos((p) => [...p, f])} />
          <PhotoSlot label="Détail" onCapture={(f) => setPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Autre" onCapture={(f) => setPhotos((p) => [...p, f])} />
        </div>
        {photos.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{photos.length} photo(s) à uploader</p>
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/apps/visites/[condoId]/[visitId]/lignes/new/page.tsx
git commit -m "feat(visites): formulaire nouvelle ligne (lieu/equipement/commentaire/photos)"
```

---

### Task 3.9 : Édition ligne existante

**Files:**
- Create: `nextjs-app/src/app/apps/visites/[condoId]/[visitId]/lignes/[id]/page.tsx`

- [ ] **Step 1 — Implémenter**

```tsx
// src/app/apps/visites/[condoId]/[visitId]/lignes/[id]/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VISIT_PLACE_FR, VISIT_COMPONENT_FR, type VisitPlace, type VisitComponent } from '@/lib/estale/visit-enums'
import { EnumPicker } from '@/components/visites/EnumPicker'
import { PhotoSlot } from '@/components/visites/PhotoSlot'
import { getCommentsForVisit, updateCommentDraft, addPhotoDraft, getPhotosForComment, type CommentDraft, type PhotoDraft } from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'

export default function EditLignePage({ params }: { params: { condoId: string; visitId: string; id: string } }) {
  const router = useRouter()
  const [draft, setDraft] = useState<CommentDraft | null>(null)
  const [photos, setPhotos] = useState<PhotoDraft[]>([])
  const [place, setPlace] = useState<VisitPlace | null>(null)
  const [component, setComponent] = useState<VisitComponent | null>(null)
  const [content, setContent] = useState('')
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const comments = await getCommentsForVisit(params.visitId)
      const d = comments.find((c) => c.localId === params.id)
      if (d) {
        setDraft(d)
        const p = d.payload as any
        setPlace(p.place)
        setComponent(p.component)
        setContent(p.content)
        setPhotos(await getPhotosForComment(d.localId))
      }
    })()
  }, [params.visitId, params.id])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft || !place || !component) return
    setSaving(true)
    await updateCommentDraft(draft.localId, {
      payload: { place, component, content },
      syncStatus: draft.estaleCommentId ? 'pending' : draft.syncStatus, // re-trigger sync si déjà synced
    })
    for (const f of newPhotos) {
      await addPhotoDraft(draft.localId, f, f.name)
    }
    flushAll()
    router.push(`/apps/visites/${params.condoId}/${params.visitId}`)
  }

  if (!draft) return <p>Chargement…</p>

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Lieu *</label>
        <EnumPicker label="Lieu" options={VISIT_PLACE_FR} value={place} onChange={setPlace} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Équipement *</label>
        <EnumPicker label="Équipement" options={VISIT_COMPONENT_FR} value={component} onChange={setComponent} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Commentaire *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded px-3 py-2 min-h-[120px]"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Photos ({photos.length} déjà attachées)</label>
        <div className="grid grid-cols-3 gap-2">
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
          <PhotoSlot label="+ Photo" onCapture={(f) => setNewPhotos((p) => [...p, f])} />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Mettre à jour'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/apps/visites/[condoId]/[visitId]/lignes/[id]/page.tsx
git commit -m "feat(visites): edition ligne existante (drafts uniquement au MVP)"
```

---

### Task 3.10 : Lien dans Header + MobileQuickNav

**Files:**
- Modify: `nextjs-app/src/components/layout/Header.tsx`
- Modify: `nextjs-app/src/components/layout/MobileQuickNav.tsx`

- [ ] **Step 1 — Repérer la zone d'ajout dans Header.tsx**

```bash
cd "nextjs-app"
grep -n "Apps\|/apps" src/components/layout/Header.tsx | head -20
```

Repérer l'endroit où sont déclarés les liens « Articles », « Réseaux sociaux », etc.

- [ ] **Step 2 — Ajouter le lien Visites (admin only)**

Ajouter dans la liste, en suivant le pattern existant :

```tsx
{/* dans la map ou liste de liens admin */}
{isAdmin && (
  <Link href="/apps/visites" className="...">
    Visites
  </Link>
)}
```

(Le code exact dépend du pattern existant — appliquer le même.)

- [ ] **Step 3 — Idem pour MobileQuickNav**

Mêmes opérations dans `src/components/layout/MobileQuickNav.tsx`.

- [ ] **Step 4 — Commit**

```bash
git add nextjs-app/src/components/layout/Header.tsx nextjs-app/src/components/layout/MobileQuickNav.tsx
git commit -m "feat(visites): liens navigation Header + MobileQuickNav (admin)"
```

---

## Phase 4 — Garde-fou email cron

### Task 4.1 : Route cron alerte sync

**Files:**
- Create: `nextjs-app/src/app/api/cron/visites-sync-alert/route.ts`

- [ ] **Step 1 — Implémenter**

```ts
// src/app/api/cron/visites-sync-alert/route.ts
// Cron quotidien : pour chaque user dont oldest_pending_at est en retard,
// envoyer un mail Resend de rappel.

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const THRESHOLD_DAYS = parseInt(process.env.VISITES_ALERT_THRESHOLD_DAYS || '5', 10)
const ALERT_EMAIL = process.env.VISITES_ALERT_EMAIL

interface HeartbeatRow {
  user_id: string
  pending_count: number
  oldest_pending_at: string | null
  last_alert_sent_at: string | null
  updated_at: string
}

export async function GET(request: Request) {
  // Vercel Cron passe un header secret optionnel — on s'aligne sur la config existante
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const cutoff = new Date(Date.now() - THRESHOLD_DAYS * 86400_000).toISOString()
  const { data: rows, error } = await supabase
    .from('visite_sync_heartbeat')
    .select('*')
    .lt('oldest_pending_at', cutoff)
    .gt('pending_count', 0)

  if (error) {
    console.error('cron read heartbeat :', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!ALERT_EMAIL) {
    return NextResponse.json({ skipped: true, reason: 'VISITES_ALERT_EMAIL non configuré', candidates: rows?.length || 0 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY manquant', candidates: rows?.length || 0 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const sent: string[] = []

  for (const row of (rows || []) as HeartbeatRow[]) {
    // déduplication : pas plus d'une alerte par 24h pour la même ligne
    if (row.last_alert_sent_at && new Date(row.last_alert_sent_at).getTime() > Date.now() - 86400_000) continue

    const daysLate = Math.floor((Date.now() - new Date(row.oldest_pending_at!).getTime()) / 86400_000)
    const html = `
      <p>Bonjour Tom,</p>
      <p>Tu as <strong>${row.pending_count} items non synchronisés</strong> dans la brique Visites de beam-app,
        dont certains depuis <strong>${daysLate} jours</strong>.</p>
      <p>Pour éviter toute perte de données :</p>
      <ol>
        <li>Ouvre Chrome iOS sur ton téléphone</li>
        <li>Va sur <a href="https://www.beamô.fr/apps/visites">https://www.beamô.fr/apps/visites</a></li>
        <li>Vérifie que le chip en haut à droite est passé en <strong>✓ vert</strong></li>
      </ol>
      <p>Si l'erreur persiste après avoir suivi ces étapes, vérifie ta connexion internet ou consulte les logs.</p>
    `

    const { error: sendErr } = await resend.emails.send({
      from: 'Beamô beam-app <noreply@beamô.fr>',
      to: ALERT_EMAIL,
      subject: `[Visites] ${row.pending_count} items non synchronisés depuis ${daysLate}j`,
      html,
    })

    if (sendErr) {
      console.error('resend send :', sendErr)
      continue
    }
    await supabase
      .from('visite_sync_heartbeat')
      .update({ last_alert_sent_at: new Date().toISOString() })
      .eq('user_id', row.user_id)
    sent.push(row.user_id)
  }

  return NextResponse.json({ ok: true, sent })
}
```

- [ ] **Step 2 — Commit**

```bash
git add nextjs-app/src/app/api/cron/visites-sync-alert/route.ts
git commit -m "feat(visites): cron alerte sync via Resend (>5j de retard)"
```

---

### Task 4.2 : Config Vercel Cron

**Files:**
- Modify: `nextjs-app/vercel.json`

- [ ] **Step 1 — Lire le fichier existant**

```bash
cat "nextjs-app/vercel.json"
```

- [ ] **Step 2 — Ajouter l'entrée cron**

Ajouter dans la section `crons` (ou la créer si absente) :

```json
{
  "crons": [
    {
      "path": "/api/cron/visites-sync-alert",
      "schedule": "0 18 * * *"
    }
  ]
}
```

(18:00 UTC = 20:00 Paris en été / 19:00 en hiver — ajuster si nécessaire.)

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/vercel.json
git commit -m "chore(visites): cron Vercel 18h UTC alerte sync"
```

---

### Task 4.3 : Documenter les nouvelles env vars

**Files:**
- Modify: `nextjs-app/.env.example`

- [ ] **Step 1 — Ajouter les deux entrées**

```env
# === Brique Visites d'immeubles ===
VISITES_ALERT_EMAIL=tom.lemeille@beamô.fr
VISITES_ALERT_THRESHOLD_DAYS=5
```

- [ ] **Step 2 — Ajouter aussi dans `.env.local` (en local, non versionné)**

```bash
echo "" >> "nextjs-app/.env.local"
echo "VISITES_ALERT_EMAIL=tom.lemeille@beamô.fr" >> "nextjs-app/.env.local"
echo "VISITES_ALERT_THRESHOLD_DAYS=5" >> "nextjs-app/.env.local"
```

- [ ] **Step 3 — Commit**

```bash
git add nextjs-app/.env.example
git commit -m "docs(visites): env vars VISITES_ALERT_EMAIL/THRESHOLD_DAYS"
```

---

## Phase 5 — Tests terrain manuels

### Task 5.1 : Smoke test desktop

- [ ] **Step 1 — Démarrer le dev server**

```bash
cd "nextjs-app" && npm run dev
```

- [ ] **Step 2 — Se loguer dans beam-app en tant que Tom**

Ouvrir http://localhost:3000 dans Chrome desktop, se connecter avec son compte admin.

- [ ] **Step 3 — Aller sur `/apps/visites`**

Vérifier :
- ✅ La page charge
- ✅ Le chip sync indique « ✓ Sync » ou « 📴 Hors-ligne »
- ✅ La liste des copros est affichée

- [ ] **Step 4 — Créer une visite test**

Cliquer une copro → « + Nouvelle visite » → remplir le formulaire → enregistrer.

- [ ] **Step 5 — Vérifier la sync**

Le chip doit passer brièvement par « ⏳ 1 en attente » puis revenir à « ✓ Sync ». Vérifier dans estale desktop que la visite apparaît.

- [ ] **Step 6 — Ajouter une ligne avec 2 photos**

Dans la visite → « + Ajouter une ligne » → choisir lieu/équip/commentaire → capturer 2 photos via webcam (Chrome ouvre le picker) → enregistrer.

- [ ] **Step 7 — Vérifier dans estale**

La ligne et les photos doivent apparaître dans estale après quelques secondes.

---

### Task 5.2 : Test offline / mode avion mobile

- [ ] **Step 1 — Déployer en préview ou sur prod**

```bash
git push origin main
# Vercel déploie automatiquement
```

- [ ] **Step 2 — Test sur Chrome iOS depuis le téléphone**

1. Ouvrir Chrome iOS sur https://www.beamô.fr (ou URL préview)
2. Se loguer
3. Aller sur `/apps/visites/<condoId>`
4. Activer le **mode avion**
5. Créer une visite + 1 ligne + 2 photos
6. Vérifier : le chip est en ⏳ et le mode est noté hors-ligne
7. Désactiver le mode avion
8. Vérifier : sync auto, chip repasse à ✓

- [ ] **Step 3 — Test purge / reprise**

1. Créer une visite locale, mettre offline
2. Fermer l'onglet Chrome (sans synchroniser)
3. Rouvrir Chrome → revenir sur `/apps/visites/<condoId>/<localId>`
4. Vérifier que la visite est toujours là (IndexedDB persiste)

---

### Task 5.3 : Test cron alerte

- [ ] **Step 1 — Forcer une donnée ancienne en base**

Via le SQL Editor Supabase :

```sql
update visite_sync_heartbeat
set oldest_pending_at = now() - interval '6 days',
    pending_count = 3,
    last_alert_sent_at = null
where user_id = '<UUID DE TOM>';
```

- [ ] **Step 2 — Déclencher le cron manuellement**

```bash
curl -s "https://www.beamô.fr/api/cron/visites-sync-alert" \
  -H "Authorization: Bearer ${CRON_SECRET}" | jq
```

(Si `CRON_SECRET` n'est pas configuré, l'auth est désactivée.)

- [ ] **Step 3 — Vérifier la réception**

Vérifier l'arrivée du mail dans `tom.lemeille@beamô.fr`.

- [ ] **Step 4 — Vérifier la dédup**

Re-déclencher le cron → la deuxième fois, la dédup `last_alert_sent_at` doit empêcher un 2e envoi.

---

## Self-review effectué

**Couverture spec** : chaque section §3-§15 de la spec est couverte par au moins une task (J0-J5 → Phases 0-5).
**Placeholders** : aucun TBD/TODO/« à compléter » dans le plan.
**Cohérence types** : `VisitDraft.entete: VisitCreateInput` est utilisé identiquement dans `addVisitDraft`, `pushVisit`, formulaire entête. Les enums `VisitPlace`/`Component` sont définis une fois et importés partout.
**Limite Vercel multipart 4.5 MB** : signalée explicitement en Task 1.6 ; au pire on adaptera en compressant côté client en v2.
**Pattern `profiles.role`** : Task 1.1 inclut un step de vérification (lire `/api/user/role/route.ts`) pour confirmer la table/colonne avant de figer dans `requireAdmin`.

---

## Volume estimé

- **Phase 0** : 6 tasks (~1 jour)
- **Phase 1** : 8 tasks (~1 jour)
- **Phase 2** : 5 tasks (~2 jours)
- **Phase 3** : 10 tasks (~2-3 jours)
- **Phase 4** : 3 tasks (~0.5 jour)
- **Phase 5** : 3 tasks de validation (~0.5 jour)

**Total : 35 tasks, ~7-8 jours homme.**

**Fin du plan.**
