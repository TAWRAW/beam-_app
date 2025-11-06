# 📍 Configuration du lieu Facebook pour le référencement local

**Date:** 4 novembre 2025
**Page Facebook:** https://www.facebook.com/profile.php?id=61582074458665
**Page ID:** `61582074458665`

---

## 🎯 Pourquoi ajouter un lieu ?

Ajouter un lieu (ville/adresse) à vos publications Facebook permet :
- ✅ **Meilleur référencement local** (SEO local)
- ✅ **Visibilité accrue** dans les recherches géolocalisées
- ✅ **Ciblage géographique** automatique
- ✅ **Crédibilité** pour votre audience locale

---

## 📋 Deux méthodes pour obtenir le Place ID

### Méthode 1 : Utiliser un lieu existant (Recommandé)

Si tu as déjà une **adresse professionnelle** enregistrée sur Facebook :

#### Étape 1 : Rechercher ton lieu
1. Va sur Facebook
2. Utilise la barre de recherche
3. Tape le nom de ton agence ou ton adresse
4. Clique sur le lieu s'il existe

#### Étape 2 : Récupérer le Place ID
L'URL ressemblera à :
```
https://www.facebook.com/places/Paris-France/112965888738054/
```

Le **Place ID** est le dernier nombre : `112965888738054`

### Méthode 2 : Rechercher via l'API Graph (Plus précis)

#### Avec le token Facebook (après l'avoir obtenu) :

```bash
curl -i -X GET \
  "https://graph.facebook.com/v18.0/search?type=place&center=48.8566,2.3522&distance=1000&q=ton%20agence&access_token=YOUR_ACCESS_TOKEN"
```

**Paramètres :**
- `center` : Coordonnées GPS (latitude, longitude) de ta ville
- `distance` : Rayon de recherche en mètres (1000m = 1km)
- `q` : Nom de ton agence ou adresse

**Réponse :**
```json
{
  "data": [
    {
      "name": "Nom de ton agence",
      "id": "123456789012345",
      "location": {
        "city": "Paris",
        "country": "France",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "street": "123 rue Example"
      }
    }
  ]
}
```

Le **Place ID** est dans `id` : `123456789012345`

### Méthode 3 : Créer un nouveau lieu (Si n'existe pas)

Si ton agence n'a pas encore de lieu Facebook :

#### Option A : Via la page Facebook
1. Aller sur ta page Facebook
2. **Modifier la page** → **Informations**
3. **Adresse** → Ajouter ton adresse
4. Sauvegarder

Facebook créera automatiquement un Place ID lié à ta page.

#### Option B : Via l'API (plus complexe)
```bash
curl -i -X POST \
  "https://graph.facebook.com/v18.0/{PAGE_ID}/locations" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d "place_id=NEW_PLACE_ID" \
  -d "location={\"street\":\"123 rue Example\",\"city\":\"Paris\",\"country\":\"France\",\"zip\":\"75001\"}"
```

---

## 🌍 Coordonnées GPS des grandes villes françaises

Pour la Méthode 2, voici les coordonnées des principales villes :

| Ville | Latitude | Longitude |
|-------|----------|-----------|
| **Paris** | 48.8566 | 2.3522 |
| **Lyon** | 45.7640 | 4.8357 |
| **Marseille** | 43.2965 | 5.3698 |
| **Toulouse** | 43.6047 | 1.4442 |
| **Nice** | 43.7102 | 7.2620 |
| **Nantes** | 47.2184 | -1.5536 |
| **Strasbourg** | 48.5734 | 7.7521 |
| **Bordeaux** | 44.8378 | -0.5792 |
| **Lille** | 50.6292 | 3.0573 |
| **Rennes** | 48.1173 | -1.6778 |

---

## ⚙️ Configuration dans n8n

Une fois que tu as ton **Facebook Place ID** :

### 1. Ajouter la variable dans n8n

1. Ouvrir https://n8n.srv982695.hstgr.cloud
2. **Settings** → **Variables**
3. Ajouter :
   - **Name:** `FACEBOOK_PLACE_ID`
   - **Value:** `TON_PLACE_ID` (ex: `112965888738054`)
4. Sauvegarder

### 2. Vérifier les workflows

Les workflows ont déjà été mis à jour pour utiliser cette variable :

**Node "Facebook - Publier" :**
```json
{
  "message": "...",
  "link": "...",
  "place": "={{ $env.FACEBOOK_PLACE_ID }}"  ← Ajouté automatiquement
}
```

---

## 🔍 Vérification

Pour vérifier que le lieu est bien ajouté :

### Test avec Graph API Explorer :

1. Va sur https://developers.facebook.com/tools/explorer
2. Sélectionne ta page
3. Teste une publication :

```
POST /v18.0/{PAGE_ID}/feed
{
  "message": "Test de publication avec lieu",
  "link": "https://www.beamô.fr",
  "place": "TON_PLACE_ID"
}
```

4. Va sur ta page Facebook et vérifie que le lieu apparaît sur le post

---

## 📝 Quelle ville utiliser ?

**Recommandations :**

### Si tu as un bureau physique :
✅ Utilise le lieu de ton agence (meilleur pour le SEO local)

### Si tu travailles dans toute une région :
- **Option 1 :** Utilise la ville principale de ta zone
- **Option 2 :** Créer des lieux différents selon l'article (avancé)

### Si tu es 100% en ligne :
- Pas nécessaire d'ajouter un lieu
- Ou utilise la ville où tu es le plus actif

---

## 💡 Conseils SEO Local

Pour maximiser le référencement local avec le lieu :

1. ✅ **Cohérence :** Utilise toujours le même lieu pour ta marque
2. ✅ **NAP :** Assure-toi que Name, Address, Phone sont identiques partout
3. ✅ **Google My Business :** Configure aussi ton profil GMB
4. ✅ **Mots-clés locaux :** Ajoute la ville dans tes hashtags (ex: #ImmobilierParis)

---

## ❓ Questions fréquentes

### Le Place ID expire-t-il ?
Non, le Place ID Facebook est permanent.

### Puis-je utiliser plusieurs lieux ?
Oui ! Tu peux créer une logique conditionnelle dans n8n pour utiliser différents lieux selon l'article ou la zone géographique.

### Le lieu est-il obligatoire ?
Non, les publications fonctionneront sans lieu. Mais pour le SEO local, c'est fortement recommandé.

### Que se passe-t-il si le Place ID est invalide ?
La publication fonctionnera quand même, mais sans le lieu. Aucune erreur ne sera levée.

---

## 🎯 Prochaine étape

1. **Décide quelle ville/adresse utiliser**
2. **Récupère ton Place ID** (avec une des 3 méthodes ci-dessus)
3. **Ajoute-le dans n8n** (Settings → Variables)
4. **Teste une publication** pour vérifier que le lieu apparaît

---

**Besoin d'aide ?** Dis-moi :
- Quelle ville tu veux utiliser
- Si tu as déjà un lieu Facebook existant
- Si tu préfères que je t'aide à récupérer le Place ID avec l'API

---

**Documentation mise à jour dans :** `SETUP_WORKFLOWS_N8N.md`
