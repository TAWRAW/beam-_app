# Demande de devis — extension du flux OS (Venator + estale-os-express)

Date : 2026-08-06
Statut : validé par Tom (06/08/2026)

## Contexte

Le flux d'émission d'OS (`KanbanEventOrder`) existe dans deux endroits :
- **beam-app / Venator** : `EmettreOsDialog.tsx` → `POST /api/venator/os` → `os-service.ts` → `estale-os.ts` (`emitEstaleOrder`) → `estale-api.ts` (GraphQL Estale).
- **Extension Chrome `estale-os-express`** : `popup.ts` → `order-send.ts` (`sendOrder`) → `client.ts` (GraphQL Estale).

Aucun des deux ne permet d'émettre une **demande de devis** (`KanbanEventQuotation`), alors qu'Estale
expose nativement cette mutation avec exactement la même forme que l'OS.

**Vérifié en direct (introspection GraphQL, 06/08/2026)** : `updateKanbanTask(taskID).createEventQuotation(input: KanbanEventQuotationInput!)`
existe, avec les mêmes champs que `KanbanEventOrderInput` : `title, description, urgent, digicode,
reference, sendAs, managerID, ownerIDs, files, recipientIDs, recipients, schedules`.

## Objectif

Ajouter un choix de type — **Ordre de service** / **Demande de devis** — au formulaire de création
existant, dans les deux endroits (beam-app et extension Chrome), en réutilisant au maximum le code
existant. Une demande de devis doit pouvoir partir à **plusieurs prestataires en même temps**, sans
qu'aucun ne voie les autres destinataires (confidentialité de la mise en concurrence).

## Confidentialité multi-prestataires

Le code actuel (mono-prestataire) place déjà le contact fournisseur à la fois dans `recipientIDs`
(génère son PDF/mail personnalisé) et dans `recipients.bcc.suppliers` — jamais dans `to`/`cc`.
Pour plusieurs prestataires, ce même mécanisme est généralisé : **tous les contactIDs vont dans
`recipientIDs` ET tous en `recipients.bcc.suppliers`**, jamais en `to`/`cc`. Le BCC garantit
structurellement qu'aucun ne voit les autres, indépendamment du mécanisme d'envoi interne d'Estale
(un mail par destinataire ou un mail groupé).

**Point de vérification recommandé** : au premier envoi réel multi-prestataires, relire le mail reçu
par l'un des prestataires (via son adresse ou en se mettant soi-même en BCC) pour confirmer qu'aucune
autre adresse fournisseur n'apparaît dans les en-têtes visibles, avant de généraliser l'usage.

## Modèle de données (Supabase)

Migration `supabase/migrations/20260806_venator_devis.sql` :

```sql
create type venator_os_type as enum ('os', 'devis');
alter table venator_os add column type venator_os_type not null default 'os';
alter table venator_os add column devis_contact_ids text[];
alter table venator_os add column devis_prestataire_noms text[];

alter type venator_ticket_statut add value 'devis_demande';
```

- Les colonnes existantes `prestataire_contact_id` / `prestataire_nom` restent le chemin utilisé pour
  `type = 'os'` (mono-prestataire) — **inchangées, zéro régression sur le flux OS**.
- `devis_contact_ids` / `devis_prestataire_noms` sont nullable et utilisées uniquement quand
  `type = 'devis'` (un ou plusieurs prestataires).
- Journal (`venator_fil_messages`) : `type_evenement` prend les nouvelles valeurs `devis_demande` /
  `devis_erreur` (texte libre, pas d'enum côté cette table — à vérifier au moment d'écrire le code que
  la colonne est bien `text` et non contrainte par un `check`).

## beam-app / Venator

### `src/lib/venator/types.ts`

`osEmettreSchema` devient une union discriminée sur `type` :

```ts
const base = { ticket_id: z.string().uuid(), objet: z.string().min(1).max(200), description: z.string().min(1).max(20000), urgent: z.boolean().default(false), code_acces: z.string().max(100).nullish() }
export const osEmettreSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('os'), ...base, prestataire_contact_id: z.string().min(1), prestataire_nom: z.string().min(1) }),
  z.object({ type: z.literal('devis'), ...base, prestataires: z.array(z.object({ contact_id: z.string().min(1), nom: z.string().min(1) })).min(1) }),
])
```

