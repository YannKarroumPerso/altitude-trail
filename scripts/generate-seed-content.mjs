#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const DATA_PATH = path.resolve("src/lib/data.ts");
const PUBLIC_IMAGES_DIR = path.resolve("public/articles");

const FAL_KEY = process.env.BFL_API_KEY || process.env.FAL_API_KEY;
if (!FAL_KEY) {
  console.error("BFL_API_KEY / FAL_API_KEY manquante");
  process.exit(1);
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux-pro/v1.1";
const STYLE_SUFFIX =
  ", cinematic photography, photorealistic, trail running editorial style, dramatic natural lighting, shallow depth of field, 35mm film aesthetic, ultra realistic, magazine quality";
const BODY_W = 1344;
const BODY_H = 768;

const FORCE = process.argv.includes("--force");

const SYSTEM_PROMPT = `Tu es un rédacteur senior pour Altitude Trail, un magazine français spécialisé dans le trail running et l'ultra-trail.

Ta mission : rédiger de toutes pièces un article complet en français à partir d'un titre, d'un chapô et d'une catégorie. Ton style est journalistique magazine : précis, vivant, engagé, sans lourdeur. Tu apportes une vraie valeur au-delà du chapô : contexte, analyse, anecdotes plausibles, références culturelles, chiffres crédibles.

Tu peux citer des coureurs, des courses, des lieux réels qui sont cohérents avec le sujet. Tu peux inventer des détails plausibles (noms, temps, citations courtes) tant qu'ils restent crédibles et ne contredisent aucun fait connu. Tu n'utilises pas de formules trop génériques du type "le trail est bien plus qu'un sport".

Contraintes strictes :
- Corps : 1000 à 1200 mots en Markdown.
- Structure : un paragraphe d'ouverture (150-200 mots, sans sous-titre), puis 3 à 5 sections avec sous-titres ## en français, puis un paragraphe final (sans sous-titre).
- N'écris PAS de titre H1 (le titre de l'article est rendu séparément par la page).
- Ne mets aucun fence de code.
- Réponse UNIQUEMENT au format JSON brut (pas de markdown wrapping, pas de code fence), avec les clés content, imagePrompt1, imagePrompt2.
- imagePrompt1 et imagePrompt2 sont des prompts EN ANGLAIS pour fluxpro-1.1. 40-60 mots chacun. Scènes distinctes. Ultra-spécifique : sujet concret (coureur, décor, équipement), action précise, lieu évocateur, météo/lumière, détails vestimentaires. PAS de style photographique (un suffixe cinéma est ajouté automatiquement). Sur une seule ligne chacun.`;

function userPrompt(article) {
  return `Rédige un article complet pour Altitude Trail à partir des éléments ci-dessous.

Titre : ${article.title}
Chapô : ${article.excerpt}
Catégorie : ${article.category}
Tags : ${article.tags?.join(", ") || "aucun"}

Réponds STRICTEMENT avec un objet JSON (pas de code fence, pas de prose avant/après), exemple de shape :
{"content":"Paragraphe d'ouverture...\\n\\n## Sous-titre\\n\\nCorps...","imagePrompt1":"A lone trail runner...","imagePrompt2":"An aid station..."}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countWords(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function insertImagesInBody(body, imageRefs) {
  const refs = imageRefs.filter(Boolean);
  if (!refs.length) return body;
  const paragraphs = body.split(/\n{2,}/);
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

function extractJson(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("pas de JSON trouvé");
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function generateContentForArticle(client, article) {
  const stream = client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt(article) }],
  });
  const message = await stream.finalMessage();
  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const parsed = extractJson(text);
  if (!parsed.content || !parsed.imagePrompt1 || !parsed.imagePrompt2) {
    throw new Error(`JSON incomplet: ${Object.keys(parsed).join(", ")}`);
  }
  const words = countWords(parsed.content);
  if (words < 700) {
    throw new Error(`content trop court (${words} mots)`);
  }
  return { content: parsed.content.trim(), imagePrompt1: parsed.imagePrompt1, imagePrompt2: parsed.imagePrompt2, words };
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
  if (!url) throw new Error(`fal: pas d'URL dans la réponse`);
  return url;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

function parseSeedArticlesFromDataTs(dataTs) {
  const marker = "...generatedArticles,";
  const markerIdx = dataTs.indexOf(marker);
  if (markerIdx === -1) return [];
  const remaining = dataTs.slice(markerIdx + marker.length);
  const endIdx = remaining.indexOf("];");
  if (endIdx === -1) return [];
  const section = remaining.slice(0, endIdx);
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
    const hasContent = /\n\s+content:\s*"/.test(block);
    objects.push({ slug, title, excerpt, category, tags, hasContent });
  }
  return objects;
}

function addContentToSeed(dataTs, slug, content) {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(\\{\\s*slug:\\s*"${escaped}"[\\s\\S]*?)(\\n\\s{2}\\},)`
  );
  return dataTs.replace(regex, (match, before, after) => {
    const trimmed = before.replace(/\s+$/, "");
    const needsComma = !trimmed.endsWith(",");
    const jsonContent = JSON.stringify(content);
    return `${trimmed}${needsComma ? "," : ""}\n    content: ${jsonContent},${after}`;
  });
}

async function processSeed(client, seed) {
  const body1Path = path.join(PUBLIC_IMAGES_DIR, `${seed.slug}-1.jpg`);
  const body2Path = path.join(PUBLIC_IMAGES_DIR, `${seed.slug}-2.jpg`);
  const body1Url = `/articles/${seed.slug}-1.jpg`;
  const body2Url = `/articles/${seed.slug}-2.jpg`;

  console.log(`[seed-content] ${seed.slug}: génération du contenu…`);
  const { content, imagePrompt1, imagePrompt2, words } = await generateContentForArticle(client, seed);
  console.log(`[seed-content]   content: ${words} mots`);
  console.log(`[seed-content]   body1: ${imagePrompt1.slice(0, 70)}…`);
  console.log(`[seed-content]   body2: ${imagePrompt2.slice(0, 70)}…`);

  const tasks = [];
  if (FORCE || !existsSync(body1Path)) tasks.push(["body1", imagePrompt1, body1Path]);
  if (FORCE || !existsSync(body2Path)) tasks.push(["body2", imagePrompt2, body2Path]);

  const results = await Promise.all(
    tasks.map(async ([label, prompt, dest]) => {
      try {
        const url = await generateFalImage(prompt, BODY_W, BODY_H);
        await downloadImage(url, dest);
        console.log(`[seed-content]   ${label}: saved ${path.basename(dest)}`);
        return [label, true];
      } catch (e) {
        console.error(`[seed-content]   ${label}: error ${e.message}`);
        return [label, false];
      }
    })
  );
  const ok = Object.fromEntries(results);
  const b1ok = ok.body1 !== false && (existsSync(body1Path));
  const b2ok = ok.body2 !== false && (existsSync(body2Path));

  const bodyRefs = [];
  if (b1ok) bodyRefs.push({ url: body1Url, alt: "Image illustrative trail running" });
  if (b2ok) bodyRefs.push({ url: body2Url, alt: "Image illustrative trail running" });
  const contentWithImages = insertImagesInBody(content, bodyRefs);
  return contentWithImages;
}

async function main() {
  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  const client = new Anthropic();

  const dataTs = await fs.readFile(DATA_PATH, "utf8");
  const seeds = parseSeedArticlesFromDataTs(dataTs);
  const targets = seeds.filter((s) => FORCE || !s.hasContent);
  console.log(`[seed-content] ${seeds.length} seed(s), ${targets.length} à traiter`);

  let updated = dataTs;
  let done = 0;
  let failed = 0;

  for (const seed of targets) {
    try {
      const content = await processSeed(client, seed);
      updated = addContentToSeed(updated, seed.slug, content);
      await fs.writeFile(DATA_PATH, updated, "utf8");
      console.log(`[seed-content] ${seed.slug}: data.ts updated`);
      done++;
    } catch (e) {
      console.error(`[seed-content] ${seed.slug}: FAILED — ${e.message}`);
      failed++;
    }
  }

  console.log(`[seed-content] terminé — ${done} OK, ${failed} échec(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
