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

## Prochaines étapes

- [ ] Avis Google - Fiche Google Business Profile Vernon
- [ ] Suivi positions Search Console sur requêtes "syndic + ville"
- [ ] Articles longs "Changer de syndic à [ville]" (Vernon, Les Andelys - cf. avancement.md)

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `src/lib/cities.ts` | +CITY_CLUSTERS, +getNearbyCities(), restructuration villes |
| `src/components/sections/CityDetailedContent.tsx` | +26 LOCAL_CONTEXTS |
| `src/components/sections/NearbyCities.tsx` | Utilise clusters géographiques |
| `src/app/sitemap.ts` | Date + Rouen prioritaire |
