#!/usr/bin/env node
// Veille thématique trail via Tavily API + Claude.
//
// Différence avec scripts/veille.mjs (flux RSS) :
//   - veille.mjs : 13 flux RSS fixes → 1 article = reformulation d'UNE source
//   - veille-tavily.mjs : requêtes thématiques → 1 article = synthèse de 5-8
//     sources récentes différentes, reformulées et recoupées par Claude
//
// Usage :
//   npm run veille-tavily           # toutes les queries thématiques
//   npm run veille-tavily -- --query="hardrock 100 results 2026"
//
// Env requis : TAVILY_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY (images).

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

import { EDITORIAL_STYLE } from "./lib/editorial-style.mjs";
import { pickAuthorForCategory } from "./lib/authors.mjs";
import { tavilySearch, TAVILY_EXCLUDE_DOMAINS, rerankByPriority, isBlacklistedSource } from "./lib/tavily-search.mjs";
import {
  loadExistingArticles,
  findTopRelated,
  insertInternalLinks,
} from "./lib/internal-linking.mjs";
import { findYouTubeVideoForArticle } from "./lib/youtube-search.mjs";
import {
  authorityDomainsListForPrompt,
  isAllowedHost,
  urlIsAlive,
} from "./lib/authority-domains.mjs";
import { effectiveCapForRun } from "./lib/daily-cap.mjs";
import { HOT_EVENTS, isInHotEventWindow, getEventSpecificQueries } from "./lib/hot-events-calendar.mjs";
import { pickFrenchSubjectQueries } from "./lib/french-trail-names.mjs";
import { generateImage, saveImage } from "./lib/image-generation.mjs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80";

const CONTENT_DIR = path.resolve("content/articles");
const PUBLIC_IMAGES_DIR = path.resolve("public/articles");

// ─────────────────────────────────────────────────────────────────────────────
// Banque de 20 requêtes thématiques trail, sans recoupement avec les flux RSS.
// Chaque run pioche 2 queries distinctes de façon déterministe selon la date
// et l'heure du run, pour éviter les doublons entre runs rapprochés.
// ─────────────────────────────────────────────────────────────────────────────

const SCIENCE_DOMAINS = [
  "irunfar.com", "trailrunnermag.com", "ultrarunning.com",
  "pubmed.ncbi.nlm.nih.gov", "pmc.ncbi.nlm.nih.gov", "bjsm.bmj.com",
  "lepape-info.com", "runnersworld.com", "trail-session.fr",
  "runningmagazine.ca", "marathonhandbook.com",
];

const RACES_DOMAINS = [
  // Presse trail internationale anglophone
  "irunfar.com", "trailrunnermag.com", "ultrarunning.com",
  "runnersworld.com", "runningmagazine.ca",
  // Presse trail francophone
  "lepape-info.com", "trail-session.fr",
  "wider-mag.com", "esprit-trail.com", "outdoor-running.com",
  "runningmag.fr", "journaldutrail.com",
  // Presse generaliste FR avec couverture trail
  "lequipe.fr", "laprovence.com", "sudouest.fr",
  "ledauphine.com", "nicematin.com",
  // Organisations et sites d evenements
  "utmbmontblanc.com", "utmb.world", "wser.org", "hardrock100.com",
  "tordesgeants.it", "skyrunning.com",
];

const GEAR_DOMAINS = [
  "irunfar.com", "trailrunnermag.com", "ultrarunning.com",
  "runnersworld.com", "runningmagazine.ca", "runrepeat.com",
  "lepape-info.com", "trail-session.fr", ];

const PORTRAITS_DOMAINS = [
  "irunfar.com", "trailrunnermag.com", "ultrarunning.com",
  "lepape-info.com", "trail-session.fr",
  "runnersworld.com", "runningmagazine.ca",
];

