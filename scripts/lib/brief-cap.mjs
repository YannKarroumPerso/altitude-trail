// Cap éditorial quotidien dédié aux brèves d'actualité (articleType: "brief").
//
// Séparé de daily-cap.mjs pour éviter la cannibalisation avec la veille
// éditoriale de fond (RSS + Tavily). Les brèves tournent sur leur propre
// pipeline et ont leur propre budget quotidien :
//   - 3 brèves/jour en régime normal
//   - 5 brèves/jour pendant une fenêtre d'événement chaud (cohérent avec
//     l'intérêt accru pour l'équipement et les athlètes pendant UTMB, WSER, etc.)
//
// Le risque "content farm" est volontairement mitigé : en cumulé avec le cap
// standard (5-10), on plafonne à 8-15 articles/jour TOTAL sur le site, ce qui
// reste acceptable pour Google (cadence média pro, pas agrégateur).

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { isInHotEventWindow } from "./hot-events-calendar.mjs";

const CONTENT_DIR = path.resolve("content/articles");

const BRIEF_CAP_NORMAL = 3;
const BRIEF_CAP_HOT = 5;

export function getBriefDailyCap() {
  if (process.env.BRIEF_DAILY_CAP) {
    return parseInt(process.env.BRIEF_DAILY_CAP, 10);
  }
  return isInHotEventWindow() ? BRIEF_CAP_HOT : BRIEF_CAP_NORMAL;
}

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

// Compte uniquement les brèves publiées aujourd'hui (articleType === "brief").
export async function countTodayBriefs() {
  const today = todayParis();
  const files = await fs.readdir(CONTENT_DIR).catch(() => []);
  let count = 0;
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    try {
      const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
      const { data } = matter(raw);
      if (data.articleType !== "brief") continue;
      const parsed = parseFrDate(data.date);
      if (parsed && sameDay(parsed, today)) count++;
    } catch {
      // skip
    }
  }
  return count;
}

export async function remainingBriefBudget() {
  const count = await countTodayBriefs();
  const cap = getBriefDailyCap();
  return Math.max(0, cap - count);
}

// Helper : log + retourne le cap effectif pour un run de brief-publish.
// pipelineDefault = combien de brèves ce run est autorisé à produire en
// temps normal (1-2). Retourne 0 si plus de budget.
export async function effectiveBriefCapForRun(pipelineName, pipelineDefault = 2) {
  const cap = getBriefDailyCap();
  const count = await countTodayBriefs();
  const remaining = Math.max(0, cap - count);
  const hot = isInHotEventWindow();
  const boostedDefault = hot ? Math.max(pipelineDefault, pipelineDefault + 1) : pipelineDefault;
  const effective = Math.min(boostedDefault, remaining);
  const mode = hot ? `HOT (${hot.event.name})` : "normal";
  console.log(
    `[${pipelineName}] mode=${mode} · budget brèves quotidien : ${count}/${cap} déjà publiées, ` +
      `restant ${remaining}. Ce run peut publier jusqu'à ${effective} brève(s).`
  );
  return effective;
}
