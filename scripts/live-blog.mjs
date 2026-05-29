#!/usr/bin/env node
/**
 * Script de live blog GENERIQUE pour tous les events HOT_EVENTS.
 * Remplace zegama-live-blog.mjs (hard-code Zegama).
 *
 * Modes :
 *  --create  : detecte l'event actif (J-1 a J+0), cree un article isLive si
 *              pas deja existant. Idempotent.
 *  --update  : detecte l'event actif (J-0 a J+1), met a jour le live blog
 *              avec les dernieres news Tavily synthese Claude.
 *  --close   : detecte les events J+2 ou plus, marque les articles isLive
 *              correspondants comme non-live (passage en mode "recap fige").
 *
 * Variables d'env requises : ANTHROPIC_API_KEY, TAVILY_API_KEY.
 *
 * Detection event = via scripts/lib/hot-events-calendar.mjs :
 *  - getActiveOrUpcomingEvent(window) : retourne l'event dans la fenetre [J-X, J+Y]
 */
import fs from "node:fs/promises";
import { trackCost, summarize } from "./lib/anthropic-cost-tracker.mjs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { HOT_EVENTS } from "./lib/hot-events-calendar.mjs";

const TAVILY_API = "https://api.tavily.com/search";
const CONTENT_DIR = path.resolve("content/articles");

// Fenetres en heures par rapport au depart de l'event
const CREATE_WINDOW = { before: 60, after: 0 };  // J-2.5j a J+0h : couvre les events courts (samedi) declares jeudi  // article live cree de J-30h a J+0h
const UPDATE_WINDOW = { before: 4, after: 24 };  // updates de J-4h a J+24h
const CLOSE_WINDOW = { before: -48, after: 9999 }; // close apres J+48h

function nowParisLabel(d = new Date()) {
  const opts = { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" };
  const time = d.toLocaleTimeString("fr-FR", opts).replace(":", "h");
  const date = d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });
  return `${date} - ${time}`;
}

/**
 * Calcule l'heure UTC effective de depart d'un event.
 * Utilise event.startTimeUtc si fourni (format "HH:MM:SS"), sinon 08:00:00Z par defaut.
 * Permet par exemple MaxiRace 5h Paris (3h UTC), MUT 7h SAST (5h UTC), UTMB 17h45.
 */
function eventStartMs(event) {
  const time = event.startTimeUtc || "08:00:00";
  return new Date(event.start + "T" + time + "Z").getTime();
}

/**
 * Detecte TOUS les events actifs dans une fenetre [J-before, J+after] en heures.
 * Refactor 2026-05-28 : avant retournait 1 seul event (1er dans HOT_EVENTS),
 * ce qui causait des oublis en cas de collision (ex MUT + MaxiRace meme weekend).
 * Maintenant retourne array. Vide si aucun match.
 */
function detectAllActiveEvents(window, now = new Date()) {
  const nowMs = now.getTime();
  const matches = [];
  for (const event of HOT_EVENTS) {
    const startMs = eventStartMs(event);
    const diffHours = (nowMs - startMs) / (1000 * 60 * 60);
    if (diffHours >= -window.before && diffHours <= window.after) {
      matches.push({ event, diffHours });
    }
  }
  return matches;
}

/**
 * Compat backward : retourne le 1er event actif (proche de J-0 en priorite).
 */
function detectActiveEvent(window, now = new Date()) {
  const matches = detectAllActiveEvents(window, now);
  if (matches.length === 0) return null;
  // Trier par proximite a J-0 (diffHours absolu croissant)
  matches.sort((a, b) => Math.abs(a.diffHours) - Math.abs(b.diffHours));
  return matches[0];
}