const QUERY_POOL = [
  // === VERTICALE SCIENCE & PERFORMANCE (8) - notre signature differenciante ===
  // Ligne editoriale : poser des questions sourcees peer-reviewed, pas des verites.
  // Tous les articles de cette categorie DOIVENT citer au moins une etude/meta-analyse.
  {
    query: '"ultramarathon" OR "ultrarunning" polarized training meta-analysis Seiler study',
    categorySlug: "science-performance",
    angle: "Decryptage scientifique : l'entrainement polarise est-il vraiment optimal pour l'ultra ? Croiser meta-analyses recentes, citer Seiler/Stoggl, nuancer le consensus. Poser la question dans le titre, ne pas y repondre fermement.",
    include_domains: SCIENCE_DOMAINS,
  },
  {
    query: '"trail running" injury prevention research rehabilitation study',
    categorySlug: "science-performance",
    angle: "Recherche sourcee sur la prevention des blessures en trail : tendinopathies, fractures de stress, surcharge. Citer au moins une etude peer-reviewed (BJSM, JOSPT, AJSM). Poser une question concrete au lecteur, ne pas asserter.",
    include_domains: SCIENCE_DOMAINS,
  },
  {
    query: '"ultra" carbohydrate intake 90g per hour gut training Maurten study performance',
    categorySlug: "science-performance",
    angle: "Question : 90 g/h de glucides est-il vraiment optimal, ou consensus de marketing Maurten ? Citer les etudes peer-reviewed (Jeukendrup, Costa), nuancer, laisser le lecteur conclure. Sujet hyper viral cible.",
    include_domains: SCIENCE_DOMAINS,
  },
  {
    query: '"mountain running" OR "skyrunning" altitude hypoxia physiology acclimatization research',
    categorySlug: "science-performance",
    angle: "Science de l'altitude pour coureur de montagne : hypoxie, acclimatation, oedeme. Citer au moins une etude peer-reviewed ou recommandation ACSM. Format question : 'Quel protocole d'acclimatation pour le X ?'",
    include_domains: SCIENCE_DOMAINS,
  },
  {
    query: '"ultrarunning" sleep deprivation recovery cortisol adaptation study',
    categorySlug: "science-performance",
    angle: "Question : peut-on vraiment 'rattraper' une nuit blanche sur un 100 miles ? Citer les etudes sur la dette de sommeil et la performance ultra. Provoc legere : confronter les mythes du milieu.",
    include_domains: SCIENCE_DOMAINS,
  },
  {
    query: '"trail running" lactate threshold ventilatory threshold VO2 max research',
    categorySlug: "science-performance",
    angle: "Decryptage : seuil lactique vs seuil ventilatoire, lequel est vraiment utile pour le coureur de trail ? Citer les etudes peer-reviewed sur les correlations performance/seuils en off-road.",
    include_domains: SCIENCE_DOMAINS,
  },
  {
    query: '"ultramarathon" women female specific physiology training research',
    categorySlug: "science-performance",
    angle: "Question : la physiologie feminine en ultra change-t-elle vraiment les protocoles d'entrainement ? Croiser les etudes recentes (Stacy Sims, Kelly McNulty), poser les implications pratiques sans donner de reponse absolue.",
    include_domains: SCIENCE_DOMAINS,
  },
  {
    query: '"mountain running" downhill eccentric muscle damage research recovery',
    categorySlug: "science-performance",
    angle: "Science de la descente en montagne : pourquoi les muscles excentriques cassent, et comment vraiment les preparer ? Citer les etudes peer-reviewed (Eston, Hyldahl).",
    include_domains: SCIENCE_DOMAINS,
  },

  // Grandes courses internationales (6)
  {
    query: '"UTMB" OR "CCC" OR "TDS" Chamonix ultramarathon results analysis 2026',
    categorySlug: "courses-recits",
    angle: "Actualité du massif du Mont-Blanc : UTMB, CCC, TDS, OCC, MCC, PTL — résultats, analyses, athlètes.",
    include_domains: RACES_DOMAINS,
  },
  {
    query: '"Western States 100" OR "WS100" ultramarathon training results preview strategy',
    categorySlug: "courses-recits",
    angle: "Western States 100 : préparation, stratégie, analyses des favoris, résultats.",
    include_domains: RACES_DOMAINS,
  },
  {
    query: '"Hardrock 100" Silverton Colorado mountain ultramarathon results finishers',
    categorySlug: "courses-recits",
    angle: "Hardrock 100 : lottery, finishers, exploits, spécificités du tracé altitude Colorado.",
    include_domains: RACES_DOMAINS,
  },
  {
    query: '"Tor des Geants" Aosta Italy 330 km ultramarathon results',
    categorySlug: "courses-recits",
    angle: "Tor des Géants : 330 km dans le Val d'Aoste, format sans sommeil obligatoire, analyses des performances.",
    include_domains: RACES_DOMAINS,
  },
  {
    query: '"Zegama Marathon" OR "Skyrunning" World Championships results mountain race',
    categorySlug: "courses-recits",
    angle: "Circuit Skyrunning international : World Championships, Zegama, formats courts en montagne verticale.",
    include_domains: RACES_DOMAINS,
  },
  {
    query: '"Diagonale des Fous" OR "Grand Raid Réunion" ultra trail results',
    categorySlug: "courses-recits",
    angle: "Diagonale des Fous à La Réunion : volcan, chaleur, 165 km, analyses des éditions récentes.",
    include_domains: RACES_DOMAINS,
  },

  // Équipement & innovation (4)
  {
    query: '"trail running shoes" 2026 review test Hoka Salomon La Sportiva',
    categorySlug: "actualites",
    angle: "Chaussures trail 2026 : nouveaux modèles, tests comparatifs, tendances des équipementiers spécialisés.",
    include_domains: GEAR_DOMAINS,
  },
  {
    query: '"carbon plate" trail running shoes performance technology',
    categorySlug: "actualites",
    angle: "Plaques carbone en trail : performances, limites, réglementation ITRA, modèles emblématiques.",
    include_domains: GEAR_DOMAINS,
  },
  {
    query: '"trail running vest" OR "hydration pack" ultra race review',
    categorySlug: "actualites",
    angle: "Sacs d'hydratation et gilets trail : comparatifs, ergonomie, innovations 2026.",
    include_domains: GEAR_DOMAINS,
  },
  {
    query: '"GPS watch" trail running Garmin Coros Suunto review 2026',
    categorySlug: "actualites",
    angle: "Montres GPS trail : modèles Garmin, Coros, Suunto — autonomie, fonctions avancées, tests.",
    include_domains: GEAR_DOMAINS,
  },

  // Portraits & interviews (5)
  {
    query: '"Kilian Jornet" training interview record ultramarathon',
    categorySlug: "courses-recits",
    angle: "Kilian Jornet : entraînement, records, philosophie de course, actualité récente.",
    include_domains: PORTRAITS_DOMAINS,
  },
  {
    query: '"Courtney Dauwalter" training strategy ultra running interview',
    categorySlug: "courses-recits",
    angle: "Courtney Dauwalter : approche d'entraînement, performances, positions publiques.",
    include_domains: PORTRAITS_DOMAINS,
  },
  {
    query: '"Jim Walmsley" Western States strategy training interview',
    categorySlug: "courses-recits",
    angle: "Jim Walmsley : stratégie, records Western States, vie de coureur pro américain.",
    include_domains: PORTRAITS_DOMAINS,
  },
  {
    query: '"François D\'Haene" UTMB training interview profile',
    categorySlug: "courses-recits",
    angle: "François D'Haene : carrière, entraînement, transition vers les sports de montagne.",
    include_domains: PORTRAITS_DOMAINS,
  },
  {
    query: '"FKT" fastest known time record trail long distance announcement',
    categorySlug: "courses-recits",
    angle: "Records FKT (Fastest Known Time) : nouvelles tentatives, records récents, coureurs engagés.",
    include_domains: PORTRAITS_DOMAINS,
  },
];

