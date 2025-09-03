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
1) Finaliser métadonnées (titles/descriptions OG) par page
2) Ajuster Tailwind aux couleurs/typo Beamô (#FFC300, Poppins)
3) Parité visuelle des sections (spacing/typo/icônes)
4) Contact: validations renforcées + Turnstile (anti‑spam)
5) Préparer/compléter redirections équivalentes (Next/Vercel)

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
- J+0–1: (1) Merci + tracking, (2) API contact SMTP.
- J+1: (3) Turnstile + bascule progressive (4).
- J+2: (5) 404/500, (6) SEO, (7) Analytics.
- J+3: (8) Audit redirections, (9) Monitoring (option).

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
- [ ] Turnstile (client + serveur)
- [ ] Bascule formulaire → API (fallback temporaire)
- [ ] 404/500 custom
- [x] 404/500 custom (404: fond jaune, GIF, bouton Contact, texte ajusté)
- [ ] SEO avancé (OG per‑page, sitemap, robots)
- [ ] GA4 + Vercel Analytics
- [ ] Audit redirections (logs + tests)
- [ ] Monitoring (Sentry) – option

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
