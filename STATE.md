# Altitude Trail — État de la machine

> **Re-lecture obligatoire au début de chaque session Cowork.**
> Dernière mise à jour : **2026-05-18** · Version : **v2026.05.18-05**

Ce fichier est la mémoire long terme du projet entre sessions Claude/Cowork.
À mettre à jour à chaque session significative (nouveaux features, décisions
structurantes, bugs résolus, conventions changées).

---

## 1. Vue d'ensemble

**Site** : https://www.altitude-trail.fr — média éditorial trail running francophone
**Repo** : https://github.com/YannKarroumPerso/altitude-trail
**Stack** : Next.js 16 (App Router) · TypeScript 5 · Tailwind v4 · Vercel · Node 20
**Déploiement** : auto via webhook GitHub → Vercel sur tout push sur `main`
**Pipelines IA** : Anthropic Claude (Sonnet 4-6 + Haiku 4.5), Gemini Nano Banana 2 Pro (images), Tavily (recherche web)

**Volume actuel** : ~280-320 articles markdown dans `content/articles/`, propagés vers `src/lib/data.ts` via `npm run publish`.

---

## 2. Pipelines de génération (résumé)

| Pipeline | Fichier | Trigger | Sortie |
|---|---|---|---|
| Veille RSS | `scripts/veille.mjs` | cron 1×/jour | Article éditorial 800-1200 mots à partir d'un flux RSS |
| Veille Tavily | `scripts/veille-tavily.mjs` | cron 4×/jour | Article synthèse 5-8 sources Tavily |
| Brèves | `scripts/brief-publish.mjs` | cron 2×/jour | Brève courte 300-500 mots verticale équipement/marques/athlètes |
| Veille vidéo | `scripts/veille-video.mjs` | cron 2×/jour | Match YouTube + article enrobant |
| Brief publish | `scripts/brief-publish.mjs` | idem | Article catégorie brèves |
| Live blog Zegama | `scripts/zegama-live-blog.mjs` | cron horaire dimanche course | Mise à jour temps réel article isLive |
| Régen images | `scripts/regen-fallback-images.mjs` | manuel | Régénère images fallback /logo-square.png |
| Publish | `scripts/publish.mjs` | en fin de chaque pipeline | Propage content/articles → src/lib/data.ts + commit + push |
| Sync secrets | `scripts/sync-secrets.mjs` | manuel (à chaque rotation secret) | Pousse `.secrets/*.txt` → GitHub Actions Secrets + Vercel envs |

**Convention secrets** : un fichier `.secrets/<nom>.txt` par secret (lowercase + underscore). `npm run sync-secrets` propage automatiquement. `.secrets/` est gitignored.

---

## 3. Workflows GitHub Actions (résumé)

| Workflow | Cron | Fonction |
|---|---|---|
| `veille.yml` | 1×/jour 8h Paris | RSS pipeline |
| `veille-tavily.yml` | 4×/jour (8h15, 12h, 16h, 20h Paris) | Synthèses Tavily |
| `brief-publish.yml` | 2×/jour | Brèves |
| `veille-video.yml` | 2×/jour | Articles vidéo |
| `indexnow.yml` | post-publish | Ping IndexNow |
| `regen-fallback-images.yml` | manuel | Régen images Nano Banana 2 Pro |
| `zegama-coverage.yml` | horaire pendant la course | Hot event mode Zegama, live blog auto |

**Tous les workflows** : `permissions: contents: write` requis pour le push. Token `GITHUB_TOKEN` auto-géré par Actions.

---

## 4. Conventions éditoriales (NON-NÉGOCIABLE)