/**
 * Pioche N queries distinctes depuis le pool de façon déterministe selon
 * l'horodatage du run, pour éviter les doublons entre runs rapprochés.
 * Le picker utilise un hash de la date+heure arrondie à l'heure, modulo la
 * taille du pool, avec décalage par position pour garantir la diversité.
 */
function pickQueriesForRun(count, seedDate = new Date()) {
  const hourKey = `${seedDate.getUTCFullYear()}-${seedDate.getUTCMonth()}-${seedDate.getUTCDate()}-${seedDate.getUTCHours()}`;
  let h = 0;
  for (let i = 0; i < hourKey.length; i++) h = (h * 31 + hourKey.charCodeAt(i)) & 0xffffffff;
  const start = Math.abs(h) % QUERY_POOL.length;
  const stride = 7; // coprime avec 20 → balaye tout le pool en passant toutes les positions
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < count && i < QUERY_POOL.length; i++) {
    const idx = (start + i * stride) % QUERY_POOL.length;
    if (!seen.has(idx)) {
      seen.add(idx);
      out.push(QUERY_POOL[idx]);
    }
  }
  return out;
}

// Ancien nom conservé pour compat (exposition dans d'autres scripts si besoin)
const THEMATIC_QUERIES = QUERY_POOL;

// Blacklist supplémentaire des domaines qui polluent les résultats "trail"
// (sports US qui utilisent le mot "trail" ou "blazer" différemment).
const TAVILY_AGGRESSIVE_BLACKLIST = [
  "sports.yahoo.com",
  "espn.com",
  "bleacherreport.com",
  "nba.com",
  "nfl.com",
  "mlb.com",
  "si.com",
  "foxsports.com",
  "cbssports.com",
  "theringer.com",
];

const MAX_ARTICLES_PER_RUN = parseInt(process.env.MAX_ARTICLES_PER_RUN || "3", 10);
const FRESHNESS_DAYS = parseInt(process.env.TAVILY_FRESHNESS_DAYS || "7", 10);

function slugify(str) {
  const s = str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length <= 90) return s;
  // Coupe a la derniere frontiere de mot <= 90 chars pour eviter les slugs mid-mot
  // (ex: "...quatrieme-m" au lieu de "...quatrieme-marathon"). Si le dernier
  // tiret est trop proche du debut, on garde la coupe dure a 90.
  const truncated = s.slice(0, 90);
  const lastDash = truncated.lastIndexOf("-");
  return lastDash > 40 ? truncated.slice(0, lastDash) : truncated;
}

function frDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];


/**
 * Détecte si un article parle d'une édition d'une année passée (typiquement
 * un recap de l'édition N-1 ramené par Tavily comme s'il était d'actualité).
 * Règle : si le slug ou le title contient une année différente de l'année en
 * cours, c'est un signal fort de contenu stale et l'article doit être rejeté
 * quand on est en contexte hot event.
 */
function articleMentionsStaleYear(meta, baseSlug) {
  const currentYear = new Date().getFullYear();
  const yearPattern = /\b(20\d{2})\b/g;
  const fields = [baseSlug || "", meta.title || "", meta.slug || ""];
  for (const f of fields) {
    const years = [...String(f).matchAll(yearPattern)].map((m) => parseInt(m[1], 10));
    for (const y of years) {
      if (y >= 2020 && y <= currentYear + 1 && y !== currentYear) return y;
    }
  }
  return null;
}

/**
 * Compare les métadonnées canoniques d'un event aux valeurs que Claude a
 * écrites dans le frontmatter (title + excerpt). Log des warnings si l'article
 * contredit le calendrier officiel. Ne bloque pas la publication.
 */
