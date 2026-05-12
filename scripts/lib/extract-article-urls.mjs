#!/usr/bin/env node
/**
 * Lit la liste des chemins .md ajoutés (1 par ligne) sur stdin (ou via --files),
 * extrait le slug du frontmatter de chaque fichier, et imprime les URLs
 * "${SITE_BASE_URL}/articles/${slug}" sur stdout (1 par ligne).
 *
 * Pourquoi ce script existe : les workflows GitHub Actions (veille.yml,
 * veille-tavily.yml, brief-publish.yml) construisaient l'URL de notif email
 * en faisant `sed 's|content/articles/||;s|\.md$||'` sur le filename. Bug :
 * le filename peut différer du `slug:` frontmatter (cas veille.mjs avant
 * fix, ou n'importe quel script qui crée un .md avec un titre source puis
 * Claude réécrit le titre). Conséquence : email avec URL en 404.
 *
 * Ce script lit le VRAI slug depuis le frontmatter, garantissant des URLs
 * email qui pointent toujours vers la version servie par Next.js (qui se
 * base sur le slug frontmatter via data.ts).
 *
 * Usage :
 *   git diff --name-only --diff-filter=A "$BEFORE..$AFTER" -- 'content/articles/*.md' | \
 *     node scripts/lib/extract-article-urls.mjs --base="https://www.altitude-trail.fr"
 *
 * Sortie (stdout) :
 *   https://www.altitude-trail.fr/articles/<slug-frontmatter-1>
 *   https://www.altitude-trail.fr/articles/<slug-frontmatter-2>
 *   ...
 *
 * Si un fichier .md n'a pas de frontmatter parseable ou pas de `slug:`,
 * fallback sur le filename (avec un warning sur stderr).
 */
import fs from "node:fs/promises";
import readline from "node:readline";

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith("--base="));
const SITE_BASE = (baseArg ? baseArg.slice("--base=".length) : (process.env.SITE_BASE_URL || "https://www.altitude-trail.fr")).replace(/\/$/, "");

function extractSlug(text) {
  // Frontmatter YAML : entre les deux `---` du début
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return null;
  const fm = text.slice(0, end);
  // Match slug: "..." ou slug: '...' ou slug: bare
  const m = fm.match(/\nslug\s*:\s*["']?([^"'\r\n]+?)["']?\s*(?:\r?\n|$)/);
  return m ? m[1].trim() : null;
}

async function processPath(rawPath) {
  const p = rawPath.trim();
  if (!p || !p.endsWith(".md")) return;
  let text;
  try {
    text = await fs.readFile(p, "utf8");
  } catch (e) {
    console.error(`[extract-urls] lecture ${p} failed: ${e.message}`);
    return;
  }
  const slug = extractSlug(text);
  if (!slug) {
    // Fallback : utiliser le filename, mais signaler l'anomalie
    const fallback = p.replace(/^.*\/content\/articles\//, "").replace(/\.md$/, "");
    console.error(`[extract-urls] WARN no slug in frontmatter of ${p}, fallback to filename "${fallback}"`);
    process.stdout.write(`${SITE_BASE}/articles/${fallback}\n`);
    return;
  }
  process.stdout.write(`${SITE_BASE}/articles/${slug}\n`);
}

async function main() {
  // Si --files=path1,path2 fourni, traiter directement. Sinon lire stdin.
  const filesArg = args.find((a) => a.startsWith("--files="));
  if (filesArg) {
    const list = filesArg.slice("--files=".length).split(",").filter(Boolean);
    for (const p of list) await processPath(p);
    return;
  }
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) await processPath(line);
}

main().catch((e) => { console.error("[extract-urls] crash:", e); process.exit(1); });