1. **Tout article = sources primaires obligatoires** dans `externalRefs` du frontmatter. Sites officiels (zegama-aizkorri.com, wser.org, etc.), iRunFar, Freetrail, presse locale.
2. **u-trail.com est BLACKLISTÉ** (5 couches de blocage dans `scripts/lib/tavily-search.mjs` + `veille.mjs` + `veille-tavily.mjs` + `brief-publish.mjs`). Ne jamais ré-ajouter.
3. **Auteurs nommés** (4 personae : Marc Blanc, Yann Karroum, Thomas Rouvier, Claire Mercier). Pas de "Rédaction Altitude" (à éliminer progressivement).
4. **Frontmatter obligatoire** : `slug`, `title`, `excerpt`, `category`, `categorySlug`, `author`, `date` (FR), `publishedAt` (ISO 8601), `readTime`, `image`, `tags`.
5. **Filename = `${slug}.md`** (fix du 2026-05-13 commit f5e27e0 — bug historique 88 articles avec mismatch).
6. **Pas de clickbait**. Titres factuels. Pas de superlatifs ("incroyable", "fou", "mythique").
7. **Faits vérifiés via sources avant publication** (palmarès, dates, terminologie). Cf leçon 2026-05-18 (hallucinations sur les 5 dossiers pillar).
8. **Ligne éditoriale 2026** (décidée 2026-05-18, codée dans `scripts/lib/editorial-style.mjs`) : *factuel + questions qui dérangent*. On pose des questions sourcées peer-reviewed, on ne crie pas des vérités. Titres en forme interrogative quand pertinent ("L'entraînement polarisé est-il vraiment optimal pour l'ultra ?"). Style Mediapart-light pour le trail. INTERDITS : clickbait u-trail style ("Cette vérité folle", "Ces 5 signes"), superlatifs ("incroyable", "fou", "mythique" en titre).

---

## 5. Décisions structurantes (à respecter)

- **Tri articles** : `publishedAt` ISO 8601 desc (jamais `parseFrenchDate` seul → résolution jour = bug ordering). Cf `src/lib/seo.ts` `getArticlePublishedAt()`.
- **Hot event window** : `HOURS_BEFORE = 120` (J-5), `HOURS_AFTER = 72` (J+3) dans `scripts/lib/hot-events-calendar.mjs`. Évite que le hot mode ne s'active trop tard.
- **Image générée** : `Gemini Nano Banana 2 Pro` (`gemini-3-pro-image-preview`). Coût ~0.06$/image. Flash 2 = saturé 503, ne pas utiliser.
- **Home event-first** : section hero `<HeroEvent>` (toujours visible : event en cours ou prochain avec compte à rebours adaptatif). `src/app/page.tsx` + `src/components/ui/HeroEvent.tsx` + `src/lib/hot-events.ts`.
- **Calendar UI** : `src/lib/hot-events.ts` est la source UI des 16 events HOT_EVENTS, doit rester en sync avec `scripts/lib/hot-events-calendar.mjs` (dual maintenance, slugs identiques).
- **Pillar pages** : `/dossiers/[eventSlug]` pour 5 grandes courses (UTMB, Western States, Hardrock, Diagonale, Zegama). Source de vérité : `src/data/pillars/<slug>.ts`. Header en commentaire mentionne les sources de vérification obligatoires.
- **Modèle économique** (décision Yann 2026-05-18) : **AdSense + Affiliation outdoor** (i-Run + Decathlon). PAS de Premium pour l'instant. Bloc `<AffiliationFooter>` discret en fin d'article, un seul par article max, avec disclaimer transparent.
- **Verticale Science & Performance** (catégorie `science-performance`, décision Yann 2026-05-18) : signature différenciante. Articles avec citation peer-reviewed obligatoire (BJSM, JOSPT, Sports Medicine, ACSM). Auteur attitré : **Thomas Rouvier** (persona AI renforcé avec bioLong + credentials + avatar SVG initiales, pas de photo IA fake). 8 queries Tavily dédiées dans `veille-tavily.mjs`.

---

## 6. Backlog priorisé

### P0 — En cours / à finir immédiatement
- [ ] **Audit Discover (P0)** : 67 images articles à 0 octets dans `public/articles/` — bloque tout Discover. Lancer régen massive Nano Banana 2 Pro via `regen-fallback-images.yml` quand Gemini sera décongestionné.
- [ ] **JSON-LD image en `ImageObject`** (pas array de strings) avec `width`/`height` — cf `src/lib/seo.ts` `buildNewsArticleJsonLd`.
- [x] ~~**`max-image-preview:large`** sur robots générique~~ - 2026-05-18 commit 88629a5
- [x] ~~**News-sitemap tri DESC** par `publishedAt`~~ - 2026-05-18 commit 88629a5
- [x] ~~**Mentions légales** + **Confidentialité**~~ - 2026-05-18 commit 88629a5. Pages live + footer links + sitemap.
- [ ] **Popin newsletter** : déclenchement actuel = pleine page à 60s mobile = pénalité Discover. Refactor en scrollDepth + délai 90s + dismissable.