function checkEventFacts(meta, event) {
  const warnings = [];
  if (!event) return warnings;
  const text = [meta.title || "", meta.excerpt || ""].join(" ");
  if (event.start) {
    const d = new Date(event.start + "T00:00:00Z");
    const expectedDay = d.getUTCDate();
    const expectedMonth = MONTHS_FR[d.getUTCMonth()];
    const re = new RegExp("(\\d+)\\s+" + expectedMonth, "gi");
    const found = [...text.matchAll(re)].map((m) => parseInt(m[1], 10));
    const wrongDays = found.filter((dd) => dd !== expectedDay);
    if (wrongDays.length > 0) {
      warnings.push(`date mismatch : mentionne ${wrongDays.join(",")} ${expectedMonth}, event.start=${expectedDay} ${expectedMonth}`);
    }
  }
  if (event.distance) {
    const num = (event.distance.match(/\d+/) || [])[0];
    if (num && !new RegExp("\\b" + num + "\\b").test(text)) {
      warnings.push(`distance canonique ${event.distance} absente du titre et de l'excerpt`);
    }
  }
  return warnings;
}


const SYSTEM_PROMPT = `${EDITORIAL_STYLE}

TÂCHE SPÉCIFIQUE

Tu vas recevoir une question thématique (ex. "actualité des chaussures carbone") et un ensemble de 5 à 8 sources récentes (titres, URLs, extraits). Ta mission : écrire UN article original qui synthétise ces sources dans le style d'Altitude Trail.

RÈGLES DE SYNTHÈSE

1. Tu recoupes au moins 2 sources dans le corps de l'article. Tu mentionnes nommément les médias d'où vient chaque information clé (ex. "selon iRunFar", "d'après une étude publiée dans le BJSM").
2. Tu ne reprends JAMAIS un paragraphe mot à mot d'une source. Tu reformules, tu condenses, tu croises.
3. Si les sources se contredisent, tu l'indiques explicitement.
4. Si tu n'as aucune source fiable pour une affirmation, tu ne l'écris pas. L'omission est toujours préférable à l'invention.
5. Le corps fait entre 800 et 1200 mots.

FORMAT DE SORTIE

Réponds UNIQUEMENT avec un fichier markdown complet, ouvert par un frontmatter YAML. Rien avant, rien après. Aucun fence de code.

Frontmatter obligatoire :
- title : titre français PENSÉ POUR GOOGLE DISCOVER, 40 à 110 caractères, accroche forte avec chiffre, enjeu, ou question rhétorique quand c'est pertinent.
- excerpt : chapeau 1-2 phrases qui résume l'enjeu de l'article.
- categorySlug : utiliser exactement la categorySlug fournie dans le prompt utilisateur.
- tags : 3 à 5 tags français, chaînes simples.
- readTime : "X min" calculé sur 230 mots/min.
- imagePrompt1 : prompt ANGLAIS pour flux-pro-1.1 illustrant la scène d'ouverture. 40-60 mots, ultra-spécifique, entre guillemets doubles. Pas de style photo (suffixe ajouté automatiquement).
- imagePrompt2 : prompt ANGLAIS pour une scène différente du milieu de l'article.
- externalRefs : liste YAML de 2 à 4 références externes, reprises EXCLUSIVEMENT depuis les sources fournies dans le prompt utilisateur (tu ne dois PAS en inventer). Format : externalRefs:\n  - { url: "https://...", label: "Titre descriptif" }

CONTEXTE TEMPOREL (IMPORTANT)

Nous sommes en 2026. Ne JAMAIS écrire un article qui se présente comme une actualité sur un événement d'une année passée. Si les sources Tavily te remontent des recaps d'éditions 2024 ou 2025, tu les identifies comme contexte historique et NE les utilises PAS pour écrire un article "résultats" ou "actualité". Ton titre et ton excerpt ne doivent contenir que l'année en cours (2026) quand il s'agit de l'édition actuelle d'une course. Un article sur une édition passée est autorisé uniquement si c'est explicitement un angle "il y a un an", "rétrospective", "bilan de X année" — et dans ce cas l'angle doit être clair dans le titre.

CONTRAINTES RGAA / SEO :
- Pas d'emoji, pas de tout majuscules, pas de point-virgule dans le titre.
- Au moins un chiffre concret dans le corps quand le sujet le permet.
- Corps structuré avec 3 à 5 sous-titres H2 (##) thématiques.
- Conclusion en 2-3 phrases qui donne une perspective plus large.`;

// Directives optionnelles activees via --title-style=XXX (injectees dans le system prompt)
const TITLE_STYLE_DIRECTIVES = {
  interrogative: "CONTRAINTE TITRE OBLIGATOIRE : le titre de l\u2019article doit etre redige en forme interrogative, se terminer par un point d\u2019interrogation, poser un vrai enjeu avec une reponse tranchee. Pas de question vague ni de double question. Si tu nommes un coureur dans le titre, son nom doit etre confirme par les sources fournies.",
  numeric: "CONTRAINTE TITRE OBLIGATOIRE : le titre doit contenir au moins un chiffre concret (km, denivele, temps, pourcentage, place au classement).",
  emotional: "CONTRAINTE TITRE OBLIGATOIRE : le titre doit porter une charge emotionnelle assumee (drame, exploit, bascule, defaite, renaissance). Pas de clickbait vide."
};
let currentTitleStyle = null;

