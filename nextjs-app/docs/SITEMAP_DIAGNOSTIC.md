# 🔍 Diagnostic: Articles non présents dans le sitemap

## Symptôme
Les articles rédigés dans `/ressources` n'apparaissent pas dans le sitemap XML et ne sont donc pas indexés par Google.

## Causes possibles

### 1️⃣ Articles non publiés (CAUSE LA PLUS PROBABLE)

Le sitemap **ne récupère que les articles avec `status = 'published'`**.

**Comment vérifier:**
```bash
cd nextjs-app
node scripts/check-sitemap-articles.js
```

Ce script vous indiquera:
- Combien d'articles existent au total
- Combien ont le statut "published"
- Quel est le statut de chaque article

**Solution:**
1. Connectez-vous à l'interface admin: `/apps/articles`
2. Pour chaque article:
   - Cliquez sur "Éditer"
   - Changez le statut de "Brouillon" à "Publié"
   - **Vérifiez que la date de publication est définie**
   - Sauvegardez

### 2️⃣ Variables d'environnement manquantes en production

Le sitemap a besoin de:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (pas la clé publique !)

**Comment vérifier:**

Vérifiez les logs de build/production pour ces messages:
```
❌ Sitemap: Missing Supabase environment variables
⚠️  Sitemap: No published articles found in database
```

**Solution:**
1. Vérifiez votre plateforme de déploiement (Vercel, etc.)
2. Assurez-vous que les variables d'environnement sont définies
3. **Important**: Utilisez la `SUPABASE_SERVICE_ROLE_KEY`, pas la clé anonyme/publique

### 3️⃣ Cache Next.js non invalidé

Le sitemap utilise ISR (Incremental Static Regeneration) avec revalidation toutes les heures.

**Solution rapide:**

Option A - Forcer la revalidation:
```bash
curl -X POST https://votre-site.fr/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"votre-token","path":"/sitemap.xml"}'
```

Option B - Attendre la revalidation automatique (1 heure max)

Option C - Rebuild complet:
```bash
npm run build
```

### 4️⃣ Problème de permissions RLS (Row Level Security)

Si vous utilisez une clé publique au lieu de la service role key, les policies RLS s'appliquent.

**La policy actuelle permet:**
```sql
CREATE POLICY "Articles publiés lisibles par tous" ON articles
    FOR SELECT USING (status = 'published');
```

✅ Avec `SUPABASE_SERVICE_ROLE_KEY` → Bypass RLS, peut tout lire
❌ Avec clé publique → Soumis au RLS, peut seulement lire published

**Solution:**
Vérifiez que vous utilisez bien `SUPABASE_SERVICE_ROLE_KEY` (pas `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Diagnostic complet

### Étape 1: Vérifier les articles

```bash
cd nextjs-app
node scripts/check-sitemap-articles.js
```

Ce script vous donnera un diagnostic complet et identifiera le problème.

### Étape 2: Vérifier les logs de production

Cherchez ces messages dans vos logs:
- `✅ Sitemap: Found X published article(s)` → Tout va bien
- `⚠️  Sitemap: No published articles found` → Articles non publiés
- `❌ Sitemap: Error fetching articles` → Problème de connexion/permissions

### Étape 3: Tester le sitemap localement

```bash
# 1. Copier .env.local.example vers .env.local et remplir les variables
cp .env.local.example .env.local

# 2. Lancer le dev server
npm run dev

# 3. Visiter http://localhost:3000/sitemap.xml

# 4. Vérifier les logs dans la console
```

### Étape 4: Vérifier directement dans Supabase

1. Ouvrir Supabase Dashboard
2. Aller dans "Table Editor" → "articles"
3. Vérifier le statut de chaque article
4. S'assurer que `status = 'published'` pour les articles à indexer
5. S'assurer que `published_at` est défini (pas NULL)

## Checklist de résolution

- [ ] Les articles ont le statut "published" (vérifier avec le script)
- [ ] Les articles ont une date `published_at` définie
- [ ] Les variables d'environnement sont correctement configurées en production
- [ ] `SUPABASE_SERVICE_ROLE_KEY` est utilisée (pas la clé publique)
- [ ] Le cache a été invalidé (revalidation forcée ou rebuild)
- [ ] Le sitemap se génère sans erreur (vérifier les logs)
- [ ] Le sitemap contient bien les URLs des articles (visiter /sitemap.xml)

## Vérification finale

Une fois corrigé, vérifiez:

1. **Sitemap accessible:**
   ```
   https://www.xn--beam-yqa.fr/sitemap.xml
   ```

2. **Articles présents dans le sitemap:**
   Cherchez les entrées `<loc>https://www.xn--beam-yqa.fr/ressources/votre-slug</loc>`

3. **Google Search Console:**
   - Soumettre le sitemap
   - Demander l'indexation des URLs d'articles
   - Utiliser l'outil "Inspection d'URL"

## Temps d'indexation par Google

⏱️ Après correction:
- Sitemap mis à jour: **Instantané** (après revalidation)
- Google découvre le sitemap: **Quelques heures à 24h**
- Google indexe les pages: **1-7 jours** (dépend de la fréquence de crawl)

Pour accélérer:
1. Soumettre le sitemap dans Google Search Console
2. Demander l'indexation manuelle via "Inspection d'URL"
3. Créer des backlinks vers vos articles

## Support

Si le problème persiste après avoir suivi ce guide:
1. Exécutez `node scripts/check-sitemap-articles.js`
2. Copiez la sortie complète
3. Vérifiez les logs de production
4. Contactez le support avec ces informations
