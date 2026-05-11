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
import { generateImage, saveImage } from "./lib/image-generation.mjs";

const CONTENT_DIR = path.resolve("content/articles");
const IMAGES_DIR = path.resolve("public/articles");
const FLUX_WIDTH = 1344;
const FLUX_HEIGHT = 768;

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
      const buf = await generateImage(prompt);
      await saveImage(buf, dest);
      console.log(`  saved ${dest}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
