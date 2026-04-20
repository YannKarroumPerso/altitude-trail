#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_IMAGES_DIR = path.resolve("public/articles");
const DATA_PATH = path.resolve("src/lib/data.ts");

const FAL_KEY = process.env.BFL_API_KEY || process.env.FAL_API_KEY;
if (!FAL_KEY) {
  console.error("BFL_API_KEY / FAL_API_KEY manquante");
  process.exit(1);
}
if (!/^[a-f0-9-]+:[a-f0-9]+$/i.test(FAL_KEY)) {
  console.warn(`[regen] WARNING: la clé ne ressemble pas à une clé fal.ai (UUID:secret) — ${FAL_KEY.slice(0, 20)}…`);
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro/v1.1";
const STYLE_SUFFIX =
  ", cinematic photography, photorealistic, trail running editorial style, dramatic natural lighting, shallow depth of field, 35mm film aesthetic, ultra realistic, magazine quality";
const HERO_W = 1200;
const HERO_H = 672;
const BODY_W = 1344;
const BODY_H = 768;

const FORCE = process.argv.includes("--force");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countWords(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function stripExistingBodyImages(body) {
  // Remove any standalone image markdown that sits as its own paragraph
  return body.replace(/(\n\n|^)!\[[^\]]*\]\([^)]+\)(?=\n\n|\n?$)/g, "$1");
}

function insertImagesInBody(body, imageRefs) {
  const refs = imageRefs.filter(Boolean);
  if (!refs.length) return body;
  const paragraphs = stripExistingBodyImages(body).split(/\n{2,}/);
  const total = countWords(body);
  const targets = [200, Math.max(Math.floor(total / 2), 450)];
  const out = [];
  let cum = 0;
  let inserted = 0;
  for (const p of paragraphs) {
    out.push(p);
    cum += countWords(p);
    while (inserted < refs.length && cum >= targets[inserted] && cum < total) {
      const { url, alt } = refs[inserted];
      out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
      inserted++;
    }
  }
  while (inserted < refs.length) {
    const { url, alt } = refs[inserted];
    out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
    inserted++;
  }
  return out.join("\n\n");
}

