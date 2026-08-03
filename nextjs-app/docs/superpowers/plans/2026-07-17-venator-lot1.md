# Venator Lot 1 (finition socle) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Compléter le socle Venator V1 : (1) type de dossier « Autre », (2) suppression dossier/ticket/étape, (3) réactivité UI (SWR + optimistic + skeletons).

**Architecture:** Extension du module `src/app/apps/venator` + `src/lib/venator/*` déjà en place. Services purs (sans `next/*`), routes guard-first + Zod, UI shadcn brutalist. Branche `feat/venator-v1` (le socle vit dessus).

**Tech Stack:** Next.js 14.2.5 · Supabase · Zod · Vitest · **SWR** (nouvelle dép, Vercel) · shadcn/ui.

## Global Constraints
- Branche : rester sur `feat/venator-v1`. Commits atomiques par tâche.
- Services purs : aucun `next/*` sous `src/lib/venator/services/`.
- Tests : `npm run test:run` vert ; `npx tsc --noEmit 2>&1 | grep -i venator` vide.
- Client Supabase : garder `cache:'no-store'` (déjà en place dans `_supabase-admin.ts`).
- Auth : chaque route `/api/venator/*` garde `requireVenatorRole(...)`. **Suppression = rôle `gestionnaire`+** (pas `invite`).
- Brutalist : carte `border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white`, accent `#FFC300`, fond `#F2F1E6`, danger `border-red-600`/`bg-red-600`.
- Le fake-db de test (`_fake-db.ts`) doit rester fidèle à Supabase ; toute évolution documentée.

---

### Task 1 — Type de dossier « Autre »

**Files:**
- Create: `supabase/migrations/20260717_venator_type_autre.sql`
- Modify: `src/lib/venator/types.ts` (DOSSIER_TYPES), `src/lib/venator/gabarits.ts` (GABARITS), `src/lib/venator/__tests__/gabarits.test.ts`

- [ ] **Step 1 : migration enum**
```sql
-- supabase/migrations/20260717_venator_type_autre.sql
-- Ajoute la valeur 'autre' à l'enum des types de dossier. (ADD VALUE = hors transaction, OK via SQL editor.)
alter type venator_dossier_type add value if not exists 'autre';
```
- [ ] **Step 2 : types.ts** — ajouter `'autre'` en fin de `DOSSIER_TYPES` :
```typescript
export const DOSSIER_TYPES = ['sinistre','travaux','procedure','mutation','ag','conseil_syndical','vie_copro','autre'] as const
```
- [ ] **Step 3 : gabarit** — ajouter dans `GABARITS` (gabarits.ts) l'entrée `autre` (gabarit minimal) :
```typescript
  autre: [
    { titre: 'Ouverture' },
    { titre: 'Suivi' },
    { titre: 'Clôture' },
  ],
```
- [ ] **Step 4 : test** — dans `gabarits.test.ts`, le test « couvre les 7 types » devient 8 automatiquement via `DOSSIER_TYPES` (il itère dessus). Vérifier qu'aucune assertion n'est hard-codée à 7. Ajouter une assertion : `expect(GABARITS.autre.length).toBe(3)`. Run `npm run test:run -- gabarits` → vert.
- [ ] **Step 5 : vérifs + commit** — `npx tsc --noEmit 2>&1 | grep -i venator` vide ; `npm run test:run` vert.
```bash
git add supabase/migrations/20260717_venator_type_autre.sql src/lib/venator/types.ts src/lib/venator/gabarits.ts src/lib/venator/__tests__/gabarits.test.ts
git commit -m "feat(venator): type de dossier 'autre' (gabarit minimal)"
```
> ⚠️ Pour Tom : appliquer `20260717_venator_type_autre.sql` au dashboard Supabase.

---

### Task 2 — Services de suppression (TDD)

**Files:**
- Modify: `src/lib/venator/services/dossiers-service.ts`, `tickets-service.ts`, `fil-service.ts`, `journal-service.ts`
- Test: `src/lib/venator/__tests__/suppression.test.ts`

