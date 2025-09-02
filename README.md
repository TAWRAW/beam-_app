# Beamô — Next.js Migration

Application Beamô — migration vers Next.js (App Router).

Ce repo contient la nouvelle application Next.js (App Router) et les documents de migration.

## Démarrer en local

- `cd nextjs-app`
- `npm install`
- `npm run dev -- -p 3002`
- Ouvrir http://localhost:3002

## Env (EmailJS)

Créer `nextjs-app/.env.local` avec:

```
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=...
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_pcipbzi
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_j8dxp6l
NEXT_PUBLIC_EMAIL_TO=tom.lemeille@beamo.fr
```

## Déploiement sur Vercel

1. Installer le CLI: `npm i -g vercel`
2. Se connecter: `vercel login`
3. Depuis `nextjs-app/`, lancer: `vercel` (staging) puis `vercel --prod` (prod)
4. Ajouter les variables d’environnement dans Vercel (Project Settings → Environment Variables) avec les clés ci‑dessus.
5. Attacher le domaine `beamo.fr` (ou équivalent) dans Vercel → Domains.

## Git — étapes

Depuis la racine du repo:

```
git init
git add .
git commit -m "feat: initial nextjs app + migration scaffolding"
```

Pour GitHub (exemple):

```
gh repo create beamo-nextjs --public --source=. --remote=origin --push
# ou manuellement:
# git remote add origin git@github.com:<org>/beamo-nextjs.git
# git push -u origin main
```

## Structure

- `nextjs-app/` — App Next.js 14 (landing, offres, contact)
- `private/` — documents de planification/migration

## Notes

- La navbar est en `fixed`; un spacer est ajouté pour éviter le recouvrement.
- Les pages clés ont été migrées; Strapi sera branché plus tard.
