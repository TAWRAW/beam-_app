# 📋 Instructions pour Claude Code

Copie-colle ceci dans une nouvelle session Claude Code:

---

**Contexte**: Je travaille sur un système de publication automatique sur les réseaux sociaux (Facebook, LinkedIn, Instagram, TikTok) pour un site Next.js + Supabase + n8n.

**État actuel**:
- ✅ Code Next.js complet (modal, API, page réseaux sociaux)
- ✅ Table Supabase `social_queue` créée
- ✅ Workflows n8n prêts en JSON (à importer)
- ✅ MCPs Supabase et n8n configurés et fonctionnels

**Ton objectif**: Importer les workflows n8n et configurer le système pour qu'il fonctionne de bout en bout.

**Instructions**:
1. Lis le fichier `CLAUDE_CONTEXT.md` pour avoir le contexte complet
2. Utilise les MCPs n8n et Supabase qui sont déjà configurés
3. Importe les workflows depuis `nextjs-app/n8n-workflows/`
4. Configure les credentials nécessaires
5. Teste le système

**Fichiers importants**:
- `CLAUDE_CONTEXT.md` - Contexte complet du projet
- `N8N_WORKFLOW_SETUP.md` - Documentation workflow n8n
- `nextjs-app/n8n-workflows/` - Workflows JSON à importer
- `.env.local` - Variables d'environnement (credentials)

**Commence par**: "Je vais lire CLAUDE_CONTEXT.md pour comprendre l'état du projet"