async function generateFalImage(prompt, width, height) {
  const body = {
    prompt: `${prompt.trim()}${STYLE_SUFFIX}`,
    image_size: { width, height },
    num_inference_steps: 28,
    safety_tolerance: "2",
    output_format: "jpeg",
    enable_safety_checker: true,
  };
  const res = await fetch(FAL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fal ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`fal: pas d'URL dans la réponse — ${JSON.stringify(data).slice(0, 200)}`);
  return url;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

const PROMPT_SYSTEM = `You write ultra-specific image prompts for a trail running magazine. Each prompt is a single line of English, 40 to 80 words, describing a photorealistic scene. You always include: the concrete subject (a runner, a specific piece of gear, a landscape feature), the exact action, recognisable real location cues (named mountain range, country, race if identified in the article), weather and lighting (e.g. low mist at dawn, golden hour side light, snow squall), clothing or equipment details (colour of running vest, brand-agnostic trail shoes, trekking poles). You never describe the style (the caller adds "cinematic photography" etc.). You never mention camera brands or model names. You never use text, logos, or brand names in the image itself. Output strictly valid JSON matching the requested schema, no markdown fences.`;

function userPrompt(article) {
  const parts = [
    `Title: ${article.title}`,
    `Excerpt: ${article.excerpt}`,
    `Category: ${article.category}`,
  ];
  if (article.tags?.length) parts.push(`Tags: ${article.tags.join(", ")}`);
  if (article.content) {
    const trimmed = article.content.replace(/!\[[^\]]*\]\([^)]+\)/g, "").slice(0, 3500);
    parts.push(`Body (truncated):\n${trimmed}`);
  } else {
    parts.push(`(No body text — compose prompts purely from title, excerpt and category.)`);
  }

  return `${parts.join("\n")}

Produce three prompts for this article:

- "hero" — an iconic wide 16:9 scene that captures the article's main subject, suitable for a magazine header. Establish shot, strong composition, one clear focal point.
- "body1" — a scene from the article's opening context: the setting, the starting line, the weather, the mood before action. Different camera angle from hero.
- "body2" — a scene from a key mid-article moment: a turning point, a specific effort, a decisive place on the course. Different subject/composition from hero and body1.

Return JSON only, no prose, no code fence:
{"hero":"<prompt>","body1":"<prompt>","body2":"<prompt>"}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("pas de JSON trouvé");
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function generatePromptsForArticle(client, article) {
  const stream = client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: PROMPT_SYSTEM,
    messages: [{ role: "user", content: userPrompt(article) }],
  });
  const message = await stream.finalMessage();
  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const parsed = extractJson(text);
  if (!parsed.hero || !parsed.body1 || !parsed.body2) {
    throw new Error(`prompts incomplets: ${Object.keys(parsed).join(", ")}`);
  }
  return parsed;
}

async function readMarkdownArticles() {
  const entries = await fs.readdir(CONTENT_DIR).catch(() => []);
  const result = [];
  for (const file of entries) {
    if (!file.endsWith(".md")) continue;
    const filePath = path.join(CONTENT_DIR, file);
    const raw = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(raw);
    if (!data.slug) continue;
    result.push({
      source: "md",
      file,
      filePath,
      slug: String(data.slug),
      title: String(data.title || ""),
      excerpt: String(data.excerpt || ""),
      category: String(data.category || ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      content: content.trim(),
      data,
    });
  }
  return result;
}

function parseSeedArticlesFromDataTs(dataTs) {
  // Seed articles live in the `articles` array after `...generatedArticles,`
  const marker = "...generatedArticles,";
  const markerIdx = dataTs.indexOf(marker);
  if (markerIdx === -1) return [];
  const remaining = dataTs.slice(markerIdx + marker.length);
  const endIdx = remaining.indexOf("];");
  if (endIdx === -1) return [];
  const section = remaining.slice(0, endIdx);
  // Each seed object starts with `{` and ends with `},` at 2-space indentation
  const objects = [];
  const objRegex = /\{\s*slug:\s*"([^"]+)"[\s\S]*?\n\s{2}\},?/g;
  let m;
  while ((m = objRegex.exec(section)) !== null) {
    const block = m[0];
    const slug = m[1];
    const title = /title:\s*"((?:[^"\\]|\\.)*)"/.exec(block)?.[1]?.replace(/\\"/g, '"') || "";
    const excerpt = /excerpt:\s*"((?:[^"\\]|\\.)*)"/.exec(block)?.[1]?.replace(/\\"/g, '"') || "";
    const category = /category:\s*"((?:[^"\\]|\\.)*)"/.exec(block)?.[1] || "";
    const tagsMatch = /tags:\s*\[([^\]]*)\]/.exec(block)?.[1] || "";
    const tags = [...tagsMatch.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((t) => t[1]);
    objects.push({ source: "seed", slug, title, excerpt, category, tags });
  }
  return objects;
}

function updateSeedImageInDataTs(dataTs, slug, newImagePath) {
  // Anchor on slug="slug" and replace the image field that follows it within the same object
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(slug:\\s*"${escaped}"[\\s\\S]*?image:\\s*)"[^"]*"`
  );
  return dataTs.replace(pattern, `$1"${newImagePath}"`);
}

async function updateMarkdownFrontmatterImage(filePath, newImagePath, newBody) {
  const raw = await fs.readFile(filePath, "utf8");
  const end = raw.indexOf("\n---", 3);
  if (end === -1) throw new Error(`frontmatter non trouvée dans ${filePath}`);
  const frontmatter = raw.slice(0, end);
  const afterFront = raw.slice(end); // starts with \n---\n
  const rest = afterFront.slice(afterFront.indexOf("\n---") + 4).replace(/^\n+/, "");
  const newFrontmatter = frontmatter.replace(
    /^image:\s*"[^"]*"$/m,
    `image: "${newImagePath}"`
  );
  const final = `${newFrontmatter}\n---\n\n${newBody.trim()}\n`;
  await fs.writeFile(filePath, final, "utf8");
  // verify we didn't lose anything surprising
  void rest;
}