**Interfaces produced:**
- `supprimerDossier(db, id)` : journalise `dossier_supprime` (acteur), purge `fil_messages` (parent_type='dossier', parent_id=id) et les `fil_messages` des tickets rattachés, supprime le dossier (les étapes partent en cascade côté DB ; les tickets passent `dossier_id=null` côté DB). Throw `VenatorError('not_found')` si absent.
- `supprimerTicket(db, id)` : purge `fil_messages` (parent_type='ticket', parent_id=id), supprime le ticket. `not_found` si absent.
- `supprimerEtape(db, id)` : supprime l'étape. `not_found` si absent.
- `purgerFil(db, parent_type, parent_id)` (dans fil-service.ts) : `delete` des `fil_messages` correspondants.

- [ ] **Step 1 : test d'abord** — `src/lib/venator/__tests__/suppression.test.ts` :
```typescript
import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { creerDossier, supprimerDossier, detailDossier } from '../services/dossiers-service'
import { creerTicket, supprimerTicket, listerTickets } from '../services/tickets-service'
import { ajouterAuFil, listerFil } from '../services/fil-service'

async function seedCopro(c:any){ const {data}=await c.from('venator_copros').insert({estale_id:'e1',reference:'00013',nom:'BUC'}).select().single(); return data }

describe('suppression', () => {
  it('supprimer un dossier : purge le fil + journalise dossier_supprime, dossier introuvable ensuite', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const { dossier } = await creerDossier(client, { copro_id: copro.id, type:'sinistre', titre:'X', priorite:2 })
    await ajouterAuFil(client, { parent_type:'dossier', parent_id: dossier.id, direction:'note', source:'manuel', contenu:'note' })
    await supprimerDossier(client, dossier.id)
    expect(await listerFil(client, 'dossier', dossier.id)).toHaveLength(0)
    const { data: j } = await client.from('venator_journal').select('*').eq('type_evenement','dossier_supprime')
    expect(j.length).toBe(1)
    await expect(detailDossier(client, dossier.id)).rejects.toMatchObject({ code:'not_found' })
  })
  it('supprimer un ticket : purge son fil + ticket retiré de la liste', async () => {
    const { client } = createFakeDb()
    const copro = await seedCopro(client)
    const t = await creerTicket(client, { copro_id: copro.id, type:'intervention', titre:'Fuite' })
    await ajouterAuFil(client, { parent_type:'ticket', parent_id: t.id, direction:'note', source:'manuel', contenu:'x' })
    await supprimerTicket(client, t.id)
    expect(await listerFil(client, 'ticket', t.id)).toHaveLength(0)
    expect(await listerTickets(client, { copro_id: copro.id })).toHaveLength(0)
  })
})
```
- [ ] **Step 2 : RED** — `npm run test:run -- suppression` → échec (fonctions absentes).
- [ ] **Step 3 : fake-db `delete`** — vérifier que `_fake-db.ts` supporte `.delete().eq(col,val)`. S'il ne le supporte pas, l'ajouter fidèlement : `delete()` retourne un objet avec `.eq(col,val)` qui retire de `rows` les lignes matchées et résout `{ data:null, error:null }` (comme supabase-js). Documenter dans le rapport.
- [ ] **Step 4 : implémenter**
  - `fil-service.ts` :
```typescript
export async function purgerFil(db: SupabaseClient, parent_type: 'dossier'|'ticket', parent_id: string): Promise<void> {
  await db.from('venator_fil_messages').delete().eq('parent_type', parent_type).eq('parent_id', parent_id)
}
```
  - `dossiers-service.ts` :
```typescript
export async function supprimerDossier(db: SupabaseClient, id: string): Promise<void> {
  const { dossier } = await detailDossier(db, id) // throw not_found si absent
  await logJournal(db, { copro_id: dossier.copro_id, dossier_id: id, type_evenement: 'dossier_supprime', contenu: `Dossier supprimé : ${dossier.titre}` })
  // purge le fil du dossier + des tickets rattachés
  await purgerFil(db, 'dossier', id)
  const { data: tks } = await db.from('venator_tickets').select('id').eq('dossier_id', id)
  for (const t of tks ?? []) await purgerFil(db, 'ticket', t.id)
  await db.from('venator_dossiers').delete().eq('id', id) // étapes cascade, tickets set null (DB)
}
```
  (importer `purgerFil` depuis `./fil-service`.)
  - `tickets-service.ts` :
