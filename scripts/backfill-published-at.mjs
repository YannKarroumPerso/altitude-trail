#!/usr/bin/env node
// One-shot : stamper `publishedAt` ISO 8601 sur les articles existants qui
// n'en ont pas. Étalement artificiel pour préserver un ordering intra-jour
// chez Google News + Discover.
//
// Stratégie :
//   - parse la frontmatter avec gray-matter (idem publish.mjs) → robuste
//     aux YAML multi-line, guillemets simples, valeurs bare, etc.
//   - regroupe les articles par jour (champ `date` français)
//   - trie chaque groupe par slug lexicographique (ordering déterministe)
//   - stamp publishedAt = jour à 09:00 UTC + N×30min
//   - insère la ligne `publishedAt: "ISO"` juste avant la fermeture `---`
//     de la frontmatter (préserve CRLF/LF natif via regex avec capture)
//   - idempotent : skip les articles qui ont déjà `publishedAt`
//
// Limitations :
//   - 09:00 UTC = ~11h Paris été, ~10h hiver — conventionnel
//   - 30min entre articles autorise jusqu'à 30 articles/jour
//
// Usage :
//   node scripts/backfill-published-at.mjs           → applique
//   node scripts/backfill-published-at.mjs --dry-run → liste sans écrire

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("content/articles");
const DRY_RUN = process.argv.includes("--dry-run");

const FR_MONTHS = {
  janvier: 0, "février": 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, "août": 7, septembre: 8, octobre: 9, novembre: 10, "décembre": 11,
};

function parseFrDate(value) {
  // Cas 1 : valeur déjà un Date (gray-matter parse certaines dates YAML)
  if (value instanceof Date && !isNaN(value.getTime())) {
    return { y: value.getUTCFullYear(), m: value.getUTCMonth(), d: value.getUTCDate() };
  }
  const str = String(value || "").trim();
  const m = str.match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
  if (!m) return null;
  const month = FR_MONTHS[m[2].toLowerCase()];
  if (month == null) return null;
  return { y: parseInt(m[3], 10), m: month, d: parseInt(m[1], 10) };
}

// d.m est 0-indexed (parseFrDate). On l'incrémente pour un dayKey lisible humain.
const dayKey = (d) => `${d.y}-${String(d.m + 1).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;

async function main() {
  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
  console.log(`[backfill] scan ${files.length} fichiers dans ${CONTENT_DIR}`);

  const candidates = [];
  let alreadyStamped = 0;
  let skipped = 0;
  const skipReasons = { no_fm: 0, no_date: 0, no_slug: 0, bad_date: 0 };

  for (const file of files) {
    const filepath = path.join(CONTENT_DIR, file);
    const text = await fs.readFile(filepath, "utf8");

    let parsed;
    try {
      parsed = matter(text);
    } catch {
      skipped++; skipReasons.no_fm++; continue;
    }
    const { data } = parsed;
    if (!data || typeof data !== "object") { skipped++; skipReasons.no_fm++; continue; }

    if (data.publishedAt) { alreadyStamped++; continue; }
    if (!data.date) { skipped++; skipReasons.no_date++; continue; }
    if (!data.slug) { skipped++; skipReasons.no_slug++; continue; }

    const ymd = parseFrDate(data.date);
    if (!ymd) { skipped++; skipReasons.bad_date++; continue; }

    candidates.push({ file, filepath, text, slug: String(data.slug), ymd, day: dayKey(ymd) });
  }

  console.log(`[backfill] ${candidates.length} candidats, ${alreadyStamped} déjà stampés, ${skipped} skippés`);
  if (skipped > 0) {
    console.log(`[backfill] skips détaillés:`, skipReasons);
  }

  // Group by day, sort by slug lexico
  const byDay = new Map();
  for (const c of candidates) {
    if (!byDay.has(c.day)) byDay.set(c.day, []);
    byDay.get(c.day).push(c);
  }

  let written = 0;
  for (const [day, list] of [...byDay.entries()].sort()) {
    list.sort((a, b) => a.slug.localeCompare(b.slug));
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const minutes = 9 * 60 + i * 30;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const iso = new Date(Date.UTC(a.ymd.y, a.ymd.m, a.ymd.d, h, m, 0, 0)).toISOString();

      // Insertion juste avant la fermeture `---` de la frontmatter.
      // Capture l'EOL natif (\r\n ou \n) pour préserver les fins de ligne du fichier.
      // Pattern : `---<frontmatter>(\r?\n)---<\r?\n>`
      // m[1] = ouverture + frontmatter (sans EOL final)
      // m[2] = EOL avant la fermeture (le séparateur natif)
      // m[3] = bloc de fermeture `---\r?\n`
      const re = /^(---[\s\S]*?)(\r?\n)(---\r?\n)/;
      const fmMatch = a.text.match(re);
      if (!fmMatch) {
        console.warn(`[backfill] WARN ${a.file} : frontmatter close pattern non trouvé`);
        continue;
      }
      const before = fmMatch[1];
      const eol = fmMatch[2];
      const close = fmMatch[3];
      const newText = `${before}${eol}publishedAt: "${iso}"${eol}${close}` + a.text.slice(fmMatch[0].length);

      if (newText === a.text) {
        console.warn(`[backfill] WARN ${a.file} : pas de changement détecté`);
        continue;
      }

      if (DRY_RUN) {
        console.log(`[backfill] DRY ${day} #${i + 1} ${a.slug.slice(0, 60)} → ${iso}`);
      } else {
        await fs.writeFile(a.filepath, newText, "utf8");
        written++;
      }
    }
  }

  console.log(`[backfill] terminé. ${DRY_RUN ? "(dry-run)" : `${written} fichier(s) écrits`}.`);
  if (!DRY_RUN && written > 0) {
    console.log(`[backfill] pense à relancer 'npm run publish' pour propager dans data.ts.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
