# Venator Lot 2 — Émission d'OS (ticket → Ordre de Service) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Depuis un ticket Venator, émettre un **Ordre de Service** au prestataire via l'API native Estale (`KanbanEventOrder`) — Estale génère le PDF, l'envoie, suit les réponses. Le ticket passe « OS envoyé ».

**Architecture:** Réutilise le flux OS validé de `estale-os-express` (2 mutations : `createKanbanTask` → `updateKanbanTask{createEventOrder}`). beam-app exécute les mutations Estale via `estaleGraphQL` (déjà utilisé pour les Visites). Nouvelle table `venator_os` (Supabase) reliant ticket ↔ OS Estale. Services purs ; l'appel Estale est **injecté** (comme `fetchCondos` dans `syncCopros`) pour rester pur et testable.

**Tech Stack:** Next 14 · Supabase · Zod · Vitest · Estale GraphQL (via `src/lib/estale-api.ts:estaleGraphQL`) · shadcn brutalist.

## Global Constraints
- Branche `feat/venator-v1`. Services purs (aucun `next/*` sous `src/lib/venator/services/`). L'adaptateur Estale (`src/lib/venator/estale-os.ts`) PEUT importer `estale-api` (hors `services/`).
- **SÉCURITÉ ENVOI EXTERNE (critique) :** un OS envoie un vrai email à un prestataire. Les tests unitaires **mockent** l'appel Estale (aucun envoi). Pour la **vérif e2e** : Tom a fourni une **adresse prestataire de test = `tom.lemeille@beamô.fr`** (lui-même, enregistré comme fournisseur dans Estale). ⇒ Un OS e2e réel est autorisé **UNIQUEMENT** si le destinataire est ce contact-là. **JAMAIS émettre un OS vers un autre prestataire réel.** Choisir le fournisseur dont le contact = `tom.lemeille@beamô.fr` pour tout test d'envoi réel.
- Client Supabase `no-store` déjà en place. Auth : routes `/api/venator/*` gardées `requireVenatorRole('gestionnaire')` pour l'émission.
- Tests : `npm run test:run` vert ; `npx tsc --noEmit 2>&1 | grep -i venator` vide. Ne pas stager les fichiers dev-auth non commités.
- Réf. exacte du flux OS : `~/Dossier en local/Beamô/estale-os-express/src/estale/order-send.ts` + `queries.ts` (mutations + input `KanbanEventOrderInput`, quirks `$id:ID!`/`$a:Boolean!`).

---

### Task 1 — Migration `venator_os` + types

**Files:** Create `supabase/migrations/20260717_venator_os.sql`; Modify `src/lib/venator/types.ts`.

- [ ] **Step 1 : migration**
```sql
-- supabase/migrations/20260717_venator_os.sql
-- Ordre de Service émis depuis un ticket (miroir de l'OS natif Estale KanbanEventOrder).
create type venator_os_statut as enum ('brouillon','envoye','erreur');
create table venator_os (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references venator_tickets(id) on delete cascade,
  copro_id uuid not null references venator_copros(id),
  prestataire_nom text not null,
  objet text not null,
  estale_task_id text,          -- id de la tâche kanban Estale porteuse
  estale_event_id text,         -- id du KanbanEventOrder
  statut venator_os_statut not null default 'brouillon',
  erreur text,                  -- message si statut='erreur'
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index on venator_os (ticket_id);
alter table venator_os enable row level security;
```
- [ ] **Step 2 : types.ts** — ajouter `OS_STATUTS = ['brouillon','envoye','erreur'] as const`, `type OsStatut`, interface `Os` (mêmes colonnes), et `osEmettreSchema` Zod : `z.object({ ticket_id: z.string().uuid(), prestataire_contact_id: z.string().min(1), prestataire_nom: z.string().min(1), objet: z.string().min(1).max(200), description: z.string().min(1).max(20000), urgent: z.boolean().default(false), code_acces: z.string().max(100).nullish() })`.
- [ ] **Step 3 : vérifs + commit** — `grep -c "enable row level security"` = 1 ; `tsc` venator clean. `git commit -m "feat(venator): table venator_os + types (OS)"`.
> ⚠️ Tom : appliquer `20260717_venator_os.sql` au dashboard Supabase.

---

### Task 2 — Service OS (pur, TDD, Estale injecté)

**Files:** Create `src/lib/venator/services/os-service.ts`; Test `src/lib/venator/__tests__/os.test.ts`.

**Interfaces produced:**
- `type EmettreOsDeps = { emitEstaleOrder: (args: EstaleOrderArgs) => Promise<{ taskID: string; eventID: string }> }` — l'appel Estale injecté.
- `emettreOS(db, deps, input)` : crée une ligne `venator_os` (statut `brouillon`), appelle `deps.emitEstaleOrder(...)` ; sur succès → maj `estale_task_id/event_id`, `statut='envoye'`, `sent_at`, passe le ticket en `statut='os_envoye'`, journalise `os_emis` ; sur échec → `statut='erreur'` + `erreur`, journalise `os_erreur`, relance l'erreur en `VenatorError('invalid')`. Retourne l'`Os`.
- `listerOsParTicket(db, ticket_id)`.

