# 🔄 Configuration Auto-Revalidation Articles

Ce guide explique comment configurer la revalidation automatique des articles Beamô après modification dans Supabase.

## 📋 Architecture

```
Supabase (modification article)
    ↓ (webhook database trigger)
n8n Workflow
    ↓ (filtre status = published)
Next.js API /api/revalidate
    ↓ (revalidatePath)
Page article mise à jour instantanément ✅
```

## ✅ Ce qui a été créé

### 1. API Route Next.js
- **Fichier** : `nextjs-app/src/app/api/revalidate/route.ts`
- **Fonction** : Revalide une page statique/ISR à la demande
- **Sécurité** : Token secret requis

### 2. Workflow n8n
- **ID** : `banx08i2FvedvMZN`
- **Nom** : `🔄 Beamô - Auto-revalidation articles`
- **Trigger** : Webhook POST
- **Action** : Appelle l'API Next.js pour revalider

## 🚀 Configuration étape par étape

### Étape 1 : Générer le token de sécurité

Le token a déjà été généré :
```
thTq4DzhN9Db1NU/pSSBfY34V4ePtINX+ZsuLejvVzA=
```

### Étape 2 : Ajouter la variable d'environnement

#### En local (.env.local)
```bash
REVALIDATION_TOKEN=thTq4DzhN9Db1NU/pSSBfY34V4ePtINX+ZsuLejvVzA=
```

#### En production (Vercel/autre)
Ajouter la variable dans votre dashboard de déploiement :
- **Nom** : `REVALIDATION_TOKEN`
- **Valeur** : `thTq4DzhN9Db1NU/pSSBfY34V4ePtINX+ZsuLejvVzA=`

### Étape 3 : Configurer n8n

#### 3.1 Accéder au workflow
1. Ouvrir n8n : `https://votre-instance-n8n.com`
2. Chercher le workflow : `🔄 Beamô - Auto-revalidation articles`
3. Ouvrir pour configuration

#### 3.2 Ajouter la variable d'environnement dans n8n
**Option A - Variables d'environnement n8n (recommandé)** :
1. Settings → Environments
2. Ajouter : `REVALIDATION_TOKEN=thTq4DzhN9Db1NU/pSSBfY34V4ePtINX+ZsuLejvVzA=`

**Option B - Credentials n8n** :
1. Credentials → Add credential
2. Type: "Header Auth"
3. Name: "Revalidation Token"
4. Header Name: `X-Revalidation-Token`
5. Header Value: `thTq4DzhN9Db1NU/pSSBfY34V4ePtINX+ZsuLejvVzA=`

#### 3.3 Récupérer l'URL du webhook
1. Cliquer sur le node "Webhook Supabase"
2. Copier l'URL du webhook (exemple) :
```
https://votre-n8n.com/webhook/supabase-article-update
```

#### 3.4 Activer le workflow
1. Cliquer sur le toggle "Active" en haut à droite
2. Le workflow est maintenant en écoute ✅

### Étape 4 : Configurer Supabase Database Webhooks

#### 4.1 Accéder à Supabase
1. Dashboard Supabase → Votre projet
2. Database → Webhooks

#### 4.2 Créer le webhook
Cliquer sur "Create a new hook" :

**Configuration** :
- **Name** : `Article Update - Revalidation`
- **Table** : `articles`
- **Events** : Cocher `Update` uniquement
- **Type** : `HTTP Request`
- **Method** : `POST`
- **URL** : L'URL du webhook n8n (étape 3.3)
- **HTTP Headers** :
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

**Payload** :
```json
{
  "type": "UPDATE",
  "table": "articles",
  "record": {
    "id": "{{ record.id }}",
    "slug": "{{ record.slug }}",
    "status": "{{ record.status }}",
    "updated_at": "{{ record.updated_at }}"
  }
}
```

#### 4.3 Tester le webhook
1. Modifier un article publié dans Supabase
2. Vérifier les logs n8n (Executions)
3. Vérifier que la page est revalidée

## 🧪 Tests

### Test manuel de l'API

```bash
# Test local
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "thTq4DzhN9Db1NU/pSSBfY34V4ePtINX+ZsuLejvVzA=",
    "path": "/ressources/marche-copropriete-gasny-27620"
  }'

# Test production
curl -X POST https://www.xn--beam-yqa.fr/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "thTq4DzhN9Db1NU/pSSBfY34V4ePtINX+ZsuLejvVzA=",
    "path": "/ressources/marche-copropriete-gasny-27620"
  }'
```

**Réponse attendue** :
```json
{
  "revalidated": true,
  "path": "/ressources/marche-copropriete-gasny-27620",
  "message": "Successfully revalidated /ressources/marche-copropriete-gasny-27620",
  "timestamp": "2025-11-07T11:07:02.224Z"
}
```

### Test du workflow n8n complet

