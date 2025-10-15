# API d'Importation d'Articles - Documentation Beamô

## Vue d'ensemble

Cette API permet l'importation automatique d'articles depuis Notion via n8n vers le site Beamô.

## URL de l'endpoint

**Développement** : `http://localhost:3000/api/articles/import`
**Production** : `https://www.xn--beam-yqa.fr/api/articles/import`

## Authentification

Toutes les requêtes doivent inclure la clé API dans le header `X-API-Key`.

```bash
X-API-Key: 8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05
```

## Endpoints disponibles

### 1. Health Check (GET)

Vérifie que l'API est opérationnelle.

**Requête** :
```bash
curl -X GET https://www.xn--beam-yqa.fr/api/articles/import \
  -H "X-API-Key: 8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05"
```

**Réponse (200 OK)** :
```json
{
  "success": true,
  "message": "API d'importation opérationnelle",
  "timestamp": "2025-10-15T15:33:37.339Z",
  "endpoint": "/api/articles/import",
  "methods": ["POST", "GET"]
}
```

### 2. Importation d'article (POST)

Importe un article depuis Notion.

**Requête** :
```bash
curl -X POST https://www.xn--beam-yqa.fr/api/articles/import \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05" \
  -d '{
    "titre": "Titre de l'\''article",
    "slug": "slug-de-l-article",
    "contenu": "# Contenu en markdown\n\nTexte de l'\''article...",
    "extrait": "Résumé de l'\''article",
    "categorie": "guides",
    "type": "articles",
    "tags": "copropriété, gestion, conseil",
    "piece_jointe": "https://drive.google.com/file/d/...",
    "meta_description": "Description SEO",
    "meta_title": "Titre SEO"
  }'
```

#### Paramètres de la requête

| Champ | Type | Requis | Description | Valeurs possibles |
|-------|------|--------|-------------|-------------------|
| `titre` | string | ✅ Oui | Titre de l'article | Max 200 caractères |
| `slug` | string | ❌ Non | URL de l'article | Généré automatiquement si absent |
| `contenu` | string | ✅ Oui | Contenu en markdown | - |
| `extrait` | string | ❌ Non | Résumé de l'article | - |
| `categorie` | string | ❌ Non | Catégorie | `general`, `guides`, `actualites`, `conseils`, `reglementation`, `immobilier` (défaut: `general`) |
| `type` | string | ❌ Non | Type d'article | `articles`, `modeles`, `applications`, `juridique`, `documentation` (défaut: `articles`) |
| `tags` | string | ❌ Non | Tags séparés par virgules | Format: "tag1, tag2, tag3" |
| `piece_jointe` | string | ❌ Non | URL de la pièce jointe | URL Google Drive, etc. |
| `meta_description` | string | ❌ Non | Description SEO | Max 160 caractères |
| `meta_title` | string | ❌ Non | Titre SEO | Max 60 caractères |

#### Réponse succès (201 Created)

```json
{
  "success": true,
  "article_id": "219e5dd1-878a-462e-ac8d-5184a6a45971",
  "message": "Article importé avec succès",
  "url_edition": "https://www.xn--beam-yqa.fr/apps/articles/edit/219e5dd1-878a-462e-ac8d-5184a6a45971",
  "article": {
    "id": "219e5dd1-878a-462e-ac8d-5184a6a45971",
    "title": "Titre de l'article",
    "slug": "titre-de-l-article",
    "status": "draft",
    "category": "guides",
    "type": "articles",
    "created_at": "2025-10-15T15:34:01.044167+00:00"
  }
}
```

**Notes importantes** :
- L'article est créé avec le statut `draft` (brouillon) par défaut
- Si le slug existe déjà, un suffixe numérique est ajouté automatiquement (ex: `slug-1`, `slug-2`)
- L'auteur est automatiquement attribué à un administrateur

## Gestion des erreurs

### Erreur d'authentification (401)

```json
{
  "success": false,
  "error": "Clé API invalide"
}
```

### Erreur de validation (400)

```json
{
  "success": false,
  "error": "Le champ \"titre\" est requis"
}
```

ou

```json
{
  "success": false,
  "error": "Le champ \"contenu\" est requis"
}
```

### Erreur serveur (500)