```typescript
export async function supprimerTicket(db: SupabaseClient, id: string): Promise<void> {
  const { data: ticket } = await db.from('venator_tickets').select('*').eq('id', id).maybeSingle()
  if (!ticket) throw new VenatorError('not_found', 'Ticket introuvable')
  await purgerFil(db, 'ticket', id)
  await db.from('venator_tickets').delete().eq('id', id)
}
```
  - `dossiers-service.ts` (étape) :
```typescript
export async function supprimerEtape(db: SupabaseClient, id: string): Promise<void> {
  const { data: e } = await db.from('venator_dossier_etapes').select('id').eq('id', id).maybeSingle()
  if (!e) throw new VenatorError('not_found', 'Étape introuvable')
  await db.from('venator_dossier_etapes').delete().eq('id', id)
}
```
- [ ] **Step 5 : GREEN + suite complète** — `npm run test:run -- suppression` vert, puis `npm run test:run` complet vert. Purity `grep -rn "from 'next" src/lib/venator/services/` vide.
- [ ] **Step 6 : commit**
```bash
git commit -am "feat(venator): services de suppression dossier/ticket/étape (+ purge fil, journal dossier_supprime)"
```

---

### Task 3 — Routes DELETE + UI Supprimer

**Files:**
- Modify: `src/app/api/venator/dossiers/[id]/route.ts`, `src/app/api/venator/tickets/[id]/route.ts`, `src/app/api/venator/dossiers/[id]/etapes/route.ts`
- Modify UI: `src/app/apps/venator/dossiers/[id]/page.tsx` (bouton Supprimer sur la fiche), `src/app/apps/venator/_components/DossierCard.tsx` (menu ⋮ → Supprimer), `EtapesTimeline.tsx` (Supprimer une étape via le menu ⋮ existant)

**Interfaces consumed:** `supprimerDossier/supprimerTicket/supprimerEtape` + `requireVenatorRole('gestionnaire')`.

- [ ] **Step 1 : routes DELETE** — ajouter une méthode `DELETE` à chaque route, garde `requireVenatorRole('gestionnaire')`, try/catch `VenatorError`→`httpStatus`. Ex. dossiers/[id] :
```typescript
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireVenatorRole('gestionnaire')
  if (!auth.ok) return auth.response
  try { await supprimerDossier(createVenatorAdminClient(), params.id); return NextResponse.json({ ok: true }) }
  catch (e) { if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] }); throw e }
}
```
  - tickets/[id] DELETE → `supprimerTicket`. etapes DELETE → body `{ etape_id }` (Zod) → `supprimerEtape`.
