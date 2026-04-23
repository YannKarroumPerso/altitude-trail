#!/usr/bin/env node
// Pipeline dédié aux BRÈVES actu chaude (équipement / marques / athlètes).
//
// Différences avec veille-tavily.mjs (éditorial de fond 800-1200 mots) :
//   - format imposé court 400-600 mots, structure "L'info en 30s / Contexte /
//     Notre lecture" (brief-prompt.mjs)
//   - cap quotidien dédié 3-5 brèves (brief-cap.mjs), PAS additif avec le cap
//     éditorial standard (5-10 articles/jour)
//   - 3 verticales rotées équitablement (equipement, marques-industrie, athletes)
//   - articleType: "brief" + briefVertical posés en frontmatter pour routage
//     catégorie + badge front + filtrage backend
//   - fraîcheur Tavily 3 jours (vs 7 pour la veille classique) : l'actu
//     chaude doit rester chaude
//
// Usage :
//   npm run brief-publish
//   node scripts/brief-publish.mjs --vertical=equipement
//
// Env requis : TAVILY_API_KEY, ANTHROPIC_API_KEY, BFL_API_KEY.

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

import { pickAuthorForCategory } from "./lib/authors.mjs";
import { tavilySearch, TAVILY_EXCLUDE_DOMAINS, rerankByPriority } from "./lib/tavily-search.mjs";
import {
  loadExistingArticles,
  findTopRelated,
  insertInternalLinks,
} from "./lib/internal-linking.mjs";
import { findYouTubeVideoForArticle } from "./lib/youtube-search.mjs";
import { urlIsAlive } from "./lib/authority-domains.mjs";
import { effectiveBriefCapForRun } from "./lib/brief-cap.mjs";
import { BRIEF_VERTICALS, pickBriefQueriesForRun } from "./lib/brief-queries.mjs";
import { BRIEF_SYSTEM_PROMPT, buildBriefUserPrompt } from "./lib/brief-prompt.mjs";
import { isInHotEventWindow } from "./lib/hot-events-calendar.mjs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80";

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_IMAGES_DIR = path.resolve("public/articles");

// Brèves = actu très fraîche. 3 jours plutôt que 7.
const FRESHNESS_DAYS = parseInt(process.env.BRIEF_FRESHNESS_DAYS || "3", 10);
const MAX_BRIEFS_PER_RUN = parseInt(process.env.MAX_BRIEFS_PER_RUN || "2", 10);
const MAX_BRIEF_WORDS = 650; // garde-fou anti-dérive longueur

const TAVILY_AGGRESSIVE_BLACKLIST = [
  "sports.yahoo.com", "espn.com", "bleacherreport.com", "nba.com",
  "nfl.com", "mlb.com", "si.com", "foxsports.com", "cbssports.com",
  "theringer.com",
];

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

async function runClaude(client, query, angle, categorySlug, vertical, sources) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 8000, // bien suffisant pour 400-600 mots + frontmatter
    thinking: { type: "adaptive" },
    system: BRIEF_SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: buildBriefUserPrompt(query, angle, categorySlug, vertical, sources),
    }],
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
    if (!m) { i++; continue; }
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
      if (TAVILY_EXCLUDE_DOMAINS.some((d) => u.hostname.endsWith(d))) continue;
    } catch { continue; }
    const alive = await urlIsAlive(ref.url);
    if (!alive) {
      console.log(`[brief]   ref rejetée (HTTP mort) : ${ref.url}`);
      continue;
    }
    out.push({ url: ref.url, label: ref.label });
  }
  return out;
}

// Garde-fou qualité : rejette la brève si elle dépasse 650 mots ou s'il
// manque une des 3 sections obligatoires. Évite les dérives du modèle.
function validateBriefStructure(body, slug) {
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  if (wordCount > MAX_BRIEF_WORDS) {
    console.log(`[brief]   rejeté ${slug} — ${wordCount} mots (cap ${MAX_BRIEF_WORDS})`);
    return false;
  }
  const hasInfo30s = /##\s+L'?info en 30 secondes/i.test(body);
  const hasContexte = /##\s+Contexte/i.test(body);
  const hasNotreLecture = /##\s+Notre lecture/i.test(body);
  if (!hasInfo30s || !hasContexte || !hasNotreLecture) {
    console.log(`[brief]   rejeté ${slug} — sections manquantes ` +
      `(30s:${hasInfo30s} ctx:${hasContexte} lect:${hasNotreLecture})`);
    return false;
  }
  // Anti-prescription commerciale : détecte les verbes d'achat directs.
  const commercial = /\b(?:achetez|il faut acheter|on recommande d'acheter|à commander|je vous conseille d'acheter)\b/i;
  if (commercial.test(body)) {
    console.log(`[brief]   rejeté ${slug} — prescription commerciale détectée`);
    return false;
  }
  return true;
}

