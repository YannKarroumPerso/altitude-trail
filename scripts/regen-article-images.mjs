#!/usr/bin/env node
// Regénère 4 images FLUX uniques pour les 4 articles rédactionnels professionnels
// (nutrition, renforcement, sommeil, descente) et met à jour leur frontmatter.
//
// Usage : node scripts/regen-article-images.mjs
// Prérequis : BFL_API_KEY dans l'environnement (présente dans .env.local)
//
// Après succès :
//   npm run publish
// (pour régénérer src/lib/data.ts et pousser sur main)

import fs from "node:fs/promises";
import path from "node:path";

// Charge .env.local manuellement (pas de dotenv en runtime)
try {
  const envFile = await fs.readFile(path.resolve(".env.local"), "utf8").catch(() => "");
  for (const line of envFile.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key]) continue;
    let val = rawVal;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
} catch {}

const PUBLIC_DIR = path.resolve("public/articles");
const CONTENT_DIR = path.resolve("content/articles");

const FLUX_STYLE_SUFFIX = ", cinematic trail running photography, summer mountain trail, dirt and rocky singletrack, dramatic natural lighting, shallow depth of field, 35mm film, ultra realistic, editorial magazine style, no skiing, no snow, no winter gear";

const FLUX_WIDTH = 1344;
const FLUX_HEIGHT = 768;

// Timestamp pour rendre les noms de fichier uniques (force le rafraîchissement CDN Vercel)
const ts = Date.now().toString(36);

const JOBS = [
  {
    slug: "comment-nourrir-son-corps-sur-un-ultra-sans-craquer-au-km-40",
    imageName: `nutrition-ultra-km40-${ts}-hero.jpg`,
    prompt:
      "A trail runner in his thirties sitting on a rock at an alpine aid station during an ultramarathon, eating an energy bar while holding a soft flask of electrolyte drink, vest loaded with gels, sweat on forehead, mid-afternoon golden light on green mountain valley behind, volunteers blurred in background, exhausted but focused expression, close-up composition",
  },
  {
    slug: "les-traileurs-qui-ne-se-blessent-pas-ont-un-point-commun",
    imageName: `renforcement-musculaire-traileur-${ts}-hero.jpg`,
    prompt:
      "A fit female trail runner in her mid-thirties performing a single-leg squat on a wooden bench at a high alpine viewpoint, muscular quadriceps visible, trail shoes and technical shorts, mountains and pine forest in the background, early morning side light, strong calves, strength training in nature, sharp focus on the supporting leg",
  },
  {
    slug: "votre-meilleur-allie-contre-les-blessures-ne-coute-rien-le-sommeil",
    imageName: `sommeil-recuperation-coureur-${ts}-hero.jpg`,
    prompt:
      "A male trail runner sleeping peacefully in a wooden mountain refuge bunk at dawn, soft warm morning light coming through a small window, trail gear and running shoes visible on the floor beside the bed, alpine peaks glowing pink outside, restful and serene atmosphere, close-up composition, no other people in view",
  },
  {
    slug: "la-descente-fait-plus-de-degats-que-la-montee-voici-comment-proteger-vos-articulations",
    imageName: `descente-trail-articulations-${ts}-hero.jpg`,
    prompt:
      "A male trail runner descending a very steep rocky technical singletrack in the summer Alps, low stance with deeply bent knees, two carbon trekking poles planted ahead for impact absorption, loose scree spraying behind heels, action shot mid-stride with quadriceps engaged, dramatic late afternoon light on grey granite, deep valley below, motion and sharp focus",
  },
];

const apiKey = process.env.BFL_API_KEY;
if (!apiKey) {
  console.error("[regen] BFL_API_KEY manquante dans .env.local ou l'environnement — abandon.");
  process.exit(1);
}

async function generateFluxImage(prompt) {
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
    throw new Error(`fal ${res.status}: ${text.slice(0, 250)}`);
  }
  const data = await res.json();
  const url = data.images?.[0]?.url;
  if (!url) throw new Error(`fal: pas d'URL dans la réponse`);
  return url;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

async function updateFrontmatter(mdPath, imagePath) {
  const src = await fs.readFile(mdPath, "utf8");
  const updated = src.replace(/^image:\s*.*$/m, `image: "${imagePath}"`);
  if (updated === src) {
    console.warn(`  ⚠ aucun champ image: trouvé dans ${mdPath}`);
  }
  await fs.writeFile(mdPath, updated, "utf8");
}

(async () => {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  let ok = 0;
  let failed = 0;
  for (const job of JOBS) {
    console.log(`\n=== ${job.slug} ===`);
    const destPath = path.join(PUBLIC_DIR, job.imageName);
    try {
      console.log(`  prompt : ${job.prompt.slice(0, 110)}…`);
      const url = await generateFluxImage(job.prompt);
      console.log(`  flux URL : ${url.slice(0, 80)}…`);
      await downloadImage(url, destPath);
      const stat = await fs.stat(destPath);
      console.log(`  ✓ saved ${destPath.replace(path.resolve("."), ".")} (${(stat.size / 1024).toFixed(1)} KB)`);
      const mdPath = path.join(CONTENT_DIR, `${job.slug}.md`);
      await updateFrontmatter(mdPath, `/articles/${job.imageName}`);
      console.log(`  ✓ frontmatter mis à jour → /articles/${job.imageName}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ERREUR: ${e.message}`);
      failed++;
    }
  }
  console.log(`\n=============================`);
  console.log(`Terminé : ${ok} succès, ${failed} échec(s)`);
  console.log(`\nÉtape suivante :`);
  console.log(`  npm run publish`);
  console.log(`(régénère data.ts, commit + push automatique, Vercel redéploie)\n`);
  if (failed > 0) process.exit(1);
})();
