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
import { getDynamicDailyCap, isInHotEventWindow } from "./hot-events-calendar.mjs";

const CONTENT_DIR = path.resolve("content/articles");

// Cap quotidien : 5 articles/jour en régime normal, 10 pendant une fenêtre
// chaude (UTMB, Western States, etc.). Le DAILY_CAP ENV écrase tout si
// positionné à la main pour tests.
export function getDailyCap() {
  if (process.env.DAILY_CAP) return parseInt(process.env.DAILY_CAP, 10);
  return getDynamicDailyCap();
}
// Compat : export constant toujours exposé pour les imports historiques.
export const DAILY_CAP = getDailyCap();

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
// Les brèves (articleType: "brief") ont leur propre cap séparé dans
// brief-cap.mjs et sont EXCLUES de ce comptage pour éviter que les deux
// pipelines se cannibalisent mutuellement.
export async function countTodayArticles() {
  const today = todayParis();
  const files = await fs.readdir(CONTENT_DIR).catch(() => []);
  let count = 0;
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    try {
      const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
      const { data } = matter(raw);
      if (data.articleType === "brief") continue; // exclu du cap standard
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
  const cap = getDailyCap();
  return Math.max(0, cap - count);
}

// Helper pratique : log + retourne le cap effectif pour un pipeline.
// En mode "hot event", le pipelineDefault par run est aussi boosté (2 -> 3).
export async function effectiveCapForRun(pipelineName, pipelineDefault = 2) {
  const cap = getDailyCap();
  const count = await countTodayArticles();
  const remaining = Math.max(0, cap - count);

  const hotEvent = isInHotEventWindow();
  const boostedDefault = hotEvent ? Math.max(pipelineDefault, pipelineDefault + 1) : pipelineDefault;
  const effective = Math.min(boostedDefault, remaining);

  const mode = hotEvent ? `HOT (${hotEvent.event.name})` : "normal";
  console.log(
    `[${pipelineName}] mode=${mode} · budget quotidien : ${count}/${cap} déjà publiés, ` +
      `restant ${remaining}. Ce run peut publier jusqu'à ${effective} article(s).`
  );
  return effective;
}
