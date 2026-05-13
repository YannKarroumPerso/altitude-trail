#!/usr/bin/env node
/**
 * Détecte tous les articles dont le champ `image:` pointe vers /logo-square.png
 * (fallback temporaire posé par les fix d'images cassées), génère une vraie
 * image Nano Banana 2 Flash basée sur leur titre + tags, et met à jour le
 * frontmatter pour pointer vers /articles/<slug>-hero.jpg.
 *
 * Usage : node scripts/regen-fallback-images.mjs [--limit=N] [--commit-each]
 *
 * --commit-each : git add/commit/push apres CHAQUE image reussie. Critique
 *   pour ne pas perdre le travail en cas de timeout GH Actions (Gemini est
 *   regulierement sature et un seul article peut consommer 5+ min). Sans ce
 *   flag, le commit se fait en fin de script (mode legacy).
 *
 * Pré-requis : GEMINI_API_KEY dans process.env.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import matter from "gray-matter";
import { generateImage, saveImage } from "./lib/image-generation.mjs";

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_DIR = path.resolve("public/articles");
const FALLBACK = "/logo-square.png";

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.slice("--limit=".length), 10) : 3;
const COMMIT_EACH = process.argv.includes("--commit-each");

function buildPrompt(meta) {
  const title = meta.title || "";
  const tags = Array.isArray(meta.tags) ? meta.tags.join(", ") : "";
  const cat = meta.categorySlug || "";
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

function safeExec(cmd) {
  try {
    return execSync(cmd, { stdio: ["pipe", "pipe", "pipe"], encoding: "utf8" }).trim();
  } catch (e) {
    return null;
  }
}

function commitAndPush(slug, mdFile, jpgFile) {
  // Stage uniquement les fichiers de cet article (pas de package-lock parasite).
  const out1 = safeExec(`git add ${JSON.stringify(mdFile)} ${JSON.stringify(jpgFile)}`);
  const staged = safeExec("git diff --cached --name-only") || "";
  if (!staged.trim()) {
    console.log(`  [commit] rien a stage pour ${slug}, skip`);
    return false;
  }
  const msg = `chore(images): regen Nano Banana 2 pour ${slug}`;
  const commitOut = safeExec(`git commit -m ${JSON.stringify(msg)}`);
  if (!commitOut) {
    console.warn(`  [commit] echec commit ${slug}`);
    return false;
  }
  // Retry push avec rebase --autostash en cas de concurrence.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const pushOut = safeExec("git push 2>&1");
    if (pushOut !== null && !/error|rejected|failed/i.test(pushOut)) {
      console.log(`  [commit] push OK (attempt ${attempt}) : ${slug}`);
      return true;
    }
    console.warn(`  [commit] push attempt ${attempt} echec, rebase + retry...`);
    safeExec("git pull --rebase --autostash origin main");
  }
  console.error(`  [commit] push DEFINITIVEMENT echec pour ${slug}`);
  return false;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY manquante");
    process.exit(1);
  }
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  const articles = await loadFallbackArticles();
  console.log(`[regen-fallback] ${articles.length} article(s) avec image fallback à régénérer (limite : ${LIMIT}, commitEach: ${COMMIT_EACH})`);

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

      const text = await fs.readFile(a.file, "utf8");
      const newImage = `/articles/${slug}-hero.jpg`;
      const updated = text.replace(/^image\s*:\s*["']?[^"'\r\n]+["']?\s*$/m, `image: "${newImage}"`);
      await fs.writeFile(a.file, updated, "utf8");
      console.log(`  ✓ frontmatter image: ${newImage}`);
      done++;

      if (COMMIT_EACH) {
        commitAndPush(slug, a.file, dest);
      }
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
      failed++;
    }
    // Sleep 10s entre articles (reduit de 15s : on a deja les retries internes
    // dans generateImage si Gemini sature).
    await new Promise((r) => setTimeout(r, 10000));
  }

  console.log(`\n[regen-fallback] ${done} régénéré(s), ${failed} échec(s) sur ${articles.length} candidats.`);
  if (done > 0 && !COMMIT_EACH) {
    console.log(`[regen-fallback] Pense à lancer 'npm run publish' pour propager data.ts.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
