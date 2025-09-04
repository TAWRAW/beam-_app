# 📈 Avancement Migration Beamô (HTML → Next.js)

Dernière mise à jour: plan de durcissement formulaire + SEO/Analytics avant stabilisation de prod.

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
- Statut: en attente support OVH.

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