function buildUserPrompt(query, angle, categorySlug, sources) {
  const sourcesFormatted = sources
    .map((s, i) => {
      const content = (s.content || "").slice(0, 800);
      return `SOURCE ${i + 1}
URL : ${s.url}
Titre : ${s.title}
Date : ${s.published_date || "non précisée"}
Extrait : ${content}`;
    })
    .join("\n\n");

  return `Requête thématique : "${query}"

Angle attendu : ${angle}

categorySlug imposé : ${categorySlug}

Sources disponibles (${sources.length}) :

${sourcesFormatted}

Écris l'article de synthèse en respectant strictement les règles du system prompt. Utilise au minimum 2 sources distinctes dans le corps, mentionne les médias par leur nom, reformule tout (jamais de copie), inclus 2 à 4 externalRefs choisies UNIQUEMENT parmi les URLs ci-dessus.

Domaines d'autorité autorisés pour les liens externes (tu peux en ajouter depuis cette whitelist si une référence officielle correspond au sujet, mais PRIORITÉ aux URLs des sources fournies ci-dessus) :
${authorityDomainsListForPrompt()}`;
}

async function runClaude(client, query, angle, categorySlug, sources) {
  // NB: avec thinking:adaptive, max_tokens est partage entre raisonnement ET
  // sortie. Sur syntheses complexes (6 sources), le thinking peut consommer
  // 10-14k -> insuffisant pour 800-1200 mots si on reste a 16k. 32k laisse une
  // marge confortable (sonnet-4-6 supporte 64k en sortie).
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    // Prompt caching Anthropic (optimisation cout 2026-05-22) :
    // le SYSTEM_PROMPT est statique entre appels (3-4K chars). Anthropic
    // facture les hits cache 10% du tarif input normal. Sur 4 runs/jour ×
    // 3 articles × ~3500 tokens system, on passe de 42k tokens/jour a 4.2k.
    system: [
      {
        type: "text",
        text: currentTitleStyle ? SYSTEM_PROMPT + "\n\n" + TITLE_STYLE_DIRECTIVES[currentTitleStyle] : SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildUserPrompt(query, angle, categorySlug, sources) }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "max_tokens") {
    throw new Error(
      "Claude a atteint max_tokens (stop_reason=max_tokens) - sortie tronquee, article rejete. " +
      "Augmenter max_tokens ou alleger le prompt."
    );
  }
  return msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function stripFences(s) {
  let out = s.trim();
  if (out.startsWith("```")) {
    out = out.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```\s*$/, "");
  }
  return out.trim();
}

function parseFrontmatter(md) {
  if (!md.startsWith("---")) return null;
  const end = md.indexOf("\n---", 3);
  if (end === -1) return null;
  const yaml = md.slice(3, end).trim();
  const body = md.slice(end + 4).trim();
  const meta = {};
  const lines = yaml.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^externalRefs\s*:\s*$/.test(line)) {
      const refs = [];
      let j = i + 1;
      while (j < lines.length && /^\s{2,}-/.test(lines[j])) {
        const itemLine = lines[j].replace(/^\s*-\s*/, "");
        const urlMatch = itemLine.match(/url\s*:\s*["']([^"']+)["']/);
        const labelMatch = itemLine.match(/label\s*:\s*["']([^"']+)["']/);
        if (urlMatch) {
          refs.push({
            url: urlMatch[1],
            label: labelMatch ? labelMatch[1] : urlMatch[1],
          });
        }
        j++;
      }
      meta.externalRefs = refs;
      i = j;
      continue;
    }
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
    meta[key] = val;
    i++;
  }
  return { meta, body };
}

async function validateRefs(refs) {
  if (!Array.isArray(refs)) return [];
  const out = [];
  for (const ref of refs.slice(0, 4)) {
    if (!ref?.url || !ref?.label) continue;
    try {
      const u = new URL(ref.url);
      // Pour Tavily, on autorise tous les domaines sauf la blacklist stricte.
      if (TAVILY_EXCLUDE_DOMAINS.some((d) => u.hostname.endsWith(d))) continue;
    } catch {
      continue;
    }
    const alive = await urlIsAlive(ref.url);
    if (!alive) {
      console.log(`[tavily]   ref rejetee (HTTP mort) : ${ref.url}`);
      continue;
    }
    out.push({ url: ref.url, label: ref.label });
  }
  return out;
}

// ─── Image generation (Nano Banana 2 Flash via scripts/lib/image-generation.mjs) ──

async function generateAndDownloadImages(slug, prompts) {
  if (!process.env.GEMINI_API_KEY) return [];
  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  const refs = [];
  for (let i = 0; i < prompts.length; i++) {
    const prompt = (prompts[i] || "").trim();
    if (!prompt) { refs.push(null); continue; }
    const filename = `${slug}-${i + 1}.jpg`;
    const destPath = path.join(PUBLIC_IMAGES_DIR, filename);
    try {
      console.log(`[tavily]   image#${i + 1}: ${prompt.slice(0, 80)}…`);
      const buf = await generateImage(prompt);
      await saveImage(buf, destPath);
      refs.push({ url: `/articles/${filename}`, alt: prompt.slice(0, 120) });
    } catch (e) {
      console.error(`[tavily]     image error: ${e.message}`);
      refs.push(null);
    }
  }
  return refs;
}

