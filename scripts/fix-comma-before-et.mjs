#!/usr/bin/env node
/**
 * Remplace toutes les occurrences de ", et " par " et " (suppression de la
 * virgule avant "et" dans une énumération — règle de typographie française).
 *
 * Passe sur :
 *  - tous les fichiers markdown dans content/articles/
 *  - src/lib/data.ts (section seeds ET section generatedArticles ; les
 *    generatedArticles seront quand même regénérées par publish.mjs à partir
 *    des .md fixés, donc la deuxième passe est redondante mais inoffensive).
 *
 * Script idempotent.
 */
import fs from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.resolve("content/articles");
const DATA_PATH = path.resolve("src/lib/data.ts");

const PATTERN = /,(\s+)et(\s+)/g;
const REPLACEMENT = "$1et$2";

async function fixFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const matches = raw.match(PATTERN);
  const count = matches ? matches.length : 0;
  if (count === 0) return 0;
  const updated = raw.replace(PATTERN, REPLACEMENT);
  await fs.writeFile(filePath, updated, "utf8");
  return count;
}

async function main() {
  let total = 0;
  let filesTouched = 0;
  const entries = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
  for (const f of entries) {
    const c = await fixFile(path.join(CONTENT_DIR, f));
    if (c > 0) {
      console.log(`[fix] ${f}: ${c}`);
      total += c;
      filesTouched++;
    }
  }
  const dataCount = await fixFile(DATA_PATH);
  if (dataCount > 0) {
    console.log(`[fix] src/lib/data.ts: ${dataCount}`);
    total += dataCount;
    filesTouched++;
  }
  console.log(`[fix] terminé — ${total} remplacements sur ${filesTouched} fichier(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
