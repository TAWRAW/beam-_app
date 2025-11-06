# 📋 Contexte du projet - Publication Réseaux Sociaux

**Date de dernière mise à jour**: 4 novembre 2025
**Fonctionnalité**: Système de publication automatique sur les réseaux sociaux (Facebook, LinkedIn, Instagram, TikTok)

---

## ✅ Ce qui a été complété

### 1. **Code Next.js** (100% terminé)

#### Frontend:
- ✅ **Modal de publication** (`src/app/apps/articles/social-publish-modal.tsx`)
  - 3 modes: "Publier maintenant", "Programmer", "Ajouter à la file"
  - Sélection de plateformes (Facebook, LinkedIn, Instagram, TikTok)
  - Sauvegarde des plateformes dans localStorage
  - Bouton "Tout sélectionner"
  - Custom modal (pas Radix Dialog à cause conflit avec DropdownMenu)

- ✅ **Page Réseaux Sociaux** (`src/app/apps/social-publishing/page.tsx`)
  - Statistiques (total, en attente, publiés, échecs)
  - Paramètres de file d'attente (heure quotidienne de publication)
  - Filtres par statut
  - Liste des publications (actuellement vide, sera remplie par n8n)

- ✅ **Colonnes table articles** (`src/app/apps/articles/columns.tsx`)
  - Action "Publier sur les réseaux" dans dropdown menu
  - Composant ActionsCell avec state management
  - Disponible uniquement pour articles publiés

- ✅ **Menu navigation** (Header.tsx)
  - Nouveau lien "Réseaux sociaux" dans le menu Apps

#### Backend:
- ✅ **API Route** (`src/app/api/social-publishing/publish/route.ts`)
  - Validation Zod du payload
  - Authentication via Supabase session
  - Récupération article depuis Supabase
  - Construction du message avec titre, excerpt, URL, category, tags
  - Envoi au webhook n8n
  - Support des 3 modes (now, schedule, queue)
  - Gestion erreurs et timeout

### 2. **Base de données Supabase** (100% terminé)

- ✅ **Table `social_queue` créée** dans Supabase
  - Colonnes: id, article_id, article_title, article_url, article_excerpt, article_image_url, article_category, article_tags, platforms, custom_message, user_id, status, scheduled_for, published_at, error_message, created_at, updated_at
  - Index: idx_social_queue_status, idx_social_queue_scheduled, idx_social_queue_article
  - Trigger: Mise à jour automatique de updated_at
  - Status CHECK constraint: 'pending' | 'processing' | 'completed' | 'failed'

### 3. **Workflows n8n** (JSON prêts, à importer)

- ✅ **Fichiers créés**:
  - `nextjs-app/n8n-workflows/social-publishing-webhook.json` - Webhook principal
  - `nextjs-app/n8n-workflows/social-publishing-queue-processor.json` - Cron job
  - `nextjs-app/n8n-workflows/README.md` - Documentation complète

- ✅ **Documentation complète** (`N8N_WORKFLOW_SETUP.md`)
  - Architecture des workflows
  - SQL pour table social_queue
  - Code JavaScript pour les nœuds n8n
  - Variables d'environnement
  - Instructions de test

### 4. **MCPs configurés** (100% fonctionnels)

- ✅ **MCP Supabase** - Connecté
  - Type: HTTP
  - URL: https://mcp.supabase.com/mcp
  - Headers avec URL et Service Role Key configurés

- ✅ **MCP n8n** - Connecté
  - Package: `n8n-mcp` (publié le 4 nov 2025)
  - Type: stdio
  - URL API: https://n8n.srv982695.hstgr.cloud
  - API Key configurée
  - Accès à 541 nœuds n8n

---

## 🎯 Ce qu'il reste à faire

### Étape 1: Importer les workflows dans n8n (PRIORITAIRE)

**Via MCP n8n** (méthode recommandée - automatique):
- Utiliser le MCP n8n pour créer les workflows directement
- Les fichiers JSON sources sont dans `nextjs-app/n8n-workflows/`

**OU via interface n8n** (méthode manuelle):
1. Ouvrir https://n8n.srv982695.hstgr.cloud
2. Workflows → Import
3. Importer `social-publishing-webhook.json`
4. Importer `social-publishing-queue-processor.json`