- [ ] **Step 2 : UI fiche dossier** — bouton « 🗑 Supprimer le dossier » (style danger `bg-red-600 text-white border-2 border-black rounded-full`), `confirm('Supprimer définitivement ce dossier ? Cette action est irréversible.')` → `DELETE /api/venator/dossiers/{id}` → `router.push('/apps/venator')`.
- [ ] **Step 3 : menu ⋮ carte + étape** — dans `DossierCard.tsx`, ajouter (si l'item est un dossier ou ticket) une entrée menu « 🗑 Supprimer » avec confirmation → DELETE + refetch. Dans `EtapesTimeline.tsx`, ajouter au menu ⋮ existant « Supprimer l'étape » → `DELETE etapes {etape_id}` → onChange.
- [ ] **Step 4 : vérifs** — `npx tsc --noEmit 2>&1 | grep -i venator` vide ; `grep -rL "requireVenatorRole" src/app/api/venator --include=route.ts` vide ; dev render `/apps/venator` + `/apps/venator/dossiers/<uuid>` = 200 (méthode : `npm run dev` avec `DEV_AUTH_BYPASS=1`, curl). Suite `npm run test:run` vert.
- [ ] **Step 5 : commit** — `git commit -am "feat(venator): suppression via UI (fiche + menu cartes + étapes) + routes DELETE (rôle gestionnaire+)"`

---

### Task 4 — Réactivité : SWR sur dashboard + copros

**Files:**
- Add dep: `swr`
- Create: `src/lib/venator/useVenator.ts` (hooks SWR + fetcher)
- Modify: `src/app/apps/venator/page.tsx`, `src/app/apps/venator/copros/page.tsx`

- [ ] **Step 1 : install** — `npm install swr`
- [ ] **Step 2 : fetcher + hooks** — `src/lib/venator/useVenator.ts` (client) :
```typescript
'use client'
import useSWR from 'swr'
export const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
export function useCopros() { return useSWR('/api/venator/copros', fetcher) }
export function useDossiers(q: string) { return useSWR(`/api/venator/dossiers?${q}`, fetcher) }
export function useTickets(q: string) { return useSWR(`/api/venator/tickets?${q}`, fetcher) }
```
- [ ] **Step 3 : refactor dashboard** — `page.tsx` : remplacer les `useEffect`+`fetch`+états par `useCopros()`/`useDossiers()`/`useTickets()`. Après une mutation (créer dossier, sync copros, créer ticket, drag), appeler `mutate()` (via `useSWRConfig().mutate` avec la clé, ou le `mutate` du hook) pour rafraîchir **instantanément** — plus de reload manuel. Ajouter **skeletons** brutalistes pendant `isLoading` (cartes grises `animate-pulse border-2 border-black rounded-2xl`) et un spinner sur les boutons d'action pendant l'envoi. Le drag & drop : après un PATCH réussi, `mutate` les clés dossiers+tickets.
- [ ] **Step 4 : refactor copros page** — idem avec `useCopros()` + skeleton + bouton Sync avec spinner + `mutate` après sync.
- [ ] **Step 5 : vérifs** — `tsc` venator clean ; dev render `/apps/venator` + `/apps/venator/copros` = 200 ; vérifier à l'œil (via dev server) qu'une création/sync se reflète **sans reload**. Suite tests vert. Commit `git commit -am "feat(venator): réactivité dashboard+copros (SWR, mutate, skeletons)"`

---

### Task 5 — Réactivité : SWR sur fiche dossier + fiche copro

**Files:**
- Modify: `src/app/apps/venator/dossiers/[id]/page.tsx`, `_components/EtapesTimeline.tsx`, `_components/FilPanel.tsx`, `src/app/apps/venator/copros/[id]/page.tsx`, `_components/ChecklistPanel.tsx`

- [ ] **Step 1 : hooks** — étendre `useVenator.ts` : `useDossier(id)`, `useFil(parentType,parentId)`, `useJournal(coproId)`, `useChecklist(coproId)`.
- [ ] **Step 2 : fiche dossier** — SWR pour le détail + fil + tickets. **Optimistic** : cocher une étape → l'UI bascule le statut immédiatement (`mutate(key, optimisticData, { revalidate:true })`), rollback si l'appel échoue. Ajouter étape / note fil / clore / supprimer → `mutate`. Skeletons pendant le chargement initial.
- [ ] **Step 3 : FilPanel + Checklist** — `FilPanel` : SWR sur `useFil` + optimistic add note. `ChecklistPanel` : SWR + optimistic cocher item (barré immédiat + %).
- [ ] **Step 4 : fiche copro** — journal + checklist + dossiers ouverts en SWR + skeletons + `mutate` après note rapide / cochage.
- [ ] **Step 5 : vérifs + commit** — `tsc` venator clean ; dev render des fiches = 200 ; suite tests vert. `git commit -am "feat(venator): réactivité fiches dossier/copro (SWR optimistic + skeletons)"`

---

## Self-Review (à l'écriture)
- Couverture : type Autre (T1) ✅ · suppression services+routes+UI+rôle gestionnaire (T2-T3) ✅ · réactivité SWR/optimistic/skeletons sur toutes les vues (T4-T5) ✅.
- Sécurité : suppression = rôle `gestionnaire`+ (T3), garde sur chaque route.
- Fidélité tests : ajout `delete` au fake-db (T2) documenté.
- Hors périmètre (backlog §15) : référentiel lots §15.4, simulateur §15.3, devis IA §15.1, rapport AG §15.2, restructuration coque — Lots 2/3 ultérieurs.
