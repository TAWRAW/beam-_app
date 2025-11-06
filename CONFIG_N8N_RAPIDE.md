# ⚡ Configuration n8n - Guide Ultra Rapide (5 min)

**Lien n8n :** https://n8n.srv982695.hstgr.cloud

---

## 1️⃣ Créer le credential Facebook (2 min)

1. **Settings** (icône engrenage) → **Credentials** → **Add credential**
2. Recherche : **"HTTP Header Auth"**
3. Remplis :
   - **Credential name :** `Facebook Header Auth`
   - **Name :** `Authorization`
   - **Value :** `Bearer YOUR_FACEBOOK_ACCESS_TOKEN` *(génère un nouveau token depuis Facebook Developers - voir SETUP_WORKFLOWS_N8N.md)*
4. **Save**

---

## 2️⃣ Ajouter les variables (1 min)

1. **Settings** → **Environment** (ou **Variables**)
2. **Add Variable** (3 fois) :

| Name | Value |
|------|-------|
| `FACEBOOK_PAGE_ID` | `835000629696626` |
| `FACEBOOK_PLACE_ID` | *(laisse vide pour l'instant)* |
| `LINKEDIN_ORGANIZATION_ID` | *(à remplir après LinkedIn)* |

3. **Save**

---

## 3️⃣ Créer le credential Supabase (1 min)

1. **Settings** → **Credentials** → **Add credential**
2. Recherche : **"Supabase"**
3. Remplis :
   - **Credential name :** `Supabase API`
   - **Host :** `https://zhtstxdbersquchtlkzm.supabase.co`
   - **Service Role Key :** *(récupère depuis ton fichier `.env.local` local - NE JAMAIS commiter)*
4. **Save**

---

## 4️⃣ Créer le credential LinkedIn OAuth2 (2 min)

1. **Settings** → **Credentials** → **Add credential**
2. Recherche : **"LinkedIn OAuth2 API"**
3. Remplis avec tes infos LinkedIn :
   - **Credential name :** `LinkedIn OAuth2`
   - **Client ID :** *(ton Client ID LinkedIn)*
   - **Client Secret :** *(ton Client Secret LinkedIn)*
4. **Click "Connect my account"** → Autoriser dans la popup
5. **Save**

---

## 5️⃣ Assigner les credentials aux workflows (1 min)

### Workflow 1 : Webhook Receiver
https://n8n.srv982695.hstgr.cloud/workflow/rz2njkEsWeKGBnNT

Clique sur chaque node rouge et sélectionne le credential :
- **Supabase - Insérer dans queue** → `Supabase API`
- **Facebook - Publier** → `Facebook Header Auth`
- **LinkedIn - Publier** → `LinkedIn OAuth2`

**Save** → **Active** (toggle ON)

### Workflow 2 : Queue Processor
https://n8n.srv982695.hstgr.cloud/workflow/YtrDp4e3ka6hysjG

Clique sur chaque node rouge et sélectionne le credential :
- **Supabase - Récupérer items pending** → `Supabase API`
- **Supabase - Marquer processing** → `Supabase API`
- **Facebook - Publier** → `Facebook Header Auth`
- **LinkedIn - Publier** → `LinkedIn OAuth2`
- **Update Article - Facebook** → `Supabase API`
- **Update Article - LinkedIn** → `Supabase API`
- **Supabase - Marquer completed** → `Supabase API`

**Save** → **Active** (toggle ON)

---

## ✅ C'est prêt !

Tu peux maintenant tester depuis http://localhost:3000/apps/articles

---

**Note :** Le `FACEBOOK_PLACE_ID` est optionnel pour commencer. On l'ajoutera après si tu veux le lieu pour le SEO local.
