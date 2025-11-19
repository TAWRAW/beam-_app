# Avancement - Stratégie SEO Multi-Ville Beamô

Date de dernière mise à jour : 07/11/2025

## 📊 État actuel du projet

### Phase 1 : Test avec 3 villes (Évreux, Vernon, Les Andelys)

#### ✅ Évreux - TERMINÉ (non publié)
**Fichier** : `/nextjs-app/src/app/ressources/changer-syndic-copropriete-evreux/page.tsx`

**Statut** : Article complet et optimisé, prêt à être testé

**Contenu créé** :
- Article 2000+ mots avec ton conversationnel Tom Lemeille
- Données API Comptoir de la Copropriété (410 copros, 23 syndics, 56 lots/moyenne)
- Section "Pourquoi j'ai créé Beamô" (présentation Tom + convictions)
- Procédure complète en 5 étapes détaillées
- Exemple concret : copropriété 62 lots La Madeleine

**Optimisations SEO appliquées** :
- ✅ Meta title optimisé : "Changer de Syndic à Évreux (2025) : Guide Complet + Tarifs"
- ✅ HowTo Schema avec 5 étapes + ancres (#etape-1 à #etape-5)
- ✅ FAQPage Schema (3 questions spécifiques Évreux)
- ✅ Article Schema avec données structurées
- ✅ CTA ajouté dans `/ville/evreux` (CityDetailedContent.tsx ligne 334-356)
- ✅ Linking interne : page courte → article long → conversion

**Corrections finales appliquées** :
- ✅ Suppression section critique concurrence (remplacée par section positive Tom Lemeille)
- ✅ Suppression comparaisons "4x moyenne nationale" et "+4.5% T3 2025"
- ✅ Suppression témoignage fictif Navarre
- ✅ Remplacement "AG" → "Assemblée Générale" (26 occurrences)
- ✅ Remplacement "copro" → "copropriété" (toutes occurrences)
- ✅ Remplacement "grosse" → "grande" copropriété

**Validation SEO agent** :
- Architecture WHITE-HAT confirmée (70% manuel + 30% API)
- Pas de cannibalisation avec `/ville/evreux` (intents différents)
- Eligible rich snippets Google (HowTo box jaune)
- Prêt pour indexation

#### ⏳ Vernon - À FAIRE
**Données nécessaires** : API Comptoir de la Copropriété T3 2025

#### ⏳ Les Andelys - À FAIRE
**Données nécessaires** : API Comptoir de la Copropriété T3 2025

---

## 🎯 Stratégie validée

### Architecture SEO
```
/ville/[ville] (Page service 400 mots - transactionnel)
    ↓ CTA "Lire le guide complet"
/ressources/changer-syndic-copropriete-[ville] (Article 2000+ mots - informationnel)
    ↓ CTA "Demander un devis"
/ressources/contact (Conversion)
```

### Règles de contenu
- **70% contenu manuel** minimum (analyse, conseils, ton Tom)
- **30% données API** maximum (stats Comptoir de la Copropriété)
- **Template A** pour grandes villes : Stats en haut, analyse marché détaillée
- **Aucune critique directe** de la concurrence (focus positif sur Beamô)
- **Ton conversationnel** Tom Lemeille (pas corporate)
- **Exemples concrets** avec chiffres réels
- **Pas d'abréviations** : Assemblée Générale (pas AG), copropriété (pas copro)
- **Vocabulaire élégant** : grande copropriété (pas grosse)

### Keywords ciblés
- Principal : "changer syndic [ville]"
- Secondaires : "syndic copropriété [ville]", "changement syndic [ville]", "nouveau syndic [ville]"
- Long tail : "comment changer syndic [ville]", "procédure changement syndic", "changer syndic [ville] prix"

---

## 📋 Prochaines étapes

### 1. Tester article Évreux
- [ ] Vérifier le rendu sur `/ressources/changer-syndic-copropriete-evreux`
- [ ] Vérifier le CTA sur `/ville/evreux`
- [ ] Valider le ton et le contenu
- [ ] Push sur dev/production si validé

### 2. Récupérer données API Vernon
- [ ] Appeler API Comptoir de la Copropriété pour Vernon
- [ ] Analyser les données (nombre copros, syndics, taille moyenne)
- [ ] Identifier spécificités marché Vernon

### 3. Créer article Vernon
- [ ] Créer `/ressources/changer-syndic-copropriete-vernon/page.tsx`
- [ ] Adapter le contenu avec données Vernon
- [ ] Utiliser Template A (grande ville)
- [ ] Ajouter CTA dans CityDetailedContent.tsx

### 4. Les Andelys
- [ ] Idem processus Vernon
- [ ] Possibilité Template C (petite ville) selon données API

### 5. Mettre à jour CityDetailedContent.tsx
Actuellement ligne 334 :
```typescript
{citySlug === 'evreux' && (
```

Remplacer par :
```typescript
{['evreux', 'vernon', 'les-andelys'].includes(citySlug) && (
```

---

## 🔧 Fichiers modifiés

### Nouveaux fichiers créés
- `/nextjs-app/src/app/ressources/changer-syndic-copropriete-evreux/page.tsx` (1038 lignes)

### Fichiers modifiés
- `/nextjs-app/src/components/sections/CityDetailedContent.tsx`
  - Ajout import Link (ligne 3)
  - Modification Card "Changement de syndic" (ligne 295-362)
  - Ajout CTA conditionnel vers article Évreux (ligne 334-356)

---

## 📊 Métriques à suivre (après mise en ligne)

### Google Search Console
- Impressions "changer syndic évreux"
- CTR sur résultat article
- Position moyenne
- Apparition rich snippet HowTo

### Analytics
- Trafic `/ressources/changer-syndic-copropriete-evreux`
- Taux de rebond
- Temps moyen sur page (objectif : 3+ minutes)
- Conversions vers `/ressources/contact`

### Objectifs Phase 1 (3 mois)
- Ranking top 3 sur "changer syndic évreux"
- 50+ visites/mois organiques sur article Évreux
- 5+ demandes de devis via article

---

## 💡 Rappels importants

### Ce qui a bien fonctionné
- Données API Comptoir = contenu unique introuvable ailleurs
- Ton conversationnel Tom = différenciation vs concurrence corporate
- Section "Pourquoi j'ai créé Beamô" = E-E-A-T fort (Experience, Expertise, Authority, Trust)
- HowTo Schema = éligibilité rich snippets Google

### Pièges évités
- ❌ Critique directe concurrence → ✅ Focus positif sur valeur Beamô
- ❌ Contenu 100% template → ✅ 70% manuel minimum
- ❌ Abréviations (AG, copro) → ✅ Termes complets
- ❌ Comparaisons agressives → ✅ Exemples concrets positifs

### Validation agent SEO
L'agent seo-ethique-fr a validé l'approche comme **WHITE-HAT** conforme Google 2025.

---

## 📞 Contact & Support

En cas de besoin, relancer l'agent SEO :
```
Task(seo-ethique-fr): "Question sur stratégie multi-ville Beamô..."
```

**Note** : Rien n'a été push sur dev/production. Tout est en local et prêt à être testé.
