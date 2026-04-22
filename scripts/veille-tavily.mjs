#!/usr/bin/env node
// Veille thématique trail via Tavily API + Claude.
//
// Différence avec scripts/veille.mjs (flux RSS) :
//   - veille.mjs : 13 flux RSS fixes → 1 article = reformulation d'UNE source
//   - veille-tavily.mjs : requêtes thématiques → 1 article = synthèse de 5-8
//     sources récentes différentes, reformulées et recoupées par Claude
//
// Usage :
//   npm run veille-tavily           # toutes les queries thématiques
//   npm run veille-tavily -- --query="hardrock 100 results 2026"
//
// Env requis : TAVILY_API_KEY, ANTHROPIC_API_KEY, BFL_API_KEY (FLUX images).

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

import { EDITORIAL_STYLE } from "./lib/editorial-style.mjs";
import { pickAuthorForCategory } from "./lib/authors.mjs";
import { tavilySearch, TAVILY_EXCLUDE_DOMAINS, rerankByPriority } from "./lib/tavily-search.mjs";
import {
  loadExistingArticles,
  findTopRelated,
  insertInternalLinks,
} from "./lib/internal-linking.mjs";
import { findYouTubeVideoForArticle } from "./lib/youtube-search.mjs";
import {
  authorityDomainsListForPrompt,
  isAllowedHost,
  urlIsAlive,
} from "./lib/authority-domains.mjs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const FLUX_MODEL = process.env.FLUX_MODEL || "flux-pro-1.1";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80";

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_IMAGES_DIR = path.resolve("public/articles");

// Requêtes thématiques tournées chaque semaine.
// IMPORTANT : en anglais, "trail" est ambigu (Trail Blazers = NBA). Les
// requêtes doivent donc contenir des mots-clés désambiguïsants explicites :
//   - "ultramarathon", "ultrarunning"
//   - "UTMB", "Western States", noms d'épreuves précises
//   - "mountain running", "skyrunning"
// On évite les mots génériques comme "training injury" qui remontent
// massivement des contenus NBA/NFL/MLB.
const THEMATIC_QUERIES = [
  {
    query: '"ultrarunning" OR "ultramarathon" science research training physiology study',
    categorySlug: "entrainement",
    angle: "Actualité scientifique appliquée à l'ultra-endurance : études récentes sur l'entraînement, la physiologie, la nutrition ou la récupération chez les coureurs d'ultra et trail.",
    include_domains: [
      "irunfar.com", "trailrunnermag.com", "ultrarunning.com",
      "pubmed.ncbi.nlm.nih.gov", "pmc.ncbi.nlm.nih.gov", "bjsm.bmj.com",
      "lepape-info.com", "runnersworld.com", "trail-session.fr",
      "runningmagazine.ca", "marathonhandbook.com",
    ],
  },
  {
    query: '"UTMB" OR "Western States" OR "Hardrock 100" OR "Tor des Geants" ultramarathon results 2026',
    categorySlug: "courses-recits",
    angle: "Actualité des grandes courses ultra-trail internationales : résultats, podiums, analyses stratégiques, surprises récentes.",
    include_domains: [
      "irunfar.com", "trailrunnermag.com", "ultrarunning.com",
      "utmbmontblanc.com", "utmb.world", "wser.org", "hardrock100.com",
      "tordesgeants.it", "lepape-info.com", "u-trail.com",
    ],
  },
  {
    query: '"trail running shoes" OR "mountain running shoes" review 2026 Hoka Salomon La Sportiva Altra',
    categorySlug: "actualites",
    angle: "Actualité équipement trail : nouveaux modèles de chaussures montagne, innovations des équipementiers spécialisés, tests et comparatifs.",
    include_domains: [
      "irunfar.com", "trailrunnermag.com", "ultrarunning.com",
      "runnersworld.com", "runningmagazine.ca", "runrepeat.com",
      "lepape-info.com", "trail-session.fr", "u-trail.com",
      "hoka.com", "salomon.com", "lasportiva.com",
    ],
  },
];

// Blacklist supplémentaire des domaines qui polluent les résultats "trail"
// (sports US qui utilisent le mot "trail" ou "blazer" différemment).
const TAVILY_AGGRESSIVE_BLACKLIST = [
  "sports.yahoo.com",
  "espn.com",
  "bleacherreport.com",
  "nba.com",
  "nfl.com",
  "mlb.com",
  "si.com",
  "foxsports.com",
  "cbssports.com",
  "theringer.com",
];

