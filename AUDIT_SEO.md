# Audit SEO — altitude-brut.fr

Rapport détaillé à destination de la direction éditoriale. Méthodologie : analyse statique du HTML servi par Vercel, du sitemap, du robots, du code source Next.js, des données structurées JSON-LD et de la configuration de crawl. Les métriques terrain Google PageSpeed Insights ont été rate-limitées pendant la collecte — elles sont à compléter manuellement via [pagespeed.web.dev](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.altitude-brut.fr%2F).

Destinataire : Yann Karroum (yannkarroum@gmail.com).
Environnement cible : production, `https://www.altitude-brut.fr`.
Date de l'audit : 21 avril 2026.

---

## 1. Résumé exécutif

Note globale : **B+ (très bon démarrage, quelques correctifs rapides à haute valeur).**

Le site a été configuré dès sa mise en ligne avec la quasi-totalité des fondations SEO attendues d'un magazine en 2026 : metadata dynamique par page, structured data complète (Organization, WebSite+SearchAction, NewsArticle, BreadcrumbList, ItemList de SportsEvent, WebPage), sitemap exhaustif de 131 URL, news sitemap pour la fraîcheur 48 h, robots.txt différencié par bot (y compris AI bots), canonical systématique, hreflang `fr`, OpenGraph + Twitter Card, Google Analytics 4, Google Search Console vérifiée et soumise. IndexNow est wiré vers Bing et Yandex à chaque push `main`.