function liveSlugFor(event) {
  return `${event.slug}-en-direct-suivez-l-edition-minute-par-minute`;
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function buildInitialArticle(event) {
  const publishedAtIso = new Date().toISOString();
  const slug = liveSlugFor(event);
  const frontmatter = `---
slug: "${slug}"
title: "${event.name} en direct : suivez l'edition minute par minute"
excerpt: "Suivez en direct sur Altitude Trail la course mythique ${event.name}. Mises a jour automatiques en continu pendant la course."
category: "Courses & Récits"
categorySlug: courses-recits
author: "Marc Blanc"
date: "${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}"
publishedAt: "${publishedAtIso}"
updatedAt: "${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}"
readTime: "12 min"
image: "/logo-square.png"
tags:
  - ${event.name}
  - Live
  - Trail
isLive: true
hotEventSlug: "${event.slug}"
externalRefs:${(event.refs || []).map((r) => `
  - { url: "${r.url}", label: "${r.label}" }`).join("")}
---

> **En direct.** Cette page est mise a jour automatiquement toutes les heures pendant la course. Derniere mise a jour : *${nowParisLabel()}*.

## Le contexte de la course

${event.name} se court a ${event.location}. ${event.distance ? "Distance : " + event.distance + ". " : ""}${event.elevation ? "Denivele : " + event.elevation + ". " : ""}Date officielle : ${new Date(event.start + "T08:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.

## Mises a jour live

*Les mises a jour apparaissent ci-dessous au fur et a mesure de la course. Section actualisee automatiquement.*

<!-- LIVE_UPDATES_START -->
*En attente du depart...*
<!-- LIVE_UPDATES_END -->

## Comment regarder la course en direct

Retransmission via les diffuseurs officiels de l'epreuve. Couverture francophone par Altitude Trail tout au long de la course.
`;
  return { slug, frontmatter };
}

async function createMode() {
  const detected = detectActiveEvent(CREATE_WINDOW);
  if (!detected) {
    console.log("[live-blog] Aucun event dans la fenetre de creation (J-30h a J+0h)");
    return 0;
  }
  const { event } = detected;
  const slug = liveSlugFor(event);
  const articlePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (await fileExists(articlePath)) {
    console.log(`[live-blog] Article ${slug} existe deja, skip create`);
    return 0;
  }
  const { frontmatter } = buildInitialArticle(event);
  await fs.writeFile(articlePath, frontmatter, "utf8");
  console.log(`[live-blog] Article live cree : ${articlePath}`);
  return 1;
}

async function tavilySearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY manquante");
  const res = await fetch(TAVILY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 10,
      include_answer: false,
      days: 1, // freshness : derniere journee uniquement
      include_domains: [
        "irunfar.com", "goldentrailseries.com", "trailrunningspain.com",
        "carreraspormontana.com", "runningmagazine.ca", "wser.org",
        "hardrock100.com", "grandraid-reunion.com", "utmbmontblanc.com",
        "lavaredoultratrail.it", "transvulcania.es",
      ],
    }),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}`);
  const j = await res.json();
  return j.results || [];
}

async function generateLiveUpdate(event, sources) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
  const client = new Anthropic({ apiKey });
  const sourcesBlock = sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${(s.content || "").slice(0, 1000)}`).join("\n\n");
  const prompt = `Tu es journaliste trail couvrant en direct ${event.name} (course a ${event.location}). Ecris UN paragraphe court (60-150 mots) de "live update" en francais sur les dernieres informations disponibles.

Tonalite : factuelle, journalistique, energique sans hyperbole. Ne JAMAIS inventer de classement, chrono ou nom non present dans les sources ci-dessous. Si les sources ne contiennent rien de nouveau ou de specifique au jour J, ecris un point d'attente ou un rappel chronologique factuel.

Sources Tavily recentes :
${sourcesBlock}

Format de sortie : juste le paragraphe, sans prefixe ni emoji.`;

  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });
  trackCost(MODEL, resp.usage || {});
  return resp.content[0].text.trim();
}

