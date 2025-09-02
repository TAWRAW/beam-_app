# 📈 Avancement Migration Beamô (HTML → Next.js)

Dernière mise à jour: initialisation de l’inventaire du site legacy et préparation du scaffolding Next.js.

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
4) Contact: validations renforcées + optional Turnstile
5) Préparer redirections équivalentes dans Next (middleware ou config Vercel)

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
- [ ] Redirections équivalentes
