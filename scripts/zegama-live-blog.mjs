#!/usr/bin/env node
/**
 * Script live blog Zegama-Aizkorri 2026.
 *
 * Deux modes :
 *  --create  (a lancer samedi soir, J-1) : cree l'article isLive:true initial
 *            avec sections preremplies (programme, mise en jambes, plan de course).
 *  --update  (a lancer toutes les heures dimanche) : tire les news Tavily sur
 *            Zegama du jour, demande a Claude de produire une mise a jour
 *            chronologique, l'injecte dans la section "## Mises a jour live"
 *            de l'article existant.
 *
 * Variables d env : ANTHROPIC_API_KEY, TAVILY_API_KEY.
 */
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const LIVE_SLUG = "zegama-aizkorri-2026-en-direct-suivez-la-25e-edition-minute-par-minute";
const ARTICLE_PATH = path.resolve(`content/articles/${LIVE_SLUG}.md`);
const TAVILY_API = "https://api.tavily.com/search";

function nowParisIso() {
  // Approximation : ISO en UTC, le frontmatter publishedAt est UTC partout.
  return new Date().toISOString();
}

function nowParisLabel() {
  // ex : "17 mai 2026 - 10h32"
  const d = new Date();
  const opts = { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" };
  const time = d.toLocaleTimeString("fr-FR", opts).replace(":", "h");
  const date = d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });
  return `${date} - ${time}`;
}

const INITIAL_FRONTMATTER = `---
slug: "${LIVE_SLUG}"
title: "Zegama-Aizkorri 2026 en direct : suivez la 25e edition minute par minute"
excerpt: "Suivez en direct sur Altitude Trail la marathon mythique du Pays basque, qui celebre ses 25 ans ce dimanche 17 mai. Kilian Jornet vise une 12e victoire, Sara Alonso defend son titre cote femmes. Mises a jour en continu de l'echauffement au franchissement de la ligne d'arrivee."
category: "Courses & Récits"
categorySlug: courses-recits
author: "Rédaction Altitude"
date: "17 mai 2026"
publishedAt: "REPLACE_WITH_PUBLISHED_AT_ISO"
updatedAt: "17 mai 2026"
readTime: "12 min"
image: "/logo-square.png"
tags:
  - Zegama
  - Kilian Jornet
  - Sara Alonso
  - Golden Trail World Series
  - Live
isLive: true
hotEventSlug: "zegama-aizkorri-2026"
externalRefs:
  - { url: "https://www.zegama-aizkorri.com/en/", label: "Zegama-Aizkorri – Site officiel" }
  - { url: "https://goldentrailseries.com/", label: "Golden Trail World Series – Retransmission YouTube" }
  - { url: "https://www.irunfar.com/2026-zegama-aizkorri-marathon-preview", label: "iRunFar – 2026 Zegama-Aizkorri Marathon Preview" }
---
`;

const INITIAL_BODY = `
> **En direct.** Cette page est mise a jour automatiquement toutes les heures pendant la course de dimanche. Derniere mise a jour : *PLACEHOLDER_LAST_UPDATE*.

## Le programme du dimanche

- **9h00 (heure de Madrid, 9h00 Paris CEST)** : depart de la marathon (42 km / 2 736 m+) sur la place principale de Zegama
- **~10h30** : passage du premier sommet, **Aratz** (1 444 m), apres ~10 km de montee
- **~11h00** : sommet de **Aizkorri** (1 528 m), tunnel humain attendu
- **~11h45** : sommet de **Aitxuri** (1 551 m), point culminant du tracé
- **~12h15** : crete vers **Andraitz** (1 412 m), fin des hauteurs
- **~13h00** : descente technique des douze derniers kilometres
- **~13h40** : premieres arrivees attendues (vainqueur masculin)
- **~14h30** : premieres arrivees feminines attendues

Horaires approximatifs bases sur les chronos de l'edition 2025. Diffusion en direct gratuite sur la chaine YouTube de la [Golden Trail World Series](https://goldentrailseries.com/).

## Les favoris du jour

**Hommes** : Kilian Jornet (Espagne, 11 victoires precedentes, RP 3h36'40), Elhousine Elazzaoui (Maroc, vainqueur 2025), Stian Angermund (Norvege, 2 victoires precedentes), Daniel Pattis (Italie).

**Femmes** : Sara Alonso (Espagne, vainqueure 2025 en 4h27'25), Tove Alexandersson (Suede, 10 fois championne du monde orientation), Judith Wyder (Suisse), Malen Osa (Espagne).

## Mises a jour live

*Les mises a jour apparaissent ci-dessous au fur et a mesure de la course. Section actualisee automatiquement.*

<!-- LIVE_UPDATES_START -->
*En attente du depart...*
<!-- LIVE_UPDATES_END -->

## Comment regarder la course en direct

Retransmission gratuite via la **[Golden Trail World Series](https://goldentrailseries.com/)** sur YouTube, depart prevu peu avant 9 heures (heure de Madrid, 9h CEST en France metropolitaine).

Les chronos intermediaires aux sommets sont publies en quasi-temps reel par Rock The Sport, partenaire chronométreur officiel. Les comptes Twitter et Instagram de @zegama_aizkorri et @gtwserie alimentent egalement les positions en course.

## Le contexte de cette 25e edition

Pour ses 25 ans pile, le Zegama-Aizkorri Mendi Maratoia accueille a nouveau celui qui en est devenu le visage. **Kilian Jornet**, vainqueur 11 fois entre 2007 et 2024, vise une 12e victoire qui consacrerait un palmares deja unique dans le sky-running mondial. En face : **Elhousine Elazzaoui**, vainqueur en titre, et un plateau elite resserre.

Cote femmes, la Basque **Sara Alonso** defend son titre 2025 face notamment a la Suedoise **Tove Alexandersson**, championne d'orientation reconvertie au trail.

L'epreuve marque l'**ouverture de la Golden Trail World Series 2026**, premiere des six manches du circuit annuel qui se conclura sur l'ile de La Reunion a l'automne.
`;

