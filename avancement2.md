# Avancement 2 - Optimisation SEO Pages Villes

Date : 08/01/2026

## Objectif de la session

Optimiser le référencement des pages `/ville/[slug]` en évitant le duplicate content et en améliorant le maillage interne géographique.

---

## Travail réalisé

### 1. Contenu unique par ville (LOCAL_CONTEXTS)

**Fichier** : `nextjs-app/src/components/sections/CityDetailedContent.tsx`

Ajout de 26 contextes locaux uniques avec données réelles issues de l'API Comptoir de la Copropriété :

| Ville | Copropriétés | Contexte unique |
|-------|--------------|-----------------|
| Vernon | 237 | Parc hétérogène, immeubles anciens + neufs |
| Rouen | 2847 | Marché dense, immeubles haussmanniens |
| Évreux | 410 | Préfecture, patrimoine années 50-70 |
| Mont-Saint-Aignan | 82 | Résidences étudiantes, proximité université |
| Louviers | 176 | Patrimoine textile reconverti |
| Les Andelys | 87 | Patrimoine historique, Château Gaillard |
| Gaillon | 61 | Résidences récentes années 80-90 |
| + 19 autres villes... | | |

### 2. Maillage interne géographique (CITY_CLUSTERS)

**Fichier** : `nextjs-app/src/lib/cities.ts`

Création de clusters géographiques pour un linking intelligent :

```typescript
export const CITY_CLUSTERS: Record<string, string[]> = {
  // Hub Vernon
  'vernon': ['gaillon', 'gasny', 'giverny', 'pacy-sur-eure', 'la-chapelle-longueville', 'saint-marcel', 'les-andelys'],

  // Hub Évreux (couronne ébroïcienne)
  'evreux': ['gravigny', 'saint-sebastien-de-morsent', 'saint-andre-de-l-eure', 'le-vieil-evreux', 'angerville-la-campagne', 'pacy-sur-eure', 'louviers'],

  // Hub Rouen (métropole rouennaise)
  'rouen': ['mont-saint-aignan', 'darnetal', 'le-mesnil-esnard', 'saint-etienne-du-rouvray', 'notre-dame-de-bondeville', 'franqueville-saint-pierre', 'louviers'],
  // ...
}
```

### 3. Composant NearbyCities amélioré

**Fichier** : `nextjs-app/src/components/sections/NearbyCities.tsx`

- Affiche les villes voisines géographiques (via `getNearbyCities()`)
- Titre dynamique : "Syndic dans la métropole de Rouen" (76) vs "Villes voisines de X"
- Cards avec liens vers pages voisines

### 4. Restructuration des villes

**Villes supprimées (9)** - trop loin ou 0 copropriétés :
- Gisors (44 min, seulement 116 copros)
- Mantes-la-Jolie (hors zone)
- Gauville-la-Campagne, Parville, Aviron, Huest, Fauville, Arnières-sur-Iton, Guichainville (0 copros = risque doorway pages)

**Villes ajoutées (7)** - métropole de Rouen (~3000 copros) :
| Ville | Copropriétés | Code postal |
|-------|--------------|-------------|
| Mont-Saint-Aignan | 82 | 76130 |
| Darnétal | 50 | 76160 |
| Le Mesnil-Esnard | 42 | 76240 |
| Saint-Étienne-du-Rouvray | 38 | 76800 |
| Notre-Dame-de-Bondeville | 34 | 76960 |
| Franqueville-Saint-Pierre | 24 | 76520 |
| Saint-Léger-du-Bourg-Denis | 18 | 76160 |

### 5. Sitemap mis à jour

**Fichier** : `nextjs-app/src/app/sitemap.ts`

- Date `cities` : 2025-10-08 → 2026-01-08
- `mainCities` : ajout de `rouen` (priorité 0.85)
- Nouvelles villes automatiquement incluses via `getCitySlugs()`

---

## Commits