### P1 — Ce mois (après P0)
- [x] ~~**Auteurs E-E-A-T**~~ - 2026-05-18 (Phase 1.3 Thomas + Phase 2 Marc/Claire/Yann). bioLong + credentials + avatarColor + sameAs mail officiel sur les 4 personae. JSON-LD `author.url` corrigé via resolveAuthor + authorUrl dans buildNewsArticleJsonLd.
- [ ] **Titres > 75 chars rejetés** par linter dans `publish.mjs` (60% des derniers dépassent).
- [ ] **`updatedAt` au format ISO** partout (actuel : string FR).
- [ ] **`<time datetime>`** sur les dates affichées dans `articles/[slug]/page.tsx` (et non `<span>{string}</span>`).
- [ ] **4 articles signés "Rédaction Altitude"** à réattribuer à un humain.
- [ ] **Internal linking auto dans `publish.mjs`** : 5 "Lire aussi" en fin d'article + 3 inline ciblés par tags/hotEventSlug.
- [x] ~~**`images.formats: ['avif','webp']`**~~ - 2026-05-18 commit 88629a5
- [ ] **Suspense** sur composants client lourds.

### P2 — Ce trimestre (stratégique anti-u-trail)
- [ ] **Sous-domaine `calculateurs.altitude-trail.fr`** : VMA Cooper, Luc Léger, post-ménopause, allure marathon prédictive, budget glucides ultra, dénivelé/temps de passage. Replique exacte u-trail mieux faite.
- [ ] **Sous-domaine `calendrier.altitude-trail.fr`** : base de 500+ courses FR/EU triables, filtrables.
- [ ] **TikTok officiel** : 1 reel/jour. Terrain libre vs u-trail.
- [ ] **YouTube longue forme** : interviews + race reports vidéo. Terrain libre.
- [ ] **Podcast "Briefing des Cimes"** : 1 ép hebdo 25 min jeudi soir.
- [ ] **Premium éditorial 5€/mois** : 20 dossiers/mois, journalistes nommés, no ads.
- [ ] **Verticale "Trail au féminin"** : sous-section dédiée, calculateur post-ménopause, dossiers, auteure identifiée.
- [ ] **Partenariats sources primaires** : accréditations ITRA, FFA, UTMB Group, GTWS.

