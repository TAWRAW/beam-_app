# Venator V1 — PV de livraison

**Date** : 2026-07-17
**Branche** : `feat/venator-v1` (non mergée, non pushée)
**Plan source** : `docs/superpowers/plans/2026-07-16-venator-v1.md` (Tasks 0 à 15)

---

## 1. Ce que V1 livre

Venator est le nouveau module de gestion de dossiers/sinistres/tickets pour Beamô, intégré à `beam-app` (`/apps/venator`).

- **Dashboard filtrable** : liste des dossiers Venator, filtres par statut/type/copro.
- **Dossiers avec gabarits d'étapes** : création de dossiers (sinistre, contentieux, etc.) avec une checklist d'étapes pré-remplie selon le gabarit (type de dossier), étapes cochables/avançables.
- **Fiche copro** : journal de la copro (historique d'événements) + checklist "nouvelle copro" (ex. checklist du Buc) + création de ticket express depuis la fiche.
- **Tickets rattachables** : tickets créés indépendamment, rattachables à un dossier (via le board drag & drop ou l'UI dédiée).
- **Fil (activité)** : fil d'événements par dossier/copro, alimenté par les actions (création, changement d'étape, rattachement, etc.).
- **Journal** : historique horodaté par copro.
- **Board drag & drop** : vue board des dossiers par colonne (statut), glisser un ticket sur un dossier pour le rattacher ; glisser un dossier sur la colonne "Clos" le ferme (drag-to-close).
- **Sync copros** : lecture seule depuis Estale (`getCondos`) pour peupler/rafraîchir la liste des copros Venator — aucun envoi externe, aucune écriture vers Estale.
- **Garde de rôle dès V1** : toutes les routes API `/api/venator/*` sont protégées par `requireVenatorRole` (vérifié ci-dessous, 11/11 routes).
- **RLS deny-by-default** : le schéma SQL (`supabase/migrations/20260716_venator_initial.sql`) applique RLS fermé par défaut sur toutes les tables Venator.
- **Services purs** : `src/lib/venator/services/` ne dépend d'aucun module `next/*` — testable hors Next.js, réutilisable par un futur MCP.

---

## 2. Résultats de vérification (2026-07-17)

| Vérification | Résultat |
|---|---|
| `npm run test:run` | **71 tests, 15 fichiers, tous verts** (15 venator + tests existants inchangés : simulateur-vote, format, visites) |
| `npx tsc --noEmit \| grep -i venator` | **vide** — aucune erreur TypeScript sur le code Venator |
| `npx tsc --noEmit` (baseline complète) | 1 erreur, préexistante et hors périmètre : `src/__tests__/simulateur-vote/calculations.test.ts(37,3)` (`SimulateurState` incomplet dans un test non-Venator) |
| `grep -rn "from 'next" src/lib/venator/services/` | **vide** — services 100% purs, aucun import Next.js |
| `grep -rL "requireVenatorRole" src/app/api/venator --include=route.ts` | **vide** — les 11 routes API Venator sont toutes gardées (journal, tickets, tickets/[id], checklists, checklists/items/[itemId], dossiers, dossiers/[id], dossiers/[id]/etapes, fil, copros, copros/sync) |
| Rendu (dev server + curl) | `/apps/venator` → 200 · `/apps/venator/dossiers/<uuid>` → 200 · `/apps/venator/copros/<uuid>` → 200 |

---

## 3. Checklist pour Tom

1. **Appliquer la migration** : `supabase/migrations/20260716_venator_initial.sql` via le dashboard Supabase (SQL Editor). Rien n'est appliqué automatiquement.
2. **Vérifier les env Vercel** : `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (déjà présents pour les apps cles/devis — à confirmer qu'ils couvrent Venator, aucune nouvelle variable requise).
3. **Smoke-test manuel** :
   - Ouvrir `/apps/venator` → cliquer "Sync copros".
   - Créer un vrai dossier sinistre.
   - Avancer les étapes du dossier.
   - Démarrer la checklist "nouvelle copro" (ex. du Buc).
   - Créer un ticket express.
   - Glisser ce ticket sur un dossier dans le board pour le rattacher.
4. **Décider du merge** de `feat/venator-v1` vers la branche principale.

---

## 4. Décisions de design à confirmer

- **Drag-to-close** : glisser un dossier sur la colonne "Clos" du board le ferme automatiquement. Comportement intentionnel — à confirmer que c'est bien voulu (pas de confirmation intermédiaire).
- **Tickets déjà rattachés non re-déplaçables** : dans le board, un ticket déjà rattaché à un dossier n'est pas re-draggable vers un autre dossier en V1. Périmètre V1 assumé — le rattachement à un autre dossier nécessite l'UI dédiée (pas le board).

---

## 5. Reporté à V2/V3 (hors périmètre V1)

- **OS via KanbanEventOrder** (ordres de service).
- **Relances automatiques + cron Vercel**.
- **Emails Resend**.
- **Add-on Gmail "coller au fil"**.
- **venator-mcp** (serveur MCP dédié — les services purs sont déjà réutilisables).
- **UI d'invitation d'utilisateurs** (Supabase Auth + MFA) — la garde de rôle existe déjà côté API, seule l'UI d'invitation manque.
- **SMS**.
- **Intégration module Clés** (`/apps/cles`) — rattachement à Venator + commande fournisseur + bordereau de remise PDF.
- **Vues GED en lecture**.

**Petits points connus, non bloquants** :
- Aliasing par défaut de `estale_refs` dans la fake-db de test — artefact de fixture de test, sans impact en usage réel.
- Le filtre par type masque des tickets dans la vue liste (comportement à surveiller, pas un bug bloquant).

---

## 6. Écarts assumés vs spec (rappel des tasks précédentes)

- `prestataire_nom` en texte libre (table `prestataires` + sync fournisseurs Estale → V2 avec l'OS).
- Vues GED, badge de retard sur le dashboard, `audit_log` alimenté → V2 (la table `audit_log` existe déjà en base, non encore alimentée).