1. Aller sur : `https://www.xn--beam-yqa.fr/apps/articles/a4090f9e-dd45-47cf-b554-68dc081e8f5f/edit`
2. Modifier le contenu de l'article Gasny
3. Sauvegarder
4. Attendre 2-3 secondes
5. Vérifier la page : `https://www.xn--beam-yqa.fr/ressources/marche-copropriete-gasny-27620`
6. Le lien vers le Comptoir devrait être visible ! ✅

## 🔍 Debugging

### Vérifier les logs n8n
1. n8n → Executions
2. Chercher l'exécution récente du workflow
3. Vérifier chaque node :
   - ✅ Webhook reçu
   - ✅ Filter passé (status = published)
   - ✅ HTTP Request réussi (status 200)

### Vérifier les logs Next.js
```bash
# En développement
npm run dev

# Chercher dans les logs :
# 🔄 Revalidating path: /ressources/...
# ✅ Revalidation successful: /ressources/...
```

### Erreurs courantes

#### 401 Unauthorized
❌ Token invalide ou manquant
✅ Vérifier que `REVALIDATION_TOKEN` est bien configuré dans Next.js ET n8n

#### 400 Bad Request
❌ Path manquant ou invalide
✅ Vérifier le payload Supabase : `{{ record.slug }}` doit être présent

#### 500 Internal Server Error
❌ Erreur dans le code de revalidation
✅ Vérifier les logs Next.js pour plus de détails

## 📊 Monitoring

### Métriques à surveiller
- **Taux de succès webhook** : >95%
- **Temps de revalidation** : <3 secondes
- **Faux positifs** (articles non publiés) : Filtrés par le workflow

### Alertes recommandées
- Échec de webhook Supabase > 3 fois consécutives
- Erreur 401/500 sur l'API revalidation
- Workflow n8n désactivé accidentellement

## 🎯 Avantages de cette solution

### ✅ Instantané
- Modification visible en **2-3 secondes** (vs 1h avec ISR classique)

### ✅ Économique
- Pas de rebuild complet (économie de temps de build)
- Pas de revalidation inutile (seulement si status = published)

### ✅ Sécurisé
- Token secret pour empêcher les appels non autorisés
- Validation du statut published côté n8n

### ✅ Traçable
- Logs n8n : historique complet des revalidations
- Logs Next.js : confirmation de chaque revalidation

## 🔐 Sécurité

### Recommandations
1. ⚠️ **Ne JAMAIS commit** le token dans Git
2. ✅ Utiliser des variables d'environnement
3. ✅ Régénérer le token si compromis :
   ```bash
   openssl rand -base64 32
   ```
4. ✅ Limiter l'accès au workflow n8n (authentification requise)

### Rotation du token
Si vous devez changer le token :
1. Générer un nouveau token : `openssl rand -base64 32`
2. Mettre à jour dans Next.js (`.env` + redéployer)
3. Mettre à jour dans n8n (environnement variable)
4. Tester le système

## 📝 Commit & Deploy

### Commit des changements
```bash
# Les fichiers modifiés :
# - nextjs-app/src/app/api/revalidate/route.ts (nouveau)
# - nextjs-app/src/app/ressources/[slug]/page.tsx (revalidate ISR)
# - nextjs-app/.env.example (doc REVALIDATION_TOKEN)

git add nextjs-app/src/app/api/revalidate/route.ts
git add nextjs-app/src/app/ressources/\[slug\]/page.tsx
git add nextjs-app/.env.example

git commit -m "feat(revalidation): add on-demand revalidation API + n8n workflow

- Add /api/revalidate route for instant page revalidation
- Add ISR revalidation (3600s) as fallback
- Create n8n workflow for Supabase webhook integration
- Document REVALIDATION_TOKEN setup

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Déployer en production
```bash
# Push vers le repo
git push origin dev

# Merger sur main (ou directement push main selon votre workflow)
# Puis :
# 1. Ajouter REVALIDATION_TOKEN dans Vercel/votre hébergeur
# 2. Redéployer
# 3. Activer le workflow n8n
# 4. Configurer le webhook Supabase
```

## ✅ Checklist finale

- [ ] REVALIDATION_TOKEN ajouté dans .env.local
- [ ] REVALIDATION_TOKEN ajouté dans Vercel/production
- [ ] Workflow n8n activé
- [ ] Variable REVALIDATION_TOKEN ajoutée dans n8n
- [ ] Webhook Supabase configuré
- [ ] Test manuel réussi (curl)
- [ ] Test end-to-end réussi (modification article)
- [ ] Lien Comptoir visible sur article Gasny ✅

## 🎉 Résultat attendu

Après configuration complète :
1. Vous modifiez un article publié dans Supabase
2. **Instantanément** (2-3 secondes), la page est revalidée
3. Les visiteurs voient le nouveau contenu sans attendre !

**Exemple concret** :
- Article Gasny modifié avec lien vers le Comptoir
- Sauvegarde dans Supabase (14h30:00)
- Page revalidée automatiquement (14h30:03)
- Lien visible pour tous les visiteurs ! ✅
