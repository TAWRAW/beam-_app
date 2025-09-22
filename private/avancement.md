# 📈 Avancement Migration Beamô (HTML → Next.js)

Dernière mise à jour: Intégration Supabase Auth (email + Google), table `profiles` + rôles, protection `/apps`, formulaire de connexion et redirections unifiées.

## ✅ Avancement Supabase Auth & Profils (22/09/2025)
- Connexion Supabase configurée via `@supabase/ssr` (clients serveur/navigateur).
- Authentification: formulaire Login/Signup + OAuth Google (bouton “Continuer avec Google”).
- Table `public.profiles` avec rôles: `visiteur`, `inscrit`, `payant`, `employe`, `admin`, `vip`.
- Triggers: création/sync du profil sur événements `auth.users` (email, avatar), `updated_at` auto.
- RLS/Policies: lecture propriétaire ou admin/employé, update owner/admin, delete admin.
- Protection d’accès: middleware protège `/apps/*` via session Supabase; redirection vers `/auth/login`.
- Pages: `/ressources/application` embarque LoginForm si non connecté; affiche rôle + liens si connecté.
- Endpoint de debug: `/api/whoami` renvoie `user` + `profile`.

Fichiers ajoutés/modifiés (principaux)
- Env: `nextjs-app/.env.local` → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Supabase migrations: `supabase/migrations/0001_profiles_and_roles.sql`, `0002_add_email_to_profiles.sql`.
- Nettoyage base (option): `supabase/scripts/cleanup_profiles.sql` (non destructif).
- Auth UI: `src/components/auth/LoginForm.tsx`, `src/app/auth/login/page.tsx`, `src/app/auth/logout/route.ts`.
- Intégration: `src/app/ressources/application/page.tsx` (Login intégré), `src/app/api/whoami/route.ts`.
- Protection: `src/middleware.ts` (session Supabase, redirect `/auth/login`).
- API sécurisée: `src/app/api/mandats/generate/route.ts` (vérifie Supabase, envoie `user.id`).
- Script admin: `nextjs-app/scripts/create-admin.js` + npm script `create:admin`.

Variables d’environnement (à définir)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client + SSR).
- (Serveur optionnel) `SUPABASE_SERVICE_ROLE_KEY` pour scripts/admin.
- OAuth Google (dans Google Cloud + Supabase Provider) – Redirect URI: `https://<project>.supabase.co/auth/v1/callback`.
- Auth URLs Supabase: Site URL dev `http://localhost:3000`, prod `https://beamo.fr`; Allowed Redirects: `/auth/callback`.

Tests/QA
- Local: `/ressources/application` → signup/login OK, Google OK, redirection → `/apps`.
- `/api/whoami` retourne session + profil (rôle).
- `/apps/mandats` redirige vers `/auth/login` si 401.

## ✅ État actuel
- Plan de migration validé: `private/plan-migration-nextjs.md`
- Dossier legacy détecté: `../Page_Web ` (avec un espace final dans le nom)
- `.htaccess` présent avec redirections et règles de perf/caching

## 📦 Inventaire (hors `backups/`, `node_modules/`, `strapi_newsletter/`)
- HTML: 45
- CSS: 16
- JS: 11
- Images: 12
- PHP: 4 (handlers/formulaires)

### Dossiers top-level du legacy
- `landing-page/`, `offre/`, `ressources/`, `pro/`, `syndic/`, `css/`, `js/`, `error/`, `scripts/`

### Pages clés pour la Phase 2 (prioritaires)
- Landing: `landing-page/index.html`
- Offres: `offre/offres.html`
- Contact: `ressources/contact.html`

### Formulaires détectés
- `ressources/contact.html` → `#contact-form` (EmailJS côté client via CDN)
- `ressources/partenaires.html` → `.contact-form`
- `offre/extranet.html` → `.login-form`
- Handlers PHP présents (à ne pas migrer pour MVP): `contact.php`, `process_form.php`, `login.php`, `index.php`

### EmailJS
- Intégration via CDN dans `ressources/contact.html`
- Script d’envoi dans `js/contact.js` (contient des logs de clé publique → à retirer dans la migration)

### .htaccess (extraits utiles)
- Forçage HTTPS et redirection `www` → apex
- Redirection racine → `landing-page/index.html`
- Fallback `*.html` si URL sans extension
- Redirections 301 des pages syndic (ex: `/syndic-vernon` → `/syndic/syndic-vernon.html`)
- En-têtes de sécurité et compression/expiration statique

## 🎯 Prochaines étapes
1) Bascule Auth → Auth.js (email)
2) Finaliser métadonnées (titles/descriptions OG) par page
3) Ajuster Tailwind aux couleurs/typo Beamô (#FFC300, Poppins)
4) Parité visuelle des sections (spacing/typo/icônes)
5) Contact: validations renforcées + Turnstile (anti‑spam)
6) Préparer/compléter redirections équivalentes (Next/Vercel)

---

## 🚀 Plan détaillé – Durcissement Contact + SEO/Analytics

1) Page Merci + tracking (P0)
- Créer `src/app/merci/page.tsx` (design cohérent, lien retour).
- Sur succès formulaire, rediriger vers `/merci` et émettre un event (gtag). 
- Acceptance: redirection + event visibles en prod.

2) API Route serveur `/api/contact` (SMTP OVH) (P0)
- Validation Zod: name/email/message (+ phone/copro optionnels); honeypot.
- Envoi via `nodemailer` → `ssl0.ovh.net` (465 SSL ou 587 TLS).
- Taux‑limite soft: 1 req/30s/IP (best‑effort en mémoire) + journalisation d’erreurs.
- Acceptance: envoi OK sans EmailJS; erreurs claires (400/429/500).

