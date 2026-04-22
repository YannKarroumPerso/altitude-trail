#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import { EDITORIAL_STYLE } from "./lib/editorial-style.mjs";

const SOURCES = [
  "https://www.lepape-info.com/feed/",
  "https://www2.u-trail.com/feed/",
  "https://passiontrail.fr/feed/",
  "https://runactu.com/feed/",
  "https://www.irunfar.com/feed",
  "https://www.trailrunnermag.com/feed",
  "https://ultrarunning.com/feed/",
  "https://trailrunningspain.com/feed/",
  "https://www.corsainmontagna.it/feed/",
  "https://www.discoveryalps.it/feed/",
  "https://ultrarunningworld.co.uk/feed/",
  "https://www.ultrarunnermagazine.co.uk/feed/",
  "https://marathonhandbook.com/feed/",
];

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_IMAGES_DIR = path.resolve("public/articles");
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const MAX_PER_SOURCE = parseInt(process.env.MAX_ARTICLES_PER_SOURCE || "2", 10);
const MIN_SOURCE_LENGTH = 400;
// Image de secours (trail running ete). L'ancienne photo (1551698618) etait une scene de ski,
// on ne la reutilise plus JAMAIS sous peine d'avoir un hero ski sur un article trail.
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80";

const BFL_BASE_URL = process.env.BFL_BASE_URL || "https://api.bfl.ai/v1";
const FLUX_MODEL = process.env.FLUX_MODEL || "flux-pro-1.1";
const FLUX_STYLE_SUFFIX = ", cinematic trail running photography, summer mountain trail, dirt and rocky singletrack, dramatic natural lighting, shallow depth of field, 35mm film, ultra realistic, editorial magazine style, no skiing, no snow, no winter gear";
const FLUX_WIDTH = 1344;
const FLUX_HEIGHT = 768;
const FLUX_POLL_INTERVAL_MS = 2000;
const FLUX_MAX_POLLS = 90;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TRAIL_KEYWORD_GROUPS = [
  ["trail", "trailrunning", "trail running", "ultra-trail", "ultratrail", "trail-running"],
  ["ultramarathon", "ultra-marathon", "ultrarunning", "ultra distance"],
  ["skyrunning", "skyrunner", "sky race", "skyrace", "fell running", "fell-running", "mountain running"],
  ["utmb", "ccc", "tds", "otc", "diagonale des fous", "hardrock", "western states", "templiers", "maxi-race"],
  ["fkt", "fastest known time"],
  ["sentier", "mountain trail", "singletrack", "off-road running"],
  ["montagne", "montagna", "montaña", "course en montagne", "corsa in montagna"],
  ["randonnée course", "course à pied nature"],
  ["dénivelé", "dénivelée", "d+", "elevation gain", "vertical gain"],
  ["km vertical", "kilometer vertical", "vertical kilometer", "vertical km", "kv race"],
];
const MIN_KEYWORD_GROUPS = 2;

const CATEGORY_SLUGS = new Set([
  "actualites", "debuter", "courses-recits", "nutrition", "entrainement", "blessures",
]);

const CATEGORY_LABELS = {
  actualites: "Actualités",
  debuter: "Débuter",
  "courses-recits": "Courses & Récits",
  nutrition: "Nutrition",
  entrainement: "Entraînement & Performances",
  blessures: "Blessures & Préventions",
};

const FR_MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function frDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getDate()} ${FR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isTrailArticle(title, text) {
  const haystack = `${title} ${text}`.toLowerCase();
  let matched = 0;
  for (const group of TRAIL_KEYWORD_GROUPS) {
    if (group.some((k) => haystack.includes(k))) {
      matched++;
      if (matched >= MIN_KEYWORD_GROUPS) return true;
    }
  }
  return false;
}

function extractImage(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item["media:content"]?.$?.url) return item["media:content"].$.url;
  if (item["media:thumbnail"]?.$?.url) return item["media:thumbnail"].$.url;
  const html = item["content:encoded"] || item.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || FALLBACK_IMAGE;
}

