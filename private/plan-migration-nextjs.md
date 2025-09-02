# 🚀 Plan de Migration Beamô : HTML → Next.js

## 📊 Vue d'ensemble du projet

### État actuel
- **30+ pages HTML** statiques
- **14 fichiers CSS** modulaires
- **11 fichiers JavaScript** vanilla
- **1 système Strapi** (newsletter)
- **Architecture bien structurée** mais répétitive

---

## ✅ Décisions validées

- **Framework**: Next.js 14 (App Router) avec SSG/ISR (pas d'`output: 'export'`).
- **CMS**: Strapi comme source de vérité (unifier, pas de Notion en prod côté site).
- **Hébergement**: Vercel (Node runtime), déploiements automatiques, CDN intégré.
- **DNS/CDN**: Cloudflare (plan gratuit) en DNS only (proxy/edge rules optionnels si besoin).
- **CSS**: Tailwind dès maintenant, migration progressive par pages prioritaires.
- **Formulaire**: EmailJS conservé pour le MVP (durci côté client). Évolution possible plus tard (API route + Resend/SMTP ou n8n).

---

### Objectif cible
- **Application Next.js 14** avec App Router
- **TypeScript** pour la robustesse
- **Tailwind CSS** pour l'optimisation
- **Composants réutilisables**
- **Performance optimisée** (Core Web Vitals)

---

## 🎯 Stratégie de migration hybride

### Phase de transition
```
📦 Architecture hybride temporaire :
├── legacy-site/ (Site HTML actuel)
├── nextjs-app/ (Nouvelle application)
└── proxy/ (Routage intelligent)
```

### Avantages
✅ **Zéro downtime** - Site toujours accessible  
✅ **Migration progressive** - Page par page  
✅ **Tests en production** - Validation continue  
✅ **Rollback facile** - Retour arrière instantané  
✅ **SEO préservé** - Aucune perte de référencement  

### Fallback legacy pendant la migration
- Option A (recommandée): gérer les routes côté DNS/Proxy (Cloudflare) pour laisser le legacy servir les pages non encore migrées.
- Option B: embarquer le legacy sous `public/legacy` dans Next et router explicitement les rares pages nécessaires.

---

## 📋 Plan détaillé de migration

### 🏗️ **PHASE 1 : Préparation & Setup (Semaine 1)**

#### Jour 1-2 : Analyse & Architecture
- [ ] **Audit complet du site existant**
  - Inventaire des 30 pages HTML
  - Analyse des dépendances CSS/JS
  - Identification des formulaires PHP
  - Cartographie des redirections (.htaccess)

- [ ] **Setup du projet Next.js**
  ```bash
  npx create-next-app@latest beamo-nextjs --typescript --tailwind --app
  cd beamo-nextjs
  npm install @next/font lucide-react framer-motion
  ```

- [ ] **Configuration de base (Node runtime, pas d'export)**
  ```javascript
  // next.config.js
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    trailingSlash: false,
    // ISR contrôlé dans les pages (revalidate)
    // Rewrites optionnelles si legacy embarqué sous /legacy
    // async rewrites() {
    //   return [{ source: '/legacy/:path*', destination: '/legacy/:path*' }]
    // }
  }
  module.exports = nextConfig
  ```

#### Jour 3-5 : Structure & Composants de base
- [ ] **Création de l'architecture des dossiers**
  ```
  src/
  ├── app/
  │   ├── globals.css
  │   ├── layout.tsx
  │   └── page.tsx
  ├── components/
  │   ├── ui/
  │   │   ├── Button.tsx
  │   │   ├── Card.tsx
  │   │   └── Modal.tsx
  │   ├── layout/
  │   │   ├── Header.tsx
  │   │   ├── Footer.tsx
  │   │   └── Navigation.tsx
  │   └── sections/
  │       ├── Hero.tsx
  │       ├── Features.tsx
  │       └── CTA.tsx
  ├── lib/
  │   ├── utils.ts
  │   └── constants.ts
  └── types/
      └── index.ts
  ```

- [ ] **Introduction Tailwind (progressive)**
  - Définir variables/couleurs/typo Beamô dans `tailwind.config.js`
  - Appliquer Tailwind d'abord sur les 3 pages prioritaires (Landing, Offres, Contact)
  - Conserver le CSS existant ailleurs durant la transition

- [ ] **Création des composants réutilisables**
  - Header/Navigation
  - Footer
  - Boutons
  - Cards
  - Modals

### 🎨 **PHASE 2 : Pages prioritaires (Semaine 2-3)**

#### Pages à fort impact SEO (priorité d'implémentation)
1. Landing Page (P0)
2. Offres (P0)
3. Contact (P0)
4. Pages Syndic-Ville (P1)
5. Ressources/Blog (P1)

1. **Landing Page** (Priority 1.0) - Jour 6-8
   - [ ] Migration de `landing-page/index.html`
   - [ ] Composant Carousel avec compte à rebours
   - [ ] Intégration vidéo optimisée
   - [ ] Animations (AOS conservé au départ, Framer Motion ensuite si utile)
   - [ ] Tests de performance

2. **Page Offres** (Priority 0.9) - Jour 9-10
   - [ ] Migration de `offre/offres.html`
   - [ ] Composants de services
   - [ ] Formulaires optimisés

3. **Page Contact** (Priority 0.9) - Jour 11-12
   - [ ] EmailJS conservé (MVP)
   - [ ] Sécurité front: suppression des logs de clé, honeypot, validations
   - [ ] Optionnel: Cloudflare Turnstile (anti-spam léger)

4. **Pages Syndic-Ville** (Priority 0.9) - Jour 13-16
   - [ ] Template dynamique pour les villes
   - [ ] Migration des 7 pages syndic : Vernon, Évreux, Les Andelys, Louviers, Gaillon, Gasny, Pacy-sur-Eure
   - [ ] Génération dynamique des métadonnées
   - [ ] Optimisation SEO local (schema local business si pertinent)

### 🔧 **PHASE 3 : Pages business (Semaine 4)**

#### Pages importantes pour la conversion
5. **Qui sommes-nous** (Priority 0.8) - Jour 17-18
   - [ ] Migration `ressources/qui-sommes-nous.html`
   - [ ] Composants timeline/équipe

6. **Ressources/Blog** (Priority 0.8) - Jour 19-21
   - [ ] Migration `ressources/ressources.html`
   - [ ] Intégration Strapi (source unique)
   - [ ] Système de blog (liste SSG + détail par slug, ISR)

### 🛠️ **PHASE 4 : Pages secondaires (Semaine 5)**

#### Finalisation de l'écosystème
7. **Section Pro** - Jour 22-23
   - [ ] Migration `pro/index.html`
   - [ ] Fonctionnalités B2B

8. **Pages légales** - Jour 24-25
   - [ ] Mentions légales, CGU, Confidentialité
   - [ ] Templates légaux

9. **Pages d'erreur** - Jour 26-27
   - [ ] 404, 500 personnalisées
   - [ ] Navigation d'erreur

### 🚀 **PHASE 5 : Optimisation & Déploiement (Semaine 6)**

#### Performance & SEO
10. **Optimisations techniques** - Jour 28-30
    - [ ] **Core Web Vitals**
      - Optimisation des images (next/image, remotePatterns)
      - Lazy loading
      - Preloading des ressources critiques
    
    - [ ] **SEO avancé**
      - Sitemap.xml dynamique
      - Métadonnées structurées (Schema.org)
      - OpenGraph optimisé
    
    - [ ] **Analytics & Tracking**
      - Google Analytics 4
      - Search Console
      - Monitoring des performances

#### Migration finale
11. **Déploiement & Redirections** - Jour 31-35
    - [ ] **Setup Vercel**
      - Configuration domaine
      - Variables d'environnement
      - Optimisations CDN

    - [ ] **Gestion des redirections**
      - Redirections 301/302 (via Vercel ou Cloudflare selon besoin)
      - Tests de toutes les URLs et canoniques
      - DNS via Cloudflare (plan gratuit), proxy activable au besoin
    
    - [ ] **Tests finaux**
      - Tests cross-browser
      - Tests mobile/desktop
      - Validation W3C
      - Tests de performance (Lighthouse)

---

## 🛠️ Stack technique détaillée

### Frontend
```json
{
  "framework": "Next.js 14",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "animations": "AOS (départ) → Framer Motion (progressif)",
  "icons": "Lucide React",
  "fonts": "Next/Font (optimized)",
  "images": "Next/Image (optimized)"
}
```

### Backend & API
```json
{
  "api": "SSG/ISR + fetch Strapi (source unique)",
  "database": "Strapi (existant) + PostgreSQL",
  "email": "EmailJS (MVP) — option: Resend/SMTP plus tard",
  "forms": "React Hook Form + Zod (client)",
  "automation": "Option n8n si besoin (webhooks)"
}
```

### Déploiement
```json
{
  "hosting": "Vercel (recommandé)",
  "cdn": "Vercel Edge Network",
  "dns": "Cloudflare",
  "monitoring": "Vercel Analytics + Sentry",
  "backup": "Git + Vercel automatic deployments"
}
```

---

## 📁 Structure finale du projet

```
beamo-nextjs/
├── public/
│   ├── images/
│   ├── videos/
│   └── favicon/
├── src/
│   ├── app/
│   │   ├── (routes)/
│   │   │   ├── page.tsx (Landing)
│   │   │   ├── offres/
│   │   │   ├── syndic/
│   │   │   │   └── [city]/
│   │   │   ├── ressources/
│   │   │   ├── contact/
│   │   │   └── pro/
│   │   ├── api/
│   │   │   ├── contact/
│   │   │   └── newsletter/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/ (Composants réutilisables)
│   │   ├── layout/ (Header, Footer, Nav)
│   │   ├── sections/ (Hero, Features, etc.)
│   │   └── forms/ (Contact, Newsletter)
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── validations.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   └── data/
│       ├── cities.ts
│       └── services.ts
├── legacy/ (Site HTML temporaire)
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔢 Priorité d'implémentation des pages (résumé)

- P0: Landing, Offres, Contact
- P1: Syndic-Ville (7 villes), Ressources/Blog (liste + détail), Qui sommes-nous
- P2: Pro, Légales (Mentions/CGU/Confidentialité), Erreurs (404/500), pages secondaires

---

## 🎯 Composants clés à développer

### 1. Composant Countdown
```typescript
// components/sections/Countdown.tsx
interface CountdownProps {
  targetDate: string;
  onComplete?: () => void;
}

export function Countdown({ targetDate, onComplete }: CountdownProps) {
  // Logic pour le compte à rebours
}
```

### 2. Composant Carousel
```typescript
// components/ui/Carousel.tsx
interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  interval?: number;
}
```

### 3. Template Ville dynamique
```typescript
// app/syndic/[city]/page.tsx
interface CityPageProps {
  params: { city: string };
}

export async function generateStaticParams() {
  return CITIES.map(city => ({ city: city.slug }));
}
```

### 4. Formulaire Contact optimisé
```typescript
// components/forms/ContactForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10)
});
```

MVP: garder EmailJS côté client (clé publique non loguée, honeypot, validations). Évolution: API Route + transport Resend/SMTP si nécessaire.

---

## 📊 Métriques de succès

### Performance (Core Web Vitals)
- **LCP** (Largest Contentful Paint) : < 2.5s
- **FID** (First Input Delay) : < 100ms
- **CLS** (Cumulative Layout Shift) : < 0.1
- **Score Lighthouse** : > 95/100

### SEO
- **Toutes les pages indexées** dans les 48h
- **Métadonnées complètes** sur toutes les pages
- **Schema.org** pour les données structurées
- **Sitemap XML** généré automatiquement (route Next) + canoniques cohérents

### Business
- **Temps de chargement** : -60%
- **Taux de rebond** : -25%
- **Conversions contact** : +40%
- **Score mobile-friendly** : 100/100

---

## 🚨 Checklist de validation

### Avant le déploiement
- [ ] Toutes les pages HTML migrées
- [ ] Formulaires fonctionnels
- [ ] Redirections configurées
- [ ] Tests cross-browser validés
- [ ] Performance > 90 (Lighthouse)
- [ ] SEO optimisé (balises, schema)
- [ ] Analytics configurés
- [ ] Monitoring en place
 - [ ] DNS via Cloudflare (nameservers), Vercel OK

### Post-déploiement
- [ ] Vérification URLs en production
- [ ] Tests formulaires en live
- [ ] Monitoring des erreurs 404
- [ ] Suivi des Core Web Vitals
- [ ] Indexation Google Search Console
- [ ] Sauvegarde site HTML legacy

---

## 💰 Estimation budget & temps

### Temps de développement
- **Phase 1** (Setup) : 5 jours
- **Phase 2** (Pages prioritaires) : 10 jours
- **Phase 3** (Pages business) : 6 jours
- **Phase 4** (Pages secondaires) : 6 jours
- **Phase 5** (Optimisation) : 8 jours

**Total : ~35 jours (7 semaines)**

### Coûts techniques
- **Vercel Pro** : 20€/mois
- **Domaine** : Existant
- **Outils dev** : Gratuits (Next.js, Tailwind)
- **Monitoring** : Inclus Vercel

**Budget technique : ~20€/mois**

---

## 🎉 Résultats attendus

### Techniques
✅ **Site 10x plus rapide**  
✅ **Score Lighthouse > 95**  
✅ **Bundle size réduit de 70%**  
✅ **SEO optimisé automatiquement**  

### Business
✅ **Expérience utilisateur améliorée**  
✅ **Taux de conversion +40%**  
✅ **Référencement local renforcé**  
✅ **Maintenance simplifiée**  

### Évolutivité
✅ **Ajout de nouvelles fonctionnalités facilité**  
✅ **Intégration API tierces simplifiée**  
✅ **Scaling automatique**  
✅ **Stack moderne et pérenne**  

---

## 📞 Prochaines étapes

1. **Validation du plan** par l'équipe
2. **Setup de l'environnement de développement**
3. **Démarrage Phase 1** (Setup Next.js)
4. **Point d'étape hebdomadaire**
5. **Tests utilisateurs** sur pages migrées

**🚀 Prêt pour le décollage vers la modernité !**