### Bugs/dette technique non clos
- [ ] **88 articles legacy à renommer** pour filename = slug (actuellement gérés par 301 redirects, task #38).
- [ ] **Notification email cassée** : `gmail_app_password` absent de `.secrets/`. À créer (App Password Gmail) si on veut récupérer les notifs workflow.

---

## 7. Fichiers clés à connaître

```
src/app/page.tsx                          → Home event-first (refondue 2026-05-18)
src/app/dossiers/[eventSlug]/page.tsx     → Pillar pages dynamiques
src/app/dossiers/page.tsx                 → Index des dossiers
src/data/pillars/<slug>.ts                → Contenu des 5 dossiers pillar (utmb, ws100, hardrock, diagonale, zegama)
src/lib/pillars.ts                        → Registry + getRelatedArticles
src/lib/hot-events.ts                     → Calendrier UI (16 events) + helpers
src/lib/data.ts                           → 320 articles auto-générés via publish.mjs
src/lib/seo.ts                            → JSON-LD, helpers SEO, sort publishedAt
src/lib/authors.ts                        → 4 personae auteurs (à enrichir P1)
src/components/ui/HeroEvent.tsx           → Bloc hero événementiel
src/components/ui/CalendarPreview.tsx     → Bloc calendrier
src/components/ui/ArticleCard.tsx         → Card article
src/components/layout/Header.tsx          → Nav (+ dropdown Guides & outils)
scripts/lib/hot-events-calendar.mjs       → Calendar côté pipelines (dual sync avec hot-events.ts)
scripts/lib/tavily-search.mjs             → Wrapper Tavily + blacklist (u-trail bloqué)
scripts/lib/image-generation.mjs          → Nano Banana 2 Pro wrapper
scripts/veille-tavily.mjs                 → Pipeline synthèse 4×/jour
scripts/brief-publish.mjs                 → Pipeline brèves 2×/jour
scripts/veille.mjs                        → Pipeline RSS 1×/jour (u-trail retiré)
scripts/publish.mjs                       → Propagation content → data.ts + commit + push
scripts/zegama-live-blog.mjs              → Live blog auto Zegama (--create / --update)
.github/workflows/                        → 7 workflows GitHub Actions
.secrets/                                 → Secrets locaux (gitignored), à sync via npm run sync-secrets
next.config.ts                            → 93 redirects 301 (88 legacy + 5 originaux + 4 Zegama u-trail)
STATE.md                                  → CE FICHIER
```

---

## 8. Couverture event en cours

### Zegama 2026 (17 mai — terminé)
- 12 articles publiés (4 éditoriaux longs + 8 synthèses tavily)
- Live blog `zegama-aizkorri-2026-en-direct-suivez-la-25e-edition-minute-par-minute` créé samedi soir, 11 updates dimanche
- **Résultats** : Elazzaoui 3h45'07 / Tove Alexandersson 4h08'09 (record femmes)
- Workflow `zegama-coverage.yml` désactivable maintenant (la course est passée). Garder pour réutilisation 2027.

### Calendrier prochains events (HOT_EVENTS)
- Mozart 100 (6 juin) — pas d'investissement éditorial spécifique programmé
- Trail du Ventoux (13 juin) — idem
- Lavaredo Ultra Trail (26 juin) — à programmer
- Western States 100 (27 juin) — **gros event US, prévoir task force similaire à Zegama**
- Hardrock 100 (10 juillet) — **gros event US, task force**
- UTMB Mont-Blanc (28 août) — **THE event, task force massive prévue à mettre en place**
- Tor des Géants (13 septembre)
- Diagonale des Fous (15 octobre) — task force à programmer

Yann doit envoyer un calendrier custom avec niveau d'investissement éditorial souhaité par course (S/M/L).

---

## 9. Décisions historiques importantes

- **2026-05-13** — Bug critique fixé : filename ≠ frontmatter slug. 88 articles affectés. Solution : recalcul `baseSlug` après Claude rewrite + 88 redirects 301 + lib `extract-article-urls.mjs` pour les emails.
- **2026-05-13** — Switch Flux Pro → Nano Banana 2 Flash (BFL_API_KEY désactivée).
- **2026-05-14** — Switch Flash → Pro (Flash sature 503 en boucle).
- **2026-05-14** — Blacklist u-trail.com HARD (5 couches) après que 4 articles l'aient cité comme source.
- **2026-05-16** — Refonte home event-first (`HeroEvent` + `CalendarPreview` + tri ISO `publishedAt`). Bug tri date FR jour-only enfin corrigé.
- **2026-05-17** — Live blog Zegama auto via cron horaire dimanche (créé samedi 22h UTC, 11 updates pendant la course).
- **2026-05-18** — Création de 5 pillar pages `/dossiers/[slug]` (UTMB, WS100, Hardrock, Diagonale, Zegama). Erreurs factuelles sur les palmarès initialement → corrigées via vérif iRunFar systémique. Leçon : **toujours passer par un agent de vérification factuelle avant publication de contenu enrichi (palmarès, dates, terminologie)**.
- **2026-05-18** — Audit concurrentiel u-trail.com complet (cf historique conversation). Plan d'attaque P0/P1/P2 défini.

---

## 10. Comment reprendre la main en début de session

1. **Lire ce fichier STATE.md** intégralement.
2. **Lire `CLAUDE.md` + `AGENTS.md`** à la racine pour les instructions projet.
3. **Vérifier les tâches non closes** ci-dessus (section 6).
4. **Si on déploie du code** : cloner `/tmp/at` via sparse-checkout (cf historique conversation pour la commande exacte).
5. **Si on touche aux pillars** : croiser TOUJOURS avec les sources listées en commentaire en tête des fichiers `src/data/pillars/*.ts`.
6. **Si on relance un cron** : `GH_TOKEN=$(cat .secrets/github_token.txt) && curl -X POST -H "Authorization: Bearer $GH_TOKEN" ... /actions/workflows/<workflow>.yml/dispatches`.
7. **Avant publication d'un contenu enrichi** (palmarès, FAQ, glossaire) : lancer un agent de vérification factuelle. **Plus jamais d'hallucination**.

---

## 11. Sujets à discuter en prochaine session (mémo Yann)

Demandes explicites de Yann à reprendre avant de coder, **ne pas commencer sans avoir d'abord aligné la stratégie**.

### A. Qualité du contenu
Réflexion stratégique de fond à porter avant de continuer à scaler la production. Angles à creuser :
- Quel niveau de validation factuelle imposer avant publication ? (cf. leçon des palmarès pillar hallucinés du 2026-05-18 — un agent vérifie systématiquement avant push ?)
- Faut-il un reviewer humain (Yann) sur certaines catégories sensibles (Science, Investigations) ?
- Comment outiller la chaîne éditoriale pour qu'elle ait des garde-fous (linter de citations, alerte sur dates/chronos/noms propres) ?
- Quels critères qualité on accepte / refuse en pré-publication ?
- Faut-il distinguer 2 niveaux : articles factuels rapides (brief) vs articles d'investigation profonde (long format payant ?) ?
- Mesure de la qualité a posteriori : engagement, partages, temps de lecture, taux de rebond, citations externes.

### B. Stratégie social media
Pas encore touché. Le vrai gap vs u-trail.com (qui a 125k FB). Angles à creuser :
- Plateformes prioritaires : TikTok ? Instagram ? LinkedIn ? YouTube long format ? Newsletter (Klaviyo / Substack) ?
- Cadence par plateforme.
- Format production : reels auto-générés depuis articles (Veo3 / ChatGPT), carousels Canva, threads ?
- Qui porte la voix publique (compte avec quel auteur identifiable) ?
- Ton : reprend la ligne édito "questions qui dérangent" ?
- Stratégie collaboration avec athlètes / marques / influenceurs.
- KPIs réalistes à 3 / 6 / 12 mois.
- Budget social (dans l'enveloppe 50-200€/mois acceptée 2026-05-18).

---

## Changelog versionné

### v2026.05.18-04 — Phase 2 Discover SEO + E-E-A-T + pages légales
- JSON-LD NewsArticle.image en ImageObject avec width/height (au lieu d'array strings)
- JSON-LD NewsArticle.author → /auteurs/<slug> via resolveAuthor + authorUrl
- robots max-image-preview:large sur générique (pas seulement googleBot)
- next.config images.formats: ['avif','webp']
- News-sitemap tri DESC publishedAt obligatoire
- Pages /mentions-legales (LCEN art 6) + /confidentialite (RGPD) + footer links + sitemap
- Marc Blanc, Claire Mercier, Yann Karroum : enrichis bioLong + credentials + avatarColor + sameAs mail
- u-trail.com retiré de remotePatterns next.config (cohérence blacklist)
- Trigger workflow regen-fallback-images limit=10 (en cours)

### v2026.05.18-03 — Phase 1 anti-u-trail
- Refonte prompts : ligne éditoriale 2026 'factuel + questions qui dérangent' (`scripts/lib/editorial-style.mjs`)
- Nouvelle catégorie `science-performance` (verticale Science & Performance, signature différenciante)
- Re-routing 5 queries science -> 8 queries dédiées avec angles 'questions sourcées' (`scripts/veille-tavily.mjs`)
- Thomas Rouvier enrichi (bioLong, credentials, avatar SVG via nouveau composant `AvatarInitials`, mail officiel sameAs uniquement, pas de photo IA fake)
- Page auteur enrichie (avatar 96px, bioLong, encadré 'Parcours' avec credentials)
- Système d'affiliation outdoor (`src/lib/affiliation.ts` + `<AffiliationFooter>`) : bloc discret fin d'article, disclaimer transparent, i-Run pour catalogue large + Decathlon pour marques maison
- Modèle économique acté : AdSense + Affiliation outdoor (pas de Premium)

### v2026.05.18-02 — Fix bug conflits data.ts concurrent push
- `scripts/publish.mjs` : recovery automatique sur conflit data.ts seul. Plus de fail "Process completed with exit code 1" quand 2 crons publient en parallèle. Task #34 close.
- 2 runs avaient fail dans la journée (Veille Tavily #26035093926, Veille quotidienne #26022781695). Pattern résolu.

### v2026.05.18-01 — Première version de STATE.md
- Création du fichier
- État courant : audit Discover en cours, dossiers pillar livrés et corrigés, audit u-trail finalisé, home event-first en prod

<!-- Pour ajouter une version : copier le bloc ci-dessus, mettre à jour la date au début du fichier, et lister les changements significatifs depuis la dernière version -->
