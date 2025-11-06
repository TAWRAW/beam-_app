# Configuration du Workflow n8n pour la Publication sur les Réseaux Sociaux

## Vue d'ensemble

Ce workflow n8n gère trois modes de publication :
1. **now** - Publication immédiate
2. **schedule** - Publication programmée à une date/heure spécifique
3. **queue** - Ajout à une file d'attente pour publication automatique quotidienne

## Structure du Workflow

### 1. Webhook (Trigger)
- **Nom**: "Webhook - Publication réseaux sociaux"
- **Method**: POST
- **Path**: `/social-publishing` (ou votre chemin personnalisé)
- **Authentication**: Basic Auth ou Bearer Token
- **Response**: JSON

**Variables d'environnement requises** :
```env
N8N_SOCIAL_WEBHOOK_URL=https://votre-n8n.com/webhook/social-publishing
N8N_SOCIAL_BASIC_USER=votre_user (ou laissez vide pour bearer)
N8N_SOCIAL_BASIC_PASS=votre_pass (ou laissez vide pour bearer)
N8N_SOCIAL_TOKEN=votre_token (si vous utilisez Bearer)
```

### 2. Switch - Router par action
Ajoutez un noeud **Switch** qui route basé sur `{{ $json.action }}` :

- **Route 1** : `action === 'now'` → Publication immédiate
- **Route 2** : `action === 'schedule'` → Publication programmée
- **Route 3** : `action === 'queue'` → Ajout à la file d'attente

### 3. Route "now" - Publication immédiate

```
Webhook → Switch → [Route now] → Pour chaque plateforme → Publier
```

**Noeud "Pour chaque plateforme"** :
- Type: Loop Over Items (Split in Batches)
- Field: `{{ $json.payload.platforms }}`

**Noeuds de publication** (un par plateforme) :
- Facebook: API Graph
- LinkedIn: API LinkedIn
- Instagram: API Instagram (nécessite Business Account)
- TikTok: API TikTok

**Format du message** :
```
{{ $json.payload.article.title }}

{{ $json.payload.article.excerpt }}

Lire la suite : {{ $json.payload.article.url }}

#{{ $json.payload.article.category }} {{ $json.payload.article.tags ? $json.payload.article.tags.join(' #') : '' }}
```

### 4. Route "schedule" - Publication programmée

```
Webhook → Switch → [Route schedule] → Attendre jusqu'à scheduled_for → Pour chaque plateforme → Publier
```

**Noeud "Wait"** :
- Type: Wait
- Resume: At Date
- Date: `{{ $json.payload.scheduled_for }}`

### 5. Route "queue" - File d'attente

Cette route nécessite une base de données pour stocker la file d'attente.

#### 5.1. Créer une table Supabase "social_queue"

```sql
CREATE TABLE social_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  article_excerpt TEXT,
  article_image_url TEXT,
  article_category TEXT,
  article_tags TEXT[],
  platforms TEXT[] NOT NULL,
  custom_message TEXT,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_queue_status ON social_queue(status);
CREATE INDEX idx_social_queue_scheduled ON social_queue(scheduled_for);
CREATE INDEX idx_social_queue_article ON social_queue(article_id);
```

#### 5.2. Workflow "Ajout à la file"

```
Webhook → Switch → [Route queue] → Calculer next scheduled_for → Insérer dans Supabase
```

**Noeud "Calculer next scheduled_for"** :
- Type: Code (Function)
- JavaScript:

```javascript
// Récupérer l'heure configurée depuis les settings (ou utiliser 09:00 par défaut)
const queueTime = '09:00'; // TODO: Récupérer depuis les settings Supabase

// Créer la date du lendemain à l'heure configurée
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const [hours, minutes] = queueTime.split(':');
tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);

return {
  json: {
    ...items[0].json,
    calculated_scheduled_for: tomorrow.toISOString()
  }
};
```

