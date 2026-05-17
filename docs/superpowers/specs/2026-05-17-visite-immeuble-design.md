# Brique « Visites d'immeubles » — beam-app

**Date** : 2026-05-17
**Auteur** : Tom Le Meille (Beamô Immobilier) + Claude
**Statut** : Spec validée, prête pour plan d'implémentation
**Repo** : `site_beamô_app/nextjs-app/`

---

## 1. Contexte

Beamô utilise **estale** (logiciel métier syndic) comme source de vérité. Estale dispose d'une fonction « Visites d'immeubles » (`Copropriété > Visites`) mais son interface web est **peu utilisable sur smartphone** : ergonomie non adaptée, formulaires lourds, prise de photo galère.

Beam-app possède déjà :
- une intégration GraphQL estale fonctionnelle (`src/lib/estale-api.ts`)
- des routes API estale (`/api/estale/agency|condos|suppliers|introspect|reset-session`)
- un système de rôles (`useUserRole`, `AppRole`)
- un système d'envoi d'emails via Resend
- Supabase comme persistance applicative
- déploiement Vercel

**Aucune fonctionnalité « visite » n'existe à ce jour dans beam-app.**

## 2. Objectif

Ajouter une **brique « Visites »** à beam-app, **optimisée mobile (Chrome iOS)**, qui permet de créer et compléter une visite d'immeuble sur le terrain, en poussant les données en continu vers estale (qui reste la source de vérité finale).

## 3. Non-objectifs (out of scope MVP)

