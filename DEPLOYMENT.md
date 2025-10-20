# 🚀 Guide de Déploiement Beamô

Ce guide explique comment utiliser les environnements de développement et production avec Vercel.

## 📋 Structure des branches

```
main (production) → https://www.beamô.fr
  ↓
dev (développement) → https://dev.beamo-immobilier.fr
```

## 🔧 Configuration Vercel (à faire une seule fois)

### Étape 1 : Accéder au Dashboard Vercel

1. Va sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Connecte-toi avec ton compte GitHub
3. Sélectionne le projet **beam-_app**

### Étape 2 : Configurer la branche de développement

1. **Settings** → **Git**
2. Section **Production Branch** : vérifie que c'est `main`
3. Section **Preview Deployments** :
   - Active **"All branches"** ou **"Only branches matching pattern"** avec pattern `dev`

### Étape 3 : Ajouter le domaine de développement

1. **Settings** → **Domains**
2. Clique sur **"Add"**
3. Entre : `dev.beamo-immobilier.fr`
4. Vercel va te demander de configurer ton DNS (voir Étape 4)
5. Une fois le domaine ajouté, clique sur les **3 points** → **Edit**
6. Dans **Git Branch**, sélectionne `dev`
7. Sauvegarde

### Étape 4 : Configuration DNS

Sur ton **registrar de domaine** (là où tu as acheté beamo-immobilier.fr) :

1. Va dans la gestion DNS
2. Ajoute un nouvel enregistrement **CNAME** :
   ```
   Type: CNAME
   Nom/Host: dev
   Valeur/Target: cname.vercel-dns.com
   TTL: Auto ou 3600
   ```
3. Sauvegarde

⏱️ **Temps de propagation DNS :** 5 minutes à 48 heures (généralement ~15 min)

### Étape 5 : Variables d'environnement (optionnel)

Si tu veux des variables différentes pour dev et production :

1. **Settings** → **Environment Variables**
2. Pour chaque variable :
   - Coche **Production** pour l'environnement de production
   - Coche **Preview** pour l'environnement de dev
   - Entre des valeurs différentes si nécessaire

Exemple :
```
NEXT_PUBLIC_API_URL
  Production: https://api.beamo-immobilier.fr
  Preview: https://dev-api.beamo-immobilier.fr
```

## 📝 Workflow Git Quotidien

### Pour développer une nouvelle fonctionnalité :

```bash
# 1. S'assurer d'être sur dev et à jour
git checkout dev
git pull origin dev

# 2. Créer une branche de feature (optionnel mais recommandé)
git checkout -b feature/ma-nouvelle-fonctionnalite

# 3. Faire des modifications, tester localement
npm run dev

# 4. Commiter les changements
git add .
git commit -m "feat: description de la fonctionnalité"

# 5. Pousser sur dev (ou merger dans dev d'abord si feature branch)
git checkout dev
git merge feature/ma-nouvelle-fonctionnalite  # Si feature branch
git push origin dev
```

🎉 **Vercel va automatiquement :**
- Détecter le push sur `dev`
- Builder l'application
- Déployer sur `dev.beamo-immobilier.fr`
- T'envoyer un email de notification

### Pour déployer en production :

```bash
# 1. S'assurer que dev fonctionne bien
# Tester sur https://dev.beamo-immobilier.fr

# 2. Merger dev dans main
git checkout main
git pull origin main
git merge dev

# 3. Pousser sur main
git push origin main
```

🚀 **Vercel va automatiquement :**
- Détecter le push sur `main`
- Builder l'application
- Déployer sur `https://www.beamô.fr` (ou beamo-immobilier.fr)
- T'envoyer un email de notification

## 🔍 Vérification et Monitoring

### Vérifier un déploiement

1. Va sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionne ton projet
3. Tu verras la liste des déploiements
4. Clique sur un déploiement pour voir :
   - Les logs de build
   - Les erreurs éventuelles
   - L'URL de preview

### URLs de test

- **Production** : https://www.beamô.fr (ou https://beamo-immobilier.fr)
- **Développement** : https://dev.beamo-immobilier.fr
- **Preview automatique** : Vercel crée aussi une URL unique pour chaque commit

## 🆘 Dépannage

### Le déploiement échoue

1. Vérifie les logs dans Vercel Dashboard → Deployments → Click sur le déploiement qui a échoué
2. Cherche l'erreur dans les logs
3. Corrige localement et repousse

### Le domaine ne fonctionne pas

1. Vérifie que le CNAME DNS est bien configuré :
   ```bash
   nslookup dev.beamo-immobilier.fr
   # Devrait pointer vers cname.vercel-dns.com
   ```
2. Attends la propagation DNS (jusqu'à 48h)
3. Vérifie dans Vercel → Domains que le domaine est bien assigné à la branche `dev`

### Rollback en cas de problème

**Via Vercel Dashboard :**
1. Va sur Deployments
2. Trouve le dernier déploiement qui fonctionnait
3. Clique sur les **3 points** → **Promote to Production** (ou **Redeploy**)

**Via Git :**
```bash
# Revenir au commit précédent
git checkout main
git log  # Trouver le hash du commit à restaurer
git revert <hash-du-commit-problématique>
git push origin main
```

## 📊 Statistiques et Analytics

Vercel fournit automatiquement :
- **Analytics** : Visites, pages vues, performance
- **Speed Insights** : Core Web Vitals
- **Logs** : Logs en temps réel des fonctions serverless

Accès : Dashboard → Ton projet → **Analytics** / **Speed Insights**

## 🎯 Bonnes pratiques

### ✅ À FAIRE

- ✅ Toujours tester sur `dev` avant de merger dans `main`
- ✅ Faire des commits petits et fréquents
- ✅ Écrire des messages de commit descriptifs
- ✅ Vérifier que le build passe localement (`npm run build`)
- ✅ Tester les fonctionnalités critiques après chaque déploiement

### ❌ À ÉVITER

- ❌ Ne jamais pousser directement sur `main` sans tester sur `dev`
- ❌ Ne jamais commiter de secrets (API keys, mots de passe)
- ❌ Ne pas ignorer les erreurs de build
- ❌ Ne pas déployer le vendredi soir (sauf urgence !)

## 🔐 Sécurité

### Variables secrètes

Les secrets (API keys, tokens) doivent **TOUJOURS** être dans :
- Fichier `.env.local` en local (non commité)
- Variables d'environnement Vercel (Settings → Environment Variables)

**JAMAIS** dans le code source !

### Exemple de `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# EmailJS
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=...
NEXT_PUBLIC_EMAILJS_SERVICE_ID=...
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=...

# Autres
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=...
```

## 📞 Support

- **Documentation Vercel** : https://vercel.com/docs
- **Dashboard Vercel** : https://vercel.com/dashboard
- **Support Vercel** : https://vercel.com/support

## 🎉 C'est tout !

Tu es maintenant prêt à déployer Beamô avec un workflow dev → production propre et automatisé !

**Rappel du workflow simple :**
1. Code sur `dev` → pousse → teste sur `dev.beamo-immobilier.fr`
2. Ça marche ? → merge dans `main` → pousse → déploiement automatique sur production

Happy coding! 🚀