Les points de friction identifiés relèvent à **95 % de petits correctifs** (pas d'erreurs structurelles majeures). Le principal enjeu est la **cohérence de domaine** (`altitude-brut.fr` vs `www.altitude-brut.fr`), suivi de l'**OG image par défaut non brandée**, puis d'une série d'optimisations avancées à programmer sur 2-4 semaines.

---

## 2. Points forts (ce qui est déjà en place)

### Infrastructure et crawlabilité
- HTTPS partout, HSTS servi par Vercel (`Strict-Transport-Security: max-age=63072000`)
- `robots.txt` détaillé : 18 user-agents distincts (Googlebot, Bingbot, Yandex, DuckDuckBot, + GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, OAI-SearchBot, ChatGPT-User, Perplexity-User)
- `Host: https://altitude-brut.fr` et deux sitemaps déclarés dans robots
- `sitemap.xml` statique avec `lastmod`, `changefreq`, `priority` par route — 131 URLs indexées
- `news-sitemap.xml` dynamique (48 h) au format Google News

### Métadonnées
- Titre home : « Altitude Trail — Actualités trail, courses et ultra-trail » (56 caractères, dans la fourchette optimale 50-60)
- Titre article type : « La caféine en ultra : dosage optimal et gestion de la vigilance nocturne | Altitude Trail » (template `%s | Altitude Trail` appliqué via `metadata.title.template`)
- Meta description unique par page, extraite du chapô rédactionnel
- Canonical URL sur chaque page (via `metadata.alternates.canonical`)
- `hreflang=fr` sur chaque page
- OpenGraph complet sur articles (`og:type=article`, `og:image`, `article:published_time`, `article:author`, `article:section`, `article:tag`)
- Twitter Card `summary_large_image` configurée

### Structured data
- Home : `Organization`, `WebSite` avec `SearchAction` (permet le *sitelinks search box*)
- Article : `NewsArticle` + `BreadcrumbList` + `WebPage` + `ImageObject`
- Catégorie : `CollectionPage` + `BreadcrumbList`
- Courses : `ItemList` de `SportsEvent` avec `geo.coordinates`
- Course détail : `SportsEvent` avec `eventAttendanceMode=OfflineEventAttendanceMode` et `eventStatus=EventScheduled`

### Contenu et hiérarchie
- 1 seul `<h1>` par page, aucun abus
- 6 `<h2>` sur un article type (bonne granularité pour le sommaire cliquable et pour Google)
- Sommaire auto-généré et cliquable avec ancres (`scroll-mt-24`) à partir des `##` du markdown
- Toutes les images servies ont un attribut `alt` non vide (17 sur home, 6 sur article — 0 sans alt)
- `next/image` avec `srcset` responsive + `sizes` correctement déclaré, format AVIF/WebP négocié
- LCP image préchargée en `<link rel="preload" as="image" imageSrcSet=…>` sur la home

### Performance (leviers déjà activés)
- `preconnect` vers `fonts.googleapis.com` et `fonts.gstatic.com`
- Google Fonts chargé en `display=swap`
- Google Analytics chargé avec `fetchPriority="low"` et `async` (pas bloquant)
- Compression gzip/brotli automatique via Vercel Edge
- Static pages prerendering (131 routes SSG)
- Images optimisées au build via Next.js Image pipeline

### Analytics et indexation
- Google Analytics 4 actif (`G-THC9PSGZ14`) injecté via `@next/third-parties`
- Google Search Console vérifiée (2 méthodes en place : HTML file + meta tag)
- Les 2 sitemaps sont soumis et parsés : `sitemap.xml` (129 URLs acceptées) et `news-sitemap.xml` (14 URLs acceptées)
- IndexNow pingue Bing + Yandex à chaque push sur `main` (workflow GitHub Actions, 180 s après push pour laisser Vercel finir le déploiement)
- Publication automatisée quotidienne à 06:00 UTC via `scripts/veille.mjs` + Claude Opus 4.7 + fal.ai flux-pro-1.1

---

## 3. Performance — Core Web Vitals

Le rate-limit de l'API PageSpeed Insights empêche la collecte automatisée des métriques terrain pendant cet audit. **À lancer manuellement** :

| URL | Mobile | Desktop |
|---|---|---|
| https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.altitude-brut.fr%2F | mobile | desktop |
| https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.altitude-brut.fr%2Farticles%2Fcafeine-ultra-trail-dosage-vigilance-nocturne | mobile | desktop |
| https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.altitude-brut.fr%2Fcourses | mobile | desktop |

### Cibles à viser en 2026

| Métrique | Bon | À corriger si |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2,5 s | > 4,0 s |
| CLS (Cumulative Layout Shift) | < 0,1 | > 0,25 |
| INP (Interaction to Next Paint) | < 200 ms | > 500 ms |
| TBT (Total Blocking Time) | < 200 ms | > 600 ms |
| FCP (First Contentful Paint) | < 1,8 s | > 3,0 s |
| TTFB (Time to First Byte) | < 800 ms | > 1,8 s |

### Prédictions et leviers disponibles

Compte tenu de la configuration actuelle :
- **LCP attendu mobile 1,8-2,5 s** : l'image hero est préchargée en `srcset`, hostée par Vercel Edge. Risque : si le `srcset` sélectionne une taille >200 kB sur mobile, le LCP peut glisser à 3 s. *Levier* : ajouter `loading="eager"` + `fetchPriority="high"` sur la balise image rendue (déjà fait via `priority` sur la carte `large`).
- **CLS attendu < 0,05** : tous les `next/image` ont des dimensions explicites (width/height), pas d'injection tardive de contenu. Bon score attendu.
- **INP attendu 100-200 ms** : React 19.2 hydrate un peu plus de 30 chunks JS sur la home. Si l'INP dépasse 300 ms au CrUX, regarder `scripts/` et déférer la carte Leaflet (déjà en dynamic import `ssr: false` sur /courses).
- **TBT attendu 100-400 ms mobile** : 33 balises `<script>` sur la home, principalement du JS Turbopack + le tag GA. GA est en `async`, non bloquant. Le gros JS de react-leaflet n'est chargé que sur /courses.
- **TTFB excellent** : Vercel Edge sert les pages statiques depuis le PoP le plus proche, typiquement 50-150 ms.

### Actions si Core Web Vitals échouent en field data

Collecte dans **Google Search Console → Expérience sur la page → Core Web Vitals** dans 28 jours (besoin de trafic CrUX). En attendant, utiliser [web.dev/measure](https://web.dev/measure/).

Si LCP > 2,5 s mobile :
1. Vérifier le poids de l'image hero : dans `src/app/page.tsx`, la première ArticleCard `large` précharge l'image de l'article le plus récent. Limiter le `sizes` à `100vw` sur mobile et `900px` sur desktop (déjà le cas).
2. Ajouter `content-visibility: auto` sur les sections en dessous du pli (Courses & Récits, Science & Entraînement).
3. Passer les fonts Google en self-hosted via `next/font/google` avec `subsets: ["latin"]` pour éliminer le round-trip `fonts.gstatic.com`.

---

## 4. SEO technique — problèmes et correctifs

### 🔴 P0-1 — Mismatch canonical / primary domain

**Symptôme.** Le site est servi en primary domain sur `https://www.altitude-brut.fr` (Vercel configuration), mais les `canonical`, les URLs du sitemap et le `metadataBase` pointent vers `https://altitude-brut.fr` (sans `www`). L'apex retourne un 307 redirect vers `www`.

**Impact.** Google finit par comprendre — mais il perd du temps, consolide mal les signaux de ranking et peut afficher temporairement l'apex dans les SERP puis le remplacer. Risque de split de backlinks.

**Correctif (5 minutes de code).** Dans `src/lib/seo.ts` :
```ts
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.altitude-brut.fr"
).replace(/\/$/, "");
```
Ou à l'inverse, basculer Vercel pour que `altitude-brut.fr` soit primary et `www` redirige — mais c'est une modif de config Vercel plus lourde.

**À valider après le fix** :
- `curl -I https://altitude-brut.fr` doit rester 307 → `www.altitude-brut.fr`
- `curl https://www.altitude-brut.fr/sitemap.xml | head` doit lister des `<loc>https://www.altitude-brut.fr/…</loc>`
- GSC → Réindexer `sitemap.xml` pour forcer le recalcul

### 🟡 P1-1 — OG image par défaut non brandée

**Symptôme.** `og:image` sur la home = `https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80` (photo générique). Idem pour toutes les pages sans image propre (sitemap, robots, 404 hypothétique).

**Impact.** Quand quelqu'un partage `altitude-brut.fr` sur Slack, Discord, Twitter, LinkedIn, iMessage, il voit une image Unsplash quelconque — pas le logo Altitude Brut, pas de titre éditorial visible, pas d'accroche commerciale.

**Correctif.**
1. Créer une image OG 1200×630 brandée : logo Altitude Brut centré + tagline « Le media trail de référence » + fond paysage montagne. Sauvée en `public/og-default.jpg`.
2. Dans `src/lib/seo.ts`, remplacer `DEFAULT_OG_IMAGE` par `${SITE_URL}/og-default.jpg`.
3. Optionnel avancé : `next/og` dynamique qui génère une image avec le titre de l'article en overlay (cf. https://vercel.com/docs/functions/og-image-generation).

### 🟡 P1-2 — Meta description articles légèrement trop longue

**Symptôme.** Les chapô rédactionnels Altitude Brut font 160-200 caractères et sont utilisés tels quels en `meta description`. Google tronque à ~155-160 caractères sur mobile.

**Impact.** Le CTR en SERP peut baisser de 5-10 % quand le snippet est coupé au milieu d'une phrase avec des points de suspension.

**Correctif.** Dans `scripts/veille.mjs` et `scripts/generate-new-articles.mjs`, contraindre le chapô Claude à 140-155 caractères pour la description (on peut garder le chapô long pour le header de la page article). Ou ajouter un champ `seoDescription` dans le frontmatter, fallback sur excerpt si absent.

### 🟡 P1-3 — Pas de feed RSS/Atom servi

**Symptôme.** Le header pointe `/sitemap.xml` sous le lien « RSS » en desktop, mais il n'y a pas de vrai flux RSS.

**Impact.** Impossible d'intégrer Altitude Brut à Feedly, Inoreader, Flipboard. Ferme une porte d'acquisition long-terme des power users et de certains réseaux d'agrégation.

**Correctif.** Créer `src/app/rss.xml/route.ts` qui retourne du RSS 2.0 ou Atom 1.0 avec les 50 derniers articles. Refuser ensuite le sitemap sous le lien « RSS » et brancher ce nouveau chemin.

### 🟡 P1-4 — `article:published_time` en format français

**Symptôme.** OpenGraph `article:published_time` contient « 16 avril 2026 » (texte FR) au lieu d'un ISO 8601. Idem pour le JSON-LD `NewsArticle.datePublished` : `parseFrDate(article.date).toISOString()` est correct pour le JSON-LD, mais l'OG meta est brut.

**Impact.** Facebook, LinkedIn et certains aggregators n'arrivent pas à parser la date. Certains CRM social listening ratent la fraîcheur.

**Correctif.** Dans `src/app/articles/[slug]/page.tsx`, `generateMetadata`, remplacer `publishedTime: article.date` par `publishedTime: parseFrDate(article.date).toISOString()`. Idem pour `modifiedTime`.

### 🟢 P2-1 — Pas de `<link rel="alternate" type="application/rss+xml">` dans le head

Une fois le RSS en place (P1-3), ajouter dans `layout.tsx` :
```tsx
<link rel="alternate" type="application/rss+xml" title="Altitude Brut — RSS" href="/rss.xml" />
```

### 🟢 P2-2 — Pas de `theme-color` ni de manifest PWA

**Impact.** Sur Android et certains iOS, la barre d'adresse reste blanche par défaut alors qu'une couleur navy serait cohérente avec la charte. Aussi, pas de possibilité d'ajouter au home screen.

**Correctif.**
```tsx
// layout.tsx metadata export
themeColor: "#0a1628", // le navy du site
manifest: "/manifest.webmanifest",
```
Plus un `public/manifest.webmanifest` minimal.

### 🟢 P2-3 — Pas de pages `/auteurs/[name]` ni `/tags/[tag]`

Chaque article référence `author` et `tags[]` mais aucune page agrégée ne les liste. Manque de profondeur d'indexation pour les requêtes de type « Yann Karroum trail ».

**Correctif.** Créer `src/app/auteurs/[slug]/page.tsx` et `src/app/tags/[slug]/page.tsx` avec `generateStaticParams` sur les valeurs uniques. Ajouter au sitemap.

---

## 5. On-page SEO

### Hiérarchie des titres
Validée sur le fichier article type. Structure correcte :
- 1 `<h1>` : le titre rendu par la page React (pas dans le markdown body)
- 4-6 `<h2>` : les sections `##` du markdown, avec `id` généré par `slugifyHeading` pour les ancres du sommaire
- Les `<h3>` sont rares mais utilisés quand la section a une sous-partie distincte

Aucun skip (pas de h1 → h3). Aucun h1 dupliqué.

### Maillage interne
- **Home** : 51 liens totaux, dont 41 internes (80 %). Excellent ratio.
- Article type : breadcrumb cliquable + sommaire cliquable + bloc catégorie parente + 3 articles similaires + 4 « plus consultés » → ~12-15 liens internes sortants par article.
- Toutes les pages catégorie sont accessibles depuis le header. Toutes les courses depuis `/courses`.

### Ancres du sommaire
Auto-générées par `slugifyHeading` (normalisation, accents supprimés, non-alphanumériques → tirets). Les `<h2>` reçoivent le même `id` côté React. `scroll-mt-24` sur chaque `<h2>` pour laisser une marge quand on saute via l'ancre.

### Longueur de contenu
Articles entre 1000 et 1250 mots. Dans la zone où Google considère le contenu comme « long-form in-depth », ce qui pousse le ranking sur requêtes moyennement concurrentielles.

### Occurence du mot-clé principal
Le mot-clé est présent dans : titre `<h1>`, premier `<h2>`, premier paragraphe, meta description, slug, URL. La densité moyenne est ~0,8-1,5 % sur les articles générés — zone saine, pas de sur-optimisation.

---

## 6. Structured data / microdata

### Couverture actuelle (vérifiée en HTML live)

| Schema.org type | Pages concernées | Implémentation |
|---|---|---|
| `Organization` | toutes | root layout, JSON-LD |
| `WebSite` + `SearchAction` | toutes | root layout, JSON-LD |
| `NewsArticle` | `/articles/[slug]` | per-page `generateMetadata` + JsonLd component |
| `BreadcrumbList` | `/articles/[slug]`, `/categories/[slug]`, `/courses`, `/courses/[slug]`, `/contact` | composant `Breadcrumb` |
| `WebPage` | `/articles/[slug]` | dans NewsArticle via mainEntityOfPage |
| `ImageObject` | `/articles/[slug]` | dans NewsArticle via publisher.logo |
| `CollectionPage` | `/categories/[slug]` | buildCollectionPageJsonLd |
| `ItemList` | `/categories/[slug]`, `/courses` | mainEntity de CollectionPage + page /courses |
| `SportsEvent` | `/courses`, `/courses/[slug]` | buildSportsEventJsonLd avec `eventStatus`, `eventAttendanceMode`, `geo.GeoCoordinates` |

### À tester dans [Rich Results Test](https://search.google.com/test/rich-results)
Chaque type déclenche des rich results différents. Soumettre :
- `https://www.altitude-brut.fr/articles/cafeine-ultra-trail-dosage-vigilance-nocturne` → doit renvoyer *Valid* pour NewsArticle + BreadcrumbList
- `https://www.altitude-brut.fr/courses/utmb-mont-blanc-2026` → doit renvoyer *Valid* pour Event + BreadcrumbList
- `https://www.altitude-brut.fr/` → doit renvoyer *Valid* pour WebSite avec *Sitelinks searchbox* éligible

### Ce qui manque (P1-P2)

1. **`FAQPage` schema** sur les articles qui ont un format question/réponse (guides type « Comment débuter le trail en 2026 »). Fait gagner un bloc FAQ rich snippet sur Google.
2. **`HowTo` schema** sur les guides d'entraînement (structure étape par étape).
3. **`Review` ou `AggregateRating` schema** sur les fiches de courses si un jour des retours coureurs sont collectés.
4. **`Person` schema** sur chaque article pour l'auteur (actuellement on met `Organization` partout). Pour les articles avec un vrai nom de journaliste derrière, switcher vers `Person` avec `sameAs` (LinkedIn, Twitter) renforce E-E-A-T.
5. **`Article` au lieu de `NewsArticle`** pour les contenus evergreen (guide débutant, blessures). `NewsArticle` est réservé aux actus datées dans Google News. À différencier selon `categorySlug` dans `buildNewsArticleJsonLd`.

---

## 7. Contenu et signaux E-E-A-T

Google's E-E-A-T = **Experience, Expertise, Authoritativeness, Trustworthiness**. Fondamental pour les sujets santé/nutrition qui tombent en zone YMYL (*Your Money or Your Life*) — et la rubrique Blessures & Nutrition y tombe pleinement.

### Ce qui manque pour booster E-E-A-T sur la rubrique Blessures/Nutrition

1. **Page `/qui-sommes-nous`** absente. Ajouter : biographie éditoriale, liste des rédacteurs, politique de vérification des faits, conflits d'intérêt déclarés.
2. **Pas de reviewer médical affiché** sur les articles santé. Pour Google YMYL, ajouter en tête ou pied d'article « Article relu le … par Dr … médecin du sport ». Si un vrai médecin n'est pas disponible, *ne pas inventer* — plutôt viser en priorité le signal de transparence rédactionnelle.
3. **Pas de `sameAs` sur Organization** (LinkedIn, Instagram, X, Strava club). Ajouter dans `buildOrganizationJsonLd` :
```ts
sameAs: [
  "https://www.instagram.com/altitudebrut",
  "https://x.com/altitudebrut",
  "https://www.linkedin.com/company/altitude-brut",
]
```
même si les comptes ne sont pas encore ultra-actifs, ils doivent exister avec la bonne biographie linkée.
4. **Pas de page `/mentions-legales` ni `/politique-de-confidentialite`**. Obligatoire RGPD (si le site trace des visiteurs EU avec GA4) et signal de trust pour Google.

---

## 8. Accessibilité et UX mobile

### Accessibilité (a11y)
- Tous les `<img>` ont un `alt` rempli (vérifié sur 23 images dans le live HTML)
- Hiérarchie sémantique : `<article>`, `<aside>`, `<nav aria-label="Sommaire">`, `<nav aria-label="Fil d'Ariane">` présents
- Hamburger du header a `aria-label` et `aria-expanded` (ajoutés récemment)
- **À vérifier manuellement** : contraste couleur des textes secondaires sur fond blanc (text-slate-500 sur white peut être en limite WCAG AA selon la taille). Lancer [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) sur `#64748b` / `#ffffff` → ratio 4.74:1 (OK pour 16px+, limite pour les 10px des tags).
- Lang attribute : `<html lang="fr">` correct.

### Mobile UX
- Layout mobile-first redesigné (Charente Libre style) : image 16:9 full-width, titre `text-2xl font-black`, pills catégorie + readTime, chapô 16px, séparateur entre cards
- Typo corps ≥ 16 px (text-base) sur mobile, 14 px (text-sm) sur desktop
- Alternance 2 cards avec chapô + 1 card titre-only (règle `i % 3 === 2`) pour casser la monotonie du feed
- Les sidebars (LES PLUS CONSULTÉS + AGENDA + À LA UNE) sont masquées sur mobile via `hidden lg:block`
- Image grayscale uniquement en desktop (hover B&W → couleur préservé), mobile natif couleur

---

## 9. Roadmap priorisée

### 🔴 P0 — Cette semaine (haute valeur, petit effort)
- [ ] **Aligner `SITE_URL` sur `www.altitude-brut.fr`** dans `src/lib/seo.ts` (5 min)
- [ ] **Forcer un resubmit du sitemap** dans GSC après le fix canonical (2 min)
- [ ] **Changer `article:published_time`** en ISO 8601 dans OG metadata (5 min)

### 🟡 P1 — Ce mois-ci
- [ ] Créer une **OG image brandée** `public/og-default.jpg` (1200×630, logo + tagline)
- [ ] Ajouter un **vrai feed RSS/Atom** à `/rss.xml` (+ `<link rel="alternate">` dans le head)
- [ ] Contraindre les meta descriptions à ≤155 caractères (ajuster prompts Claude)
- [ ] Ajouter **`FAQPage` schema** sur les guides avec questions/réponses
- [ ] Ajouter **pages `/auteurs/[slug]`** pour les signatures récurrentes
- [ ] Ajouter **`sameAs` sur Organization** dès les comptes sociaux créés
- [ ] Ajouter **pages légales** (Mentions légales, RGPD, À propos)
- [ ] Différencier `Article` (evergreen) de `NewsArticle` (actu datée)

### 🟢 P2 — Quand le temps le permet
- [ ] `theme-color` + web manifest PWA
- [ ] Pages `/tags/[tag]` avec sitemap
- [ ] `next/og` dynamique pour génération d'images par article
- [ ] Self-host des fonts Google via `next/font` (gagne 100-200 ms sur LCP)
- [ ] `content-visibility: auto` sur sections below-the-fold
- [ ] Ajouter `Review`/`AggregateRating` si un système d'avis est lancé sur les fiches courses
- [ ] Soumettre la propriété à [Google News Publisher Center](https://publishercenter.google.com/) (élargit la visibilité dans l'onglet *Actualités*)
- [ ] Soumettre un flux RSS à [Mediatonic](https://www.mediatonic.com/) / Actualitte pour diffusion FR spécialisée
- [ ] `sitemap-index.xml` qui agrège sitemap.xml + news-sitemap.xml (aujourd'hui ils sont listés séparément dans robots, ça marche aussi)

---

## 10. Commandes et liens utiles

Pour relancer un audit quand les corrections sont en place :

```bash
# Rich Results Test pour chaque schema
open "https://search.google.com/test/rich-results?url=https%3A%2F%2Fwww.altitude-brut.fr%2F"
open "https://search.google.com/test/rich-results?url=https%3A%2F%2Fwww.altitude-brut.fr%2Farticles%2Fcafeine-ultra-trail-dosage-vigilance-nocturne"
open "https://search.google.com/test/rich-results?url=https%3A%2F%2Fwww.altitude-brut.fr%2Fcourses%2Futmb-mont-blanc-2026"

# PageSpeed Insights (mobile + desktop)
open "https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.altitude-brut.fr%2F&form_factor=mobile"
open "https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.altitude-brut.fr%2F&form_factor=desktop"

# Lighthouse CLI en local (Node 20+)
npx lighthouse https://www.altitude-brut.fr/ --preset=mobile --view
npx lighthouse https://www.altitude-brut.fr/articles/cafeine-ultra-trail-dosage-vigilance-nocturne --preset=mobile --view

# GTmetrix (test serveur London, free tier)
open "https://gtmetrix.com/?url=https%3A%2F%2Fwww.altitude-brut.fr%2F"

# WebPageTest (multi-location)
open "https://www.webpagetest.org/runtest?url=https%3A%2F%2Fwww.altitude-brut.fr%2F"

# Security Headers (GSC signal indirect)
open "https://securityheaders.com/?q=https%3A%2F%2Fwww.altitude-brut.fr%2F"
```

---

## 11. Suivi recommandé

Mettre en place dans GSC le **rapport hebdo automatisé** :
- GSC → Paramètres → Utilisateurs → Ajouter ton adresse Gmail en tant que *Propriétaire vérifié*
- GSC → *Performances* → bouton *Exporter* → exporter le CSV en Google Sheets (onglet Search)
- Un Google Apps Script tire ces données toutes les semaines et push un résumé par mail (template disponible sur [Search Analytics for Sheets](https://searchanalyticsforsheets.com/))

Métriques à suivre les 28 premiers jours :
- Impressions, clics, CTR, position moyenne (global + par catégorie)
- Couverture d'indexation (pages indexées / soumises)
- Core Web Vitals (field data CrUX, une fois dispo)
- Erreurs de crawl (doit rester à 0)

---

*Audit généré le 21 avril 2026. À re-lancer après application des correctifs P0, soit environ une semaine de delta pour voir les premiers effets dans GSC.*
