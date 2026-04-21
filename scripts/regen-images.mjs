#!/usr/bin/env node
// Régénère les images FLUX de certains articles avec les prompts actuels.
// Utile quand on retouche manuellement imagePrompt1/2 ou le FLUX_STYLE_SUFFIX.
//
// Usage : node scripts/regen-images.mjs <filename-slug> [<filename-slug>...]
// où <filename-slug> correspond au nom de fichier dans content/articles/ SANS l'extension .md.
// Ex : node scripts/regen-images.mjs ecologie-de-facade-l-utmb-rend-obligatoire-l-utilisation-du-mode-lumiere-rouge-s idee-d-enchainement-trail-cotes-montees-marche-rapide

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("content/articles");
const IMAGES_DIR = path.resolve("public/articles");
const FLUX_WIDTH = 1344;
const FLUX_HEIGHT = 768;
const FLUX_STYLE_SUFFIX =
  ", cinematic trail running photography, summer mountain trail, dirt and rocky singletrack, dramatic natural lighting, shallow depth of field, 35mm film, ultra realistic, editorial magazine style, no skiing, no snow, no winter gear";

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
  if (!url) throw new Error("fal: pas d'URL dans la réponse");
  return url;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

async function main() {
  const slugs = process.argv.slice(2);
  if (!slugs.length) {
    console.error("Usage: node scripts/regen-images.mjs <slug1> [<slug2> ...]");
    process.exit(1);
  }
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  for (const slug of slugs) {
    const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
    const raw = await fs.readFile(mdPath, "utf8");
    const { data } = matter(raw);
    const prompts = [data.imagePrompt1, data.imagePrompt2].filter(Boolean);
    console.log(`[regen] ${slug} — ${prompts.length} prompt(s)`);
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const dest = path.join(IMAGES_DIR, `${slug}-${i + 1}.jpg`);
      console.log(`  flux#${i + 1}: ${prompt.slice(0, 90)}...`);
      const url = await generateFluxImage(prompt);
      await downloadImage(url, dest);
      console.log(`  saved ${dest}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
