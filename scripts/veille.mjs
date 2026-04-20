#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";

const SOURCES = [
  "https://www.lepape-info.com/feed/",
  "https://www2.u-trail.com/feed/",
  "https://passiontrail.fr/feed/",
  "https://runactu.com/feed/",
  "https://www.planetrail.fr/feed",
  "https://runninghero.com/feed",
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
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const MAX_PER_SOURCE = parseInt(process.env.MAX_ARTICLES_PER_SOURCE || "2", 10);
const MIN_SOURCE_LENGTH = 400;
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80";

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

const SYSTEM_PROMPT = `Tu es un rédacteur senior pour Altitude Trail, un magazine français spécialisé dans le trail running et l'ultra-trail.

Ta mission : réécrire entièrement, en français, un article de trail running — jamais plagier. Tu reformules avec tes propres mots en conservant les faits, noms propres, résultats et chiffres. Tu adoptes un ton journalistique magazine : précis, vivant, engagé, sans lourdeur.

Contraintes strictes :
- Longueur du corps : entre 1000 et 1200 mots.
- Format de sortie : un fichier Markdown avec frontmatter YAML EN TÊTE, rien d'autre avant ou après.
- Ne mets AUCUN fence de code (pas de triple backticks). Commence directement par "---".
- categorySlug doit être exactement l'une de ces valeurs : actualites, debuter, courses-recits, nutrition, entrainement, blessures.
- readTime au format "X min" (ex: "7 min"), estimé à 230 mots/minute.
- 3 à 5 tags pertinents, en français, chaînes simples.`;

function userPrompt({ title, sourceUrl, text }) {
  return `Voici l'article source à réécrire en français magazine pour Altitude Trail.

Titre original : ${title}
URL source : ${sourceUrl}

Contenu source :
${text}

Réponds UNIQUEMENT avec le fichier markdown complet, au format exact suivant (sans rien d'autre, sans fences) :

---
title: "Titre français attrayant"
excerpt: "Chapô accrocheur en 1 à 2 phrases."
categorySlug: actualites
tags: ["tag1", "tag2", "tag3"]
readTime: "7 min"
---

# Titre principal

Paragraphe d'ouverture...

## Sous-titre

Corps de l'article avec sous-sections, entre 1000 et 1200 mots au total.`;
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
    const m = line.match(/^([a-zA-Z_]+):\s*(.+)$/);
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
    "---",
    "",
    body,
    "",
  ].join("\n");
  return front;
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
    const md = buildMarkdownFile({
      meta: validated.meta,
      body: validated.body,
      sourceItem: item,
      pubDate: item.isoDate || item.pubDate || new Date(),
      image: extractImage(item),
    });
    await fs.writeFile(outPath, md, "utf8");
    created++;
    console.log(`[veille]   saved ${outPath} (${validated.words} mots)`);
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