```
92025b3 feat(seo): optimize city pages with unique content and smart linking
c94e23e Merge branch 'dev'
6aff671 fix(sitemap): update cities lastModified date and add Rouen as main city
```

---

## Résultat SEO

| Critère | Avant | Après |
|---------|-------|-------|
| Contenu unique par ville | Non | Oui (26 LOCAL_CONTEXTS) |
| Maillage interne | Aléatoire | Géographique (CITY_CLUSTERS) |
| Risque doorway pages | Oui (villes 0 copros) | Non (supprimées) |
| Couverture Rouen | 1 ville | 8 villes (métropole) |
| Villes total | 43 | 34 (qualité > quantité) |

---

## Prochaines étapes SEO

- [ ] Avis Google - Fiche Google Business Profile Vernon
- [ ] Suivi positions Search Console sur requêtes "syndic + ville"
- [ ] Articles longs "Changer de syndic à [ville]" (Vernon, Les Andelys - cf. avancement.md)

---

## Fichiers modifiés (SEO)

| Fichier | Modifications |
|---------|--------------|
| `src/lib/cities.ts` | +CITY_CLUSTERS, +getNearbyCities(), restructuration villes |
| `src/components/sections/CityDetailedContent.tsx` | +26 LOCAL_CONTEXTS |
| `src/components/sections/NearbyCities.tsx` | Utilise clusters géographiques |
| `src/app/sitemap.ts` | Date + Rouen prioritaire |

---
---

# Session 9 février 2026 — Fix Estale + Contrats + Réglages

## Contexte

Le nom de l'immeuble ne se chargeait plus depuis la modification de `getCondos()` pour récupérer les infos collaborateur. Cause : les champs `firstname`, `lastname`, `phone` n'existent pas sur le type `Collaborator` du schema GraphQL Estale → erreur GraphQL → zéro condo retourné.

---

## Phase 1 : Fix régression (CRITIQUE) — FAIT

### 1.1 `executeQuery()` tolérant aux erreurs partielles
**Fichier** : `src/lib/estale-api.ts` (lignes 156-169)

GraphQL peut retourner `data` + `errors` en même temps. Avant : throw dès qu'il y a une erreur. Maintenant : warn dans la console, ne throw que si `json.data` est absent.

### 1.2 `getCondos()` séparé en 2 requêtes
**Fichier** : `src/lib/estale-api.ts` (lignes 227-280)

- **Requête 1** (doit réussir) : condos avec `id`, `name`, `address`
- **Requête 2** (try/catch) : `getCollaboratorInfo()` — si ça plante, les condos sont quand même retournés

### 1.3 `getCondoDetails()` réécrit
**Fichier** : `src/lib/estale-api.ts` (lignes 554-624)

Utilise `serviceBook.mandate.manager` pour trouver le gestionnaire du condo. Fallback sur le collaborateur connecté.

---

## Phase 2 : Exploration schema Estale — FAIT

### Découvertes clés du schema GraphQL

```
Collaborator : fullname (PAS firstname/lastname), email, NO phone → phone sur user.phone
Condo : contracts, serviceBook { mandate { manager } }, suppliers, collaborators
SupplierContract : label, category, supplier (→ SupplierCondo → contact { phone })
CondoServiceBookMandate : manager, assistant, accountant (refs Collaborator)
User : firstname, lastname, fullname, email, phone
```

### Endpoint d'introspection
**Nouveau fichier** : `src/app/api/estale/introspect/route.ts`
- GET `/api/estale/introspect` → dump complet du schema (446 types)
- Usage diagnostic uniquement

---

## Phase 3 : Correction champs Collaborator + Contrats Estale — FAIT

### 3.1 Champs collaborateur corrigés
**Fichier** : `src/lib/estale-api.ts`

- `getCollaboratorInfo()` : utilise `fullname` + `user { phone }` au lieu de `firstname`/`lastname`/`phone`
- `getCondoDetails()` : utilise `serviceBook.mandate.manager.fullname` + `.user.phone`
- Suppression de `getCollaboratorDetails()` (code mort après refactor)

