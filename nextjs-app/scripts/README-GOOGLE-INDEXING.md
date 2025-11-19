# Google Indexing - Guide Rapide

Soumettre automatiquement vos articles à Google pour accélérer l'indexation.

## 🚀 Démarrage rapide

### 1. Installation
```bash
./scripts/setup-google-indexing.sh
```

### 2. Configuration Google Cloud

Suivre le guide détaillé : [`GOOGLE_INDEXING_SETUP.md`](./GOOGLE_INDEXING_SETUP.md)

**Résumé :**
1. Créer un projet Google Cloud
2. Activer l'API Indexing
3. Créer un compte de service
4. Télécharger `google-credentials.json`
5. Placer le fichier dans `nextjs-app/`
6. Ajouter le compte de service dans Google Search Console

### 3. Utilisation

#### Soumettre tous les articles publiés
```bash
node scripts/submit-to-google.js
```

#### Soumettre une URL spécifique
```bash
node scripts/submit-to-google.js https://www.xn--beam-yqa.fr/ressources/mon-article
```

## 📊 Ce que fait le script

1. ✅ Se connecte à Supabase
2. ✅ Récupère tous les articles avec `status='published'`
3. ✅ Soumet chaque URL à Google Indexing API
4. ✅ Affiche un résumé des succès/échecs

## ⚡ Bénéfices

- **Indexation plus rapide** : De quelques semaines à quelques jours
- **Automatisable** : Peut être intégré dans n8n ou Supabase
- **Suivi** : Vérifiable dans Google Search Console

## 📈 Limites

- **200 URLs/jour** maximum (quota Google)
- **Pas d'indexation garantie** : Google décide in fine
- **Délai** : Quelques heures à quelques jours même avec soumission

## 🔒 Sécurité

⚠️ Le fichier `google-credentials.json` est déjà dans `.gitignore`

**Ne JAMAIS :**
- Commit ce fichier
- Le partager publiquement
- L'uploader sur GitHub/GitLab

## 🤖 Automatisation future

### Option A : Webhook n8n
Déclencher automatiquement lors de la publication d'un article

### Option B : Supabase Edge Function
Fonction déclenchée par trigger DB quand `status → published`

### Option C : API Route Next.js
Endpoint `/api/submit-to-google` appelable depuis l'admin

## 📚 Ressources

- [Guide complet](./GOOGLE_INDEXING_SETUP.md)
- [Doc officielle Google](https://developers.google.com/search/apis/indexing-api/v3/quickstart)
- [Google Search Console](https://search.google.com/search-console)

---

**Questions ?** Voir `GOOGLE_INDEXING_SETUP.md` pour le troubleshooting