function insertImagesInBody(body, imageRefs) {
  const refs = imageRefs.filter(Boolean);
  if (!refs.length) return body;
  const paragraphs = body.split(/\n{2,}/);
  const totalWords = body.split(/\s+/).filter(Boolean).length;
  const targets = [200, Math.max(Math.floor(totalWords / 2), 450)];
  const out = [];
  let cumWords = 0;
  let insertedCount = 0;
  for (const p of paragraphs) {
    out.push(p);
    cumWords += p.split(/\s+/).filter(Boolean).length;
    while (insertedCount < refs.length && cumWords >= targets[insertedCount] && cumWords < totalWords) {
      const { url, alt } = refs[insertedCount];
      out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
      insertedCount++;
    }
  }
  while (insertedCount < refs.length) {
    const { url, alt } = refs[insertedCount];
    out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
    insertedCount++;
  }
  return out.join("\n\n");
}

function buildMarkdownFile({ meta, body, pubDate, image, sources }) {
  const CATEGORY_LABELS = {
    actualites: "Actualités",
    debuter: "Débuter",
    "courses-recits": "Courses & Récits",
    nutrition: "Nutrition",
    entrainement: "Entraînement",
    "blessures-preventions": "Blessures & Préventions",
    blessures: "Blessures & Préventions",
  };
  const category = CATEGORY_LABELS[meta.categorySlug] || "Actualités";
  const tagsYaml = Array.isArray(meta.tags) && meta.tags.length
    ? `[${meta.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`
    : "[]";

  const author = pickAuthorForCategory(meta.categorySlug, meta.title || "").name;
  const dateFr = frDate(pubDate);

  const externalRefsYaml = Array.isArray(meta.externalRefs) && meta.externalRefs.length
    ? [
        "externalRefs:",
        ...meta.externalRefs.map(
          (r) => `  - { url: "${r.url.replace(/"/g, '\\"')}", label: "${String(r.label || "").replace(/"/g, '\\"')}" }`
        ),
      ]
    : [];

  const sourcesList = sources
    .map((s) => `  - "${(s.url || "").replace(/"/g, '\\"')}"`)
    .join("\n");

  const front = [
    "---",
    `slug: "${slugify(meta.title)}"`,
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    `excerpt: "${meta.excerpt.replace(/"/g, '\\"')}"`,
    `category: "${category}"`,
    `categorySlug: ${meta.categorySlug}`,
    `author: "${author}"`,
    `date: "${dateFr}"`,
    `publishedAt: "${new Date().toISOString()}"`,
    `updatedAt: "${dateFr}"`,
    `readTime: "${meta.readTime || "7 min"}"`,
    `image: "${image}"`,
    `tags: ${tagsYaml}`,
    `source: "tavily-synthesis"`,
    ...(meta.isLive ? [`isLive: true`] : []),
    ...(meta.hotEventSlug ? [`hotEventSlug: "${meta.hotEventSlug}"`] : []),
    sources.length > 0 ? `tavilySources:\n${sourcesList}` : "",
    ...externalRefsYaml,
    ...(meta.imagePrompt1 ? [`imagePrompt1: ${JSON.stringify(meta.imagePrompt1)}`] : []),
    ...(meta.imagePrompt2 ? [`imagePrompt2: ${JSON.stringify(meta.imagePrompt2)}`] : []),
    "---",
    "",
    body,
    "",
  ].filter(Boolean).join("\n");
  return front;
}

// ─── Orchestration ─────────────────────────────────────────────────────────