**Workflows à créer**:
1. **Social Publishing - Webhook Receiver**
   - Reçoit les requêtes POST de l'API Next.js
   - Route par action (now/schedule/queue)
   - Publie sur Facebook/LinkedIn
   - Ajoute à la table social_queue pour mode queue

2. **Social Publishing - Queue Processor**
   - Cron qui tourne toutes les 15 minutes
   - Lit social_queue WHERE status='pending' AND scheduled_for<=NOW()
   - Publie sur les plateformes
   - Met à jour status='completed'

### Étape 2: Configurer les credentials dans n8n

**Credentials nécessaires**:

1. **Supabase** (pour les deux workflows)
   - Host: https://zhtstxdbersquchtlkzm.supabase.co
   - Service Role Key: (voir `.env.local`)

2. **Facebook** (HTTP Header Auth)
   - Header: `Authorization`
   - Value: `Bearer YOUR_FACEBOOK_ACCESS_TOKEN`
   - Comment l'obtenir: https://developers.facebook.com → Créer app → Permission `pages_manage_posts`

3. **LinkedIn** (HTTP Header Auth)
   - Header: `Authorization`
   - Value: `Bearer YOUR_LINKEDIN_ACCESS_TOKEN`
   - Comment l'obtenir: https://www.linkedin.com/developers → Créer app → Permission `w_member_social`

### Étape 3: Configurer les variables d'environnement

**Dans n8n** (Settings → Environment Variables):
```env
FACEBOOK_PAGE_ID=votre_page_id
LINKEDIN_ORGANIZATION_ID=votre_organization_id
```

**Dans Next.js** (`.env.local`):
```env
# Webhook n8n
N8N_SOCIAL_WEBHOOK_URL=https://n8n.srv982695.hstgr.cloud/webhook/social-publishing
N8N_SOCIAL_BASIC_USER=admin
N8N_SOCIAL_BASIC_PASS=votre_mot_de_passe_securise
```

### Étape 4: Activer les workflows dans n8n

1. Ouvrir chaque workflow
2. Cliquer sur le toggle "Active" en haut à droite
3. Vérifier qu'ils sont bien actifs

### Étape 5: Tester le système

**Test 1 - Publication immédiate**:
1. Aller sur http://localhost:3000/apps/articles
2. Cliquer sur Actions (trois points) d'un article publié
3. "Publier sur les réseaux"
4. Sélectionner Facebook
5. "Publier maintenant"
6. Vérifier dans n8n Executions que ça fonctionne

**Test 2 - File d'attente**:
1. Même chose mais choisir "Ajouter à la file"
2. Vérifier dans Supabase → Table Editor → social_queue
3. Attendre 15 minutes que le cron s'exécute
4. Vérifier que status passe à 'completed'

---

## 📂 Fichiers importants

### Code Next.js:
```
nextjs-app/src/
├── app/
│   ├── api/social-publishing/publish/route.ts     ← API endpoint
│   ├── apps/articles/
│   │   ├── columns.tsx                            ← Actions dropdown avec modal
│   │   └── social-publish-modal.tsx               ← Modal de publication
│   └── apps/social-publishing/page.tsx            ← Page réseaux sociaux
```

### Workflows n8n:
```
nextjs-app/n8n-workflows/
├── social-publishing-webhook.json                 ← Workflow webhook
├── social-publishing-queue-processor.json         ← Workflow cron
└── README.md                                      ← Doc complète
```

### Scripts:
```
nextjs-app/scripts/
├── social-queue.sql                               ← SQL table (déjà exécuté)
└── setup-social-queue.js                          ← Script Node.js (alternatif)
```

### Documentation:
```
N8N_WORKFLOW_SETUP.md                              ← Guide complet workflow n8n
CLAUDE_CONTEXT.md                                  ← Ce fichier
```

---

## 🔐 Credentials et URLs

### Supabase:
- **URL**: https://zhtstxdbersquchtlkzm.supabase.co
- **Service Role Key**: Disponible dans `.env.local` → `SUPABASE_SERVICE_ROLE_KEY`
- **Database**: Projet Beamô

### n8n:
- **URL Instance**: https://n8n.srv982695.hstgr.cloud
- **API Key**: *(générer depuis n8n Settings → API → Create API Key - NE JAMAIS commiter)*
- **Workflow existant**: https://n8n.srv982695.hstgr.cloud/workflow/7tYWNjElDzyEhmHK

