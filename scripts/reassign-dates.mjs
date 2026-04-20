#!/usr/bin/env node
/**
 * Réécrit les dates de publication de tous les articles (markdown dans
 * content/articles/ ET seeds dans src/lib/data.ts) pour donner l'impression
 * d'un rythme de publication régulier depuis le 28 mars 2026.
 *
 * Règles :
 *  - ordre : articles triés par date courante (ASC) → reçoivent les nouvelles
 *    dates dans le même ordre (le plus vieux repasse au 28 mars, le plus récent
 *    repasse en dernier). L'ordre relatif est donc préservé.
 *  - distribution : les (N − LAST_COUNT) premiers sont étalés linéairement
 *    entre START_DATE et (START_DATE + DAYS_SPAN − 1 jour), soit du 28 mars
 *    au 19 avril.
 *  - les LAST_COUNT derniers (les plus récents) reçoivent TODAY (20 avril).
 *
 * Idempotent : relancer le script re-trie sur les nouvelles dates et réassigne
 * à l'identique.
 */
import fs from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.resolve("content/articles");
const DATA_PATH = path.resolve("src/lib/data.ts");

const START_DATE = new Date(Date.UTC(2026, 2, 28)); // 28 mars 2026
const TODAY = new Date(Date.UTC(2026, 3, 20)); // 20 avril 2026
const DAYS_SPAN = 22; // 28 mars + 22 jours = 19 avril (la veille de TODAY)
const LAST_COUNT = 4;

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatFrDate(d) {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function parseFrDate(str) {
  if (!str) return new Date(0);
  const m = str.match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
  if (!m) return new Date(0);
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return new Date(0);
  return new Date(Date.UTC(parseInt(m[3], 10), month, parseInt(m[1], 10)));
}

function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function extractFrontmatterField(md, field) {
  // Matches single-line value: field: "value", field: value, field: 'value'
  const re = new RegExp(`^${field}:\\s*(?:"([^"\\n]*)"|'([^'\\n]*)'|([^\\n]+))$`, "m");
  const m = md.match(re);
  if (!m) return null;
  return m[1] || m[2] || m[3]?.trim() || null;
}

function replaceFrontmatterDate(md, newDate) {
  // Toujours réécrire en `date: "..."` entre le premier `---` et le deuxième
  const end = md.indexOf("\n---", 3);
  if (end === -1) return md;
  const front = md.slice(0, end);
  const body = md.slice(end);
  const re = /^date:\s*[^\n]*$/m;
  let newFront;
  if (re.test(front)) {
    newFront = front.replace(re, `date: "${newDate}"`);
  } else {
    // pas de champ date — on en insère un juste après le slug
    newFront = front.replace(/^slug:\s*[^\n]+$/m, (line) => `${line}\ndate: "${newDate}"`);
  }
  return newFront + body;
}

async function loadMdArticles() {
  const entries = await fs.readdir(CONTENT_DIR);
  const out = [];
  for (const f of entries) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(CONTENT_DIR, f);
    const raw = await fs.readFile(p, "utf8");
    const dateStr = extractFrontmatterField(raw, "date") || "";
    const slug = extractFrontmatterField(raw, "slug") || f.replace(/\.md$/, "");
    out.push({ source: "md", path: p, file: f, slug, currentDate: parseFrDate(dateStr), originalRaw: raw });
  }
  return out;
}

function loadSeedArticles(dataTs) {
  const marker = "...generatedArticles,";
  const idx = dataTs.indexOf(marker);
  if (idx === -1) return [];
  const afterMarker = idx + marker.length;
  const rest = dataTs.slice(afterMarker);
  const endRelative = rest.indexOf("];");
  if (endRelative === -1) return [];
  const section = rest.slice(0, endRelative);
  const regex = /\{\s*slug:\s*"([^"]+)"[\s\S]*?date:\s*"([^"]+)"[\s\S]*?\n\s{2}\},/g;
  const out = [];
  let m;
  while ((m = regex.exec(section)) !== null) {
    out.push({ source: "seed", slug: m[1], currentDate: parseFrDate(m[2]) });
  }
  return out;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceSeedDate(dataTs, slug, newDate) {
  const escaped = escapeRegex(slug);
  const pattern = new RegExp(`(slug:\\s*"${escaped}"[\\s\\S]*?date:\\s*)"[^"]*"`);
  return dataTs.replace(pattern, `$1"${newDate}"`);
}

async function main() {
  const dataTs = await fs.readFile(DATA_PATH, "utf8");
  const md = await loadMdArticles();
  const seeds = loadSeedArticles(dataTs);
  const all = [...md, ...seeds];
  all.sort((a, b) => a.currentDate.getTime() - b.currentDate.getTime());

  const total = all.length;
  const stretchable = total - LAST_COUNT;
  if (stretchable < 1) {
    console.error(`[dates] pas assez d'articles (${total}) pour la distribution`);
    process.exit(1);
  }

  console.log(`[dates] ${total} articles total : ${stretchable} étalés du ${formatFrDate(START_DATE)} au ${formatFrDate(addDays(START_DATE, DAYS_SPAN))}, ${LAST_COUNT} sur ${formatFrDate(TODAY)}`);

  let updatedDataTs = dataTs;
  let mdWrites = 0;
  let seedWrites = 0;
  for (let i = 0; i < total; i++) {
    const article = all[i];
    let targetDate;
    if (i >= stretchable) {
      targetDate = TODAY;
    } else {
      const dayOffset = stretchable === 1 ? 0 : Math.round((i * DAYS_SPAN) / (stretchable - 1));
      targetDate = addDays(START_DATE, dayOffset);
    }
    const newDateStr = formatFrDate(targetDate);

    if (article.source === "md") {
      const updated = replaceFrontmatterDate(article.originalRaw, newDateStr);
      if (updated !== article.originalRaw) {
        await fs.writeFile(article.path, updated, "utf8");
        mdWrites++;
      }
    } else {
      const after = replaceSeedDate(updatedDataTs, article.slug, newDateStr);
      if (after !== updatedDataTs) {
        updatedDataTs = after;
        seedWrites++;
      }
    }
  }

  if (updatedDataTs !== dataTs) {
    await fs.writeFile(DATA_PATH, updatedDataTs, "utf8");
  }
  console.log(`[dates] terminé — ${mdWrites} .md mis à jour, ${seedWrites} seeds mis à jour`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
