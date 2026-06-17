# Fiabilisation des photos de visites — Estale gardien + Supabase seau de débordement

Date : 2026-06-16
Module : `apps/visites` (beam-app)
Se pose sur : branche `fix/visites-photos-resilience` (compression + résilience, non mergée)
Statut : design validé avec Tom — en attente d'écriture du plan d'implémentation

## 1. Problème

Les photos de visite se perdent, se figent ou se dupliquent côté Estale. Causes racines observées (cf. note Obsidian « Visites Immeubles ») :

1. **Copie unique sur l'iPhone** : avant succès Estale, la seule copie d'une photo est l'IndexedDB du téléphone (d'où la consigne « ne pas vider Safari »). Cache vidé / coupure = photo perdue.
2. **Upload direct mobile → Estale fragile** : multipart GraphQL depuis le téléphone, interrompu en arrière-plan / écran verrouillé / réseau de chantier ; **limite 4,5 Mo** des fonctions Vercel ; **race conditions → doublons**.
3. **Statut trompeur** : photos figées en `syncing` invisibles (badge vert).

Les fixes de la branche `fix/visites-photos-resilience` (try/catch upload → `error`, comptage des `syncing`, auto-heal, compression ≤ 2048 px, bouton ⬇ HD) atténuent mais ne **garantissent** ni la durabilité ni l'absence de doublon.

## 2. Objectif

**Ne plus jamais perdre ni dupliquer une photo**, sans geste manuel, avec retour d'état **quasi-instantané et sans polling client**.

## 3. Décisions validées

