# Configuration Google Indexing API

Guide complet pour configurer la soumission automatique des URLs à Google.

## Prérequis

- Un compte Google
- Accès à Google Search Console pour votre site
- Node.js installé

## Étape 1 : Créer un projet Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Nommer le projet (ex: "Beamo Indexing")

## Étape 2 : Activer l'API Indexing

1. Dans le menu, aller à **APIs & Services** > **Library**
2. Chercher "**Indexing API**"
3. Cliquer sur "**Enable**" (Activer)

## Étape 3 : Créer un compte de service

1. Aller à **APIs & Services** > **Credentials**
2. Cliquer sur **Create Credentials** > **Service Account**
3. Remplir :
   - **Service account name**: `indexing-bot`
   - **Service account ID**: `indexing-bot` (auto-généré)
   - **Description**: "Bot pour soumettre les URLs à Google"
4. Cliquer sur **Create and Continue**
5. Pour le rôle, sélectionner : **Owner** (ou minimum **Editor**)
6. Cliquer sur **Done**

## Étape 4 : Créer une clé JSON

1. Dans la liste des comptes de service, cliquer sur celui que vous venez de créer
2. Aller dans l'onglet **Keys**
3. Cliquer sur **Add Key** > **Create new key**
4. Choisir le format **JSON**
5. Cliquer sur **Create**
6. Le fichier JSON se télécharge automatiquement

## Étape 5 : Configurer le fichier de credentials

1. Renommer le fichier téléchargé en `google-credentials.json`
2. Le placer dans le dossier racine de `nextjs-app/`
3. **IMPORTANT**: Ajouter ce fichier au `.gitignore` :

```bash
echo "google-credentials.json" >> .gitignore
```

## Étape 6 : Autoriser le compte de service dans Google Search Console

1. Ouvrir le fichier `google-credentials.json`
2. Copier la valeur du champ `"client_email"` (ex: `indexing-bot@projet.iam.gserviceaccount.com`)
3. Aller sur [Google Search Console](https://search.google.com/search-console)
4. Sélectionner votre propriété (`www.xn--beam-yqa.fr`)
5. Aller dans **Paramètres** > **Utilisateurs et autorisations**
6. Cliquer sur **Ajouter un utilisateur**
7. Coller l'email du compte de service
8. Sélectionner l'autorisation **Propriétaire**
9. Cliquer sur **Ajouter**

## Étape 7 : Installer les dépendances

```bash
npm install googleapis
```

## Étape 8 : Tester le script

### Soumettre une URL spécifique
```bash
node scripts/submit-to-google.js https://www.xn--beam-yqa.fr/ressources/mon-article
```

### Soumettre tous les articles publiés
```bash
node scripts/submit-to-google.js
```

## Variables d'environnement (optionnel)

Vous pouvez définir le chemin des credentials dans `.env.local` :

```env
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
```

## Quotas et limitations

- **200 URLs par jour** maximum
- Pas de garantie d'indexation immédiate
- Utilisez avec parcimonie (nouveaux contenus uniquement)

## Automatisation

### Option 1 : Automatiser via n8n

Créer un workflow n8n qui :
1. Se déclenche lors de la publication d'un article (webhook Supabase)
2. Appelle le script de soumission

### Option 2 : Trigger Supabase

Créer une fonction Edge Supabase qui appelle Google Indexing API quand un article passe à `status='published'`

### Option 3 : Hook Git

Ajouter un hook post-deployment qui soumet les nouveaux articles

## Vérification

1. Aller dans [Google Search Console](https://search.google.com/search-console)
2. Utiliser l'outil **Inspection d'URL**
3. Vérifier le statut d'indexation de vos URLs

## Dépannage

### Erreur "Invalid credentials"
- Vérifiez que le fichier JSON est au bon endroit
- Vérifiez que l'API Indexing est activée

### Erreur "Permission denied"
- Vérifiez que le compte de service est bien ajouté dans GSC
- Vérifiez que les rôles sont corrects

### Erreur "Quota exceeded"
- Vous avez dépassé les 200 URLs/jour
- Attendez 24h

## Sécurité

⚠️ **ATTENTION** : Le fichier `google-credentials.json` contient des secrets !

- Ne JAMAIS commit ce fichier dans Git
- Ne JAMAIS le partager publiquement
- Vérifier qu'il est dans `.gitignore`

## Ressources

- [Documentation Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart)
- [Google Search Console](https://search.google.com/search-console)
- [Google Cloud Console](https://console.cloud.google.com/)
