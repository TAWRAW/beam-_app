# Configuration des workflows n8n - Publication Réseaux Sociaux

## État actuel

✅ **Workflows créés dans n8n:**
- **Webhook Receiver** (ID: `rz2njkEsWeKGBnNT`) - Reçoit les requêtes de l'API Next.js
- **Queue Processor** (ID: `YtrDp4e3ka6hysjG`) - Cron qui publie depuis la queue

🔴 **À configurer:**
1. Credentials dans n8n (Supabase, Facebook, LinkedIn)
2. Variables d'environnement dans n8n
3. Variables dans .env.local Next.js
4. Activer les workflows

---

## 1. Configurer les Credentials dans n8n

### Accéder aux credentials:
1. Ouvrir https://n8n.srv982695.hstgr.cloud
2. Aller dans **Settings** → **Credentials**

### A. Créer credential Supabase

**Nom:** `Supabase API` (utilisé comme `supabase-credentials` dans les workflows)

**Type:** Supabase

**Configuration:**
- **Host:** `https://zhtstxdbersquchtlkzm.supabase.co`
- **Service Role Key:** Disponible dans `.env.local` → `SUPABASE_SERVICE_ROLE_KEY`
  - ⚠️ **NE JAMAIS commiter cette clé dans Git**
  - Récupérer depuis votre fichier `.env.local` local
  - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Note:** Ces credentials sont disponibles via le MCP Supabase si besoin.

### B. Créer credential Facebook

**Nom:** `Facebook Header Auth` (utilisé comme `facebook-auth` dans les workflows)

**Type:** Header Auth

**Configuration:**
- **Name:** `Authorization`
- **Value:** `Bearer YOUR_FACEBOOK_ACCESS_TOKEN`

**Comment obtenir le token Facebook:**
1. Aller sur https://developers.facebook.com
2. Créer une application ou utiliser une existante
3. Ajouter le produit "Facebook Login"
4. Dans **Tools** → **Graph API Explorer**:
   - Sélectionner votre app
   - Sélectionner votre page dans "User or Page"
   - Ajouter les permissions:
     - `pages_manage_posts`
     - `pages_read_engagement`
     - `pages_show_list`
   - Cliquer sur "Generate Access Token"
5. **IMPORTANT:** Convertir le token court en token longue durée (60 jours):
   ```bash
   curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```
6. Copier le `access_token` dans le credential n8n

**Récupérer le Page ID:**
```bash
curl -i -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_TOKEN"
```
Le `id` de votre page sera dans la réponse.

**✅ Page ID déjà connu:** `61582074458665`

**📍 Récupérer le Place ID (pour le lieu/référencement local):**
Voir le guide dédié → `FACEBOOK_PLACE_SETUP.md`

### C. Créer credential LinkedIn OAuth2

**Nom:** `LinkedIn OAuth2` (utilisé comme `linkedin-oauth` dans les workflows)

**Type:** LinkedIn OAuth2 API

**⚡ BEAUCOUP PLUS SIMPLE qu'avant ! Le node LinkedIn natif utilise OAuth2 automatiquement.**

**Configuration:**

1. **Aller sur https://www.linkedin.com/developers**
2. **Créer une application:**
   - Nom: "Beamô Social Publishing"
   - Company: Votre entreprise
3. **Dans Auth → OAuth 2.0 settings:**
   - Ajouter cette Redirect URL: `https://n8n.srv982695.hstgr.cloud/rest/oauth2-credential/callback`
4. **Dans Products:**
   - Demander l'accès à: **"Share on LinkedIn"** ou **"Community Management"**
   - Attendre l'approbation (généralement instantané pour Share on LinkedIn)
5. **Dans Auth, copier:**
   - Client ID
   - Client Secret
6. **Dans n8n, créer le credential:**
   - Type: `LinkedIn OAuth2 API`
   - Nom: `LinkedIn OAuth2`
   - Client ID: (coller)
   - Client Secret: (coller)
   - Cliquer sur **"Connect my account"**
   - Autoriser l'accès dans la popup LinkedIn