async function processQuery(client, query, angle, categorySlug, allExisting, include_domains, hotEventSlug) {
  console.log(`\n[tavily] == ${query}`);

  const tavilyResult = await tavilySearch(query, {
    search_depth: "advanced",
    max_results: 15,
    topic: "general",  // "news" remonte trop de sports US, on préfère general
    days: FRESHNESS_DAYS,
    exclude_domains: [...TAVILY_EXCLUDE_DOMAINS, ...TAVILY_AGGRESSIVE_BLACKLIST],
    ...(include_domains && include_domains.length > 0 ? { include_domains } : {}),
  });

  // Post-filtrage : retire tout résultat dont l'URL ou le titre ne semble
  // pas lié à la course / trail / running / ultra / montagne. On est strict
  // pour éviter les contaminations NBA/NFL/MLB.
  const TRAIL_TOKENS = [
    "trail", "ultra", "running", "marathon", "runner", "course",
    "mountain", "sky", "fkt", "utmb", "ftr", "itra",
    "nutrition", "physiology", "endurance", "training",
    "hoka", "salomon", "sportiva", "altra",
  ];
  const isTrailRelated = (s) => {
    const hay = `${s.url} ${s.title || ""} ${s.content || ""}`.toLowerCase();
    return TRAIL_TOKENS.some((tok) => hay.includes(tok));
  };

  // FILTRAGE BLACKLIST HARD : tavily exclude_domains ne capture pas les
  // sous-domaines (www2.u-trail.com passe quand on exclut u-trail.com).
  // On post-filtre cote code pour rejeter toute source d'un domaine
  // blackliste, sous-domaines inclus.
  const trailRelated = tavilyResult.results.filter(isTrailRelated);
  const filtered = trailRelated.filter((r) => {
    if (isBlacklistedSource(r.url)) {
      console.warn(`[tavily]   BLACKLISTE rejete : ${r.url}`);
      return false;
    }
    return true;
  });
  const reranked = rerankByPriority(filtered);
  const top = reranked.slice(0, 6);
  if (top.length < 2) {
    console.log(`[tavily]   seulement ${top.length} source(s) pertinente(s) après filtrage, skip (min 2)`);
    console.log(`[tavily]   → Tavily avait renvoyé ${tavilyResult.results.length} résultats, ${filtered.length} ont passé le filtre trail`);
    return null;
  }

  console.log(`[tavily]   ${top.length} sources retenues (sur ${tavilyResult.results.length} résultats Tavily, ${filtered.length} passés filtre trail)`);
  for (const s of top) console.log(`           · ${s.url}`);

  let rewritten;
  try {
    rewritten = await runClaude(client, query, angle, categorySlug, top);
    rewritten = stripFences(rewritten);
  } catch (e) {
    console.error(`[tavily]   Claude error: ${e.message}`);
    return null;
  }

  const parsed = parseFrontmatter(rewritten);
  if (!parsed) {
    console.error(`[tavily]   frontmatter invalide`);
    return null;
  }
  const { meta, body } = parsed;
  if (!meta.title || !meta.excerpt) {
    console.error(`[tavily]   frontmatter incomplet`);
    return null;
  }
  meta.categorySlug = meta.categorySlug || categorySlug;

  // Tag hot event si ce run est déclenché dans une fenêtre chaude.
  if (hotEventSlug) {
    meta.isLive = true;
    meta.hotEventSlug = hotEventSlug;
  }

  // Fact-check : si hotEventSlug est présent, comparer title+excerpt aux
  // données canoniques du calendrier. Warnings seulement, pas de blocage.
  if (meta.hotEventSlug) {
    const canonicalEvent = HOT_EVENTS.find((e) => e.slug === meta.hotEventSlug);
    if (canonicalEvent) {
      const warnings = checkEventFacts(meta, canonicalEvent);
      if (warnings.length > 0) {
        console.warn(`[tavily]   fact-check warnings pour "${meta.title}":`);
        for (const w of warnings) console.warn(`              - ${w}`);
      }
    }
  }

  // REJET HARD : si Claude a malgre tout cite un domaine blackliste dans
  // meta.tavilySources ou sourceUrl (cas rarissime mais observe : 4 articles
  // Zegama du 2026-05-14 ont passe avec www2.u-trail.com en sourceUrl), on
  // rejette l'article completement.
  const allMetaUrls = [
    meta.sourceUrl,
    ...(Array.isArray(meta.tavilySources) ? meta.tavilySources : []),
    ...(Array.isArray(meta.externalRefs) ? meta.externalRefs.map((r) => r?.url).filter(Boolean) : []),
  ].filter(Boolean);
  const blacklistedHit = allMetaUrls.find((u) => isBlacklistedSource(u));
  if (blacklistedHit) {
    console.error(`[tavily]   REJET BLACKLIST : article cite ${blacklistedHit} (domaine interdit). Publication annulee.`);
    return null;
  }
  // Et dans le body markdown : on cherche les mentions textuelles "u-trail.com"
  // ou "utrail.com" pour rejeter aussi les citations inline.
  const bodyLower = body.toLowerCase();
  if (bodyLower.includes("u-trail.com") || bodyLower.includes("utrail.com")) {
    console.error(`[tavily]   REJET BLACKLIST : article contient une mention textuelle de u-trail. Publication annulee.`);
    return null;
  }

  const baseSlug = slugify(meta.title);

  // Anti-stale year : si on est en contexte hot event et que l'article
  // parle d'une édition d'une année différente de l'année en cours, on rejette.
  // Typiquement : Tavily remonte un recap de l'édition N-1, Claude le
  // resynthétise comme s'il était d'actualité. Bloqué ici pour les hot events.
  if (meta.hotEventSlug) {
    const staleYear = articleMentionsStaleYear(meta, baseSlug);
    if (staleYear !== null) {
      console.error(`[tavily]   REJET : article mentionne l'année ${staleYear} dans slug/title alors qu'on couvre l'édition ${new Date().getFullYear()} de ${meta.hotEventSlug}. Recap stale, publication annulée.`);
      return null;
    }
  }

  const outPath = path.join(CONTENT_DIR, `${baseSlug}.md`);
  if (existsSync(outPath)) {
    console.log(`[tavily]   doublon détecté (${baseSlug}), skip`);
    return null;
  }

  // Validation des external refs
  if (meta.externalRefs) {
    const before = meta.externalRefs.length;
    meta.externalRefs = await validateRefs(meta.externalRefs);
    console.log(`[tavily]   externalRefs: ${before} → ${meta.externalRefs.length} validées`);
  }

  // YouTube
  try {
    const yt = await findYouTubeVideoForArticle({ title: meta.title, tags: meta.tags });
    if (yt) {
      meta.youtubeVideoId = yt.videoId;
      meta.youtubeTitle = yt.title;
      if (yt.channel) meta.youtubeChannel = yt.channel;
      if (yt.duration) meta.youtubeDuration = yt.duration;
      if (yt.uploadDate) meta.youtubeUploadDate = yt.uploadDate;
      console.log(`[tavily]   YouTube: ${yt.title.slice(0, 60)}`);
    }
  } catch {}

  // Liens internes (max 2)
  let bodyWithLinks = body;
  try {
    const related = findTopRelated(
      { slug: baseSlug, title: meta.title, tags: meta.tags, categorySlug: meta.categorySlug },
      allExisting,
      2,
      baseSlug
    );
    if (related.length) {
      const siteUrl = (process.env.SITE_BASE_URL || "https://www.altitude-trail.fr").replace(/\/$/, "");
      bodyWithLinks = insertInternalLinks(bodyWithLinks, related, siteUrl);
      console.log(`[tavily]   ${related.length} liens internes`);
    }
  } catch (e) {
    console.warn(`[tavily]   internal linking error: ${e.message}`);
  }

  // Images (Nano Banana 2 Flash)
  const imageRefs = await generateAndDownloadImages(baseSlug, [meta.imagePrompt1, meta.imagePrompt2]);
  const bodyWithImages = insertImagesInBody(bodyWithLinks, imageRefs);
  const heroImage = imageRefs.find(Boolean)?.url || FALLBACK_IMAGE;

  const md = buildMarkdownFile({
    meta,
    body: bodyWithImages,
    pubDate: new Date(),
    image: heroImage,
    sources: top,
  });
  await fs.writeFile(outPath, md, "utf8");
  console.log(`[tavily]   ✓ saved ${outPath}`);
  return baseSlug;
}