3) Turnstile Cloudflare (P0)
- Ajouter widget côté client (ContactForm) et vérification serveur dans `/api/contact`.
- Env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- Acceptance: requête refusée si token invalide/absent; UX fluide.

4) Bascule progressive du formulaire (P0)
- ContactForm: appeler `/api/contact`; garder un flag de fallback EmailJS pendant 24‑48h.
- Retirer EmailJS côté client une fois validé.
- Acceptance: 0 régressions; repli désactivable.

5) 404/500 custom (P1)
- `src/app/not-found.tsx` déjà présent → harmoniser style.
- Ajouter `src/app/error.tsx` pour 500 avec lien retour.
- Acceptance: erreurs stylées, navigation claire.

6) SEO avancé (P1)
- OG images par page (default + spécifiques), titres/templates uniformes.
- `robots.txt` → ajouter `Sitemap: https://xn--beam-yqa.fr/sitemap.xml`.
- Améliorer `sitemap.ts` (routes supplémentaires, timestamps).
- Acceptance: Meta/OG corrects, sitemap/robots valides.

7) Analytics (P1)
- GA4 via `NEXT_PUBLIC_GA_MEASUREMENT_ID` (gtag) + Vercel Analytics activé.
- Event `contact_submit_success` sur `/merci`.
- Acceptance: hits visibles dans GA4.

8) Audit redirections (P1)
- Vérifier QR/anciennes URLs (logs Vercel + tests manuels) et compléter rules.
- Acceptance: aucune 404 pour anciennes URLs connues.

9) Monitoring (P2)
- Option Sentry (client+server) avec DSN env + sampling faible.
- Acceptance: erreurs visibles, sans bruit.

---

## 🔐 Bascule Auth → Auth.js (Email via OVH SMTP)

Objectif: Remplacer Supabase Auth par Auth.js (NextAuth) avec Magic Link (email) contrôlé, pour maîtriser les redirections et simplifier l’UX.

Étapes (P0)
1) Env NextAuth
- NEXTAUTH_URL (local/prod) + NEXTAUTH_SECRET
- EMAIL_SERVER_* (OVH SMTP 465/587) + EMAIL_FROM

2) Route NextAuth
- Créer `src/app/api/auth/[...nextauth]/route.ts` (App Router) avec Provider Email.
- Adapter en-têtes/subject d’email.

3) Middleware `/apps/*`
- Remplacer la vérification Supabase par NextAuth (`getToken`) dans `src/middleware.ts`.
- Rediriger vers `/login?redirect=…` si non authentifié.

4) Login/Logout
- `src/app/login/page.tsx`: utiliser `signIn('email', { callbackUrl })`.
- `src/app/logout/route.ts`: redirection vers `/api/auth/signout`.

5) API Mandats
- `src/app/api/mandats/generate/route.ts`: lire la session via `getServerSession`, attacher `user.email` comme `userId` (ou hash stable), puis relayer à n8n.

6) Nettoyage
- Retirer logique Supabase Auth; garder Supabase si besoin data ultérieure.
- Mettre à jour docs/env; QA sur `/apps` + `/apps/mandats`.

Acceptation
- Accès `/apps/*` bloqué hors session; login par email; redirection `redirect` respectée.
- Mandat généré avec `userId` issu de NextAuth.

ENV à ajouter
- NEXTAUTH_URL=http://localhost:3002 (dev) / https://www.xn--beam-yqa.fr (prod)
- NEXTAUTH_SECRET=<openssl rand -base64 32>
- EMAIL_SERVER_HOST=ssl0.ovh.net
- EMAIL_SERVER_PORT=465
- EMAIL_SERVER_USER=tom.lemeille@xn--beam-yqa.fr
- EMAIL_SERVER_PASSWORD=<app_password>
- EMAIL_FROM="Beamô <tom.lemeille@xn--beam-yqa.fr>"

Notes
- Conserver temporairement les env Supabase jusqu’à fin de bascule.
- UX Login identique (lien magique).

---

## 🔐 Variables d’environnement à ajouter (proposition)

SMTP (OVH) – pour `/api/contact`:
- `SMTP_HOST=ssl0.ovh.net`
- `SMTP_PORT=465` (ou 587)
- `SMTP_SECURE=true` (false si 587)
- `SMTP_USER=tom.lemeille@xn--beam-yqa.fr` (Punycode)
- `SMTP_PASS=<app_password>`
- `CONTACT_TO=tom.lemeille@xn--beam-yqa.fr`