**Récupérer l'Organization URN (pour publier sur une page entreprise):**

Une fois connecté, vous pouvez récupérer l'URN de votre organisation:
```bash
curl -X GET 'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

L'URN ressemble à: `urn:li:organization:123456789`

**Note importante:**
- Pour publier sur votre **profil personnel**: Utiliser `postAs: person`
- Pour publier sur une **page entreprise**: Utiliser `postAs: organization` et fournir l'Organization URN

---

## 2. Configurer les Variables d'environnement dans n8n

### Dans n8n:
1. Aller dans **Settings** → **Variables**
2. Ajouter les variables suivantes:

| Variable | Valeur | Description |
|----------|--------|-------------|
| `FACEBOOK_PAGE_ID` | `61582074458665` | ID de votre page Facebook |
| `FACEBOOK_PLACE_ID` | `votre_place_id` | 📍 **NOUVEAU:** ID du lieu pour SEO local (voir guide) |
| `LINKEDIN_ORGANIZATION_ID` | `votre_organization_id` | ID de votre organisation LinkedIn (optionnel si profil perso) |

**📍 Lieu Facebook pour le référencement local:**
Le paramètre `FACEBOOK_PLACE_ID` ajoute automatiquement un lieu (ville/adresse) à toutes vos publications Facebook.

**Pourquoi ?** Améliore le SEO local et la visibilité géographique.

**Comment l'obtenir ?** Voir le guide complet → `FACEBOOK_PLACE_SETUP.md`

---

## 3. Ajouter les variables manquantes dans .env.local

Éditer le fichier `nextjs-app/.env.local` et ajouter :

```env
# Webhook n8n pour publication réseaux sociaux
N8N_SOCIAL_WEBHOOK_URL=https://n8n.srv982695.hstgr.cloud/webhook/social-publishing
```

**Note:** Le webhook n8n est configuré sans authentification pour l'instant. Si vous voulez ajouter une authentification:
1. Dans n8n, éditer le node "Webhook - Publication réseaux sociaux"
2. Activer "Authentication" → "Basic Auth"
3. Définir un username et password
4. Ajouter dans `.env.local`:
   ```env
   N8N_SOCIAL_BASIC_USER=admin
   N8N_SOCIAL_BASIC_PASS=votre_mot_de_passe_securise
   ```
5. Modifier l'API route Next.js pour envoyer l'authentification

---

## 4. Ouvrir et configurer les workflows dans n8n

### A. Workflow Webhook Receiver (ID: rz2njkEsWeKGBnNT)

1. Ouvrir https://n8n.srv982695.hstgr.cloud/workflow/rz2njkEsWeKGBnNT
2. Vérifier/configurer les nodes qui ont des erreurs (icône rouge):

**Nodes qui nécessitent des credentials:**
- `Supabase - Insérer dans queue` → Sélectionner credential "Supabase API"
- `Facebook - Publier` → Sélectionner credential "Facebook Header Auth"
- `LinkedIn - Publier` → Sélectionner credential "LinkedIn OAuth2" ✨ (Node natif LinkedIn)

3. Cliquer sur **Save** en haut à droite
4. Cliquer sur le toggle **Active** pour activer le workflow

### B. Workflow Queue Processor (ID: YtrDp4e3ka6hysjG)

1. Ouvrir https://n8n.srv982695.hstgr.cloud/workflow/YtrDp4e3ka6hysjG
2. Vérifier/configurer les nodes qui ont des erreurs:

**Nodes qui nécessitent des credentials:**
- `Supabase - Récupérer items pending` → Sélectionner credential "Supabase API"
- `Supabase - Marquer processing` → Sélectionner credential "Supabase API"
- `Facebook - Publier` → Sélectionner credential "Facebook Header Auth"
- `LinkedIn - Publier` → Sélectionner credential "LinkedIn OAuth2" ✨ (Node natif LinkedIn)
- `Update Article - Facebook` → Sélectionner credential "Supabase API"
- `Update Article - LinkedIn` → Sélectionner credential "Supabase API"
- `Supabase - Marquer completed` → Sélectionner credential "Supabase API"

3. Cliquer sur **Save**
4. Cliquer sur le toggle **Active**

---

## 5. Tester le système

### Test 1: Publication immédiate (mode NOW)

1. Démarrer le dev server Next.js:
   ```bash
   cd nextjs-app
   npm run dev
   ```

2. Ouvrir http://localhost:3000/apps/articles

3. Sélectionner un article publié

4. Cliquer sur Actions (trois points) → "Publier sur les réseaux"

5. Dans le modal:
   - Sélectionner "Facebook" ou "LinkedIn"
   - Choisir "Publier maintenant"
   - Cliquer sur "Publier"

6. Vérifier dans n8n:
   - Aller dans **Executions**
   - Voir l'exécution du workflow "Webhook Receiver"
   - Vérifier qu'il n'y a pas d'erreurs

7. Vérifier sur Facebook/LinkedIn que le post est publié

### Test 2: Ajouter à la file d'attente (mode QUEUE)

1. Répéter les étapes 1-4 du Test 1

2. Dans le modal:
   - Sélectionner les plateformes
   - Choisir "Ajouter à la file"
   - Cliquer sur "Publier"

3. Vérifier dans Supabase:
   - Ouvrir https://supabase.com
   - Table Editor → `social_queue`
   - Vérifier qu'un nouvel item a été ajouté avec `status='pending'`

4. Attendre 15 minutes (ou déclencher manuellement le cron):
   - Dans n8n, ouvrir le workflow "Queue Processor"
   - Cliquer sur "Execute Workflow" (icône play)

5. Vérifier que:
   - Le post est publié sur les plateformes
   - Dans Supabase, le status passe à `'completed'`
   - Le champ `published_at` est rempli

### Test 3: Publication programmée (mode SCHEDULE)

**Note:** La fonctionnalité SCHEDULE dans le workflow webhook utilise un node "Wait" qui peut ne pas fonctionner correctement dans certains environnements n8n. Pour un vrai système de programmation, préférez le mode QUEUE en ajustant le `scheduled_for`.

---

## 6. Dépannage

### Erreur: "Credential not found"
→ Vérifiez que vous avez créé les credentials avec les bons noms dans n8n

### Erreur: "Table not found: social_queue"
→ La table n'existe pas dans Supabase. Exécutez le script SQL:
```bash
cd nextjs-app/scripts
# Vérifier que social-queue.sql a été exécuté dans Supabase
```

### Erreur Facebook: "Invalid OAuth access token"
→ Le token a expiré (durée: 60 jours). Générez un nouveau token

### Erreur LinkedIn: "Unauthorized"
→ Vérifiez que l'app LinkedIn a les bonnes permissions (w_member_social)

### Le cron ne s'exécute pas
→ Vérifiez que le workflow "Queue Processor" est bien **actif** (toggle ON)

### Le webhook n8n ne reçoit rien
→ Vérifiez la variable `N8N_SOCIAL_WEBHOOK_URL` dans `.env.local`

---

## 7. Améliorations futures

### Ajouter Instagram
- Nécessite un **Facebook Business Account**
- API Instagram Graph
- Permissions: `instagram_content_publish`

### Ajouter TikTok
- Nécessite un **TikTok Developer Account**
- API TikTok for Business
- Approval process requis

### Monitoring et notifications
- Ajouter un node "Send Email" en cas d'échec
- Créer une API route `/api/social-publishing/stats` pour afficher dans l'UI

### Refresh automatique des tokens
- Implémenter OAuth 2.0 refresh token flow
- Stocker les tokens dans Supabase avec expiration

---

## Liens utiles

- **n8n Instance:** https://n8n.srv982695.hstgr.cloud
- **Supabase Dashboard:** https://supabase.com/dashboard/project/zhtstxdbersquchtlkzm
- **Facebook Developers:** https://developers.facebook.com
- **LinkedIn Developers:** https://www.linkedin.com/developers
- **Documentation n8n:** https://docs.n8n.io

---

**Dernière mise à jour:** 4 novembre 2025
**Auteur:** Claude Code