async function createLiveBlog() {
  if (await fileExists(ARTICLE_PATH)) {
    console.log(`[zegama-live] L'article ${LIVE_SLUG} existe deja, abandon de la creation initiale.`);
    return;
  }
  const publishedAtIso = nowParisIso();
  const frontmatter = INITIAL_FRONTMATTER.replace("REPLACE_WITH_PUBLISHED_AT_ISO", publishedAtIso);
  const body = INITIAL_BODY.replace("PLACEHOLDER_LAST_UPDATE", nowParisLabel());
  await fs.writeFile(ARTICLE_PATH, frontmatter + body, "utf8");
  console.log(`[zegama-live] Article live cree : ${ARTICLE_PATH}`);
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
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
      max_results: 8,
      include_answer: false,
      include_raw_content: false,
      include_domains: [
        "irunfar.com", "zegama-aizkorri.com", "goldentrailseries.com",
        "trailrunningspain.com", "carreraspormontana.com", "runningmagazine.ca",
        "elcorreo.com", "elpais.com", "lavanguardia.com",
      ],
    }),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}`);
  const j = await res.json();
  return j.results || [];
}

async function generateLiveUpdate(sources) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
  const client = new Anthropic({ apiKey });
  const sourcesBlock = sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${(s.content || "").slice(0, 800)}`).join("\n\n");
  const prompt = `Tu es journaliste trail couvrant en direct le Zegama-Aizkorri Mendi Maratoia 2026, dimanche 17 mai. Ecris UN paragraphe court (60-120 mots) de "live update" en francais sur les dernieres informations disponibles. Tonalite : factuelle, journalistique, energique sans hyperbole. Ne JAMAIS inventer de classement, chrono ou nom non present dans les sources ci-dessous. Si les sources ne contiennent rien de nouveau ou de specifique au jour J, ecris simplement un point d'attente ou un rappel chronologique.

Sources Tavily recentes :
${sourcesBlock}

Format de sortie : juste le paragraphe, sans prefixe ni emoji.`;

  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });
  return resp.content[0].text.trim();
}

async function updateLiveBlog() {
  if (!await fileExists(ARTICLE_PATH)) {
    console.log("[zegama-live] Article live introuvable, fallback : creation initiale.");
    await createLiveBlog();
    return;
  }
  const sources = await tavilySearch("Zegama Aizkorri 2026 marathon live results today");
  if (sources.length === 0) {
    console.log("[zegama-live] Aucune source Tavily, skip update.");
    return;
  }
  const update = await generateLiveUpdate(sources);
  if (!update || update.length < 40) {
    console.log("[zegama-live] Update genere trop court, skip.");
    return;
  }
  const label = nowParisLabel();
  const block = `\n**${label}** — ${update}\n`;

  let content = await fs.readFile(ARTICLE_PATH, "utf8");
  const startMarker = "<!-- LIVE_UPDATES_START -->";
  const endMarker = "<!-- LIVE_UPDATES_END -->";
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    console.error("[zegama-live] Markers LIVE_UPDATES introuvables, abandon.");
    return;
  }

  // Inserer le nouveau bloc juste avant le marker de fin (les updates s'empilent
  // chronologiquement de haut en bas).
  const before = content.slice(0, endIdx);
  const after = content.slice(endIdx);
  // Si la section est encore "En attente du depart...", on la remplace.
  const cleanedBefore = before.replace(/\*En attente du depart\.\.\.\*\s*\n/, "");
  content = cleanedBefore + block + "\n" + after;

  // Bump updatedAt frontmatter + remplacer le "Derniere mise a jour".
  content = content.replace(/^updatedAt:\s*".*"$/m, `updatedAt: "${nowParisLabel().split(" - ")[0]}"`);
  content = content.replace(/Derniere mise a jour\s*:\s*\*[^*]+\*/, `Derniere mise a jour : *${label}*`);

  await fs.writeFile(ARTICLE_PATH, content, "utf8");
  console.log(`[zegama-live] Update ajoute @ ${label}`);
}

async function main() {
  const mode = process.argv.find((a) => a === "--create") ? "create" : process.argv.find((a) => a === "--update") ? "update" : null;
  if (!mode) {
    console.error("Usage : node scripts/zegama-live-blog.mjs (--create | --update)");
    process.exit(1);
  }
  if (mode === "create") await createLiveBlog();
  else await updateLiveBlog();
}

main().catch((e) => { console.error(e); process.exit(1); });