async function main() {
  if (!process.env.TAVILY_API_KEY) {
    console.error("TAVILY_API_KEY manquante");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY manquante");
    process.exit(1);
  }
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const queryArg = args.find((a) => a.startsWith("--query="));
  const customQuery = queryArg ? queryArg.split("=")[1] : null;
  const titleStyleArg = args.find((a) => a.startsWith("--title-style="));
  if (titleStyleArg) {
    const style = titleStyleArg.split("=")[1];
    if (TITLE_STYLE_DIRECTIVES[style]) {
      currentTitleStyle = style;
      console.log(`[tavily] title-style override: ${style}`);
    } else if (style) {
      console.warn(`[tavily] --title-style=${style} inconnu, ignore (valides: ${Object.keys(TITLE_STYLE_DIRECTIVES).join(", ")})`);
    }
  }

  const client = new Anthropic();
  const allExisting = await loadExistingArticles();

  // Cap quotidien partagé (5 articles/jour par défaut, RSS + Tavily confondus).
  // Chaque run Tavily peut publier jusqu'à MAX_ARTICLES_PER_RUN, plafonné par
  // le budget restant de la journée. En mode HOT (UTMB, Western, etc.), le
  // pipelineDefault est boosté à MAX_ARTICLES_PER_RUN+1 et le cap daily à 10.
  const runCap = await effectiveCapForRun("veille-tavily", MAX_ARTICLES_PER_RUN);
  if (runCap <= 0) {
    console.log(`[tavily] cap quotidien atteint, aucun article ne sera publié ce run.`);
    return;
  }

  // Détecte un événement chaud en cours : bascule sur des queries dédiées.
  const hotEvent = isInHotEventWindow();

  // Query source : custom > hot event > rotation normale boostée FR.
  // P0 : en mode normal, on garantit qu'au moins 30% des queries portent sur
  // un nom propre FR (athlète, marque, influenceur) pour rattraper u-trail.com
  // sur l'actu chaude française.
  let queries;
  if (customQuery) {
    queries = [{ query: customQuery, angle: "Synthèse thématique personnalisée.", categorySlug: "actualites", include_domains: RACES_DOMAINS }];
  } else if (hotEvent) {
    queries = getEventSpecificQueries(hotEvent.event);
  } else {
    const TOTAL = 3;
    const frCount = Math.max(1, Math.ceil(TOTAL * 0.34)); // au moins 1/3, >= 30%
    const frQueries = pickFrenchSubjectQueries(frCount, undefined, new Date());
    const generic = pickQueriesForRun(TOTAL - frCount, new Date());
    queries = [...frQueries, ...generic];
  }

  const modeLabel = hotEvent
    ? `HOT ${hotEvent.event.name} (J${hotEvent.relativeHours >= 0 ? "+" : ""}${Math.round(hotEvent.relativeHours / 24)})`
    : "normal";
  console.log(`[tavily] mode=${modeLabel} · ${queries.length} queries (cap ${runCap}) :`);
  for (const q of queries) console.log(`           · ${q.query.slice(0, 90)}`);

  let created = 0;
  for (const q of queries) {
    if (created >= runCap) {
      console.log(`[tavily] cap du run atteint (${runCap}), arrêt.`);
      break;
    }
    try {
      const slug = await processQuery(
        client,
        q.query,
        q.angle,
        q.categorySlug,
        allExisting,
        q.include_domains,
        (customQuery ? null : (q.hotEvent || (hotEvent?.event.slug ?? null)))
      );
      if (slug) created++;
    } catch (e) {
      console.error(`[tavily] ${q.query} — erreur: ${e.message}`);
    }
  }

  console.log(`\n[tavily] terminé — ${created} nouvel(s) article(s) Tavily.`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