- Pas de gestion de **facturation** (mutations `bill`, `isBilled` non utilisées)
- Pas de **génération PDF** côté beam-app (`reportPDF` reste dans estale desktop)
- Pas de **réordonnancement** de lignes (mutation `orderComments` non utilisée)
- Pas de **suppression de visite** (mutation `delete` non utilisée)
- Pas d'**archivage / désarchivage** (reste côté estale desktop)
- Pas d'**annotation graphique** sur photos (cercles, flèches)
- Pas de **PWA installable** au MVP (peut être ajouté plus tard si besoin)
- Pas de **support hors Chrome iOS** (l'app sera responsive et fonctionnera ailleurs, mais Chrome iOS est la cible primaire)
- Pas de **support multi-utilisateurs estale** (un seul compte estale partagé, celui de Tom)

## 4. Scope MVP

### 4.1 Lecture (A′)

Afficher la **liste des visites non archivées** d'une copropriété (filtre `visits(archived: false)`). Utilité : reprendre sur mobile une visite préparée la veille sur PC.

### 4.2 Création (B)

Créer une visite complète :
1. Sélection de la copropriété parmi celles du collaborateur connecté
2. Saisie de l'entête (catégorie, date, durée, objet, participants)
3. Ajout itératif de lignes (lieu, équipement, commentaire, photos)

### 4.3 Reprise (C)

Ouvrir une visite **existante** (créée sur PC ou commencée le matin) pour y ajouter / modifier des lignes.

## 5. Décisions validées

| # | Décision | Rationale |
|---|---|---|
| D1 | Cible primaire : Chrome iOS, page responsive (pas de PWA installable) | « Simple et fiable » ; risque purge IndexedDB minimisé par la sync continue |
| D2 | Mode sync : **push continu vers estale** (à chaque ligne sauvegardée, à chaque photo capturée) | Plus fiable qu'un batch en fin de visite ; pas de buffer Supabase nécessaire |
| D3 | Storage local : **IndexedDB** uniquement (pas de Supabase Storage) | Cache transient ; vidé dès confirmation estale |
| D4 | Photos : **pleine résolution**, multi-photos par ligne, pattern UX "1 cadrage + 1 détail + N supplémentaires" | Demande métier explicite |
| D5 | Pas d'annotation photo, pas de compression côté client | Simplicité MVP |
| D6 | Auth : **compte estale unique** dans `.env.local` (celui de Tom) | Solo usage actuel |
| D7 | Gating beam-app : **`role === 'admin'`** | Seul Tom utilise les visites |
| D8 | Garde-fou perte de données : **email Resend** si items en attente > N jours | Cron quotidien |

## 6. Modèle de données estale (référence)

Schéma confirmé par introspection live le 2026-05-17.

### 6.1 Visit (entête)

```graphql
type Visit {
  id: ID!
  category: VisitCategory!     # CONTRACTUAL | NON_CONTRACTUAL
  date: Timestamptz!           # jour + heure de début
  period: Int!                 # durée en minutes (supposé)
  object: String!              # sujet de la visite
  message: String!             # compte-rendu global (optionnel)
  archivedAt: Timestamptz      # null = en cours
  condoID: ID!
  condo: Condo!
  organiser: Collaborator!     # celui qui mène la visite
  organiserID: ID!
  collaborators: [Collaborator!]!
  owners: [Owner!]!
  comments: [VisitComment!]!   # = "lignes" en langage métier
  reportPDF: String!
  isUpdatable: Boolean!
  isDeletable: Boolean!
  isFrozen: Boolean!
  # facturation : ignorée au MVP
}
```

### 6.2 VisitComment (ligne)

```graphql
type VisitComment {
  id: ID!
  rank: Int!                   # ordre dans la visite
  content: String!             # commentaire texte
  place: VisitPlace!           # voir enum 20 valeurs
  component: VisitComponent!   # voir enum 42 valeurs
  documents: [File!]!          # photos
  deletedAt: Timestamptz       # soft delete
  visitID: ID!
}
```

### 6.3 Enums

**VisitCategory** (2 valeurs)
- `CONTRACTUAL`
- `NON_CONTRACTUAL`

**VisitPlace** (20 valeurs)
ELEVATOR, CELLARS, BOILER_ROOM, CORRIDOR, COURT_YARD, HALL, STAIRS, EXTERIORS, GARAGE, BIKE_ROOM, TECHNICAL_AREA, GARBAGE_DISPOSAL_AREA, LEVEL_1, LEVEL_2, LANDING, CAR_PARK, SWIMMING_POOL, ROOF_PLACE, ACCESS_ROAD, OTHER

**VisitComponent** (42 valeurs)
ANTENNA, WATER_INLET, SANDBOX, FENCE, EMERGENCY_BLOCK, LETTER_BOX, CABIN, CHANNELING, CHAIN, FENCING, WATER_METER, ELECTRIC_METER, GAS_METER, SHOWER, LIGHTING, EXTINGUISHER, FACADE, WINDOW, GROOM, INTERCOM, SWITCHER, PLANTER, WALL, NEON, DOORMAT, LAWN, CEILING, CEILING_LIGHT, EVACUATION_PLAN, STUDS, LIFT_PUMP, GATE, ACCES_DOOR, ELEVATOR_DOOR, FRONT_DOOR, LANDING_DOOR, SOCKET, RAMP, FAUCET, SKYDOME, FLOOR, OTHERS

Mapping FR ↔ enum à définir dans une constante `src/lib/estale/visit-enums.ts` (libellés FR pour l'UI).

### 6.4 Mutations utilisées

```graphql
Mutation.createVisit(input: VisitCreateInput!): Visit!
Mutation.updateVisit(id: ID!): VisitMutation!

VisitMutation.update(input: VisitUpdateInput!): Visit!
VisitMutation.createComment(input: VisitCommentCreateInput!): VisitComment!
VisitMutation.updateComment(id: ID!): VisitCommentMutation!

VisitCommentMutation.update(input: VisitCommentUpdateInput!): VisitComment!
VisitCommentMutation.delete: Visit!
VisitCommentMutation.createFile(file: Upload!): VisitComment!
VisitCommentMutation.deleteFile(fileID: ID!): VisitComment!
```

### 6.5 Queries utilisées

```graphql
me.collaborator.condos(archived: false)            # liste copros (déjà câblée)
me.collaborator.condo(id).visits(archived: false)  # liste visites
me.collaborator.condo(id).visit(id)                # détail visite
```

## 7. Architecture côté client (mobile)

### 7.1 Vue globale

```
┌─────────────────────────────────────────────────────────────┐
│  Page /apps/visites/* (Next.js App Router, client component)│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  UI Layer (React + Tailwind + shadcn)               │   │
│  │  - Liste copros / liste visites / formulaire ligne  │   │
│  │  - Indicateur sync permanent (header)               │   │
│  └────────────────┬────────────────────────────────────┘   │
│                   │                                         │
│  ┌────────────────▼────────────────────────────────────┐   │
│  │  Local store (IndexedDB via 'idb' lib)              │   │
│  │  - object stores: visits_drafts, comments_drafts,   │   │
│  │    photos_drafts, sync_queue                        │   │
│  └────────────────┬────────────────────────────────────┘   │
│                   │                                         │
│  ┌────────────────▼────────────────────────────────────┐   │
│  │  Sync Engine (custom hook + worker)                 │   │
│  │  - online/offline detection (navigator.onLine)      │   │
│  │  - retry queue (30s tick when online)               │   │
│  │  - calls beam-app API routes                        │   │
│  └────────────────┬────────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────────┘
                    │  HTTPS multipart / JSON
                    ▼
       beam-app API routes (/api/estale/visits/*)
                    │
                    ▼  GraphQL via estale-api.ts
              api.estale.app/graphql/intranet
```

### 7.2 Stores IndexedDB

Lib utilisée : **`idb`** (wrapper léger autour d'IndexedDB).

Base : `beamo-visites-v1`

| Object store | Clé | Champs notables |
|---|---|---|
| `visits_drafts` | `localId` (UUID v4) | `estaleVisitId` (null si pas encore push), `condoId`, `entete: VisitCreateInput`, `syncStatus`, `createdAt`, `lastSyncAttempt`, `syncError` |
| `comments_drafts` | `localId` | `visitLocalId`, `estaleCommentId`, `payload: VisitCommentCreateInput`, `syncStatus`, ... |
| `photos_drafts` | `localId` | `commentLocalId`, `estaleFileId`, `blob: Blob`, `mimeType`, `capturedAt`, `syncStatus`, `syncError` |
| `sync_queue` | `id` (auto-incr) | `type` (`visit\|comment\|photo`), `localId`, `attempts`, `nextAttemptAt`, `lastError` |

**`syncStatus`** ∈ { `pending`, `syncing`, `synced`, `error` }

Règle de cleanup : un item `synced` reste **24h** dans IndexedDB pour permettre une consultation rapide hors ligne, puis est purgé par un GC déclenché au démarrage de l'app.

### 7.3 Sync Engine (logique)

```ts
// pseudo-code
async function trySyncOne(item) {
  item.status = 'syncing'
  try {
    const result = await postToBeamoApi(item)  // /api/estale/visits/...
    item.estaleId = result.id
    item.status = 'synced'
    enqueueChildren(item)  // une visite synced débloque ses comments
  } catch (e) {
    item.status = 'error'
    item.attempts++
    item.nextAttemptAt = now() + backoff(item.attempts)
    item.lastError = e.message
  }
}

// triggers
- window.addEventListener('online') → flushAll()
- setInterval(flushAll, 30_000) si tab visible
- au moment de chaque sauvegarde locale → trySyncOne immédiat
```

Backoff exponentiel plafonné : 5s, 15s, 60s, 5min, 30min, 30min, ...

### 7.4 Ordre des dépendances de sync

Une `comment` ne peut être pushée qu'après que sa `visit` parent ait obtenu son `estaleVisitId`.
Une `photo` ne peut être pushée qu'après que son `comment` parent ait obtenu son `estaleCommentId`.

Le sync engine respecte cet ordre topologique.

### 7.5 Indicateur sync UI (header permanent)

```
✓ Synchronisé          — tout est OK
⏳ 3 lignes en cours   — sync en route
⚠️ 5 items > 24h       — banner orange, modal au démarrage
❌ Erreur réseau       — bouton "Réessayer"
```

Un click sur le chip ouvre un **drawer de détail** listant les items en retard avec leur `lastError`.

## 8. Architecture côté serveur (beam-app API)

### 8.1 Routes à créer

```
src/app/api/estale/visits/
├── route.ts                    GET    → liste visites d'une copro (?condoId=X&archived=false)
│                                POST   → createVisit
├── [visitId]/
│   ├── route.ts                GET    → détail visite
│   │                           PATCH  → updateVisit
│   └── comments/
│       ├── route.ts            POST   → createComment
│       └── [commentId]/
│           ├── route.ts        PATCH  → updateComment
│           │                   DELETE → deleteComment
│           └── files/
│               ├── route.ts    POST (multipart) → createFile
│               └── [fileId]/
│                   └── route.ts DELETE → deleteFile
```

Toutes ces routes :
- Vérifient `role === 'admin'` (via `getCurrentUserRole()`)
- Délèguent à des fonctions ajoutées dans `src/lib/estale-api.ts`
- Retournent un JSON normalisé `{ data, error }`

### 8.2 Extensions de `src/lib/estale-api.ts`

Ajouter les fonctions :

```ts
export async function getCondoVisits(condoId: string, archived: boolean = false): Promise<Visit[]>
export async function getVisitDetail(condoId: string, visitId: string): Promise<Visit | null>
export async function createVisit(input: VisitCreateInput): Promise<Visit>
export async function updateVisit(visitId: string, input: VisitUpdateInput): Promise<Visit>
export async function createVisitComment(visitId: string, input: VisitCommentCreateInput): Promise<VisitComment>
export async function updateVisitComment(visitId: string, commentId: string, input: VisitCommentUpdateInput): Promise<VisitComment>
export async function deleteVisitComment(visitId: string, commentId: string): Promise<void>
export async function uploadVisitCommentFile(visitId: string, commentId: string, file: Blob, filename: string): Promise<File>
export async function deleteVisitCommentFile(visitId: string, commentId: string, fileID: string): Promise<void>
```

Et les types correspondants côté TypeScript dans le même fichier (ou dans `src/lib/estale-types.ts` si la taille grandit).

### 8.3 Upload GraphQL multipart

L'upload de fichier estale utilise la spec [graphql-multipart-request](https://github.com/jaydenseric/graphql-multipart-request-spec). Le client `fetch` natif suffit avec un `FormData` correctement structuré (`operations`, `map`, `0`).

## 9. UX flows

### 9.1 Arborescence des routes Next.js

```
/apps/visites                                      Liste de mes copros (cartes mobile)
/apps/visites/[condoId]                            Liste visites non archivées de la copro
/apps/visites/[condoId]/new                        Formulaire entête → crée + redirect
/apps/visites/[condoId]/[visitId]                  Vue visite : entête + liste lignes + bouton "Ajouter une ligne"
/apps/visites/[condoId]/[visitId]/lignes/new       Formulaire nouvelle ligne (lieu, équip, commentaire, photos)
/apps/visites/[condoId]/[visitId]/lignes/[id]      Édition ligne existante
```

### 9.2 Wireframes (texte)

**Liste copros** — `/apps/visites`
```
┌─────────────────────────────────────────┐
│ ← Beamô       Visites          ✓ Sync   │
├─────────────────────────────────────────┤
│ Choisis une copropriété                 │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ Résidence Les Cèdres              │   │
│ │ 14 rue de la Paix, 75002 Paris    │   │
│ │ 3 visites en cours          →     │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ Le Clos Saint-Martin              │   │
│ │ ...                                │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Liste visites** — `/apps/visites/[condoId]`
```
┌─────────────────────────────────────────┐
│ ← Les Cèdres                  ✓ Sync    │
├─────────────────────────────────────────┤
│ [ + Nouvelle visite ]                   │
│                                         │
│ Visites en cours                        │
│ ┌───────────────────────────────────┐   │
│ │ 2026-05-17  10h                   │   │
│ │ Visite annuelle obligatoire       │   │
│ │ 4 lignes • 12 photos              │   │
│ │ ⏳ 2 photos en sync                │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Vue visite** — `/apps/visites/[condoId]/[visitId]`
```
┌─────────────────────────────────────────┐
│ ← Visite 17/05            ✓ Sync        │
├─────────────────────────────────────────┤
│ Visite annuelle obligatoire             │
│ 2026-05-17 • 10h-12h • CONTRACTUAL      │
│ 👥 Tom (orga.) + 2 copro                │
│ [Modifier entête]                       │
│                                         │
│ ─── Lignes (4) ───                      │
│ ① Cave → Compteur eau                   │
│   "Fuite légère, jonction...    📷📷+3 │
│ ② Hall → Boîtes aux lettres             │
│ ③ Toiture → Façade                       │
│ ④ Ascenseur → Porte                      │
│                                         │
│ [ + Ajouter une ligne ]                 │
└─────────────────────────────────────────┘
```

**Nouvelle ligne** — `/apps/visites/[condoId]/[visitId]/lignes/new`
```
┌─────────────────────────────────────────┐
│ ← Nouvelle ligne          ⏳ 1 en sync  │
├─────────────────────────────────────────┤
│ Lieu                                    │
│ [Sélectionner…           ▼]             │
│   → modal full-screen avec 20 enum FR   │
│                                         │
│ Équipement                              │
│ [Sélectionner…           ▼]             │
│   → modal full-screen avec 42 enum FR   │
│                                         │
│ Commentaire                             │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Photos                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │📷 Cadrage│ │📷 Détail │ │ + Photo  │ │
│ │  (vide)  │ │  (vide)  │ │          │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                         │
│ [ Annuler ]    [ Enregistrer ▶ ]        │
└─────────────────────────────────────────┘
```

### 9.3 Comportements clés

- **« Enregistrer »** sur une ligne = écriture IndexedDB + déclenche sync immédiat si online + redirige vers la vue visite. Pas de bouton « publier vers estale » distinct.
- **Capture photo** = ouvre l'app caméra native (`<input type="file" accept="image/*" capture="environment">`), Chrome iOS gère.
- **Long press sur une ligne** = action menu (modifier, supprimer)
- **Tirer pour rafraîchir** = relance `getCondoVisits()` (pour voir une visite créée sur PC entre-temps)

## 10. Garde-fous anti-perte de données

### 10.1 Indicateurs UI (déjà décrit §7.5)

- Chip permanent en header
- Modal au démarrage si items > 24h
- Banner sur chaque page tant que items en retard

### 10.2 Cron quotidien email Resend

Nouvelle route : `src/app/api/cron/visites-sync-alert/route.ts` (CRON Vercel, fréquence 1× / jour à 19h).

**Logique** : la route ne peut pas elle-même voir IndexedDB (côté client uniquement). Donc le mécanisme est inversé :

1. À chaque sauvegarde locale, beam-app envoie aussi un **heartbeat** vers une nouvelle route `/api/visites/heartbeat` qui inscrit dans Supabase une ligne `{ user_id, item_count, oldest_pending_at, last_seen_at }`.
2. Quand un item est confirmé `synced`, beam-app appelle `/api/visites/heartbeat/clear` pour décrémenter / mettre à jour.
3. Le cron quotidien lit Supabase. Si pour un user `oldest_pending_at < now() - 5 days`, il envoie un email Resend :

> Bonjour Tom,
> Tu as **12 items non synchronisés depuis 5 jours** dans la brique Visites de beam-app.
> Pour éviter toute perte de données :
> 1. Ouvre Chrome iOS sur ton téléphone
> 2. Va sur https://beamô.fr/apps/visites
> 3. Vérifie que le chip est passé en ✓ vert
>
> Si l'erreur persiste, contacte le support.

**Table Supabase à créer** : `visite_sync_heartbeat`
```sql
create table visite_sync_heartbeat (
  user_id uuid primary key references auth.users(id),
  pending_count int not null default 0,
  oldest_pending_at timestamptz,
  last_alert_sent_at timestamptz,
  updated_at timestamptz not null default now()
);
```

RLS : un user ne voit que sa propre ligne. Le cron utilise la `service_role` key.

### 10.3 Limitation honnête

Cette stratégie heartbeat suppose que le client a au moins 1× la connexion pour envoyer le heartbeat. Si Tom est **totalement déconnecté + ne rouvre pas l'app**, ni heartbeat ni cron ne le sauveront. C'est l'unique cas où la perte est possible — et il est très improbable.

## 11. Gating par rôle (sécurité)

### 11.1 Côté client

- Route `/apps/visites/*` vérifie `useUserRole().role === 'admin'`. Si non → redirect vers `/apps`.
- Lien « Visites » dans le `MobileQuickNav` et `Header` n'apparaît que pour `admin`.

### 11.2 Côté serveur

Toutes les routes `src/app/api/estale/visits/**` commencent par :

```ts
const session = await getServerSession()
if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
const role = await getRole(session.user.id)
if (role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
```

Helper à factoriser dans `src/lib/api-auth.ts` si pas déjà présent.

## 12. Stack technique

| Domaine | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js (existant) | Stack en place |
| UI | shadcn/ui + Tailwind (existants) | Cohérence visuelle beam-app |
| IndexedDB | lib `idb` (npm) | Léger, types, promise-based |
| GraphQL client (serveur) | `fetch` natif via `estale-api.ts` (existant) | Pas de dépendance Apollo nécessaire |
| Photo capture | `<input capture="environment">` | Natif, OK Chrome iOS |
| Email | Resend (existant) | Déjà câblé |
| Persistance heartbeat | Supabase (existant) | Cohérence beam-app |
| Cron | Vercel Cron + route `/api/cron/...` (pattern existant) | `rapport-comptable` déjà ainsi |
| Tests | Pas de tests automatisés au MVP, validation manuelle uniquement | Vélocité MVP — tests E2E à ajouter en v2 si dette devient sensible |

## 13. Plan d'implémentation (jalons)

Estimation à confirmer pendant la phase plan détaillé.

### Jalon J0 — Préliminaires (1 jour)
- [ ] Créer la table Supabase `visite_sync_heartbeat` + RLS
- [ ] Ajouter constantes FR pour enums `VisitPlace` / `VisitComponent` / `VisitCategory` dans `src/lib/estale/visit-enums.ts`
- [ ] Étendre `src/lib/estale-api.ts` avec les 8 fonctions visites + types TypeScript
- [ ] Tester chaque fonction via un script `tsx` ou route debug temporaire

### Jalon J1 — API beam-app (1 jour)
- [ ] Créer toutes les routes `/api/estale/visits/**` (8 routes)
- [ ] Factoriser le helper `requireAdmin()` côté serveur
- [ ] Tester chaque route via curl ou Postman avec l'auth session beam-app

### Jalon J2 — Couche IndexedDB + sync engine (2 jours)
- [ ] Schéma IndexedDB v1 + helpers CRUD via `idb`
- [ ] Sync engine (hook React `useSyncEngine`)
- [ ] Online/offline detection
- [ ] Backoff exponentiel + ordre topologique des dépendances
- [ ] Heartbeat vers `/api/visites/heartbeat`

### Jalon J3 — UI mobile (2-3 jours)
- [ ] `/apps/visites` — liste copros
- [ ] `/apps/visites/[condoId]` — liste visites
- [ ] `/apps/visites/[condoId]/new` — formulaire entête
- [ ] `/apps/visites/[condoId]/[visitId]` — vue visite
- [ ] `/apps/visites/[condoId]/[visitId]/lignes/new` — formulaire ligne
- [ ] `/apps/visites/[condoId]/[visitId]/lignes/[id]` — édition ligne
- [ ] Composant chip sync permanent (header)
- [ ] Modal sync au démarrage si items > 24h

### Jalon J4 — Garde-fous (0.5 jour)
- [ ] Route `/api/cron/visites-sync-alert/route.ts`
- [ ] Template email Resend
- [ ] Config Vercel Cron dans `vercel.json`
- [ ] Test end-to-end de l'alerte

### Jalon J5 — Tests terrain (0.5 jour)
- [ ] Test création de visite complète depuis Chrome iOS
- [ ] Test offline (mode avion) → puis online → vérif sync
- [ ] Test reprise d'une visite préparée sur PC
- [ ] Validation que la donnée arrive correctement dans estale desktop

**Total estimé : 7 à 8 jours homme.**

## 14. Risques & limitations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| API estale change la signature (breaking) | Faible | Élevé | Introspection régulière + tests E2E mensuels |
| Purge IndexedDB Chrome iOS après 7 jours sans visite du site | Faible | Moyen (perte photos non synced) | Sync continu + email cron de rappel |
| User saisit une visite, change de téléphone | Très faible | Élevé | Email cron en cas d'inactivité prolongée |
| Upload photo > 50 MB rejeté par Vercel Functions | Modéré (limite 4.5 MB par défaut sur Functions, 100MB sur Edge) | Élevé | Configurer la route comme **Edge Function** ou streamer directement vers estale sans transit body |
| Chrome iOS tue l'onglet en plein milieu de visite | Faible | Faible (IndexedDB persiste) | Reload de l'app récupère l'état |
| Conflit de modification ligne par 2 utilisateurs | Quasi nul (Tom seul) | Faible | Pas géré au MVP |
| Mauvais mapping enum (libellé FR oublié) | Modérée | Faible (cosmétique) | Test exhaustif des 64 valeurs |

## 15. Variables d'environnement requises

```env
# Déjà présentes :
ESTALE_API_BASE_URL=https://api.estale.app
ESTALE_EMAIL=...
ESTALE_PASSWORD=...
RESEND_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# À ajouter :
VISITES_ALERT_EMAIL=tom.lemeille@beamô.fr   # destinataire des alertes cron
VISITES_ALERT_THRESHOLD_DAYS=5               # seuil de retard avant alerte
```

## 16. Évolutions possibles (post-MVP)

- **PWA installable** (manifest + service worker) si purge iOS devient un vrai problème
- **Multi-comptes estale** : table chiffrée `estale_credentials` indexée par `user_id`
- **Compression photo côté client** si volume devient un souci
- **Annotation graphique** (`react-konva`)
- **Mode dictée vocale** pour les commentaires (Web Speech API)
- **Génération PDF** côté beam-app (`@react-pdf/renderer`)
- **Statistiques** : nb visites / mois, % désordres récurrents, etc.
- **Workflow de validation** : visite signée par le conseil syndical (signature tactile)
- **Notifications push** (iOS 16.4+ avec PWA installée)

---

**Fin de spec.**
