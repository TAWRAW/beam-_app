# 📖 GUIDE DE MAINTENANCE - Application Beamô

## 🏗️ Architecture Générale

L'application Beamô est construite avec **Next.js 14** (App Router) + **Supabase** + **Vercel**.

### Stack Technique
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Déploiement**: Vercel
- **Auth**: Session HMAC temporaire + middleware protection
- **CMS**: Interface admin custom pour articles

---

## 📄 PAGES PRINCIPALES - Guide Développeur

### 🏠 Page d'Accueil (`/page.tsx`)
**Fonction**: Landing page principale avec SEO local optimisé
**Composants**: Carousel, Features, Squares, FinalCta
**SEO**: Métadonnées complètes + JSON-LD LocalBusiness + Service
**Maintenance**:
- Modifier métadonnées si nouvelles zones géographiques
- Ajuster données structurées pour nouvelles offres
- Composants sections dans `/components/sections/`

### 🔐 Connexion (`/login/page.tsx`)
**Fonction**: Auth temporaire pour admin
**Sécurité**: Sessions HMAC signées, cookies httpOnly
**Flow**: Email/password → API /auth/login → redirect /apps
**Maintenance**:
- Logique auth dans `/components/auth/LoginForm`
- API dans `/api/auth/login`
- Session management dans middleware.ts

### 📊 Dashboard Admin (`/apps/page.tsx`)
**Fonction**: Hub central administration
**Protection**: Middleware auth obligatoire
**Layout**: Sidebar commune dans `/apps/layout.tsx`
**Évolution**: Ajouter widgets statistiques, graphiques
**Maintenance**: Protected zone, voir middleware.ts

### ✍️ Création Articles (`/apps/articles/new/page.tsx`)
**Fonction**: Éditeur markdown complet
**Features**: Auto-slug, preview, upload images, SEO
**API**: POST /api/articles → redirect vers édition
**Validation**: validateArticle() dans types/article.ts
**Maintenance**:
- Types articles dans `/types/article.ts`
- Upload images via composant `ImageUpload`
- API CRUD dans `/api/articles/`

### 🏪 Offres (`/offres/page.tsx`)
**Fonction**: Page commerciale services
**Offres**: Standard, Hybride, Clos-Masure (en dev)
**SEO**: Données structurées OfferCatalog
**Maintenance**:
- Ajouter nouvelles offres dans JSON-LD + grid
- Mettre à jour statut Clos-Masure
- Vérifier CTA vers pages détail

### 🌍 Pages Villes (`/ville/[slug]/page.tsx`)
**Fonction**: SEO local géographique (47 villes)
**Génération**: SSG via generateStaticParams()
**Data**: Configuration dans `/lib/cities.ts`
**SEO**: Métadonnées personnalisées + LocalBusiness + FAQPage
**Maintenance**:
- Ajouter villes dans cities.ts
- Adapter FAQ par zone
- Vérifier maillage interne NearbyCities

---

## 🔧 MODULES ADMINISTRATIFS

### 📝 Gestionnaire Articles (`/apps/articles/`)
- **Liste**: `/apps/articles/page.tsx` - Tableau filtrable avec pagination
- **Création**: `/apps/articles/new/page.tsx` - Éditeur complet
- **Édition**: `/apps/articles/[id]/edit/page.tsx` - Modification articles
- **API**: CRUD complet dans `/api/articles/`
- **Types**: Définitions dans `/types/article.ts`

### 📋 Générateur Mandats (`/apps/mandats/page.tsx`)
**Fonction**: Interface génération contrats via n8n
**Workflow**: Formulaire → Webhook n8n → Google Docs → PDF → Email
**API**: POST /api/mandats/generate (sécurisé Basic Auth)
**Maintenance**: Webhook URL et auth dans variables d'env

### 👥 Gestion Utilisateurs (`/apps/users/page.tsx`)
**Fonction**: Interface admin des comptes
**Features**: Tableau, filtres, promotion admin
**Protection**: Accès admin uniquement
**API**: Routes dans `/api/users/`

---

## 🌐 PAGES PUBLIQUES

### 📞 Contact (`/ressources/contact/page.tsx`)
**Fonction**: Formulaire contact + infos
**Service**: EmailJS pour envoi emails
**Validation**: Côté client + anti-spam
**Maintenance**: Clés EmailJS dans variables d'env

### 📚 Ressources (`/ressources/page.tsx` + `/ressources/[slug]/page.tsx`)
**Fonction**: Galerie articles publics par catégorie
**Source**: Articles Supabase status='published'
**SEO**: Métadonnées dynamiques par article
**Routes**: /ressources/guides, /ressources/actualites, etc.

### ℹ️ Pages Légales
- `/qui-sommes-nous/page.tsx` - Présentation entreprise
- `/mentions-legales/page.tsx` - Mentions obligatoires
- `/politique-de-confidentialite/page.tsx` - RGPD
- `/conditions-utilisation/page.tsx` - CGU

### 🚧 Pages Système
- `/en-cours/page.tsx` - Fonctionnalités en développement
- `/403/page.tsx` - Erreur accès refusé
- `/404.tsx` + `/500.tsx` - Erreurs personnalisées
- `/logout/page.tsx` - Déconnexion