// ─── FLUX image generation (identique à veille-tavily.mjs) ────────────────

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
      console.log(`[brief]   flux#${i + 1}: ${prompt.slice(0, 80)}…`);
      const url = await generateFluxImage(prompt);
      if (!url) throw new Error("pas d'URL d'image");
      await downloadImage(url, destPath);
      refs.push({ url: `/articles/${filename}`, alt: prompt.slice(0, 120) });
    } catch (e) {
      console.error(`[brief]     flux error: ${e.message}`);
      refs.push(null);
    }
  }
  return refs;
}

function insertImagesInBody(body, imageRefs) {
  const refs = imageRefs.filter(Boolean);
  if (!refs.length) return body;
  // Pour les brèves, on insère 1 seule image max en tête de "Contexte".
  // La hero image est gérée séparément en frontmatter (champ image).
  const firstRef = refs[0];
  if (!firstRef) return body;
  const ctxIdx = body.search(/##\s+Contexte/i);
  if (ctxIdx < 0) return body;
  // Insertion juste avant "## Contexte"
  const insert = `![${firstRef.alt.replace(/[\[\]]/g, "")}](${firstRef.url})\n\n`;
  return body.slice(0, ctxIdx) + insert + body.slice(ctxIdx);
}

const CATEGORY_LABELS = {
  equipement: "Équipement",
  "marques-industrie": "Marques & industrie",
  athletes: "Athlètes",
};

function buildMarkdownFile({ meta, body, pubDate, image, sources }) {
  const category = CATEGORY_LABELS[meta.categorySlug] || "Équipement";
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
    `readTime: "${meta.readTime || "2 min"}"`,
    `image: "${image}"`,
    `tags: ${tagsYaml}`,
    `source: "brief-synthesis"`,
    `articleType: "brief"`,
    `briefVertical: "${meta.briefVertical}"`,
    ...(meta.isLive ? [`isLive: true`] : []),
    ...(meta.hotEventSlug ? [`hotEventSlug: "${meta.hotEventSlug}"`] : []),
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

async function processQuery(client, q, allExisting, hotEventSlug) {
  console.log(`\n[brief] == ${q.query} (${q.vertical})`);

  const tavilyResult = await tavilySearch(q.query, {
    search_depth: "advanced",
    max_results: 12,
    topic: "general",
    days: FRESHNESS_DAYS,
    exclude_domains: [...TAVILY_EXCLUDE_DOMAINS, ...TAVILY_AGGRESSIVE_BLACKLIST],
    ...(q.include_domains && q.include_domains.length > 0 ? { include_domains: q.include_domains } : {}),
  });

  const TRAIL_TOKENS = [
    "trail", "ultra", "running", "marathon", "runner", "course",
    "mountain", "sky", "fkt", "utmb", "ftr", "itra",
    "hoka", "salomon", "sportiva", "altra", "nnormal", "norda",
    "scarpa", "brooks", "saucony", "merrell", "mizuno", "speedgoat",
    "tecton", "vectiv", "dauwalter", "jornet", "walmsley", "haene",
  ];
  const isTrailRelated = (s) => {
    const hay = `${s.url} ${s.title || ""} ${s.content || ""}`.toLowerCase();
    return TRAIL_TOKENS.some((tok) => hay.includes(tok));
  };

  const filtered = tavilyResult.results.filter(isTrailRelated);
  const reranked = rerankByPriority(filtered);
  const top = reranked.slice(0, 6);
  if (top.length < 2) {
    console.log(`[brief]   seulement ${top.length} source(s) retenue(s), skip (min 2)`);
    return null;
  }

  console.log(`[brief]   ${top.length} sources retenues (sur ${tavilyResult.results.length} Tavily)`);
  for (const s of top) console.log(`          · ${s.url}`);

  let rewritten;
  try {
    rewritten = await runClaude(client, q.query, q.angle, q.categorySlug, q.vertical, top);
    rewritten = stripFences(rewritten);
  } catch (e) {
    console.error(`[brief]   Claude error: ${e.message}`);
    return null;
  }

  const parsed = parseFrontmatter(rewritten);
  if (!parsed) { console.error(`[brief]   frontmatter invalide`); return null; }
  const { meta, body } = parsed;
  if (!meta.title || !meta.excerpt) {
    console.error(`[brief]   frontmatter incomplet`);
    return null;
  }
  meta.categorySlug = meta.categorySlug || q.categorySlug;
  meta.briefVertical = meta.briefVertical || q.vertical;
  meta.articleType = "brief";

  const baseSlug = slugify(meta.title);

  // Validation structure (sections obligatoires + longueur)
  if (!validateBriefStructure(body, baseSlug)) {
    return null;
  }

  if (hotEventSlug) {
    meta.isLive = true;
    meta.hotEventSlug = hotEventSlug;
  }

  const outPath = path.join(CONTENT_DIR, `${baseSlug}.md`);
  if (existsSync(outPath)) {
    console.log(`[brief]   doublon (${baseSlug}), skip`);
    return null;
  }

  if (meta.externalRefs) {
    const before = meta.externalRefs.length;
    meta.externalRefs = await validateRefs(meta.externalRefs);
    console.log(`[brief]   externalRefs: ${before} → ${meta.externalRefs.length} validées`);
  }

  // YouTube (pertinent pour équipement : tests vidéo) mais pas bloquant.
  try {
    const yt = await findYouTubeVideoForArticle({ title: meta.title, tags: meta.tags });
    if (yt) {
      meta.youtubeVideoId = yt.videoId;
      meta.youtubeTitle = yt.title;
      if (yt.channel) meta.youtubeChannel = yt.channel;
      if (yt.duration) meta.youtubeDuration = yt.duration;
      if (yt.uploadDate) meta.youtubeUploadDate = yt.uploadDate;
    }
  } catch {}

  // Liens internes (1 max pour une brève courte)
  let bodyWithLinks = body;
  try {
    const related = findTopRelated(
      { slug: baseSlug, title: meta.title, tags: meta.tags, categorySlug: meta.categorySlug },
      allExisting,
      1,
      baseSlug
    );
    if (related.length) {
      const siteUrl = (process.env.SITE_BASE_URL || "https://www.altitude-trail.fr").replace(/\/$/, "");
      bodyWithLinks = insertInternalLinks(bodyWithLinks, related, siteUrl);
    }
  } catch (e) {
    console.warn(`[brief]   internal linking error: ${e.message}`);
  }

  // Images FLUX (1 image insérée dans le corps + hero)
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
  console.log(`[brief]   ✓ saved ${outPath}`);
  return baseSlug;
}

async function main() {
  if (!process.env.TAVILY_API_KEY) { console.error("TAVILY_API_KEY manquante"); process.exit(1); }
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY manquante"); process.exit(1); }
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const verticalArg = args.find((a) => a.startsWith("--vertical="));
  const forcedVertical = verticalArg ? verticalArg.split("=")[1] : null;

  const client = new Anthropic();
  const allExisting = await loadExistingArticles();

  const runCap = await effectiveBriefCapForRun("brief-publish", MAX_BRIEFS_PER_RUN);
  if (runCap <= 0) {
    console.log(`[brief] cap quotidien brèves atteint, aucun run.`);
    return;
  }

  // Sélection des queries : verticale forcée en CLI > rotation équitable
  let queries;
  if (forcedVertical && BRIEF_VERTICALS[forcedVertical]) {
    // Pioche 2-3 queries de la verticale demandée
    const pool = BRIEF_VERTICALS[forcedVertical];
    const hour = new Date().getUTCHours();
    const start = (hour * 3) % pool.length;
    queries = [];
    for (let i = 0; i < Math.min(runCap + 1, pool.length); i++) {
      queries.push(pool[(start + i * 5) % pool.length]);
    }
  } else {
    queries = pickBriefQueriesForRun(runCap + 1, new Date());
  }

  const hotEvent = isInHotEventWindow();
  const modeLabel = hotEvent
    ? `HOT ${hotEvent.event.name}`
    : "normal";
  console.log(`[brief] mode=${modeLabel} · ${queries.length} queries (cap ${runCap}) :`);
  for (const q of queries) console.log(`         · [${q.vertical}] ${q.query.slice(0, 80)}`);

  let created = 0;
  for (const q of queries) {
    if (created >= runCap) {
      console.log(`[brief] cap run atteint (${runCap}), stop.`);
      break;
    }
    try {
      const slug = await processQuery(
        client,
        q,
        allExisting,
        hotEvent?.event?.slug ?? null,
      );
      if (slug) created++;
    } catch (e) {
      console.error(`[brief] ${q.query} — erreur: ${e.message}`);
    }
  }

  console.log(`\n[brief] terminé — ${created} brève(s) publiée(s).`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