- [ ] **Step 1 : test d'abord** — deux cas : (a) succès → os `envoye` avec estale ids, ticket devient `os_envoye`, journal `os_emis` ; (b) l'appel Estale jette → os `erreur`, ticket inchangé, journal `os_erreur`. Le `emitEstaleOrder` est un **fake** (aucune vraie Estale). Utiliser `createFakeDb` + `creerTicket`.
```typescript
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerTicket, listerTickets } from '../services/tickets-service'
import { emettreOS, listerOsParTicket } from '../services/os-service'
async function seed(c:any){const{data}=await c.from('venator_copros').insert({estale_id:'e1',reference:'00013',nom:'BUC'}).select().single();return data}
describe('os-service',()=>{
  it('émission OK : os envoyé, ticket os_envoye, journal os_emis',async()=>{
    const{client}=createFakeDb();const copro=await seed(client)
    const t=await creerTicket(client,{copro_id:copro.id,type:'intervention',titre:'Fuite'})
    const deps={emitEstaleOrder:async()=>({taskID:'k1',eventID:'ev1'})}
    const os=await emettreOS(client,deps,{ticket_id:t.id,prestataire_contact_id:'c1',prestataire_nom:'Plomberie X',objet:'Fuite',description:'<p>Intervenir</p>',urgent:true})
    expect(os.statut).toBe('envoye');expect(os.estale_event_id).toBe('ev1')
    const[t2]=await listerTickets(client,{copro_id:copro.id});expect(t2.statut).toBe('os_envoye')
    const{data:j}=await client.from('venator_journal').select('*').eq('type_evenement','os_emis');expect(j.length).toBe(1)
  })
  it('émission KO : os erreur, ticket inchangé, journal os_erreur',async()=>{
    const{client}=createFakeDb();const copro=await seed(client)
    const t=await creerTicket(client,{copro_id:copro.id,type:'intervention',titre:'Fuite'})
    const deps={emitEstaleOrder:async()=>{throw new Error('estale down')}}
    await expect(emettreOS(client,deps,{ticket_id:t.id,prestataire_contact_id:'c1',prestataire_nom:'X',objet:'o',description:'<p>x</p>'})).rejects.toMatchObject({code:'invalid'})
    const list=await listerOsParTicket(client,t.id);expect(list[0].statut).toBe('erreur')
    const[t2]=await listerTickets(client,{copro_id:copro.id});expect(t2.statut).toBe('nouveau')
  })
})
```
- [ ] **Step 2 : RED** — `npm run test:run -- os` échoue.
- [ ] **Step 3 : implémenter** `os-service.ts` (pur ; importe `logJournal`, `VenatorError`, types ; `emitEstaleOrder` reçu en param `deps`). Créer la ligne os avant l'appel Estale, mettre à jour selon résultat. Passer le ticket en `os_envoye` seulement sur succès.
- [ ] **Step 4 : GREEN** + suite complète verte ; purity `grep -rn "from 'next" src/lib/venator/services/` vide.
- [ ] **Step 5 : commit** `feat(venator): service OS (orchestration + statut ticket + journal, Estale injecté)`.

---

### Task 3 — Adaptateur Estale + routes API (⚠️ pas d'envoi réel en test)

**Files:** Create `src/lib/venator/estale-os.ts` (adaptateur, HORS services/); routes `src/app/api/venator/os/route.ts`, `src/app/api/venator/estale/suppliers/route.ts`, `src/app/api/venator/estale/me/route.ts`.

**Interfaces:**
- `estale-os.ts` : porte le flux d'`estale-os-express/order-send.ts` en utilisant `estaleGraphQL` de `@/lib/estale-api`.
  - `emitEstaleOrder({ condoEstaleId, taskLabel, title, description, reference, urgent, digicode, managerID, recipientContactIDs, recipients, schedules }): Promise<{taskID; eventID}>` — reprend `sendOrder` (createKanbanTask puis updateKanbanTask{createEventOrder}) avec les quirks `$condoID:ID!/$label:String!` et `$input:KanbanEventOrderInput!`.
  - `loadCondoSuppliers(condoEstaleId)` → contacts fournisseurs `{ id, name, contacts[{id,name,email}] }` (query `condo(id:$id){ suppliers(archived:$a){ id name contacts(archived:$a){ id name email } } }`, `$id:ID!,$a:Boolean!`).
  - `loadMeCollaborator()` → `me.collaborator.id` (managerID) + `establishment.id`.
  Copier les strings GraphQL VERBATIM depuis `~/Dossier en local/Beamô/estale-os-express/src/estale/{order-send.ts,queries.ts}`.