```json
{
  "success": false,
  "error": "Erreur serveur lors de la création de l'article",
  "details": "Message d'erreur détaillé"
}
```

## Configuration n8n

### Configuration du nœud HTTP Request dans n8n

1. **Method** : POST
2. **URL** : `https://www.xn--beam-yqa.fr/api/articles/import`
3. **Authentication** : None
4. **Headers** :
   - Name: `X-API-Key`
   - Value: `8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05`
   - Name: `Content-Type`
   - Value: `application/json`
5. **Body** : JSON avec les champs requis

### Exemple de workflow n8n

```json
{
  "nodes": [
    {
      "parameters": {
        "url": "https://www.xn--beam-yqa.fr/api/articles/import",
        "authentication": "none",
        "requestMethod": "POST",
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "bodyParameters": {
          "parameters": [
            {
              "name": "titre",
              "value": "={{ $json.title }}"
            },
            {
              "name": "contenu",
              "value": "={{ $json.content }}"
            },
            {
              "name": "extrait",
              "value": "={{ $json.excerpt }}"
            },
            {
              "name": "categorie",
              "value": "={{ $json.category }}"
            },
            {
              "name": "tags",
              "value": "={{ $json.tags }}"
            }
          ]
        }
      },
      "name": "Import to Beamô",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

## Variables d'environnement

Pour déployer l'API en production, assurez-vous d'ajouter la variable d'environnement suivante sur Vercel :

**Variable** : `BEAMO_API_KEY`
**Valeur** : `8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05`

### Ajouter la variable sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet Beamô
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez une nouvelle variable :
   - **Name** : `BEAMO_API_KEY`
   - **Value** : `8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05`
   - **Environments** : Production, Preview, Development
5. Cliquez sur **Save**
6. Redéployez votre application

## Tests manuels

### Test 1 : Health check

```bash
curl -X GET https://www.xn--beam-yqa.fr/api/articles/import \
  -H "X-API-Key: 8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05"
```

**Résultat attendu** : Status 200 avec message de succès

### Test 2 : Importation simple

```bash
curl -X POST https://www.xn--beam-yqa.fr/api/articles/import \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05" \
  -d '{
    "titre": "Article de test",
    "contenu": "Contenu de test"
  }'
```

**Résultat attendu** : Status 201 avec l'ID de l'article créé

### Test 3 : Importation complète

```bash
curl -X POST https://www.xn--beam-yqa.fr/api/articles/import \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 8f9f50cf8fc547034b897f6cb04d359d3697b46274eef67e4d5ad5492493dd05" \
  -d '{
    "titre": "Guide complet de la copropriété",
    "slug": "guide-copropriete",
    "contenu": "# Introduction\n\nCe guide vous explique...",
    "extrait": "Tout ce que vous devez savoir sur la copropriété",
    "categorie": "guides",
    "type": "articles",
    "tags": "copropriété, guide, immobilier",
    "piece_jointe": "https://drive.google.com/file/d/123",
    "meta_description": "Guide complet sur la copropriété",
    "meta_title": "Guide Copropriété - Beamô"
  }'
```

**Résultat attendu** : Status 201 avec toutes les informations de l'article

## Sécurité

1. **Clé API** : Ne partagez jamais votre clé API publiquement
2. **HTTPS** : Utilisez toujours HTTPS en production
3. **Rotation** : Pensez à régénérer la clé API périodiquement
4. **Logs** : Surveillez les logs pour détecter les tentatives d'accès non autorisées

## Support

Pour toute question ou problème :
- Email : tom.lemeille@xn--beam-yqa.fr
- Documentation : Ce fichier
- Logs serveur : Consultez les logs Next.js pour le débogage

## Fichiers créés/modifiés

1. **Nouveau** : `/nextjs-app/src/lib/api-auth.ts` - Middleware d'authentification
2. **Nouveau** : `/nextjs-app/src/app/api/articles/import/route.ts` - Endpoint d'importation
3. **Modifié** : `/nextjs-app/src/types/article.ts` - Ajout du type `NotionArticleImport`
4. **Modifié** : `/nextjs-app/.env.local` - Ajout de `BEAMO_API_KEY`

## Version

- **Version** : 1.0.0
- **Date de création** : 15 octobre 2025
- **Dernière mise à jour** : 15 octobre 2025