const FORMAT_INSTRUCTIONS = `FORMAT DE SORTIE (INITIAL — article créé depuis une source de presse)

Réponds UNIQUEMENT avec un fichier Markdown complet, ouvert par un frontmatter YAML. Rien avant ni après. Aucun fence de code.

Frontmatter obligatoire :
- title : titre français PENSÉ POUR GOOGLE DISCOVER, entre 40 et 110 caractères (idéal 60-90).
  - Construction recommandée : accroche forte + protagoniste ou chiffre + enjeu.
  - Leviers Discover à privilégier (utilise-les à bon escient, jamais les cinq d'un coup) :
    * Un chiffre concret quand le sujet le permet ("3 erreurs qui ruinent votre UTMB", "60 secondes pour sauver un genou")
    * Une question rhétorique qui pose le vrai enjeu ("Pourquoi Kilian court-il plus vite que vous ?")
    * Un marqueur d'actualité fort si l'info vient de tomber ("BREAKING", "Ce week-end")
    * Une charge émotionnelle assumée sur les portraits et récits ("L'histoire glaciale de…", "La chute qui a tout changé")
    * Un mot-clé trail/ultra dans le titre (trail, UTMB, ultra, D+, FKT, VMA, seuil) pour l'indexation Actualités
  - Interdits : titres plats, descriptifs ("Un article sur…"), clickbait vide ("Vous ne croirez jamais…"), tout en majuscules, point-virgule, emoji.
- excerpt : chapeau accrocheur 1-2 phrases
- categorySlug : une de ces valeurs exactement — actualites, debuter, courses-recits, nutrition, entrainement, blessures
- tags : 3 à 5 tags français, chaînes simples
- readTime : format "X min", calculé sur 230 mots/minute
- imagePrompt1 : prompt ANGLAIS pour flux-pro-1.1 illustrant le décor ou le contexte d'ouverture. 40-60 mots, une seule ligne, entre guillemets, ultra-spécifique (sujet, action, lieu nommé, lumière, équipement). N'inclus pas le style photo (un suffixe cinéma est ajouté automatiquement).
- imagePrompt2 : prompt ANGLAIS pour une scène différente liée à un moment-clé du milieu de l'article. Mêmes exigences que imagePrompt1.`;

const SYSTEM_PROMPT = `${EDITORIAL_STYLE}\n\n${FORMAT_INSTRUCTIONS}`;

function userPrompt({ title, sourceUrl, text }) {
  return `Source à analyser pour Altitude Trail.

Titre original de la source : ${title}
URL source : ${sourceUrl}

Identifie dans l'URL ou la structure du titre le média d'origine (lepape-info, u-trail, iRunFar, Trail Runner Mag, Ultrarunning, etc.) et cite-le nommément dans ton article à chaque reprise d'une information spécifique.

Contenu intégral de la source :
${text}

Réponds UNIQUEMENT avec le fichier markdown complet (frontmatter + corps de 1000-1200 mots), sans prose avant ni après, sans fence de code. Commence directement par "---".`;
}

async function rewriteArticle(client, { title, sourceUrl, text }) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt({ title, sourceUrl, text }) }],
  });
  const message = await stream.finalMessage();
  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return stripFences(raw);
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
  for (const line of yaml.split("\n")) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
    meta[key] = val;
  }
  return { meta, body };
}

function validateRewrite(md, sourceItem) {
  const parsed = parseFrontmatter(md);
  if (!parsed) throw new Error("réponse sans frontmatter valide");
  const { meta, body } = parsed;
  if (!meta.title || !meta.excerpt || !meta.categorySlug) {
    throw new Error("frontmatter incomplet");
  }
  if (!CATEGORY_SLUGS.has(meta.categorySlug)) {
    meta.categorySlug = "actualites";
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 600) throw new Error(`corps trop court (${words} mots)`);
  return { meta, body, words };
}

function buildMarkdownFile({ meta, body, sourceItem, pubDate, image }) {
  const category = CATEGORY_LABELS[meta.categorySlug];
  const tagsYaml = Array.isArray(meta.tags) && meta.tags.length
    ? `[${meta.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`
    : "[]";
  const front = [
    "---",
    `slug: "${slugify(meta.title)}"`,
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    `excerpt: "${meta.excerpt.replace(/"/g, '\\"')}"`,
    `category: "${category}"`,
    `categorySlug: ${meta.categorySlug}`,
    `author: "Rédaction Altitude"`,
    `date: "${frDate(pubDate)}"`,
    `readTime: "${meta.readTime || "7 min"}"`,
    `image: "${image}"`,
    `tags: ${tagsYaml}`,
    `sourceUrl: "${sourceItem.link}"`,
    ...(meta.imagePrompt1 ? [`imagePrompt1: ${JSON.stringify(meta.imagePrompt1)}`] : []),
    ...(meta.imagePrompt2 ? [`imagePrompt2: ${JSON.stringify(meta.imagePrompt2)}`] : []),
    "---",
    "",
    body,
    "",
  ].join("\n");
  return front;
}