| Sujet | Décision |
|---|---|
| Moteur | **Automatique / opportuniste** (pas de bouton « envoyer » comme chemin normal) |
| Rôle Estale | **Gardien / source de vérité** (conserve la photo) |
| Rôle Supabase | **Seau de débordement uniquement** — transitoire, ne conserve jamais rien durablement |
| Chemin normal | iPhone → **Estale en direct** (compressé, sous 4,5 Mo) |
| Débordement | Si direct impossible (offline / trop lourd / interrompu / erreur répétée) → blob versé dans **Supabase Storage** + ligne outbox, puis **drain serveur → Estale** |
| Idempotence | **UUID photo** de bout en bout (clé de dédup) |
| État UI | **Supabase Realtime** (websocket) → 0 polling ; bouton « Forcer » = filet manuel |
| HD iPhone | **(i)** supprimé automatiquement dès qu'Estale confirme |
| Compression | Sur le chemin normal, Estale reçoit la version compressée (≤ 2048 px). Le HD full-res ne transite vers Estale que via le débordement (le serveur n'a pas la limite 4,5 Mo) |

## 4. Architecture

### Vue d'ensemble
```
Capture ──► IndexedDB (HD, immédiat)
   │
   ├─(en ligne, ≤ limite)──► route Vercel ──► Estale  ✅ done
   │                                            │ échec / trop lourd / offline
   ▼                                            ▼
  (débordement) ──► Supabase Storage (blob) + table outbox (status=pending)
                         │
                         ├─ déclenchement instantané (si en ligne) ─┐
                         └─ filet serveur silencieux (cas offline/app fermée) ─┤
                                                                     ▼
                                                        Drain serveur ──► Estale
                                                          (retry, idempotent)
                                                                     │ estale_file_id
                                                                     ▼
                                          status=done → supprime blob Supabase + HD iPhone (i)
```

### Composants
- **Client capture/sync** (`src/lib/visites/`) :
  - `db.ts` : IndexedDB inchangé pour le HD ; ajout d'un état photo `overflowed`/`done` et de l'`uuid` (déjà identifiant local) comme clé d'idempotence.
  - `sync-engine.ts` : `pushPhoto` tente Estale direct ; sur échec qualifié (offline / 413 trop lourd / interruption / N échecs) → **bascule débordement** (upload Supabase + insert outbox) au lieu de rester en `error`.
  - `image-compress.ts` : conservé pour le chemin normal.
- **Overflow Supabase** :
  - Bucket Storage privé `visites-overflow`.
  - Table `visite_photo_outbox` (voir §5).
  - Upload **direct client → Supabase Storage** (SDK supabase-js, pas via Vercel → contourne 4,5 Mo).
- **Drain serveur** (beam-app, réutilise `estale-api.ts` + routes `/api/estale/*`) :
  - Route `POST /api/visites/overflow/drain` : prend les `pending`, vérifie idempotence (`estale_file_id` déjà posé ?), lit le blob depuis Supabase, pousse vers Estale (HD), pose `estale_file_id`, `status=done`, supprime le blob.
  - **Déclencheur instantané** : le client appelle cette route juste après un débordement, si en ligne.
  - **Filet** : Cron Vercel (réutilise le pattern du cron email de retard) toutes les ~2 min → appelle le drain pour vider les `pending` restants (cas offline-app-fermée). Job serveur invisible — **pas de polling client**.
- **État UI** : abonnement **Supabase Realtime** sur `visite_photo_outbox` filtré par visite → le statut passe `pending → done` en direct. Écran de suivi + bouton « Forcer l'envoi » (appel manuel du drain).

## 5. Modèle de données — `visite_photo_outbox`

| Colonne | Type | Rôle |
|---|---|---|
| `photo_uuid` | uuid (PK) | clé d'idempotence (générée à la capture) |
| `visit_local_id` | uuid | rattachement visite (IndexedDB) |
| `estale_visit_id` | text null | id visite Estale si connu |
| `comment_local_id` | uuid | rattachement ligne |
| `estale_comment_id` | text null | id ligne Estale |
| `storage_path` | text | chemin du blob dans le bucket |
| `status` | text | `pending` / `uploading` / `done` / `error` |
| `estale_file_id` | text null | posé au succès → **garde-fou anti-doublon** |
| `attempts` | int | compteur retry |
| `last_error` | text null | dernier message d'erreur |
| `created_at` / `updated_at` | timestamptz | |

RLS : deny-by-default, accès via service-role (`requireAdmin`), cohérent avec le reste de beam-app (auth legacy). Realtime activé sur la table.

## 6. Idempotence (anti-doublon)

- `photo_uuid` unique, généré une seule fois à la capture, propagé partout.
- Avant **tout** envoi Estale (direct ou drain), garde atomique : si `estale_file_id` déjà présent → ne pas ré-uploader, marquer `done`.
- Le drain peut être rejoué N fois sans créer de second fichier Estale.
- Suppression du blob Supabase **seulement après** `estale_file_id` confirmé.

## 7. Gestion d'erreurs & cas limites

- **Offline à la capture** : reste en IndexedDB ; à la reconnexion, tentative Estale directe ; si elle échoue (lourd/flaky) → débordement Supabase.
- **Upload Supabase interrompu** : repris (idempotent par `storage_path`/`photo_uuid`).
- **Drain échoue** : `attempts++`, retenté par le filet cron ; au-delà d'un seuil → `error` + alerte (réutiliser le canal Resend existant).
- **App fermée avec des `pending`** : le cron serveur les draine sans le client.
- **Suppression HD iPhone** : uniquement sur `done` confirmé (Estale `file_id` posé).

## 8. Hors périmètre (YAGNI)

- Pas d'archivage HD durable dans Supabase (Estale = gardien ; Supabase purgé après succès).
- Pas de réécriture du chemin normal direct→Estale (on garde l'existant + résilience).
- Pas de migration des photos déjà en prod ; design pour le flux à venir.
- Pas de tri/validation manuelle avant Estale (chemin automatique).

## 9. Tests

- **Unitaires** (vitest + `fake-indexeddb`) : bascule en débordement sur échec qualifié ; idempotence (double drain → 1 seul `estale_file_id`) ; nettoyage blob + HD sur `done` ; comptage statuts.
- **Intégration** : route drain (mock Estale) — pending → done, retry, garde anti-doublon.
- **Terrain (iPhone réel, post-déploiement)** : capture offline → reconnexion → arrivée Estale ; photo lourde → débordement → HD full-res sur Estale ; Realtime coche « ✓ Estale » en direct ; aucun doublon dans le PDF de rapport.

## 10. Points ouverts (à trancher au plan)

- Seuil exact de bascule en débordement (nb d'échecs directs avant overflow ; taille déclenchant directement l'overflow).
- Fréquence du cron filet (1 / 2 / 5 min).
- Réutiliser la table outbox existante éventuelle vs nouvelle table.