---

## 🛡️ SÉCURITÉ & AUTHENTIFICATION

### Middleware Protection (`middleware.ts`)
```typescript
// Protège toutes les routes /apps/*
// Vérifie session HMAC signée
// Redirection auto vers /login si non connecté
```

### Session Management
- **Cookies**: httpOnly, secure, sameSite
- **Signature**: HMAC avec SESSION_SECRET
- **Durée**: Configurable (par défaut 7 jours)
- **Logout**: Suppression cookie + redirect

### Variables d'Environnement Critiques
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Auth temporaire
ADMIN_EMAIL=
ADMIN_PASSWORD=
SESSION_SECRET=

# n8n Workflow
N8N_WEBHOOK_URL=
N8N_WEBHOOK_AUTH=
```

---

## 📊 BASE DE DONNÉES (Supabase)

### Table `articles`
```sql
-- Colonnes principales
id, title, slug, content, excerpt, meta_description
author_id, category, type, tags, status
featured_image_url, attachment_url
seo_title, seo_keywords
reading_time_minutes, views_count
published_at, created_at, updated_at

-- RLS activée
-- Triggers auto: reading_time, updated_at
```

### Table `profiles`
```sql
-- Utilisateurs admin
id, email, full_name, role, avatar_url
created_at, updated_at

-- Rôles: 'user' | 'admin'
```

---

## 🚀 DÉPLOIEMENT & CI/CD

### Vercel Configuration
- **Build**: `npm run build`
- **Framework**: Next.js
- **Variables**: Env production configurées
- **Domaine**: xn--beam-yqa.fr (punycode pour beamô.fr)

### Workflow Git
1. **Développement**: Local sur port 3000
2. **Commit**: Git add + commit avec messages descriptifs
3. **Push**: GitHub main branch
4. **Auto-deploy**: Vercel détecte et build
5. **Production**: Disponible sur https://www.xn--beam-yqa.fr

### Commandes Utiles
```bash
# Développement
npm run dev

# Build production
npm run build

# Création admin
npm run create:admin -- --email="admin@example.com"

# Types check
npm run type-check
```

---

## 🎨 DESIGN SYSTEM

### Couleurs Beamô
- **Primary**: #FFC300 (jaune signature)
- **Neutral**: Gris pour textes
- **Cards**: Blanc avec ombres subtiles

### Typographie
- **Font**: Poppins (Google Fonts)
- **Hiérarchie**: h1, h2, h3 avec classes utilities
- **Responsive**: Mobile-first approach

### Composants UI
- **shadcn/ui**: Système de composants base
- **Custom**: Extensions Beamô-spécifiques
- **Icons**: Lucide React

---

## 🔍 SEO & RÉFÉRENCEMENT

### Métadonnées Next.js
- **generateMetadata()**: Pages dynamiques
- **metadata export**: Pages statiques
- **OpenGraph**: Partage réseaux sociaux
- **Twitter Cards**: Optimisation Twitter

### Données Structurées
- **LocalBusiness**: Référencement local
- **Service**: Description prestations
- **FAQPage**: Questions/réponses
- **Article**: Articles de blog

### Sitemap & Robots
- **Sitemap**: Auto-généré (`/sitemap.xml`)
- **Robots**: Configuration dans `/robots.txt`
- **Canonical**: URLs canoniques définies

---

## 🐛 DÉBOGAGE COMMUN

### Problèmes Auth
- **Session expirée**: Vérifier SESSION_SECRET
- **Middleware**: Logs dans console dev
- **Cookies**: Vérifier httpOnly + secure

### Erreurs Supabase
- **RLS**: Vérifier Row Level Security
- **API Keys**: SUPABASE_SERVICE_ROLE_KEY
- **Triggers**: reading_time_minutes auto-calculé

### Performance
- **SSG**: Pages villes pré-générées
- **Images**: Optimisation Next.js
- **Bundle**: Analyse avec `npm run build`

---

## 📋 CHECKLIST MAINTENANCE

### Mensuel
- [ ] Vérifier certificats SSL
- [ ] Contrôler performances Vercel
- [ ] Sauvegarder base Supabase
- [ ] Mettre à jour dépendances

### Lors d'ajouts
- [ ] Nouvelles villes → cities.ts
- [ ] Nouveaux articles → vérifier SEO
- [ ] Nouvelles offres → JSON-LD
- [ ] Nouvelles pages → middleware si admin

### Monitoring
- [ ] Logs erreurs Vercel
- [ ] Métriques Core Web Vitals
- [ ] Taux de conversion contact
- [ ] Performance recherche Google

---

## 📞 SUPPORT TECHNIQUE

### Contacts Clés
- **Développement**: Code source GitHub
- **Hosting**: Vercel Dashboard
- **Base de données**: Supabase Console
- **Domaine**: Registrar DNS

### Documentation Externe
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

*Guide créé le 29/09/2025 - Version 1.0*
*Application Beamô - Syndic de Copropriété Moderne*