async function generateFluxImage(prompt) {
  const apiKey = process.env.BFL_API_KEY;
  if (!apiKey) throw new Error("BFL_API_KEY manquante");
  const fullPrompt = `${prompt.trim()}${FLUX_STYLE_SUFFIX}`;
  const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      image_size: { width: FLUX_WIDTH, height: FLUX_HEIGHT },
      num_images: 1,
      safety_tolerance: "2",
      output_format: "jpeg",
      enable_safety_checker: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal submit ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const url = data.images?.[0]?.url;
  if (!url) throw new Error(`fal: pas d'URL dans la réponse`);
  return url;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

async function generateAndDownloadImages(slug, prompts) {
  if (!process.env.BFL_API_KEY) {
    console.warn("[veille]   skipping FLUX images: BFL_API_KEY manquante");
    return [];
  }
  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  const refs = [];
  for (let i = 0; i < prompts.length; i++) {
    const prompt = (prompts[i] || "").trim();
    if (!prompt) {
      console.warn(`[veille]   flux#${i + 1}: prompt vide, skip`);
      refs.push(null);
      continue;
    }
    const filename = `${slug}-${i + 1}.jpg`;
    const destPath = path.join(PUBLIC_IMAGES_DIR, filename);
    try {
      console.log(`[veille]   flux#${i + 1}: ${prompt.slice(0, 80)}${prompt.length > 80 ? "…" : ""}`);
      const imageUrl = await generateFluxImage(prompt);
      if (!imageUrl) throw new Error("pas d'URL d'image dans la réponse");
      await downloadImage(imageUrl, destPath);
      refs.push({ url: `/articles/${filename}`, alt: prompt.slice(0, 120) });
      console.log(`[veille]     saved ${destPath}`);
    } catch (e) {
      console.error(`[veille]     flux error: ${e.message}`);
      refs.push(null);
    }
  }
  return refs;
}

function countWords(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function insertImagesInBody(body, imageRefs) {
  const refs = imageRefs.filter(Boolean);
  if (!refs.length) return body;
  const paragraphs = body.split(/\n{2,}/);
  const totalWords = countWords(body);
  const targets = [200, Math.max(Math.floor(totalWords / 2), 450)];
  const out = [];
  let cumWords = 0;
  let insertedCount = 0;
  for (const p of paragraphs) {
    out.push(p);
    cumWords += countWords(p);
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

async function processFeed(client, url) {
  const parser = new Parser({ timeout: 20000, headers: { "User-Agent": "AltitudeTrail-Veille/1.0" } });
  let feed;
  try {
    feed = await parser.parseURL(url);
  } catch (e) {
    console.error(`[veille] ${url} — parse failed: ${e.message}`);
    return 0;
  }
  let created = 0;
  for (const item of (feed.items || []).slice(0, MAX_PER_SOURCE * 3)) {
    if (created >= MAX_PER_SOURCE) break;
    if (!item.title || !item.link) continue;

    const baseSlug = slugify(item.title);
    if (!baseSlug) continue;
    const outPath = path.join(CONTENT_DIR, `${baseSlug}.md`);
    if (existsSync(outPath)) continue;

    const rawBody = stripHtml(item["content:encoded"] || item.content || item.contentSnippet || "");
    if (rawBody.length < MIN_SOURCE_LENGTH) continue;
    if (!isTrailArticle(item.title, rawBody)) continue;

    const sourceText = rawBody.slice(0, 12000);
    console.log(`[veille] rewriting: ${item.title}`);
    let rewritten;
    try {
      rewritten = await rewriteArticle(client, {
        title: item.title,
        sourceUrl: item.link,
        text: sourceText,
      });
    } catch (e) {
      console.error(`[veille]   API error: ${e.message}`);
      continue;
    }
    let validated;
    try {
      validated = validateRewrite(rewritten, item);
    } catch (e) {
      console.error(`[veille]   validation failed: ${e.message}`);
      continue;
    }
    const imageRefs = await generateAndDownloadImages(baseSlug, [
      validated.meta.imagePrompt1,
      validated.meta.imagePrompt2,
    ]);
    const bodyWithImages = insertImagesInBody(validated.body, imageRefs);
    const md = buildMarkdownFile({
      meta: validated.meta,
      body: bodyWithImages,
      sourceItem: item,
      pubDate: item.isoDate || item.pubDate || new Date(),
      image: extractImage(item),
    });
    await fs.writeFile(outPath, md, "utf8");
    created++;
    console.log(`[veille]   saved ${outPath} (${validated.words} mots, ${imageRefs.filter(Boolean).length} image(s))`);
  }
  return created;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY manquante");
    process.exit(1);
  }
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const client = new Anthropic();
  let total = 0;
  for (const url of SOURCES) {
    try {
      total += await processFeed(client, url);
    } catch (e) {
      console.error(`[veille] ${url} — unexpected error: ${e.message}`);
    }
  }
  console.log(`[veille] terminé — ${total} nouvel(s) article(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