const MAX_ARTICLES_PER_RUN = parseInt(process.env.MAX_ARTICLES_PER_RUN || "3", 10);
const FRESHNESS_DAYS = parseInt(process.env.TAVILY_FRESHNESS_DAYS || "7", 10);

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function frDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

const SYSTEM_PROMPT = `${EDITORIAL_STYLE}

TÂCHE SPÉCIFIQUE

Tu vas recevoir une question thématique (ex. "actualité des chaussures carbone") et un ensemble de 5 à 8 sources récentes (titres, URLs, extraits). Ta mission : écrire UN article original qui synthétise ces sources dans le style d'Altitude Trail.

RÈGLES DE SYNTHÈSE

1. Tu recoupes au moins 2 sources dans le corps de l'article. Tu mentionnes nommément les médias d'où vient chaque information clé (ex. "selon iRunFar", "d'après une étude publiée dans le BJSM").
2. Tu ne reprends JAMAIS un paragraphe mot à mot d'une source. Tu reformules, tu condenses, tu croises.
3. Si les sources se contredisent, tu l'indiques explicitement.
4. Si tu n'as aucune source fiable pour une affirmation, tu ne l'écris pas. L'omission est toujours préférable à l'invention.
5. Le corps fait entre 800 et 1200 mots.

FORMAT DE SORTIE

Réponds UNIQUEMENT avec un fichier markdown complet, ouvert par un frontmatter YAML. Rien avant, rien après. Aucun fence de code.

Frontmatter obligatoire :
- title : titre français PENSÉ POUR GOOGLE DISCOVER, 40 à 110 caractères, accroche forte avec chiffre, enjeu, ou question rhétorique quand c'est pertinent.
- excerpt : chapeau 1-2 phrases qui résume l'enjeu de l'article.
- categorySlug : utiliser exactement la categorySlug fournie dans le prompt utilisateur.
- tags : 3 à 5 tags français, chaînes simples.
- readTime : "X min" calculé sur 230 mots/min.
- imagePrompt1 : prompt ANGLAIS pour flux-pro-1.1 illustrant la scène d'ouverture. 40-60 mots, ultra-spécifique, entre guillemets doubles. Pas de style photo (suffixe ajouté automatiquement).
- imagePrompt2 : prompt ANGLAIS pour une scène différente du milieu de l'article.
- externalRefs : liste YAML de 2 à 4 références externes, reprises EXCLUSIVEMENT depuis les sources fournies dans le prompt utilisateur (tu ne dois PAS en inventer). Format : externalRefs:\n  - { url: "https://...", label: "Titre descriptif" }

CONTRAINTES RGAA / SEO :
- Pas d'emoji, pas de tout majuscules, pas de point-virgule dans le titre.
- Au moins un chiffre concret dans le corps quand le sujet le permet.
- Corps structuré avec 3 à 5 sous-titres H2 (##) thématiques.
- Conclusion en 2-3 phrases qui donne une perspective plus large.`;

function buildUserPrompt(query, angle, categorySlug, sources) {
  const sourcesFormatted = sources
    .map((s, i) => {
      const content = (s.content || "").slice(0, 800);
      return `SOURCE ${i + 1}
URL : ${s.url}
Titre : ${s.title}
Date : ${s.published_date || "non précisée"}
Extrait : ${content}`;
    })
    .join("\n\n");

  return `Requête thématique : "${query}"

Angle attendu : ${angle}

categorySlug imposé : ${categorySlug}

Sources disponibles (${sources.length}) :

${sourcesFormatted}

Écris l'article de synthèse en respectant strictement les règles du system prompt. Utilise au minimum 2 sources distinctes dans le corps, mentionne les médias par leur nom, reformule tout (jamais de copie), inclus 2 à 4 externalRefs choisies UNIQUEMENT parmi les URLs ci-dessus.

Domaines d'autorité autorisés pour les liens externes (tu peux en ajouter depuis cette whitelist si une référence officielle correspond au sujet, mais PRIORITÉ aux URLs des sources fournies ci-dessus) :
${authorityDomainsListForPrompt()}`;
}