async function processArticle(client, article, { heroOnly = false } = {}) {
  const heroPath = `public/articles/${article.slug}-hero.jpg`;
  const body1Path = `public/articles/${article.slug}-1.jpg`;
  const body2Path = `public/articles/${article.slug}-2.jpg`;
  const heroAbs = path.resolve(heroPath);
  const body1Abs = path.resolve(body1Path);
  const body2Abs = path.resolve(body2Path);
  const heroUrl = `/articles/${article.slug}-hero.jpg`;
  const body1Url = `/articles/${article.slug}-1.jpg`;
  const body2Url = `/articles/${article.slug}-2.jpg`;

  const needHero = FORCE || !existsSync(heroAbs);
  const needBody1 = !heroOnly && (FORCE || !existsSync(body1Abs));
  const needBody2 = !heroOnly && (FORCE || !existsSync(body2Abs));

  if (!needHero && !needBody1 && !needBody2) {
    console.log(`[regen] skip ${article.slug} (images existent déjà, utilise --force pour régénérer)`);
    return { heroUrl, body1Url: heroOnly ? null : body1Url, body2Url: heroOnly ? null : body2Url };
  }

  console.log(`[regen] ${article.slug}: prompts…`);
  const prompts = await generatePromptsForArticle(client, article);
  console.log(`[regen]   hero: ${prompts.hero.slice(0, 80)}…`);

  const tasks = [];
  if (needHero) tasks.push(["hero", prompts.hero, HERO_W, HERO_H, heroAbs]);
  if (needBody1) tasks.push(["body1", prompts.body1, BODY_W, BODY_H, body1Abs]);
  if (needBody2) tasks.push(["body2", prompts.body2, BODY_W, BODY_H, body2Abs]);

  const results = await Promise.all(
    tasks.map(async ([label, prompt, w, h, dest]) => {
      try {
        const url = await generateFalImage(prompt, w, h);
        await downloadImage(url, dest);
        console.log(`[regen]   ${label}: saved ${path.basename(dest)}`);
        return [label, true];
      } catch (e) {
        console.error(`[regen]   ${label}: error ${e.message}`);
        return [label, false];
      }
    })
  );

  const okBy = Object.fromEntries(results);
  return {
    heroUrl: okBy.hero || (!needHero ? true : false) ? heroUrl : null,
    body1Url: heroOnly ? null : okBy.body1 || (!needBody1 ? true : false) ? body1Url : null,
    body2Url: heroOnly ? null : okBy.body2 || (!needBody2 ? true : false) ? body2Url : null,
  };
}

async function main() {
  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  const client = new Anthropic();

  const mdArticles = await readMarkdownArticles();
  console.log(`[regen] ${mdArticles.length} article(s) markdown`);
  const dataTs = await fs.readFile(DATA_PATH, "utf8");
  const seedArticles = parseSeedArticlesFromDataTs(dataTs);
  console.log(`[regen] ${seedArticles.length} article(s) seed (data.ts)`);

  let updatedDataTs = dataTs;

  // Process markdown articles (hero + 2 body)
  for (const article of mdArticles) {
    try {
      const { heroUrl, body1Url, body2Url } = await processArticle(client, article, { heroOnly: false });
      if (!heroUrl) {
        console.warn(`[regen]   ${article.slug}: hero manquant, skip update`);
        continue;
      }
      // Update body content: strip existing body images, insert new ones
      const bodyRefs = [];
      if (body1Url) bodyRefs.push({ url: body1Url, alt: `Image illustrative trail running` });
      if (body2Url) bodyRefs.push({ url: body2Url, alt: `Image illustrative trail running` });
      const newBody = insertImagesInBody(article.content, bodyRefs);
      await updateMarkdownFrontmatterImage(article.filePath, heroUrl, newBody);
      console.log(`[regen]   ${article.slug}: md updated`);
    } catch (e) {
      console.error(`[regen] ${article.slug}: FAILED — ${e.message}`);
    }
  }

  // Process seed articles (hero only — no body in data.ts)
  for (const article of seedArticles) {
    try {
      const { heroUrl } = await processArticle(client, article, { heroOnly: true });
      if (!heroUrl) {
        console.warn(`[regen]   ${article.slug}: hero manquant, skip data.ts update`);
        continue;
      }
      updatedDataTs = updateSeedImageInDataTs(updatedDataTs, article.slug, heroUrl);
      console.log(`[regen]   ${article.slug}: data.ts image updated`);
    } catch (e) {
      console.error(`[regen] ${article.slug}: FAILED — ${e.message}`);
    }
  }

  if (updatedDataTs !== dataTs) {
    await fs.writeFile(DATA_PATH, updatedDataTs, "utf8");
    console.log(`[regen] data.ts seed images persisted`);
  }

  console.log(`[regen] terminé. Lancer \`npm run publish\` pour regénérer data.ts et committer.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
