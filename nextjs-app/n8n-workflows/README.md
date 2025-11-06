# n8n Workflows - Social Media Publishing

Ce dossier contient deux workflows n8n prêts à l'import pour gérer la publication sur les réseaux sociaux.

## 📦 Fichiers

1. **`social-publishing-webhook.json`** - Webhook principal qui reçoit les demandes de publication
2. **`social-publishing-queue-processor.json`** - Processeur de file qui s'exécute toutes les 15 minutes

## 🚀 Import dans n8n

### Étape 1: Importer les workflows

1. Ouvrez n8n (https://votre-n8n.com)
2. Cliquez sur **"Workflows"** → **"Import"**
3. Glissez-déposez ou sélectionnez `social-publishing-webhook.json`
4. Répétez pour `social-publishing-queue-processor.json`

### Étape 2: Configurer les credentials

#### A. Supabase API (requis pour les deux workflows)

1. Dans n8n, allez dans **Credentials** → **New**
2. Cherchez **"Supabase"**
3. Remplissez:
   - **Host**: `https://zhtstxdbersquchtlkzm.supabase.co` (votre SUPABASE_URL)
   - **Service Role Key**: Votre `SUPABASE_SERVICE_ROLE_KEY` depuis `.env.local`

#### B. Facebook (HTTP Header Auth)

1. Credentials → New → **HTTP Header Auth**
2. Nommez-le: `Facebook Header Auth`
3. Header Name: `Authorization`
4. Value: `Bearer YOUR_FACEBOOK_ACCESS_TOKEN`

**Comment obtenir le token Facebook:**
- Allez sur https://developers.facebook.com
- Créez une app avec permission `pages_manage_posts`
- Générez un Page Access Token

#### C. LinkedIn (HTTP Header Auth)

1. Credentials → New → **HTTP Header Auth**
2. Nommez-le: `LinkedIn Header Auth`
3. Header Name: `Authorization`
4. Value: `Bearer YOUR_LINKEDIN_ACCESS_TOKEN`

**Comment obtenir le token LinkedIn:**
- Allez sur https://www.linkedin.com/developers
- Créez une app avec permission `w_member_social`
- Utilisez OAuth 2.0 pour obtenir un access token

### Étape 3: Configurer les variables d'environnement

Dans n8n, ajoutez ces variables d'environnement:

```env
FACEBOOK_PAGE_ID=votre_page_id
LINKEDIN_ORGANIZATION_ID=votre_organization_id
INSTAGRAM_BUSINESS_ACCOUNT_ID=votre_account_id (si Instagram)
```

**Comment les ajouter dans n8n:**
- Self-hosted: Ajoutez-les dans votre fichier `.env` de n8n
- n8n Cloud: Settings → Environment Variables

### Étape 4: Configurer le webhook

#### Dans le workflow "Social Publishing - Webhook Receiver":

1. Ouvrez le noeud **"Webhook - Publication réseaux sociaux"**
2. **Production URL** sera affichée, par exemple:
   ```
   https://votre-n8n.com/webhook/social-publishing
   ```
3. Copiez cette URL

4. **Ajoutez-la dans votre `.env.local` Next.js:**
   ```env
   N8N_SOCIAL_WEBHOOK_URL=https://votre-n8n.com/webhook/social-publishing
   ```

#### Sécurité du webhook (IMPORTANT):

##### Option 1: Basic Auth (Recommandé)

1. Dans le noeud Webhook, cliquez sur **"Credentials"**
2. Sélectionnez **"HTTP Header Auth"** ou **"Basic Auth"**
3. Créez des credentials:
   - Username: `admin`
   - Password: `votre_mot_de_passe_sécurisé`

4. Ajoutez dans `.env.local`:
   ```env
   N8N_SOCIAL_BASIC_USER=admin
   N8N_SOCIAL_BASIC_PASS=votre_mot_de_passe_sécurisé
   ```

##### Option 2: Bearer Token

1. Générez un token sécurisé:
   ```bash
   openssl rand -hex 32
   ```

2. Dans le webhook, configurez Header Auth:
   - Header: `Authorization`
   - Value: `Bearer VOTRE_TOKEN`

3. Ajoutez dans `.env.local`:
   ```env
   N8N_SOCIAL_TOKEN=VOTRE_TOKEN
   ```

### Étape 5: Activer les workflows

1. Ouvrez **"Social Publishing - Webhook Receiver"**
2. Cliquez sur **"Active"** en haut à droite (toggle on)
3. Faites de même pour **"Social Publishing - Queue Processor"**

## 🧪 Test des workflows

### Test 1: Publication immédiate (NOW)

Depuis votre UI Next.js:
1. Allez sur un article publié
2. Cliquez sur Actions (trois points) → **"Publier sur les réseaux"**
3. Sélectionnez Facebook et/ou LinkedIn
4. Choisissez **"Publier maintenant"**
5. Cliquez sur **"Publier"**

**Vérifications:**
- Dans n8n, allez dans **"Executions"**
- Vous devriez voir une exécution du workflow webhook
- Vérifiez sur Facebook/LinkedIn que le post est publié

### Test 2: Ajout à la file (QUEUE)

1. Depuis l'UI, publiez un article mais choisissez **"Ajouter à la file"**
2. Dans Supabase, vérifiez la table `social_queue`:
   ```sql
   SELECT * FROM social_queue WHERE status = 'pending';
   ```
3. Vous devriez voir votre article avec `scheduled_for` = demain à 09:00
4. Attendez que le cron s'exécute (toutes les 15 min)
5. Vérifiez que le statut passe à `completed`

### Test 3: Publication programmée (SCHEDULE)

1. Publiez avec **"Programmer la publication"**
2. Choisissez une date/heure dans 5 minutes
3. Le workflow utilisera le noeud **Wait**
4. La publication se fera automatiquement à l'heure choisie

## 🔧 Ajout d'Instagram et TikTok

Les workflows incluent déjà les switches pour Instagram et TikTok, mais les noeuds de publication ne sont pas encore configurés.

### Pour ajouter Instagram:

1. Dans le workflow webhook, après le switch "Router par plateforme"
2. Ajoutez un noeud **HTTP Request**:
   ```
   URL: https://graph.facebook.com/v18.0/{{ $env.INSTAGRAM_BUSINESS_ACCOUNT_ID }}/media
   Method: POST
   Body:
     - image_url: {{ $json.imageUrl }}
     - caption: {{ $json.message }}
   ```
3. Puis un second noeud pour publier:
   ```
   URL: https://graph.facebook.com/v18.0/{{ $env.INSTAGRAM_BUSINESS_ACCOUNT_ID }}/media_publish
   Method: POST
   Body:
     - creation_id: {{ $json.id }}
   ```

### Pour ajouter TikTok:

Suivez la documentation de l'API TikTok: https://developers.tiktok.com/doc/content-posting-api-get-started

## 📊 Monitoring

### Dans n8n:

- **Executions**: Voir toutes les exécutions passées
- **Error Workflow**: Créez un workflow pour être notifié en cas d'erreur
- **Activity Log**: Voir les erreurs et warnings

### Dans Supabase:

Requête pour voir les publications en attente:
```sql
SELECT
  article_title,
  platforms,
  status,
  scheduled_for,
  published_at,
  error_message
FROM social_queue
ORDER BY scheduled_for DESC;
```

## 🐛 Troubleshooting

### Le webhook ne répond pas

1. Vérifiez que le workflow est **activé** (toggle Active)
2. Vérifiez les credentials d'authentification
3. Testez le webhook directement dans n8n (bouton "Test")

### Les publications échouent

1. Vérifiez les credentials Facebook/LinkedIn
2. Vérifiez que les tokens n'ont pas expiré
3. Regardez les logs d'erreur dans n8n Executions

### Le cron ne s'exécute pas

1. Vérifiez que le workflow est activé
2. Dans n8n self-hosted, vérifiez que les crons sont activés
3. Regardez les executions passées du workflow

### La file ne se vide pas

1. Vérifiez que le workflow "Queue Processor" est actif
2. Vérifiez que `scheduled_for` est dans le passé
3. Vérifiez les credentials Supabase

## 📝 Notes importantes

- **Rate Limits**: Facebook et LinkedIn ont des limites. Ne publiez pas trop souvent.
- **Tokens expirés**: Les tokens Facebook expirent après 60 jours. Planifiez un refresh.
- **Coûts n8n**: Vérifiez votre plan n8n pour le nombre d'exécutions incluses.
- **Timezone**: Les dates sont en UTC. Ajustez si nécessaire dans le code JavaScript.

## 🔐 Sécurité

- ✅ Utilisez HTTPS pour tous les webhooks
- ✅ Activez l'authentification Basic Auth ou Bearer Token
- ✅ Ne commitez jamais les tokens dans Git
- ✅ Utilisez des variables d'environnement
- ✅ Limitez les permissions des tokens aux strict nécessaire

## 📚 Ressources

- [n8n Documentation](https://docs.n8n.io/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [Instagram API](https://developers.facebook.com/docs/instagram-api)
- [Supabase Documentation](https://supabase.com/docs)
