#!/usr/bin/env node
/**
 * Détecte tous les articles dont le champ `image:` pointe vers /logo-square.png
 * (fallback temporaire posé par les fix d'images cassées), génère une vraie
 * image Nano Banana 2 Flash basée sur leur titre + tags, et met à jour le
 * frontmatter pour pointer vers /articles/<slug>-hero.jpg.
 *
 * Usage : node scripts/regen-fallback-images.mjs [--limit=N]
 *
 * Pré-requis : GEMINI_API_KEY dans process.env.
 *
 * Après ce script : lancer `npm run publish` pour régénérer data.ts + commit + push.
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { generateImage, saveImage } from "./lib/image-generation.mjs";

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_DIR = path.resolve("public/articles");
const FALLBACK = "/logo-square.png";

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.slice("--limit=".length), 10) : 100;

function buildPrompt(meta) {
  const title = meta.title || "";
  const tags = Array.isArray(meta.tags) ? meta.tags.join(", ") : "";
  const cat = meta.categorySlug || "";
  // Mapping catégorie → vocabulaire visuel
  const catVisual = {
    nutrition: "nutrition shot at trail aid station, gel bars and isotonic drinks, gloved hands of ultra runner",
    "courses-recits": "elite trail runner racing on technical mountain singletrack during major ultra event",
    entrainement: "trail runner doing structured training session, mountain landscape, athletic focus",
    "blessures-preventions": "trail runner doing rehab/strength exercises in mountain setting, sports physio context",
    actualites: "trail running scene with editorial photojournalism feel, mountain backdrop",
    equipement: "trail running gear close-up product photography, mountain backdrop, dirt and rocky singletrack visible",
    debuter: "beginner trail runner on gentle mountain path, golden hour light, encouraging atmosphere",
  };
  const visual = catVisual[cat] || "trail runner on alpine singletrack, dramatic mountain scenery";
  return `${visual}, evoking "${title}". Tags: ${tags}.`;
}

async function loadFallbackArticles() {
  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
  const out = [];
  for (const f of files) {
    const fp = path.join(CONTENT_DIR, f);
    const text = await fs.readFile(fp, "utf8");
    const { data } = matter(text);
    if (String(data.image || "").trim() === FALLBACK) {
      out.push({ file: fp, fname: f.replace(/\.md$/, ""), data });
    }
  }
  return out;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY manquante");
    process.exit(1);
  }
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  const articles = await loadFallbackArticles();
  console.log(`[regen-fallback] ${articles.length} article(s) avec image fallback à régénérer (limite : ${LIMIT})`);

  let done = 0;
  let failed = 0;
  for (const a of articles.slice(0, LIMIT)) {
    const slug = String(a.data.slug || a.fname);
    const prompt = buildPrompt(a.data);
    console.log(`\n[regen-fallback] ${slug.slice(0, 70)}`);
    console.log(`  prompt: ${prompt.slice(0, 100)}…`);
    try {
      const buf = await generateImage(prompt);
      const dest = path.join(PUBLIC_DIR, `${slug}-hero.jpg`);
      await saveImage(buf, dest);
      console.log(`  ✓ ${dest} (${buf.length} bytes)`);

      // Update frontmatter
      const text = await fs.readFile(a.file, "utf8");
      const newImage = `/articles/${slug}-hero.jpg`;
      const updated = text.replace(/^image\s*:\s*["']?[^"'\r\n]+["']?\s*$/m, `image: "${newImage}"`);
      await fs.writeFile(a.file, updated, "utf8");
      console.log(`  ✓ frontmatter image: ${newImage}`);
      done++;
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
      failed++;
    }
  }

  console.log(`\n[regen-fallback] ${done} régénéré(s), ${failed} échec(s) sur ${articles.length} candidats.`);
  if (done > 0) {
    console.log(`[regen-fallback] Pense à lancer 'npm run publish' pour propager data.ts.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