**Noeud "Insérer dans Supabase"** :
- Type: Supabase
- Operation: Insert
- Table: social_queue
- Data:
```json
{
  "article_id": "{{ $json.payload.article.id }}",
  "article_title": "{{ $json.payload.article.title }}",
  "article_url": "{{ $json.payload.article.url }}",
  "article_excerpt": "{{ $json.payload.article.excerpt }}",
  "article_image_url": "{{ $json.payload.article.image_url }}",
  "article_category": "{{ $json.payload.article.category }}",
  "article_tags": "{{ $json.payload.article.tags }}",
  "platforms": "{{ $json.payload.platforms }}",
  "custom_message": "{{ $json.payload.custom_message }}",
  "user_id": "{{ $json.userId }}",
  "status": "pending",
  "scheduled_for": "{{ $json.calculated_scheduled_for }}"
}
```

#### 5.3. Workflow "Processeur de file d'attente" (Séparé)

Ce workflow s'exécute automatiquement toutes les heures pour publier les articles en attente.

```
Cron (Hourly) → Supabase: Récupérer items pending → Pour chaque item → Vérifier si c'est l'heure → Publier → Marquer comme completed
```

**Noeud "Cron"** :
- Type: Schedule
- Interval: Every hour (ou toutes les 15 minutes pour plus de précision)

**Noeud "Supabase: Récupérer items pending"** :
- Type: Supabase
- Operation: Get All
- Table: social_queue
- Filters:
  - `status = 'pending'`
  - `scheduled_for <= NOW() + INTERVAL '1 hour'`

**Noeud "Vérifier si c'est l'heure"** :
- Type: IF
- Condition: `{{ new Date($json.scheduled_for) <= new Date() }}`

**Noeuds de publication** : (identiques à la route "now")

**Noeud "Marquer comme completed"** :
- Type: Supabase
- Operation: Update
- Table: social_queue
- ID: `{{ $json.id }}`
- Data:
```json
{
  "status": "completed",
  "published_at": "{{ $now.toISO() }}",
  "updated_at": "{{ $now.toISO() }}"
}
```

## Variables d'environnement complètes

```env
# Webhook n8n
N8N_SOCIAL_WEBHOOK_URL=https://votre-n8n.com/webhook/social-publishing
N8N_SOCIAL_BASIC_USER=admin
N8N_SOCIAL_BASIC_PASS=votre_password_secure

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=votre_service_key

# Facebook
FACEBOOK_PAGE_ID=votre_page_id
FACEBOOK_ACCESS_TOKEN=votre_access_token

# LinkedIn
LINKEDIN_ORGANIZATION_ID=votre_org_id
LINKEDIN_ACCESS_TOKEN=votre_access_token

# Instagram (Business API)
INSTAGRAM_BUSINESS_ACCOUNT_ID=votre_account_id
INSTAGRAM_ACCESS_TOKEN=votre_access_token

# TikTok
TIKTOK_CLIENT_KEY=votre_client_key
TIKTOK_CLIENT_SECRET=votre_client_secret
```

## Enregistrement des publications

Pour toutes les publications réussies, enregistrez dans la table `articles` :

```javascript
// Après publication réussie
await supabase
  .from('articles')
  .update({
    [`published_on_${platform}`]: new Date().toISOString()
  })
  .eq('id', articleId);
```

Cela permettra d'afficher les icônes cochées dans la colonne "Réseaux sociaux" de la table des articles.

## Gestion des erreurs

Pour chaque publication échouée :

**Si mode queue** :
```javascript
await supabase
  .from('social_queue')
  .update({
    status: 'failed',
    error_message: error.message,
    updated_at: new Date().toISOString()
  })
  .eq('id', queueItemId);
```

**Pour tous les modes** :
- Envoyer une notification email à l'administrateur
- Logger l'erreur dans n8n
- Retourner un message d'erreur détaillé

## Test du workflow

1. **Test "now"** : Cliquez sur "Publier maintenant" depuis l'interface
2. **Test "schedule"** : Programmez une publication dans 5 minutes
3. **Test "queue"** : Ajoutez à la file et vérifiez dans Supabase que l'enregistrement est créé

## Prochaines étapes

1. Créer la table `social_queue` dans Supabase
2. Configurer les credentials des réseaux sociaux dans n8n
3. Importer/créer les workflows dans n8n
4. Tester chaque mode de publication
5. Créer une API pour gérer les settings de la file (`/api/social-publishing/settings`)