### 3.2 Contrats depuis Estale
**Fichier** : `src/lib/estale-api.ts` (lignes 629-685)

- Nouvelle interface `EstaleContract` : `{ id, label, category, supplierName, supplierPhone }`
- Nouvelle fonction `getCondoContracts(condoId)` : query `condo.contracts` avec `supplier.contact.phone`

**Nouveau fichier** : `src/app/api/estale/condos/contracts/route.ts`
- GET `/api/estale/condos/contracts?condoId=X` → `{ contracts: EstaleContract[] }`

### 3.3 Generate page mise à jour
**Fichier** : `src/app/apps/documents/generate/page.tsx`

- `fetchSuppliers()` : essaie contrats Estale d'abord, fallback `autoMatchContracts` (tag-matching)
- `handleTemplateChange()` : même logique Estale-first au switch vers contacts
- `handleCondoChange()` : appelle `/condos/details` pour le gestionnaire per-condo (au lieu du gestionnaire par défaut)

---

## Phase 4 : Supplier IDs par commune (Réglages) — FAIT

### 4.1 Schema étendu
**Fichier** : `src/schemas/document.ts`

`CommuneContacts` a 3 nouveaux champs optionnels :
- `mairieSupplierEstaleId`
- `dechetterieSupplierEstaleId`
- `eauSupplierEstaleId`

### 4.2 Réglages mis à jour
**Fichier** : `src/app/apps/reglages/page.tsx`

- Boutons "Mairie" / "Déch." / "Eau" du picker stockent aussi `s.id`
- `handleCommuneFieldChange()` efface l'ID Estale quand on édite manuellement un champ lié
- Nouveau `useEffect` d'auto-sync : quand les fournisseurs Estale sont chargés, met à jour nom/tel si le fournisseur lié a changé dans Estale

---

## État du build

- **TypeScript** : 0 nouvelles erreurs
- 1 erreur pré-existante dans `calculations.test.ts` (pas liée)
- Tous les changements sont rétro-compatibles

---

## Fichiers modifiés (Estale)

| Fichier | Type | Modifications |
|---------|------|---------------|
| `src/lib/estale-api.ts` | Modifié | executeQuery tolérant, split getCondos, rewrite getCondoDetails (serviceBook.mandate.manager), fix champs Collaborator (fullname/user.phone), ajout getCondoContracts, ajout introspectAllTypeNames |
| `src/schemas/document.ts` | Modifié | +mairieSupplierEstaleId, +dechetterieSupplierEstaleId, +eauSupplierEstaleId sur CommuneContacts |
| `src/app/apps/reglages/page.tsx` | Modifié | Store IDs fournisseurs, auto-sync au chargement, clear ID sur édition manuelle |
| `src/app/apps/documents/generate/page.tsx` | Modifié | Contrats Estale-first, gestionnaire per-condo via /condos/details |
| `src/app/api/estale/introspect/route.ts` | **NOUVEAU** | Endpoint diagnostic schema GraphQL |
| `src/app/api/estale/condos/contracts/route.ts` | **NOUVEAU** | Endpoint contrats par condo |

---

## À tester

- [ ] Sélectionner un immeuble → nom, adresse, CP, ville se remplissent
- [ ] Template Contacts Utiles → gestionnaire affiché (nom + tel + email)
- [ ] Template Contacts Utiles → contrats Estale affichés
- [ ] Réglages → configurer commune avec fournisseur Estale → recharger → valeurs synchronisées
- [ ] Réglages → éditer manuellement un champ lié → l'ID Estale est effacé
- [ ] Affiche Travaux et Règlement Intérieur fonctionnent toujours
- [ ] GET `/api/estale/introspect` → JSON avec les types

## À faire ensuite

- [ ] Commit des changements
- [ ] Tester en conditions réelles avec l'API Estale
- [ ] Explorer les champs `serviceBook` pour enrichir d'autres templates (DPE, assurances, etc.)
