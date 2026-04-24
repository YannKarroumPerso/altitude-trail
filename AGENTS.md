<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:altitude-trail-context -->
# Altitude Trail — contexte projet pour Claude

**Ce que c'est** : site éditorial trail running + ultra-endurance, Next.js 16 (App Router) + Tailwind 4, hébergé sur Vercel, repo GitHub `YannKarroumPerso/altitude-trail`. Propriétaire / dev : Yann Karroum.

## Comment tu déploies (autonome)

Tu as un token GitHub dédié qui te permet de commit/push seul, sans action de Yann :

- **PAT** stocké dans `C:\Users\YannKARROUM\altitude-trail\.claude-git-token` (gitignored)
- **Identité git bot** : `user.name="altitude-trail-claude-bot"`, `user.email="claude-bot@altitude-trail.fr"`
- **Pattern de déploiement** qui fonctionne :
  1. Clone frais dans `/tmp/deploy-repo` avec le token dans l'URL (le mount Windows corrompt l'index git si on manipule `git add/rm` dessus)
  2. Applique les modifs dans `/tmp/deploy-repo`
  3. Lance `node scripts/publish.mjs` — ce script régénère `src/lib/data.ts` à partir des `.md` de `content/articles/`, puis commit + push automatiquement
- **Auto-déploiement Vercel** : build + deploy automatique sur tout push `main`, ~2-3 min de build
- **Allowlist Cowork** : Yann a mis "Tous les domaines" → tu peux `WebFetch` `altitude-trail.fr` et `api.github.com` pour vérifier les déploiements

## Pipelines éditoriaux actifs (GitHub Actions)

- `scripts/veille.mjs` — 3x/jour (6h, 11h30, 18h Paris) · 21 sources RSS · 1 article max par run
- `scripts/veille-tavily.mjs` — 4x/jour (8h15, 12h, 16h, 20h Paris) · 20 queries thématiques · synthèse multi-sources
- `scripts/brief-publish.mjs` — 2x/jour (10h, 15h Paris) · 3 verticales (equipement / marques-industrie / athletes) · format court 400-600 mots · gabarit imposé "L'info en 30 secondes / Contexte / Notre lecture"
- Cap quotidien global : 5 articles éditoriaux + 3 brèves (10+5 pendant un hot event : UTMB, Western States, Hardrock, etc.)

## Garde-fous & règles critiques

- **Pas de cadratins (—)** dans les articles : max 1 par article. Virgules, parenthèses, deux-points à la place.
- **Monnaies en euros** uniquement. Les sources $ / £ / CHF sont converties approximativement.
- **Anglicismes limités** : "chaussures" pas "shoes", "équipement" pas "gear".
- **Brèves** : anti-rétro (le filtre regex rejette les titres/excerpts mentionnant une année révolue), anti-prescription commerciale, anti-spéculation, format strict avec 3 sections obligatoires.
- **PPTX/DOCX/XLSX** sont gitignored (évite les locks Office qui cassent les rebase).
- **Fichiers sensibles** gitignored : `.claude-git-token`, `.claude-secrets`, `.claude-*.local`, `.claude-bootstrap.md`.

## Auteurs (routage déterministe 80/20)

Défini dans `src/lib/authors.ts` et miroir dans `scripts/lib/authors.mjs` :

- **Thomas Rouvier** — entrainement, blessures-preventions
- **Claire Mercier** — nutrition
- **Marc Blanc** — actualites, courses-recits, athletes, marques-industrie, equipement
- **Yann Karroum** — actualites, debuter, equipement (cosigne 80/20 avec Marc sur actualites + equipement)

## Ce que tu dois faire au début de chaque nouvelle conversation

1. Lire ce fichier (`AGENTS.md`) — tu le fais déjà puisque `CLAUDE.md` l'inclut.
2. Demander à Yann ce qu'il veut faire.
3. Pour toute modif code : cloner dans `/tmp/deploy-repo`, modifier, `publish.mjs` commit+push.
4. Pour toute vérif prod : `WebFetch` sur `altitude-trail.fr` ou l'API GitHub pour le statut.

## Repères récents (mettre à jour quand pertinent)

- `aa01b17` (2026-04-23) : retrait article Blanchard UROY 2025 (événement trop vieux, mal daté par le pipeline brèves avant les garde-fous anti-rétro)
- `935a545` (2026-04-23) : bot Tavily, 2 articles UTMF 2026 (hot event du 24-26 avril)

Dernière mise à jour de ce fichier : 2026-04-23.
<!-- END:altitude-trail-context -->