async function updateMode() {
  // Multi-events : on update TOUS les events actifs dans la fenetre.
  // Refactor 2026-05-28 : avant ne traitait que le 1er, on a perdu des
  // updates sur MUT vendredi quand MaxiRace est aussi devenue active.
  const matches = detectAllActiveEvents(UPDATE_WINDOW);
  if (matches.length === 0) {
    console.log("[live-blog] Aucun event dans la fenetre d'update (J-4h a J+24h)");
    return 0;
  }
  console.log(`[live-blog] ${matches.length} event(s) actif(s) en update : ${matches.map((m) => m.event.slug).join(", ")}`);
  let totalUpdates = 0;
  for (const { event } of matches) {
    const slug = liveSlugFor(event);
    const articlePath = path.join(CONTENT_DIR, `${slug}.md`);
    if (!await fileExists(articlePath)) {
      console.log(`[live-blog] [${event.slug}] Article live introuvable, skip (creation J-30h aurait du le faire)`);
      continue;
    }
    try {
      const query = `${event.name} ${new Date().getFullYear()} live results positions race report`;
      const sources = await tavilySearch(query);
      if (sources.length === 0) {
        console.log(`[live-blog] [${event.slug}] Aucune source Tavily, skip update`);
        continue;
      }
      const update = await generateLiveUpdate(event, sources);
      if (!update || update.length < 40) {
        console.log(`[live-blog] [${event.slug}] Update genere trop court, skip`);
        continue;
      }
      const label = nowParisLabel();
      const block = `\n**${label}** \u2014 ${update}\n`;
      let content = await fs.readFile(articlePath, "utf8");
      const startMarker = "<!-- LIVE_UPDATES_START -->";
      const endMarker = "<!-- LIVE_UPDATES_END -->";
      const endIdx = content.indexOf(endMarker);
      if (endIdx === -1) {
        console.error(`[live-blog] [${event.slug}] Marker LIVE_UPDATES_END introuvable, skip`);
        continue;
      }
      const cleanedContent = content.replace(/\*En attente du depart\.\.\.\*\s*\n/, "");
      const before = cleanedContent.slice(0, cleanedContent.indexOf(endMarker));
      const after = cleanedContent.slice(cleanedContent.indexOf(endMarker));
      content = before + block + "\n" + after;
      const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      content = content.replace(/^updatedAt:\s*".*"$/m, `updatedAt: "${dateStr}"`);
      content = content.replace(/Derniere mise a jour\s*:\s*\*[^*]+\*/, `Derniere mise a jour : *${label}*`);
      await fs.writeFile(articlePath, content, "utf8");
      console.log(`[live-blog] [${event.slug}] Update ajoute @ ${label}`);
      totalUpdates++;
    } catch (err) {
      console.error(`[live-blog] [${event.slug}] Erreur update : ${err.message}`);
    }
  }
  return totalUpdates;
}


async function closeMode() {
  // Pour chaque event J+2 ou plus, on cherche un article isLive et on retire le flag
  const closeWindow = { before: -48, after: 9999 };
  const now = new Date();
  for (const event of HOT_EVENTS) {
    const startMs = new Date(event.start + "T08:00:00Z").getTime();
    const diffHours = (now.getTime() - startMs) / (1000 * 60 * 60);
    if (diffHours > 48 && diffHours < 24 * 30) { // entre J+2 et J+30
      const slug = liveSlugFor(event);
      const articlePath = path.join(CONTENT_DIR, `${slug}.md`);
      if (await fileExists(articlePath)) {
        const content = await fs.readFile(articlePath, "utf8");
        if (content.includes("isLive: true")) {
          const updated = content.replace(/^isLive:\s*true$/m, "isLive: false");
          await fs.writeFile(articlePath, updated, "utf8");
          console.log(`[live-blog] Article ${slug} ferme (passe isLive=false)`);
        }
      }
    }
  }
  return 0;
}

async function main() {
  const mode = process.argv.find((a) => a === "--create") ? "create"
            : process.argv.find((a) => a === "--update") ? "update"
            : process.argv.find((a) => a === "--close") ? "close"
            : null;
  if (!mode) {
    console.error("Usage : node scripts/live-blog.mjs (--create | --update | --close)");
    process.exit(1);
  }
  if (mode === "create") return createMode();
  if (mode === "update") return updateMode();
  if (mode === "close") return closeMode();
}

main().catch((e) => { console.error(e); process.exit(1); });