Turnstile:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site_key>`
- `TURNSTILE_SECRET_KEY=<secret_key>`

Analytics:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

Notes:
- Garder les 3 clés EmailJS existantes jusqu’à bascule (
  `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`, `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`).

---

## ⏱️ Ordonnancement (proposé)
- J+0–0.5: Auth.js (env + route + middleware + login/logout)
- J+0.5–1: Adapter API Mandats, QA auth et redirections
- J+1–2: (1) Merci + tracking, (2) API contact SMTP
- J+2: (3) Turnstile + bascule progressive (4)
- J+3: (5) 404/500, (6) SEO, (7) Analytics
- J+4: (8) Audit redirections, (9) Monitoring (option)

## 📝 Décisions courantes
- Strapi: non prioritaire pour l’instant
- Déploiement: à définir (Vercel ensuite)
- Fallback legacy: à préciser (Cloudflare proxy ou embarqué en `public/legacy`)

## ⚠️ Points d’attention
- Nom du dossier legacy avec espace final: `../Page_Web `
- Nettoyer les logs sensibles dans `js/contact.js`
- Conserver la parité visuelle (couleurs/typo) avec beamô.fr

---

## ✅ Checklist (résumé)
- [x] Inventaire legacy
- [x] Scaffold Next.js 14
- [x] Base Tailwind + layout (Poppins)
- [x] Pages Landing / Offres / Contact (contenu migré)
- [x] Formulaire Contact EmailJS (env vars, honeypot)
- [x] Favicon & robots.txt copiés
- [x] Redirections équivalentes (HTML → routes Next)

- [x] Page `/merci` + event GA4 (gtag prêt)
- [x] API `/api/contact` (SMTP OVH + Zod + rate‑limit)
- [x] Espace Applications `/apps` (layout + sidebar)
- [ ] Auth.js (NextAuth) implémenté (middleware + login/logout)
- [x] Page `/apps/mandats` (formulaire + calculs client)
- [ ] API `/api/mandats/generate` (proxy n8n, validations, userId via NextAuth)
- [ ] Turnstile (client + serveur)
- [ ] Bascule formulaire → API (fallback temporaire)
- [ ] 404/500 custom
- [x] 404/500 custom (404: fond jaune, GIF, bouton Contact, texte ajusté)
- [ ] SEO avancé (OG per‑page, sitemap, robots)
- [ ] GA4 + Vercel Analytics
- [ ] Audit redirections (logs + tests)
- [ ] Monitoring (Sentry) – option

Mise à jour UI globale
- Fond de page par défaut: jaune `#FFC300` (remplace le blanc visible derrière la navbar et au-dessus du footer)
- Spacer sous navbar coloré (assure un bandeau jaune sous la barre fixe)
- 500 harmonisée (fond jaune)
- Landing: héros vidéo plein écran (md+: h-screen), typo responsive (mobile→desktop), centrage vertical
- Header spacer annulé sur desktop uniquement (md:-mt-24) pour supprimer la barre en haut sans casser le mobile
- Correctif scroll horizontal mobile/tablette: `overflow-x: hidden` global + wrap du titre (break-words)
- Fond global: retour au blanc; remplacement du spacer coloré par padding-top dans le layout (supprime la barre/artefact jaune)
- Fin de page: suppression du scroll après footer (html/body min-height, overscroll-behavior; wrapper min-h-screen)
- Mobile/Tablet: ajout d'une barre de raccourcis (Accueil/Offres/Histoire/Plus) fixe en bas, avec bottom-sheet pour Contact/Extranet/Ressources
- Navbar: fond blanc plein écran (barre carrée, largeur de l’appareil), ombre légère
 - Navbar (mobile): bouton "Nous Contacter" raccourci en "Contacter" + taille réduite (text-sm, padding réduit)
 - Héros: mot « syndic » mis en jaune (#FFC300)

---

## 🛰️ Suivi DNS/OVH (en attente)

- Objectif: configuration propre Vercel + GTM visible partout (pas de page OVH “Site non installé”).
- Zone DNS (OK):
  - `beamô.fr A 216.198.79.1`
  - `www.beamô.fr CNAME d6db1e7fe4d91b78.vercel-dns-017.com`
  - Aucun `AAAA` sur apex/www
- Bloqueur: Hébergement gratuit/Multisite OVH impossible à retirer (ticket OVH ouvert). 
  - À faire dès réponse OVH: supprimer totalement `beamô.fr` et `www.beamô.fr` des Multisites (tous hébergements), puis re‑vérifier.
- Après déblocage: vérifier Vercel Domains (Valid apex + www), définir `xn--beam-yqa.fr` en domaine primaire, revalider Tag Manager.

---

## 📌 Travaux récents (pages ville + CSS)

Date: 2025-09-08

Ce qui a été fait:
- Pages dynamiques « ville »: `src/app/ville/[slug]/page.tsx` (SSG via `generateStaticParams`, SEO via `generateMetadata`).
- Liste des villes centralisée: `src/lib/cities.ts` (incluant la préposition correcte `prep: 'à' | 'aux' | 'à la' | "à l'"`).
- Footer dynamique: `src/components/layout/Footer.tsx` génère la liste « Syndic de copropriété [prep] [Ville] » depuis `cities` et pointe vers `/ville/[slug]`.
- Redirections: ancien schéma `/syndic/syndic-:slug` → `/ville/:slug` ajouté dans `next.config.js`.
- Sitemap: `src/app/sitemap.ts` enrichi avec les URLs des villes.
- Personnalisation hero des pages ville: `Carousel` accepte `cityLabel` et `cityPrep` pour afficher « Le syndic local et efficace [prep] [Ville]. Une réponse en 48h garantie. ». La home n’est pas affectée (fallback texte d’origine).
- Correctif CSS (Tailwind): 
  - Le style global `h1, .h1 { font-size: clamp(...) }` écrasait les classes Tailwind (`text-7xl`, etc.) dans le hero.
  - Correction: découper en `h1 { font-family; font-weight }` et `.h1 { font-size; line-height }` pour ne pas casser les utilitaires Tailwind sur les `h1`.
- Fichier modifié: `src/app/globals.css`.

Ajustements linguistiques (Les Andelys):
- Besoin: afficher « Aux Andelys » (sans « Les ») dans le footer et dans le hero (Carousel) pour la page ville correspondante.
- Implémentation: ajout de champs d’affichage optionnels dans `src/lib/cities.ts`:
  - `displayName: 'Andelys'`, `displayPrep: 'Aux'` pour la ville `les-andelys`.
  - Footer et pages ville consomment désormais `displayName/displayPrep` si présents, sinon `name/prep`.
  - Fichiers impactés: `src/components/layout/Footer.tsx`, `src/app/ville/[slug]/page.tsx` (passage des props `cityLabel/cityPrep` au `Carousel`).

Masquage sélectif de villes dans le footer:
- Besoin: retirer du footer sans désactiver les pages: Val-de-Reuil, Gisors, Bueil, Mantes-la-Jolie.
- Implémentation: ajout du champ optionnel `showInFooter?: boolean` dans `src/lib/cities.ts` et mise à `false` pour ces villes.
- `Footer.tsx` filtre désormais avec `cities.filter(c => c.showInFooter !== false)` pour n’afficher que les villes voulues.

Création de nouvelles pages ville (SEO inclus):
- Ajouts dans `src/lib/cities.ts` avec `showInFooter: false` (non listées en footer mais présentes dans le sitemap) pour:
  Saint-Marcel, La Chapelle-Longueville, Giverny, Étrépagny, Le Vaudreuil (affichage « Au Vaudreuil »), Saint-André-de-l’Eure, Ivry-la-Bataille, La Couture-Boussey, Gauville-la-Campagne, Parville, Aviron, Gravigny, Huest, Saint-Sébastien-de-Morsent, Fauville, Le Vieil-Évreux (affichage « Au Vieil‑Évreux »), Arnières-sur-Iton, Guichainville, Angerville-la-Campagne.
- SEO: la page `src/app/ville/[slug]/page.tsx` génère des `metadata` dynamiques en utilisant `displayPrep/displayName` pour les titres et descriptions; ajout de `keywords` et `robots: index, follow`.

SEO technique & SEO IA — améliorations globales
- `src/app/robots.ts`: robots permissif avec `sitemap` et `host`, groupes pour Googlebot, Bingbot et bots IA (GPTBot, CCBot, Perplexity, etc.).
- `public/indexnow.txt`: placeholder pour la clé IndexNow (à personnaliser et ping manuel/automatisé ensuite).
- City pages enrichies: contenu structuré (intro H2, Services, FAQ, liens vers autres villes) + données structurées JSON‑LD (`LocalBusiness` + `FAQPage`).
- Objectif: meilleure couverture SEO (title/meta/OG/keywords), SEO sémantique (FAQ, listes), et extraction par IA.

Notes d’usage:
- Ajouter une ville: éditer `src/lib/cities.ts` (slug, name, prep, département, région). Les pages, le footer et le sitemap se mettent à jour automatiquement.
- Grammaire: pour « Les Andelys », `prep: 'aux'`. Si on veut afficher « aux Andelys » (sans « Les »), prévoir un champ d’affichage dédié (ex: `displayName: 'Andelys'`).

Prochaines améliorations possibles:
- Hero plus contextuel: props supplémentaires pour image/vidéo/overlay par ville.
- SEO local: JSON‑LD enrichi (adresse/geo) et image OG spécifique par ville.
- Tracking: event GA pour clics footer vers les pages ville et vues des pages ville.
- Statut: en attente support OVH.

---

## 🔍 Optimisations SEO — Session du 2025-09-09

### Objectif
Améliorer le référencement naturel des pages existantes sans créer de nouveaux contenus, en optimisant les métadonnées, données structurées et signaux techniques.

### Travaux réalisés

#### Phase 1 : Corrections critiques (P0) ✅
1. **Robots.txt statique corrigé**
   - Correction du sitemap URL: `https://www.beamo.fr/sitemap.xml` → `https://xn--beam-yqa.fr/sitemap.xml`
   - Fichier: `nextjs-app/public/robots.txt`

2. **Métadonnées globales enrichies** (`nextjs-app/src/app/layout.tsx`)
   - Description étendue avec zones géographiques
   - Mots-clés ajoutés: syndic, copropriété, Vernon, Évreux, Les Andelys, Normandie, Eure
   - OpenGraph enrichi avec dimensions d'image (1200x630), alt text
   - Twitter Cards ajoutées
   - Robots directives avancées (googleBot, max-image-preview, max-snippet)
   - Support Google Site Verification

3. **Métadonnées complétées sur pages principales**
   - **Page d'accueil** (`src/app/page.tsx`): keywords, OpenGraph complet, Twitter cards, robots
   - **Page offres** (`src/app/offres/page.tsx`): mots-clés spécialisés (tarifs, changement syndic), OG/Twitter
   - **Page contact** (`src/app/ressources/contact/page.tsx`): focus "réponse 48h", mots-clés contact/devis

#### Phase 2 : Données structurées (P1) ✅
1. **Page d'accueil** — JSON-LD ajouté
   - **LocalBusiness** (Schema.org): nom, URL, logo, description, zones desservies (Vernon/Évreux/Les Andelys)
   - **Service**: services de gestion de copropriété, contact, zones couvertes
   - Fondateur: Tom Lemeille
   - Liens externes: LinkedIn

2. **Page offres** — JSON-LD Service + OfferCatalog
   - **Service** principal avec provider LocalBusiness
   - **OfferCatalog** avec 3 offres structurées:
     * Offre Standard (InStock)
     * Offre Hybride (InStock)  
     * Offre Clos-Masure (PreOrder)
   - Categories: "Syndic de copropriété", "Syndic hybride", "Syndic spécialisé"

3. **Page contact** — JSON-LD ContactPage + Organization
   - **ContactPage**: description, actions de contact
   - **ContactPoint**: téléphone, email, horaires (9h-18h), langues (français)
   - **Organization**: informations de contact consolidées
   - Actions potentielles: ContactAction avec EntryPoint

### Impact SEO attendu
- **Indexation**: meilleure compréhension par les moteurs de recherche
- **Rich snippets**: affichage enrichi dans les résultats Google (horaires, notes, liens directs)
- **Local SEO**: données structurées pour les requêtes géolocalisées "syndic + ville"
- **CTR amélioré**: images OpenGraph dans les partages sociaux
- **Cohérence technique**: métadonnées uniformes et complètes

### Fichiers modifiés
- `nextjs-app/public/robots.txt`
- `nextjs-app/src/app/layout.tsx`
- `nextjs-app/src/app/page.tsx`
- `nextjs-app/src/app/offres/page.tsx`
- `nextjs-app/src/app/ressources/contact/page.tsx`

### Phases suivantes (non implémentées)
- **Images OpenGraph personnalisées** par page/section
- **Sitemap enrichi** avec priority/changefreq
- **Breadcrumbs JSON-LD** sur pages ville
- **Données structurées avancées** (reviews, aggregateRating)

---

## 🔐 Auth temporaire simple (email + mot de passe env)

Objectif: restreindre l’accès à `/apps/*` à un seul compte (tom.lemeille@xn--beam-yqa.fr) via formulaire email+mot de passe, sans dépendance externe. Remplacera plus tard Auth.js/Google.

Implémentation
- Session HMAC signée en cookie httpOnly (`SESSION_SECRET`).
- `POST /api/auth/login` vérifie `ADMIN_EMAIL`/`ADMIN_PASSWORD` (env) et émet la session.
- `src/middleware.ts` vérifie le cookie; redirige vers `/login?redirect=…` si absent/expiré.
- `/logout` efface la session.
- `/api/mandats/generate` attache `userId=email` depuis la session.

ENV
- ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET (ajoutés dans `.env.local.example`).

Statut
- En place côté code; à compléter par la mise en env (prod) et tests.

---

## 🛠️ Session du jour — Diagnostic page blanche + Auth

Contexte et symptômes
- Page blanche perçue sur certaines routes; démarrage local en erreur sur `:3000`.

Causes identifiées
- Port `3000` déjà occupé par un process Node (EADDRINUSE).
- Auth serveur non configurée → `/api/auth/login` renvoyait `500 Server auth not configured` (variables d’environnement manquantes).

Actions réalisées
- Libération du port 3000 et démarrage de l’app (sinon utilisation `--port 3001`).
- Ajout des variables d’auth côté local (sans commit): `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.
- Correction UI du formulaire de login: champ mot de passe contrôlé (state React) au lieu d’un accès DOM (`getElementById`).
- Vérification API: `/api/auth/login` → `200` + `Set-Cookie: app_session=…` puis redirection `redirect`.
- Vérification middleware `/apps/*`: redirige vers `/login?redirect=…` si cookie absent/invalid.

## 🧩 n8n — Mandats: intégration Google Docs + PDF

Contexte
- Webhook n8n (Basic Auth) connecté à l'app: `/api/mandats/generate`.
- Chaîne validée: Webhook → Get rows (Sheets) → Validation & Formatage (Code) → Copy Google Doc → Docs API `batchUpdate` (replace placeholders) → Export PDF → (Upload Drive + Gmail) → Respond.

Points clés et correctifs appliqués
- Docs API: modèle converti en Google Doc natif (pas .docx).
- Auth: nœud `HTTP Request` (Docs) en OAuth2 avec scopes `documents` + `drive.file`.
- JSON Body: expression renvoyant un objet `{ requests: [...] }` (pas de chaîne JSON).
- Gmail: pièce jointe sur `Binary Property = data` (sortie de l’export PDF), branchement direct depuis `Exporter en PDF`.
- Respond: un seul `Respond to Webhook` en fin de flux (pas de double entrée).

Placeholders non remplacés (cause et fix)
- Cause: dans le nœud Code, on fusionnait `tpl` avec `...consts` APRÈS avoir mis les valeurs du formulaire; des clés vides en Sheet écrasaient les valeurs issues du formulaire → champs vides.
- Fix recommandé:
  1) Lire correctement les données du formulaire via `payload`:
     `const form = ($json && typeof $json.payload === 'object') ? $json.payload : $json`
  2) Construire `tpl` en posant d'abord les constantes `...consts`, puis SURPOSER les valeurs issues du formulaire (et dérivées) pour qu'elles prennent le dessus.
  3) (Optionnel) Filtrer les constantes vides: supprimer des `consts` les clés dont la valeur est vide pour éviter tout écrasement intempestif.

Snippet (extrait) — ordre de fusion correct
```
// … consts initialisées
// Option: supprimer les vides
for (const k of Object.keys(consts)) if (String(consts[k]).trim() === '') delete consts[k]

const tpl = {
  // 1) Constantes depuis Sheets en premier
  ...consts,
  // 2) Valeurs du formulaire et dérivées qui doivent primer
  AG__DATE: isoToFR(AG__DATE_ISO),
  MANDAT__DUREE: String(dureeMois),
  MANDAT__DATE_DEBUT: isoToFR(MANDAT__DATE_DEBUT_ISO),
  MANDAT__DATE_FIN: isoToFR(MANDAT__DATE_FIN_ISO),
  COPRO__NOM_USAGE: form.COPRO__NOM_USAGE || '',
  COPRO__ADRESSE: form.COPRO__ADRESSE || '',
  COPRO__CP: form.COPRO__CP || '',
  COPRO__VILLE: form.COPRO__VILLE || '',
  COPRO__NUMERO_RNC: form.COPRO__NUMERO_RNC || '',
  SYNDIC__HONORAIRES_HT: money(HONO_HT),
  SYNDIC__HONORAIRES_TTC: money(HONO_TTC),
  // etc.
}
```

Regex date FR → ISO
- Corrigée: `/^\d{2}\/\d{2}\/\d{4}$/` (attention à échapper le `/`).

État actuel
- Webhook 200 OK (nœud Respond en place), PDF reçu par mail, placeholders désormais remplacés.
- Si un champ restait vide: vérifier la clé dans Sheets (colonne KEY sans espaces/casse), et le placeholder exact dans le Doc (pas de coupure/retour ligne/espaces à l’intérieur des `{{…}}`).

---

## ✅ n8n Mandats — Configuration finale (référence)

- Chaîne des nœuds (ordre):
  1) Webhook Trigger (POST, Basic Auth, Respond via node)
  2) Get row(s) in sheet (Google Sheets)
  3) Validation & Formatage (Code)
  4) Copy file (Google Drive) — modèle Google Docs natif
  5) HTTP Request (Docs API `documents.batchUpdate`) — replace placeholders
  6) Exporter en PDF (Drive → download, Binary `data`)
  7) [Option] Upload file (Drive → upload, Binary `data`) + [Option] Share file (anyone: reader)
  8) Gmail (Send a message, Attachments Binary = `data`)
  9) Respond to Webhook (JSON, 200)

- Payload attendu (app → n8n): dans `body.payload` (pas à la racine).

- Lecture Sheets: colonnes « Type » et « Information » (avec espace final dans l’export) → le Code retire `{{ }}` et trim() pour produire des clés propres.

- Code (points critiques):
  - Lire le formulaire depuis le Webhook: `const w = $items('Webhook Trigger',0,0)[0]?.json; const form = w?.body?.payload || {};`
  - Fusion: `tpl = { ...consts, ...form/dérivés }` pour que le formulaire prime.
  - Générer `requests` via replaceAllText avec `containsText.text = '{{KEY}}'` exactement.

- Google Docs (modèle):
  - Placeholders stricts `{{KEY}}` sans coupure/retour/espace interne.
  - Modèle en Google Docs natif (mime `application/vnd.google-apps.document`).

- Gmail: pièce jointe → `Binary Property = data` (sortie d’Export PDF); le download ne crée pas de fichier Drive (utiliser Upload si archivage voulu).

## 🧪 Dépannage express

- Champs vides côté Doc alors que le Webhook a des valeurs: le Code lisait `$json` (ligne Sheet) au lieu de `Webhook → body.payload`. Corriger la source.
- Placeholders visibles: token `{{KEY}}` « cassé » dans le Doc (retour/espaces) → retaper d’un tenant.
- Pas de lien public: ajouter “Share file” (anyone: reader) et renvoyer `webViewLink`.


Résultats
- La connexion fonctionne; si déjà connecté, le bouton “Connexion” n’exige plus d’identifiants (cookie déjà présent). Après déconnexion (`/logout`), le formulaire réapparaît.

Sécurité / Git
- Aucun secret n’a été commité. Le fichier `nextjs-app/.env.local` est ignoré par Git (cf. `.gitignore`).
- L’exemple d’environnement reste dans `nextjs-app/.env.local.example` (placeholders).

Prochaines étapes
- Rediriger automatiquement `/login` → `/apps` quand une session valide existe (amélioration UX).
- Connecter n8n pour le workflow “Mandats”: utiliser `N8N_MANDAT_WEBHOOK_URL` + `N8N_MANDAT_TOKEN` (déjà prévus dans `.env.local.example`).
- Envisager Auth.js (email) à moyen terme pour simplifier l’auth et préparer multi‑utilisateurs.

Runbook rapide (local)
- Démarrer: `cd nextjs-app && npm run dev` (ou `--port 3001`).
- Login: `/login` → entrer l’email autorisé et le mot de passe local.
- Logout: `/logout`.

---

## 🧷 Correctif UI — Espace blanc avant le footer

Symptôme
- Un espace blanc apparaissait entre la dernière section (ex. `FinalCta`) et le footer sur la landing et les pages ville.

Cause
- Le composant `Footer` imposait une marge supérieure `mt-20`. Cette marge crée une zone « hors section » où l’arrière‑plan par défaut (blanc) restait visible entre la dernière section et le footer.

Correctif
- Suppression de la marge supérieure du footer: `mt-20` retiré dans `src/components/layout/Footer.tsx`. Le footer s’aligne désormais directement après la dernière section, sans bande blanche.
- La séparation visuelle est assurée par la barre `h-2 bg-primary` en haut du footer; pas de régression sur l’espacement.

Correctif page Offres — bande blanche sous la barre de navigation
- Contexte: la page `/offres` utilise un fond jaune global (`bg-primary` sur `<main>`). Le wrapper global ajoute un padding top pour la barre fixe, ce qui laissait une bande blanche (fond `body`) au-dessus de la zone jaune.
- Fix: la première section de la page reçoit `relative -mt-20 md:-mt-24 pt-20 md:pt-24` afin d’annuler le padding global tout en conservant l’espace sous la barre. Fichier: `src/app/offres/page.tsx`.
- Harmonisation entête sur pages colorées (flush sous la navbar fixe)
- Contexte: certaines pages (erreur/404/contact) démarraient par une section colorée qui ne montait pas jusqu’à la navbar à cause du padding de compensation du header.
- Fix: ajout du pattern `relative -mt-20 md:-mt-24 pt-20 md:pt-24` sur la première section (ou `main`) des pages suivantes:
  - `src/app/offres/page.tsx` (déjà fait),
  - `src/app/error.tsx`,
  - `src/app/not-found.tsx`,
  - `src/app/ressources/contact/page.tsx`.
  Résultat: aucune bande blanche résiduelle sous la navbar; fond coloré aligné.

---

## 🧭 Nouvelle page — Qui sommes‑nous ?

Implémentation
- Route: `src/app/qui-sommes-nous/page.tsx` (App Router).
- SEO: `metadata` (title/description/keywords/OG + canonical), `robots: index, follow`.
- Contenu: sections Hero, Mission & valeurs, Histoire, Approche (listes), CTA final.
- JSON‑LD: `Organization` (name, url, logo, sameAs) intégré en bas de page.

Intégrations
- Header: lien « Histoire » pointe sur `/qui-sommes-nous`.
- Footer: « Notre histoire » pointe sur `/qui-sommes-nous`.
- Sitemap: entrée ajoutée pour `/qui-sommes-nous`.

À faire (contenu)
- Remplacer les textes génériques par le contenu validé (document Google Drive fourni).
- Ajouter photos/équipe/valeurs officielles si disponibles.

Mise à jour contenu (ton assumé)
- Intégration d’un texte éditorial fort (Ambition, Volonté, « Mettre fin … ») avec sections:
  - Notre ambition / Notre volonté
  - Pourquoi Beamô existe / Ce que nous faisons différemment
  - Position assumée et clivante
  - Histoire (timeline)
  - Engagements mesurables
- Le mot du fondateur
- Attentes / Option courte « en bref »
- CTA final

Mises à jour récentes (style + wording)
- Fond jaune (bg-primary) des sections: « Pourquoi Beamô existe », « En bref », et « Prêt à échanger… » pour renforcer l’identité visuelle.
- Bloc fondateur: carte blanche rétablie autour de la citation, avec photo adjacente (2 colonnes) sur fond jaune.
- Wording:
  - « Des promesses de digital sans effet sur le quotidien » → « … et inutilisable par les copropriétaires ».
  - « Tech utile: automatiser la paperasse… » → « … automatiser les tâches redondantes et chronophages… ».
  - Titre « Notre position (assumée et clivante) » → « Notre position » et suppression du point « options cachées ».

Notes CSS / Dev
- Résolution des 404 sur chunks (_next/static/*) en dev: kill process :3004 → rm -rf .next → npm run dev -p 3004.
  - En cas de persistance: tester en prod local (npm run build && npm run start -p 3004) pour valider le rendu stable.

---

## 🚧 Page "En cours de construction" + intégration Extranet

Objectif
- Disposer d’une page générique pour les fonctionnalités non encore disponibles (ex: Extranet), sans impacter les pages d’erreur (404/500).

Implémentation
- Route: `src/app/en-cours/page.tsx` (App Router) avec hero jaune + carte centrale, message: « En cours de construction — Nous travaillons sur une expérience incroyable ».
- SEO: `robots: index: false, follow: true`, canonical `/en-cours`.
- Liens internes: boutons « Retour à l’accueil » et « Nous contacter ».

Intégrations UI
- Header: bouton « Extranet » → `/en-cours`.
- Mobile Quick Nav: lien « Extranet » → `/en-cours`.
- Mobile Quick Nav: ajout du lien « Application » → `/apps` et correction du lien « Histoire » → `/qui-sommes-nous`.

Backlink LinkedIn (footer)
- Ajout d’un lien vers la page LinkedIn de Beamô dans le footer (sous le bloc marque) avec logo SVG inline.
- URL: https://www.linkedin.com/company/beam%C3%B4/posts/?feedView=all&viewAsMember=true (ouverture dans un nouvel onglet).

À faire (optionnel)
- Remplacer le GIF par une illustration locale si besoin.
- Quand l’Extranet sera prêt: mettre à jour les liens sans supprimer la page (utile comme fallback).

---

## 📝 Système de gestion d'articles (22/09/2025)

### Objectif
Créer un système de gestion d'articles complet pour remplacer Strapi, avec interface d'administration et pages publiques optimisées SEO.

### Travaux réalisés ✅

#### Phase 1 : Base de données et API
1. **Table articles Supabase** (`supabase/scripts/create-articles-table.sql`)
   - Champs complets: title, slug, content (markdown), meta_description, featured_image, author_id
   - SEO: seo_title, seo_keywords, reading_time_minutes auto-calculé
   - Catégories et tags (array), statuts (draft/published/archived)
   - RLS policies: lecture publique pour articles publiés, gestion admin/employé/auteur
   - Triggers: updated_at auto, calcul temps de lecture
   - Index de performance sur slug, status, published_at, category, tags

2. **Types TypeScript** (`src/types/article.ts`)
   - Interface Article complète avec tous les champs
   - Types ArticleCategory et ArticleStatus
   - Types pour création/édition

3. **API CRUD complète** 
   - `src/app/api/articles/route.ts`: GET (avec filtres/pagination/tri), POST
   - `src/app/api/articles/[id]/route.ts`: GET, PUT, DELETE individuels
   - Validation avec filtres par catégorie, statut, recherche texte
   - Génération automatique de slug unique

#### Phase 2 : Interface d'administration
1. **Page principale** (`src/app/apps/articles/page.tsx`)
   - Dashboard avec statistiques en temps réel (total, publiés, brouillons)
   - DataTable avec Tanstack React Table
   - Filtres par catégorie et statut
   - Bouton "Nouvel Article"

2. **Gestion des colonnes** (`src/app/apps/articles/columns.tsx`)
   - Colonnes: titre, slug, catégorie, statut, auteur, dates
   - Actions dropdown: voir, éditer, dupliquer, archiver, supprimer
   - Tri et filtrage avancés

3. **Création d'articles** (`src/app/apps/articles/new/page.tsx`)
   - Formulaire complet avec tous les champs
   - Génération auto du slug à partir du titre
   - Éditeur markdown (textarea pour MVP)
   - Champs SEO dédiés
   - Preview mode

4. **Édition d'articles** (`src/app/apps/articles/[id]/edit/page.tsx`)
   - Chargement et mise à jour d'articles existants
   - Formulaire pré-rempli
   - Même interface que création

#### Phase 3 : Pages publiques
1. **Migration depuis Strapi** (`src/app/ressources/page.tsx`)
   - Remplacement des appels Strapi par Supabase
   - Même structure de filtrage par catégorie
   - Cards d'articles avec image, extrait, temps de lecture

2. **Page article individuelle** (`src/app/ressources/[slug]/page.tsx`)
   - Route dynamique par slug
   - Génération metadata SEO automatique (titre, description, OG)
   - Rendu markdown du contenu
   - Tracking des vues (views_count)

#### Phase 4 : Intégrations
1. **Navigation admin** (`src/components/AppSidebar.tsx`)
   - Ajout onglet "Articles" avec icône
   - Protection admin uniquement

2. **Composants UI réutilisés**
   - DataTable généralisé (`src/components/ui/data-table.tsx`)
   - Harmonisation avec le système utilisateurs existant

3. **Routing et protection**
   - Middleware mis à jour pour protéger `/apps/articles`
   - Toutes les routes articles nécessitent auth admin/employé

### Données de test
- Article exemple créé automatiquement: "Guide de gestion de copropriété"
- Catégorie "guides" avec tags pertinents
- Statut publié pour test des pages publiques

### Base de données exécutée ✅
Script SQL exécuté avec succès dans Supabase:
- Table articles créée
- Triggers et fonctions installés
- RLS policies actives
- 1 article de test disponible

### État actuel
- ✅ Système complet opérationnel
- ✅ Interface admin fonctionnelle
- ✅ Pages publiques migrées de Strapi vers Supabase
- ✅ SEO optimisé avec metadata automatique
- ✅ Sécurité via RLS Supabase

### Prochaines améliorations possibles
- Éditeur markdown enrichi (WYSIWYG)
- Upload d'images pour featured_image
- Système de commentaires
- Statistiques détaillées par article
- Export/import d'articles

### Fichiers créés/modifiés
**Nouveaux fichiers:**
- `supabase/scripts/create-articles-table.sql`
- `src/types/article.ts`
- `src/app/api/articles/route.ts`
- `src/app/api/articles/[id]/route.ts`
- `src/app/apps/articles/page.tsx`
- `src/app/apps/articles/new/page.tsx`
- `src/app/apps/articles/[id]/edit/page.tsx`
- `src/app/apps/articles/columns.tsx`
- `private/gestionnaire-articles-roadmap.md`

**Fichiers modifiés:**
- `src/app/ressources/page.tsx` (migration Strapi → Supabase)
- `src/app/ressources/[slug]/page.tsx` (création route article)
- `src/components/AppSidebar.tsx` (ajout onglet Articles)
- `src/components/layout/Header.tsx` (correction lien Application)
- `src/middleware.ts` (protection routes articles)

---

## ✍️ Charte éditoriale — Ton & « mots forts »

Objectif
- Assumer une voix claire et assurée, orientée action, qui exprime l’Ambition et la Volonté de « mettre fin » aux irritants classiques de la copropriété.

Piliers sémantiques (à réutiliser)
- Ambition, Volonté, Exigence, Transparence, Proximité, Réactivité, Respect, Simplicité, Clarté.
- Verbes d’action: « Mettre fin », « Clarifier », « Accélérer », « Assumer », « Garantir », « Simplifier ».

Formules « Mettre fin… » (à décliner)
- « Mettre fin aux réponses tardives. »
- « Mettre fin aux frais cachés. »
- « Mettre fin aux AG sans fin. »
- « Mettre fin aux dossiers qui n’avancent pas. »

Exemples prêts à l’emploi
- Home (H1/H2)
  - H1: « Le syndic local et efficace. »
  - H2: « Mettons fin aux lenteurs et aux zones d’ombre. »
- Pages ville (H1/H2)
  - H1: « Le syndic local et efficace [prep] [Ville]. »
  - H2: « Notre volonté: des réponses sous 48h et une gestion claire. »
- Offres (intro)
  - « Transparence totale. Aucune ligne illisible. Des engagements assumés. »
- Changer de syndic (accroche)
  - « Mettre fin à l’inertie: 5 étapes simples, on s’occupe de tout. »
- Qui sommes‑nous (mission)
  - « Notre ambition: réconcilier exigence, proximité et résultats. »

CTA — variantes
- « Demander un devis en 24h » / « Être rappelé » / « Démarrer la transition » / « Parler à un gestionnaire »

Do / Don’t (rédaction)
- Do: phrases courtes, verbe fort au présent, bénéfices concrets, évitez le jargon.
- Don’t: hyperboles vagues (« solution innovante »), passif, doubles négations, promesses non mesurables.

Implémentation progressive (suggestion)
- Remplacer les sous‑titres H2 par des formulations « Ambition/Volonté/Mettre fin ».
- Ajouter un encart « En bref » (3–5 puces d’engagements) en haut de Home/Offres/Villes.
- Harmoniser les CTA avec une promesse mesurable (« 24h », « 48h »).