### `src/lib/venator/estale-os.ts`

- `emitEstaleOrder` : inchangé.
- Nouvelle fonction `emitEstaleQuotation(args: EmitEstaleOrderArgs & { recipientContactIDs: string[] })` :
  même structure que `emitEstaleOrder`, appelle `createEventQuotation` au lieu de `createEventOrder`,
  `recipients.bcc.suppliers` = tous les `recipientContactIDs`.

### `src/lib/venator/services/os-service.ts`

- `emettreOS` généralisé pour accepter `type` + soit `{ prestataire_contact_id, prestataire_nom }`
  soit `{ prestataires: {contact_id, nom}[] }`.
- Écrit dans les colonnes appropriées de `venator_os` selon `type`.
- Statut ticket : `os_envoye` (type os) ou `devis_demande` (type devis).
- Journal : `os_emis`/`os_erreur` (inchangé) ou `devis_demande`/`devis_erreur` (nouveau), contenu
  listant les prestataires sollicités pour un devis.

### `src/app/api/venator/os/route.ts`

- `deps` expose deux méthodes distinctes, `emitOrder` et `emitQuotation` (au lieu de l'actuelle
  `emitEstaleOrder` seule), chacune construisant son propre texte de corps de mail ("demande
  d'intervention" pour l'OS, "demande de devis" pour le devis) avant d'appeler `emitEstaleOrder` /
  `emitEstaleQuotation` de `estale-os.ts`.

### `src/app/apps/venator/_components/EmettreOsDialog.tsx`

- Toggle "Ordre de service" / "Demande de devis" en haut du dialog (deux boutons/tabs). Titre du
  dialog et libellé du bouton principal changent selon le type sélectionné.
- Type `os` : formulaire actuel inchangé (select prestataire unique).
- Type `devis` : le select existant sert à **ajouter** un prestataire à une liste (bouton "+"),
  affichée sous forme de chips avec croix de suppression. Au moins un prestataire requis pour activer
  le bouton d'envoi.

## Extension Chrome `estale-os-express`

### `src/estale/order-send.ts`

- `sendOrder` généralisé avec un paramètre `kind: 'order' | 'quotation'` qui choisit la mutation
  (`createEventOrder` vs `createEventQuotation`) — une seule fonction, pas de duplication (les deux
  inputs ont la même forme, vérifié par introspection).

### `src/popup/popup.ts` + `src/popup/view.ts`

- Même toggle de type en haut du formulaire (`FormState.kind: 'order' | 'quotation'`).
- En mode devis, le bloc "Fournisseur / Contact" devient une liste de contacts ajoutés (même pattern
  de chips que côté beam-app pour la cohérence UX entre les deux outils).
- `doSend` construit `recipientContactIDs` et `recipients.bcc.suppliers` avec tous les contacts
  sélectionnés ; `to`/`cc` restent vides pour les fournisseurs, comme aujourd'hui.
- Le garde anti-double-envoi (`sending`) et l'écran de confirmation avant envoi restent identiques —
  aucune régression sur le flux OS existant.

## Erreurs

Identique au flux OS actuel : échec Estale → `venator_os.statut = 'erreur'` + entrée journal
`devis_erreur`, message d'erreur renvoyé tel quel au frontend (pas de message générique qui masquerait
la cause).

## Tests

- `src/lib/venator/__tests__/os.test.ts` : étendre avec des cas `type: 'devis'` multi-prestataires
  (vérifier les colonnes écrites, le statut ticket, le contenu du journal).
- Nouveau test pour `emitEstaleQuotation` (ou le paramètre `type` de la fonction généralisée) :
  vérifier que `recipients.to.suppliers` et `recipients.cc.suppliers` restent vides et que
  `recipients.bcc.suppliers` contient bien tous les contactIDs passés.
- Côté extension (`tests/`) : test équivalent pour `sendOrder(kind:'quotation')` avec plusieurs
  contacts.

## Hors scope (V1)

- Pas de changement sur `estale-mcp` (`os__emettre` reste OS uniquement) — pourra être étendu plus
  tard si besoin d'émettre un devis depuis Claude/MCP.
- Pas de suivi des réponses de devis (comparaison des montants, etc.) — c'est le sujet §17 V2 du
  projet Venator (devis d'AG), distinct de cette demande de devis fournisseur ponctuelle.