async function runClaude(client, query, angle, categorySlug, sources) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(query, angle, categorySlug, sources) }],
  });
  const msg = await stream.finalMessage();
  return msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function stripFences(s) {
  let out = s.trim();
  if (out.startsWith("```")) {
    out = out.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```\s*$/, "");
  }
  return out.trim();
}

function parseFrontmatter(md) {
  if (!md.startsWith("---")) return null;
  const end = md.indexOf("\n---", 3);
  if (end === -1) return null;
  const yaml = md.slice(3, end).trim();
  const body = md.slice(end + 4).trim();
  const meta = {};
  const lines = yaml.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^externalRefs\s*:\s*$/.test(line)) {
      const refs = [];
      let j = i + 1;
      while (j < lines.length && /^\s{2,}-/.test(lines[j])) {
        const itemLine = lines[j].replace(/^\s*-\s*/, "");
        const urlMatch = itemLine.match(/url\s*:\s*["']([^"']+)["']/);
        const labelMatch = itemLine.match(/label\s*:\s*["']([^"']+)["']/);
        if (urlMatch) {
          refs.push({
            url: urlMatch[1],
            label: labelMatch ? labelMatch[1] : urlMatch[1],
          });
        }
        j++;
      }
      meta.externalRefs = refs;
      i = j;
      continue;
    }
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
    meta[key] = val;
    i++;
  }
  return { meta, body };
}

async function validateRefs(refs) {
  if (!Array.isArray(refs)) return [];
  const out = [];
  for (const ref of refs.slice(0, 4)) {
    if (!ref?.url || !ref?.label) continue;
    try {
      const u = new URL(ref.url);
      // Pour Tavily, on autorise tous les domaines sauf la blacklist stricte.
      if (TAVILY_EXCLUDE_DOMAINS.some((d) => u.hostname.endsWith(d))) continue;
    } catch {
      continue;
    }
    const alive = await urlIsAlive(ref.url);
    if (!alive) {
      console.log(`[tavily]   ref rejetee (HTTP mort) : ${ref.url}`);
      continue;
    }
    out.push({ url: ref.url, label: ref.label });
  }
  return out;
}

// ─── FLUX image generation (mêmes fonctions que dans veille.mjs) ───────────

const FLUX_STYLE_SUFFIX = ", cinematic trail running photography, summer mountain trail, dirt and rocky singletrack, dramatic natural lighting, shallow depth of field, 35mm film, ultra realistic, editorial magazine style, no skiing, no snow, no winter gear";

async function generateFluxImage(prompt) {
  const apiKey = process.env.BFL_API_KEY;
  if (!apiKey) throw new Error("BFL_API_KEY manquante");
  const fullPrompt = `${prompt.trim()}${FLUX_STYLE_SUFFIX}`;
  const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      image_size: { width: 1344, height: 768 },
      num_images: 1,
      safety_tolerance: "2",
      output_format: "jpeg",
      enable_safety_checker: true,
    }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}`);
  const data = await res.json();
  return data.images?.[0]?.url;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

async function generateAndDownloadImages(slug, prompts) {
  if (!process.env.BFL_API_KEY) return [];
  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  const refs = [];
  for (let i = 0; i < prompts.length; i++) {
    const prompt = (prompts[i] || "").trim();
    if (!prompt) { refs.push(null); continue; }
    const filename = `${slug}-${i + 1}.jpg`;
    const destPath = path.join(PUBLIC_IMAGES_DIR, filename);
    try {
      console.log(`[tavily]   flux#${i + 1}: ${prompt.slice(0, 80)}…`);
      const url = await generateFluxImage(prompt);
      if (!url) throw new Error("pas d'URL d'image");
      await downloadImage(url, destPath);
      refs.push({ url: `/articles/${filename}`, alt: prompt.slice(0, 120) });
    } catch (e) {
      console.error(`[tavily]     flux error: ${e.message}`);
      refs.push(null);
    }
  }
  return refs;
}

function insertImagesInBody(body, imageRefs) {
  const refs = imageRefs.filter(Boolean);
  if (!refs.length) return body;
  const paragraphs = body.split(/\n{2,}/);
  const totalWords = body.split(/\s+/).filter(Boolean).length;
  const targets = [200, Math.max(Math.floor(totalWords / 2), 450)];
  const out = [];
  let cumWords = 0;
  let insertedCount = 0;
  for (const p of paragraphs) {
    out.push(p);
    cumWords += p.split(/\s+/).filter(Boolean).length;
    while (insertedCount < refs.length && cumWords >= targets[insertedCount] && cumWords < totalWords) {
      const { url, alt } = refs[insertedCount];
      out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
      insertedCount++;
    }
  }
  while (insertedCount < refs.length) {
    const { url, alt } = refs[insertedCount];
    out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
    insertedCount++;
  }
  return out.join("\n\n");
}

function buildMarkdownFile({ meta, body, pubDate, image, sources }) {
  const CATEGORY_LABELS = {
    actualites: "Actualités",
    debuter: "Débuter",
    "courses-recits": "Courses & Récits",
    nutrition: "Nutrition",
    entrainement: "Entraînement",
    "blessures-preventions": "Blessures & Préventions",
    blessures: "Blessures & Préventions",
  };
  const category = CATEGORY_LABELS[meta.categorySlug] || "Actualités";
  const tagsYaml = Array.isArray(meta.tags) && meta.tags.length
    ? `[${meta.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`
    : "[]";

  const author = pickAuthorForCategory(meta.categorySlug, meta.title || "").name;
  const dateFr = frDate(pubDate);

  const externalRefsYaml = Array.isArray(meta.externalRefs) && meta.externalRefs.length
    ? [
        "externalRefs:",
        ...meta.externalRefs.map(
          (r) => `  - { url: "${r.url.replace(/"/g, '\\"')}", label: "${String(r.label || "").replace(/"/g, '\\"')}" }`
        ),
      ]
    : [];

  const sourcesList = sources
    .map((s) => `  - "${(s.url || "").replace(/"/g, '\\"')}"`)
    .join("\n");

  const front = [
    "---",
    `slug: "${slugify(meta.title)}"`,
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    `excerpt: "${meta.excerpt.replace(/"/g, '\\"')}"`,
    `category: "${category}"`,
    `categorySlug: ${meta.categorySlug}`,
    `author: "${author}"`,
    `date: "${dateFr}"`,
    `updatedAt: "${dateFr}"`,
    `readTime: "${meta.readTime || "7 min"}"`,
    `image: "${image}"`,
    `tags: ${tagsYaml}`,
    `source: "tavily-synthesis"`,
    sources.length > 0 ? `tavilySources:\n${sourcesList}` : "",
    ...externalRefsYaml,
    ...(meta.imagePrompt1 ? [`imagePrompt1: ${JSON.stringify(meta.imagePrompt1)}`] : []),
    ...(meta.imagePrompt2 ? [`imagePrompt2: ${JSON.stringify(meta.imagePrompt2)}`] : []),
    "---",
    "",
    body,
    "",
  ].filter(Boolean).join("\n");
  return front;
}

// ─── Orchestration ─────────────────────────────────────────────────────────

async function processQuery(client, query, angle, categorySlug, allExisting, include_domains) {
  console.log(`\n[tavily] == ${query}`);

  const tavilyResult = await tavilySearch(query, {
    search_depth: "advanced",
    max_results: 15,
    topic: "general",  // "news" remonte trop de sports US, on préfère general
    days: FRESHNESS_DAYS,
    exclude_domains: [...TAVILY_EXCLUDE_DOMAINS, ...TAVILY_AGGRESSIVE_BLACKLIST],
    ...(include_domains && include_domains.length > 0 ? { include_domains } : {}),
  });

  // Post-filtrage : retire tout résultat dont l'URL ou le titre ne semble
  // pas lié à la course / trail / running / ultra / montagne. On est strict
  // pour éviter les contaminations NBA/NFL/MLB.
  const TRAIL_TOKENS = [
    "trail", "ultra", "running", "marathon", "runner", "course",
    "mountain", "sky", "fkt", "utmb", "ftr", "itra",
    "nutrition", "physiology", "endurance", "training",
    "hoka", "salomon", "sportiva", "altra",
  ];
  const isTrailRelated = (s) => {
    const hay = `${s.url} ${s.title || ""} ${s.content || ""}`.toLowerCase();
    return TRAIL_TOKENS.some((tok) => hay.includes(tok));
  };

  const filtered = tavilyResult.results.filter(isTrailRelated);
  const reranked = rerankByPriority(filtered);
  const top = reranked.slice(0, 6);
  if (top.length < 2) {
    console.log(`[tavily]   seulement ${top.length} source(s) pertinente(s) après filtrage, skip (min 2)`);
    console.log(`[tavily]   → Tavily avait renvoyé ${tavilyResult.results.length} résultats, ${filtered.length} ont passé le filtre trail`);
    return null;
  }

  console.log(`[tavily]   ${top.length} sources retenues (sur ${tavilyResult.results.length} résultats Tavily, ${filtered.length} passés filtre trail)`);
  for (const s of top) console.log(`           · ${s.url}`);

  let rewritten;
  try {
    rewritten = await runClaude(client, query, angle, categorySlug, top);
    rewritten = stripFences(rewritten);
  } catch (e) {
    console.error(`[tavily]   Claude error: ${e.message}`);
    return null;
  }

  const parsed = parseFrontmatter(rewritten);
  if (!parsed) {
    console.error(`[tavily]   frontmatter invalide`);
    return null;
  }
  const { meta, body } = parsed;
  if (!meta.title || !meta.excerpt) {
    console.error(`[tavily]   frontmatter incomplet`);
    return null;
  }
  meta.categorySlug = meta.categorySlug || categorySlug;

  const baseSlug = slugify(meta.title);
  const outPath = path.join(CONTENT_DIR, `${baseSlug}.md`);
  if (existsSync(outPath)) {
    console.log(`[tavily]   doublon détecté (${baseSlug}), skip`);
    return null;
  }

  // Validation des external refs
  if (meta.externalRefs) {
    const before = meta.externalRefs.length;
    meta.externalRefs = await validateRefs(meta.externalRefs);
    console.log(`[tavily]   externalRefs: ${before} → ${meta.externalRefs.length} validées`);
  }

  // YouTube
  try {
    const yt = await findYouTubeVideoForArticle({ title: meta.title, tags: meta.tags });
    if (yt) {
      meta.youtubeVideoId = yt.videoId;
      meta.youtubeTitle = yt.title;
      if (yt.channel) meta.youtubeChannel = yt.channel;
      if (yt.duration) meta.youtubeDuration = yt.duration;
      if (yt.uploadDate) meta.youtubeUploadDate = yt.uploadDate;
      console.log(`[tavily]   YouTube: ${yt.title.slice(0, 60)}`);
    }
  } catch {}

  // Liens internes (max 2)
  let bodyWithLinks = body;
  try {
    const related = findTopRelated(
      { slug: baseSlug, title: meta.title, tags: meta.tags, categorySlug: meta.categorySlug },
      allExisting,
      2,
      baseSlug
    );
    if (related.length) {
      const siteUrl = (process.env.SITE_BASE_URL || "https://www.altitude-trail.fr").replace(/\/$/, "");
      bodyWithLinks = insertInternalLinks(bodyWithLinks, related, siteUrl);
      console.log(`[tavily]   ${related.length} liens internes`);
    }
  } catch (e) {
    console.warn(`[tavily]   internal linking error: ${e.message}`);
  }

  // Images FLUX
  const imageRefs = await generateAndDownloadImages(baseSlug, [meta.imagePrompt1, meta.imagePrompt2]);
  const bodyWithImages = insertImagesInBody(bodyWithLinks, imageRefs);
  const heroImage = imageRefs.find(Boolean)?.url || FALLBACK_IMAGE;

  const md = buildMarkdownFile({
    meta,
    body: bodyWithImages,
    pubDate: new Date(),
    image: heroImage,
    sources: top,
  });
  await fs.writeFile(outPath, md, "utf8");
  console.log(`[tavily]   ✓ saved ${outPath}`);
  return baseSlug;
}

async function main() {
  if (!process.env.TAVILY_API_KEY) {
    console.error("TAVILY_API_KEY manquante");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY manquante");
    process.exit(1);
  }
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const queryArg = args.find((a) => a.startsWith("--query="));
  const customQuery = queryArg ? queryArg.split("=")[1] : null;

  const client = new Anthropic();
  const allExisting = await loadExistingArticles();

  const queries = customQuery
    ? [{ query: customQuery, angle: "Synthèse thématique personnalisée.", categorySlug: "actualites", include_domains: undefined }]
    : THEMATIC_QUERIES;

  let created = 0;
  for (const q of queries) {
    if (created >= MAX_ARTICLES_PER_RUN) break;
    try {
      const slug = await processQuery(client, q.query, q.angle, q.categorySlug, allExisting, q.include_domains);
      if (slug) created++;
    } catch (e) {
      console.error(`[tavily] ${q.query} — erreur: ${e.message}`);
    }
  }

  console.log(`\n[tavily] terminé — ${created} nouvel(s) article(s) Tavily.`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
