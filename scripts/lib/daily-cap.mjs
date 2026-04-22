// Cap éditorial quotidien partagé entre les pipelines de veille (RSS + Tavily).
//
// Garantit qu'au maximum DAILY_CAP articles sont publiés par jour calendaire
// (timezone Europe/Paris). Chaque pipeline appelle remainingDailyBudget()
// avant son run et adapte son MAX_ARTICLES à min(limite_pipeline, budget).
//
// Compte les articles déjà publiés du jour en lisant le champ `date` de la
// frontmatter des .md dans content/articles/ et en le comparant au jour
// Europe/Paris actuel.

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("content/articles");
export const DAILY_CAP = parseInt(process.env.DAILY_CAP || "5", 10);

const FR_MONTHS = {
  janvier: 0, "février": 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, "août": 7, aout: 7, septembre: 8, octobre: 9, novembre: 10,
  "décembre": 11, decembre: 11,
};

function parseFrDate(str) {
  if (!str) return null;
  const m = String(str).match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
  if (!m) return null;
  const month = FR_MONTHS[m[2].toLowerCase()];
  if (month == null) return null;
  return { year: parseInt(m[3], 10), month, day: parseInt(m[1], 10) };
}

// Jour courant à Paris, format {year, month, day} (month 0-indexé).
function todayParis() {
  const paris = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(paris.find((p) => p.type === "year").value);
  const m = Number(paris.find((p) => p.type === "month").value) - 1;
  const d = Number(paris.find((p) => p.type === "day").value);
  return { year: y, month: m, day: d };
}

function sameDay(a, b) {
  return a && b && a.year === b.year && a.month === b.month && a.day === b.day;
}

// Compte les articles publiés aujourd'hui en parcourant les .md.
export async function countTodayArticles() {
  const today = todayParis();
  const files = await fs.readdir(CONTENT_DIR).catch(() => []);
  let count = 0;
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    try {
      const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
      const { data } = matter(raw);
      const parsed = parseFrDate(data.date);
      if (parsed && sameDay(parsed, today)) count++;
    } catch {
      // skip
    }
  }
  return count;
}

// Budget restant pour ce pipeline. Retourne un entier >= 0.
export async function remainingDailyBudget() {
  const count = await countTodayArticles();
  return Math.max(0, DAILY_CAP - count);
}

// Helper pratique : log + retourne le cap effectif pour un pipeline.
export async function effectiveCapForRun(pipelineName, pipelineDefault = 2) {
  const remaining = await remainingDailyBudget();
  const effective = Math.min(pipelineDefault, remaining);
  const count = DAILY_CAP - remaining;
  console.log(
    `[${pipelineName}] budget quotidien : ${count}/${DAILY_CAP} déjà publiés, ` +
    `restant ${remaining}. Ce run peut publier jusqu'à ${effective} article(s).`
  );
  return effective;
}