- `POST /api/venator/os` : guard `gestionnaire`, valide `osEmettreSchema`, charge `managerID` (loadMeCollaborator) + le `venator_copros.estale_id` du ticket, construit `recipients` (to.suppliers = [prestataire_contact_id] OU recipientContactIDs=[contact], selon le schéma Estale — respecter `sendOrder`: `recipientContactIDs` + `recipients.to.suppliers`), `description` = HTML (envelopper le texte + code d'accès dans `<p>`), puis `emettreOS(db, { emitEstaleOrder }, input)`. Erreurs → `VenatorError`/httpStatus.
- `GET /api/venator/estale/suppliers?copro_estale_id=` → `{ suppliers }` (contacts fournisseurs pour le sélecteur). `GET /api/venator/estale/me` → `{ managerID }`.

- [ ] **Step 1** : écrire `estale-os.ts` en copiant les mutations/queries verbatim d'estale-os-express, câblées sur `estaleGraphQL`.
- [ ] **Step 2** : écrire les 3 routes (guard + Zod + délégation). `os/route.ts` POST assemble l'input et appelle `emettreOS` avec `deps.emitEstaleOrder = (args)=>emitEstaleOrder(args)`.
- [ ] **Step 3 : vérifs SANS ENVOI RÉEL** :
  - `tsc` venator clean ; `grep -rL "requireVenatorRole" src/app/api/venator --include=route.ts` vide.
  - `DEV_AUTH_BYPASS=1 npm run dev` ; **GET** `/api/venator/estale/me` → 200 avec un `managerID` (lecture seule) ; **GET** `/api/venator/estale/suppliers?copro_estale_id=<un estale_id réel d'une copro synchronisée>` → 200 avec une liste (lecture seule). **e2e envoi réel autorisé UNIQUEMENT vers le contact `tom.lemeille@beamô.fr`** : dans la liste des suppliers, repérer le contact dont `email === 'tom.lemeille@beamô.fr'` ; si présent, tu PEUX faire un `POST /api/venator/os` réel avec ce `prestataire_contact_id` pour prouver le flux complet (attendu : os `envoye`, ticket `os_envoye`, un email arrive chez Tom). Si ce contact n'est pas trouvé dans la copro testée, NE PAS envoyer — s'arrêter aux GET et le signaler. Kill dev.
  - Suite `npm run test:run` verte.
- [ ] **Step 4 : commit** `feat(venator): adaptateur Estale OS + routes (émettre OS, suppliers, me)`.

---

### Task 4 — UI : émettre un OS depuis un ticket

**Files:** Create `src/app/apps/venator/_components/EmettreOsDialog.tsx`; Modify `src/app/apps/venator/_components/DossierCard.tsx` (menu ⋮ ticket → « Émettre OS »), `src/app/apps/venator/_components/TicketExpressDialog.tsx` (rendre « OS en un clic » fonctionnel : après création du ticket, ouvrir le dialog OS), et le badge de statut ticket (`os_envoye`).

- [ ] **Step 1 : `EmettreOsDialog`** (client) — props `{ ticket, onEmis }`. Charge les fournisseurs via `GET /api/venator/estale/suppliers?copro_estale_id=` (l'`estale_id` de la copro du ticket ; le récupérer via `useCopros()` → `find`). Champs : **Prestataire** (Select = contacts fournisseurs Estale `{contact.id, "Fournisseur — contact"}`), **Objet** (input, défaut = titre du ticket), **Description** (textarea), **Urgent** (checkbox), **Code d'accès clés** (input optionnel). Bouton « Émettre l'OS » → `POST /api/venator/os` (prestataire_contact_id, prestataire_nom, objet, description, urgent, code_acces) → sur succès `onEmis()` (SWR `mutate`) + message « OS envoyé ✅ ». Style brutalist. Icônes lucide (pas d'emoji). Un `confirm()` avant l'envoi (« Émettre et envoyer cet OS au prestataire ? »).
- [ ] **Step 2 : déclencheurs** — dans `DossierCard.tsx`, pour un item **ticket**, ajouter au menu ⋮ « Émettre OS » (icône `Send`/`FileOutput` lucide) → ouvre `EmettreOsDialog`. Dans `TicketExpressDialog.tsx`, remplacer le placeholder désactivé « OS en un clic » : à la création du ticket, si l'utilisateur clique ce bouton, créer le ticket puis ouvrir `EmettreOsDialog` pré-rempli.
- [ ] **Step 3 : badge statut** — afficher un badge « OS envoyé » sur les cartes ticket dont `statut='os_envoye'` (couleur distincte).
- [ ] **Step 4 : vérifs** — `tsc` venator clean ; `DEV_AUTH_BYPASS=1 npm run dev` → `/apps/venator` rend 200, le dialog OS s'ouvre et charge les fournisseurs (GET, sûr) ; **ne pas envoyer d'OS réel**. Suite verte. Commit `feat(venator): UI émettre un OS depuis un ticket`.

---

## Self-Review
- Couverture : table+types (T1) · service pur testé Estale-mocké (T2) · adaptateur Estale + routes lecture-sûres (T3) · UI émission (T4).
- **Sécurité envoi externe** : tests mockent Estale ; e2e limité à des lectures (me/suppliers) ; aucun OS réel émis par les agents — Tom fait le 1er envoi réel.
- Réutilisation : mutations/queries verbatim d'estale-os-express ; `estaleGraphQL` beam-app pour l'exécution.
- Hors périmètre : modèles d'OS Estale, programmation d'envoi (deferMinutes/fenêtre d'annulation), Lot 3 (Clés), relance (Lot suivant).