### Next.js:
- **Dev URL**: http://localhost:3000
- **Production URL**: https://www.beamô.fr

---

## 🛠️ Commandes utiles

### Démarrer le dev server:
```bash
cd "/Users/tomlemeille/Dossier en local/Code/site_beamô_app/nextjs-app"
npm run dev
```

### Vérifier les MCPs:
```bash
/mcp
```

### Tester l'API publish:
```bash
curl -X POST http://localhost:3000/api/social-publishing/publish \
  -H "Content-Type: application/json" \
  -d '{
    "article_id": "uuid-article",
    "platforms": ["facebook"],
    "publish_mode": "now"
  }'
```

### Requête Supabase (via MCP):
```
Demander au MCP Supabase:
"Liste les 10 derniers items de la table social_queue"
```

---

## 🐛 Problèmes connus et solutions

### Problème: Modal ne s'affiche pas
**Solution**: Le modal utilise une implémentation custom (pas Radix Dialog) car il y a un conflit avec DropdownMenu. C'est normal et corrigé dans `social-publish-modal.tsx`.

### Problème: MCP n8n failed
**Solution**: Le package correct est `n8n-mcp` (pas `@n8n/mcp-server`). Configuration dans `.claude.json` ligne 182-196.

### Problème: Webhook n8n ne reçoit rien
**Solution**:
1. Vérifier que le workflow est activé dans n8n
2. Vérifier `N8N_SOCIAL_WEBHOOK_URL` dans `.env.local`
3. Vérifier l'authentification (Basic Auth ou Bearer Token)

### Problème: Cron ne publie pas
**Solution**:
1. Vérifier que le workflow "Queue Processor" est actif
2. Vérifier que `scheduled_for` est dans le passé
3. Regarder les executions dans n8n pour voir les erreurs

---

## 📝 Notes importantes

1. **Sécurité**:
   - Ne jamais committer les tokens Facebook/LinkedIn dans Git
   - Utiliser Basic Auth sur le webhook n8n
   - Les credentials sont déjà dans `.env.local` (gitignored)

2. **Rate Limits**:
   - Facebook: Limitez les publications
   - LinkedIn: Même chose
   - Prévoir un délai entre publications

3. **Tokens expirés**:
   - Les tokens Facebook expirent après 60 jours
   - Prévoir un système de refresh ou notification

4. **Timezone**:
   - Les dates sont en UTC dans Supabase
   - Le frontend utilise Europe/Paris
   - Adapter si besoin dans le code JavaScript n8n

---

## 🎯 Prochaines actions recommandées

### Action immédiate (Priorité 1):
1. ✅ Importer les workflows n8n (via MCP ou manuellement)
2. ✅ Configurer les credentials Supabase dans n8n
3. ✅ Obtenir et configurer tokens Facebook
4. ✅ Obtenir et configurer tokens LinkedIn
5. ✅ Activer les deux workflows
6. ✅ Tester publication immédiate

### Actions secondaires (Priorité 2):
7. Tester publication programmée
8. Tester file d'attente
9. Ajouter Instagram (API Business Account requis)
10. Ajouter TikTok (API Developer Account requis)

### Améliorations futures (Priorité 3):
- Créer API `/api/social-publishing/list` pour afficher l'historique
- Créer API `/api/social-publishing/settings` pour sauvegarder queue_time
- Ajouter notifications en cas d'échec
- Ajouter preview du message avant publication
- Ajouter analytics (nombre de vues, likes, etc.)

---

## 🤝 Comment utiliser ce document

**Pour Claude Code**:
```
Lis le fichier CLAUDE_CONTEXT.md pour comprendre l'état du projet
et ce qu'il reste à faire pour la fonctionnalité de publication
sur les réseaux sociaux.
```

**Pour consulter les détails**:
- Workflow n8n: Voir `N8N_WORKFLOW_SETUP.md`
- Configuration MCP: Voir `.claude.json` lignes 173-196
- Variables d'environnement: Voir `.env.local`

---

**Dernière mise à jour**: 4 novembre 2025, 16h30
**Auteur**: Claude Code (Session précédente)
**Status**: Prêt pour import workflows n8n et tests
