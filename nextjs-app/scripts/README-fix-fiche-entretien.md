# Correction du lien de téléchargement de la fiche d'entretien syndic

## Problème
Sur la page `https://www.xn--beam-yqa.fr/ressources/fiche-entretien-syndic`, le texte "Télécharger la fiche d'entretien syndic (PDF)" n'est pas un lien cliquable.

## Solution
Le texte doit être transformé en lien Markdown pointant vers `https://drive.google.com/file/d/190Pit5zEqor_7fbeTMTtqZ3yW2UZvIlB/view`.

## Options de correction

### Option 1 : SQL directement dans Supabase (RECOMMANDÉ - Le plus simple)
1. Ouvrez votre dashboard Supabase
2. Allez dans le SQL Editor
3. Copiez et exécutez le contenu du fichier `fix-fiche-entretien-link.sql`
4. Vérifiez le résultat

### Option 2 : Script Node.js avec paramètres
```bash
node scripts/fix-fiche-entretien-link-with-params.js <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>
```

### Option 3 : Script Node.js avec variables d'environnement
1. Créez un fichier `.env.local` à la racine du projet `nextjs-app` avec :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```
2. Exécutez :
```bash
node scripts/fix-fiche-entretien-link.js
```

## Vérification
Après l'exécution, visitez la page `https://www.xn--beam-yqa.fr/ressources/fiche-entretien-syndic` et vérifiez que le lien est maintenant cliquable.

Note : La page peut mettre jusqu'à 1 heure à se mettre à jour à cause du cache (revalidate: 3600 secondes).
