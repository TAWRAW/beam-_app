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

À faire (optionnel)
- Remplacer le GIF par une illustration locale si besoin.
- Quand l’Extranet sera prêt: mettre à jour les liens sans supprimer la page (utile comme fallback).

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
