#!/usr/bin/env node
// Veille vidéo YouTube → article.
//
// Surveille une liste de chaînes YouTube, récupère les vidéos récentes qui
// parlent de trail, télécharge leur transcription auto-générée, et génère un
// article via Claude en citant systématiquement la vidéo source.
//
// Usage :
//   npm run veille-video                     # tous les channels
//   npm run veille-video -- --channel=iRunFar
//
// Env requis : YOUTUBE_API_DATA, ANTHROPIC_API_KEY
//
// Règles éditoriales strictes (héritées du system prompt) : citation obligatoire
// de la chaîne, max 15 mots en citation directe, embed obligatoire (article
// refusé si la vidéo a embed désactivé), refus des vidéos sans transcription.

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
// Implementation maison du fetch de transcription YouTube.
// On evite les packages npm (youtube-transcript et ses cousins ont des
// problemes d'interop CJS/ESM et de parsing qui varient selon les versions
// de Node). Direct acces a la page YouTube + extraction de captionTracks.

import { EDITORIAL_STYLE } from "./lib/editorial-style.mjs";
import { pickAuthorForCategory } from "./lib/authors.mjs";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_DATA;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const CONTENT_DIR = path.resolve("content/articles");
const MAX_ARTICLES_PER_RUN = parseInt(process.env.MAX_ARTICLES_PER_RUN || "1", 10);
const LOOKBACK_HOURS = parseInt(process.env.VEILLE_VIDEO_LOOKBACK_HOURS || "48", 10);

// ─── Chaînes surveillées (v1 : 5 chaînes trail-first à haute cadence) ──────
// Les IDs peuvent être trouvés via https://commentpicker.com/youtube-channel-id.php
// ou via l'API : /channels?forHandle=@irunfar
const WATCHED_CHANNELS = [
  { handle: "@irunfar", name: "iRunFar", prio: 1 },
  { handle: "@UTMBMontBlanc", name: "UTMB World Series", prio: 1 },
  { handle: "@u-trail", name: "U-Trail", prio: 1 },
  { handle: "@trailrunnermagazine", name: "Trail Runner Magazine", prio: 2 },
  { handle: "@kilianjornetofficial", name: "Kilian Jornet", prio: 2 },
  { handle: "@Kiprunfr", name: "Kiprun", prio: 2 },
];

// Mots-clés trail pour filtrer les vidéos non pertinentes sur chaînes généralistes.
const TRAIL_KEYWORDS = [
  "trail", "ultra", "utmb", "western states", "hardrock", "running",
  "mountain", "skyrunning", "fkt", "course", "dénivelé", "sentier",
  "run", "runner", "marathon", "ultramarathon", "endurance",
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function slugify(str) {
  const s = str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length <= 90) return s;
  const truncated = s.slice(0, 90);
  const lastDash = truncated.lastIndexOf("-");
  return lastDash > 40 ? truncated.slice(0, lastDash) : truncated;
}

function frDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function isTrailRelated(title, description) {
  const hay = `${title} ${description || ""}`.toLowerCase();
  return TRAIL_KEYWORDS.some((k) => hay.includes(k));
}

/** Scan content/articles/*.md and collect youtubeVideoId values to dedupe. */
async function loadProcessedVideoIds() {
  const ids = new Set();
  const files = await fs.readdir(CONTENT_DIR).catch(() => []);
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    try {
      const raw = await fs.readFile(path.join(CONTENT_DIR, f), "utf8");
      const m = raw.match(/^youtubeVideoId:\s*"?([A-Za-z0-9_-]{11})"?/m);
      if (m) ids.add(m[1]);
    } catch {}
  }
  return ids;
}

/** Resolve a @handle into a channelId (YouTube Data API v3 requires channelId). */
async function resolveChannelId(handle) {
  const h = handle.replace(/^@/, "");
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(h)}&key=${YOUTUBE_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`channels API ${r.status}`);
  const data = await r.json();
  const id = data.items?.[0]?.id;
  if (!id) throw new Error(`channel '${handle}' not found`);
  return id;
}

/** Fetch recent videos from a channel (last LOOKBACK_HOURS). */
async function fetchRecentVideos(channelId, hoursBack = LOOKBACK_HOURS) {
  const publishedAfter = new Date(Date.now() - hoursBack * 3600 * 1000).toISOString();
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&publishedAfter=${publishedAfter}&maxResults=10&key=${YOUTUBE_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`search API ${r.status}`);
  const data = await r.json();
  return (data.items || []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
  }));
}

/** Get a video's embeddable status + more accurate duration. */
async function fetchVideoDetails(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`videos API ${r.status}`);
  const data = await r.json();
  return data.items?.[0] || null;
}

/** Parse ISO 8601 duration (PT1H23M45S) to seconds. */
function parseIsoDurationToSeconds(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || "0", 10) * 3600) + (parseInt(m[2] || "0", 10) * 60) + parseInt(m[3] || "0", 10);
}

/**
 * Fetch the transcript of a YouTube video by scraping the public captionTracks
 * metadata from the video page, then fetching the track URL directly.
 * Returns null if no transcript is available (video without captions).
 * Prefers French track, falls back to English, then first available.
 */
async function fetchTranscript(videoId, preferredLangs = ["fr", "en"]) {
  const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let pageHtml;
  try {
    const pageResp = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    if (!pageResp.ok) return null;
    pageHtml = await pageResp.text();
  } catch {
    return null;
  }

  // Find the captionTracks array in the embedded JSON (ytInitialPlayerResponse)
  const m = pageHtml.match(/"captionTracks":(\[[^\]]*\])/);
  if (!m) return null;
  let tracks;
  try { tracks = JSON.parse(m[1]); } catch { return null; }
  if (!Array.isArray(tracks) || tracks.length === 0) return null;

  // Pick a track : exact match preferred langs, fallback any
  let track = null;
  for (const lang of preferredLangs) {
    track = tracks.find((t) => t.languageCode === lang);
    if (track) break;
  }
  if (!track) track = tracks[0];
  if (!track || !track.baseUrl) return null;

  // Fetch the XML transcript (YouTube returns SRV1 XML by default)
  let xml;
  try {
    const r = await fetch(track.baseUrl);
    if (!r.ok) return null;
    xml = await r.text();
  } catch {
    return null;
  }

  // Parse <text> nodes
  const texts = [];
  const re = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = re.exec(xml))) {
    const raw = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
    if (raw) texts.push(raw);
  }
  const transcript = texts.join(" ").trim();
  return transcript.length >= 200 ? transcript : null;
}

// ─── System prompt : adaptation "veille vidéo" du style éditorial ──────────

const SYSTEM_PROMPT = `${EDITORIAL_STYLE}

CONTEXTE TEMPOREL (IMPORTANT)

Nous sommes en ${new Date().getFullYear()}. Ne JAMAIS présenter une vidéo datant d'il y a plus de 30 jours comme une actualité chaude. Si la vidéo source a plus d'un mois, mentionne-le explicitement dans l'article.

TÂCHE SPÉCIFIQUE : VEILLE VIDÉO YOUTUBE

Tu reçois la transcription d'une vidéo YouTube publiée par une chaîne trail reconnue. Ta mission : écrire UN article original qui s'appuie sur cette vidéo comme source unique, avec des règles d'attribution strictes.

RÈGLES OBLIGATOIRES

1. ATTRIBUTION : tu cites nommément la chaîne qui a publié la vidéo, à plusieurs reprises dans le corps (au minimum 3 fois). Formules acceptables : "selon la vidéo de [chaîne]", "[chaîne] affirme dans sa vidéo publiée le [date]", "comme le détaille [créateur] dans son reportage".
2. CITATION DIRECTE : MAX 15 mots d'affilée. Au-delà, tu reformules systématiquement.
3. VALEUR AJOUTÉE : ton article N'EST PAS un résumé passif. Tu apportes du contexte historique, des chiffres comparatifs, une mise en perspective avec d'autres événements ou athlètes. Un lecteur qui lit ton article doit en savoir PLUS que s'il ne regarde que la vidéo.
4. LONGUEUR : 800 à 1100 mots. Ni plus, ni moins.
5. JAMAIS INVENTER. Si la vidéo ne mentionne pas un fait, tu ne l'inventes pas. L'omission > l'invention. Pas de nom de coureur, de chrono, de classement qui ne soit pas explicitement dans la vidéo ou sa description.
6. EMBED : la vidéo sera embarquée automatiquement dans l'article par le moteur du site (via le champ youtubeVideoId du frontmatter). N'inclus PAS de balise iframe ni de lien vers la vidéo dans le corps, sauf en external ref.

FORMAT DE SORTIE

Réponds UNIQUEMENT avec un fichier markdown complet, ouvert par un frontmatter YAML. Rien avant, rien après. Aucun fence de code.

Frontmatter obligatoire :
- title : titre français PENSÉ POUR GOOGLE DISCOVER, 40 à 110 caractères. Forme interrogative privilégiée si elle pose un vrai enjeu avec réponse tranchée. Toujours inclure l'année en cours (${new Date().getFullYear()}) si l'angle est une actualité.
- excerpt : chapeau 1-2 phrases qui résume l'enjeu de l'article et mentionne la chaîne source.
- categorySlug : une valeur EXACTE parmi : actualites, debuter, courses-recits, nutrition, entrainement, blessures-preventions.
- tags : 3-5 tags français, chaînes simples.
- readTime : "X min" calculé sur 230 mots/min.
- externalRefs : liste YAML avec AU MINIMUM un lien vers la vidéo YouTube source, label "Vidéo source : [titre] — [chaîne]". Format : externalRefs:\n  - { url: "https://youtube.com/watch?v=XXX", label: "..." }

Corps structuré avec 3 à 5 sous-titres H2 (##) thématiques. Conclusion en 2-3 phrases de mise en perspective.

CONTRAINTES RGAA / SEO : pas d'emoji, pas de point-virgule dans le titre, pas de tout majuscules. Au moins un chiffre concret dans le corps. Cadratins interdits (max 1 par article).
`;

function buildUserPrompt(video, transcript, sourceKind = "transcription") {
  const isDescription = sourceKind === "description";
  const sourceLabel = isDescription
    ? `DESCRIPTION COMPLÈTE (la transcription n'est pas disponible, tu travailles à partir de la description officielle fournie par le créateur) :`
    : `TRANSCRIPTION AUTO-GÉNÉRÉE (peut contenir des imprécisions, à citer avec prudence) :`;
  const extraRule = isDescription
    ? `\n\nATTENTION : la transcription audio n'est pas disponible. Tu construis l'article à partir du titre, de la description officielle et de la chaîne source UNIQUEMENT. Tu mentionnes clairement que l'article se base sur la description et non sur la transcription intégrale. Tu ne cites pas de propos comme s'ils avaient été prononcés — tu les présentes comme "selon la description de la vidéo" ou "selon la chaîne".`
    : "";
  return `VIDÉO SOURCE
Titre : ${video.title}
Chaîne : ${video.channelTitle}
Date de publication : ${video.publishedAt.slice(0, 10)}
URL : https://www.youtube.com/watch?v=${video.videoId}
Durée : ${video.durationSec ? Math.round(video.durationSec / 60) + " min" : "inconnue"}

${sourceLabel}
${transcript.slice(0, 15000)}

Écris l'article selon les règles du system prompt. Angle éditorial de ton choix mais centré sur ce que la vidéo apporte de neuf ou de pertinent pour un public francophone trail. Cite nommément ${video.channelTitle} au moins 3 fois.${extraRule}`;
}

async function runClaude(client, video, transcript, sourceKind = "transcription") {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(video, transcript, sourceKind) }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "max_tokens") {
    throw new Error("Claude a atteint max_tokens (stop_reason=max_tokens), article rejeté.");
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
          refs.push({ url: urlMatch[1], label: labelMatch ? labelMatch[1] : urlMatch[1] });
        }
        j++;
      }
      meta.externalRefs = refs;
      i = j;
      continue;
    }
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
    if (!m) { i++; continue; }
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

function buildMarkdownFile({ meta, body, pubDate, video }) {
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

  const front = [
    "---",
    `slug: "${slugify(meta.title)}"`,
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    `excerpt: "${meta.excerpt.replace(/"/g, '\\"')}"`,
    `category: "${category}"`,
    `categorySlug: ${meta.categorySlug}`,
    `author: "${author}"`,
    `date: "${dateFr}"`,
    `updatedAt: "${dateFr}"`,
    `readTime: "${meta.readTime || "7 min"}"`,
    `image: "${video.thumbnail}"`,
    `tags: ${tagsYaml}`,
    `source: "veille-video"`,
    `youtubeVideoId: "${video.videoId}"`,
    `youtubeTitle: "${video.title.replace(/"/g, '\\"')}"`,
    `youtubeChannel: "${video.channelTitle.replace(/"/g, '\\"')}"`,
    `youtubeUploadDate: "${video.publishedAt.slice(0, 10)}"`,
    ...(video.durationSec ? [`youtubeDuration: ${video.durationSec}`] : []),
    ...externalRefsYaml,
    "---",
    "",
    body,
    "",
  ].filter(Boolean).join("\n");
  return front;
}

// ─── Orchestration ─────────────────────────────────────────────────────────

async function processChannel(client, channel, processedIds, budget) {
  console.log(`\n[video] == ${channel.name} (${channel.handle})`);
  let channelId;
  try {
    channelId = await resolveChannelId(channel.handle);
  } catch (e) {
    console.error(`[video]   resolveChannelId fail: ${e.message}`);
    return 0;
  }

  const videos = await fetchRecentVideos(channelId).catch((e) => {
    console.error(`[video]   fetchRecentVideos fail: ${e.message}`);
    return [];
  });
  console.log(`[video]   ${videos.length} videos in last ${LOOKBACK_HOURS}h`);

  let produced = 0;
  for (const video of videos) {
    if (produced >= budget) break;

    if (processedIds.has(video.videoId)) {
      console.log(`[video]     skip ${video.videoId} : déjà traité`);
      continue;
    }
    if (!isTrailRelated(video.title, video.description)) {
      console.log(`[video]     skip ${video.videoId} : pas trail`);
      continue;
    }

    // Embeddable + duration
    const details = await fetchVideoDetails(video.videoId).catch(() => null);
    if (details?.status?.embeddable === false) {
      console.log(`[video]     skip : embed désactivé par le créateur`);
      continue;
    }
    video.durationSec = parseIsoDurationToSeconds(details?.contentDetails?.duration);
    if (video.durationSec > 0 && video.durationSec < 120) {
      console.log(`[video]     skip : vidéo trop courte (${video.durationSec}s)`);
      continue;
    }

    // Transcript
    const transcript = await fetchTranscript(video.videoId);
    if (!transcript || transcript.length < 500) {
      console.log(`[video]     skip : transcription indisponible ou trop courte`);
      continue;
    }
    console.log(`[video]   OK ${video.videoId} : ${video.title.slice(0, 80)} (${transcript.length} chars transcript)`);

    // Generate
    let rewritten;
    try {
      rewritten = stripFences(await runClaude(client, video, transcript));
    } catch (e) {
      console.error(`[video]     Claude error: ${e.message}`);
      continue;
    }

    const parsed = parseFrontmatter(rewritten);
    if (!parsed || !parsed.meta.title || !parsed.meta.excerpt) {
      console.warn(`[video]     frontmatter incomplet, skip`);
      continue;
    }
    const { meta, body } = parsed;
    meta.categorySlug = meta.categorySlug || "actualites";

    const baseSlug = slugify(meta.title);
    const outPath = path.join(CONTENT_DIR, `${baseSlug}.md`);
    if (existsSync(outPath)) {
      console.log(`[video]     slug doublon (${baseSlug}), skip`);
      continue;
    }

    const md = buildMarkdownFile({ meta, body, pubDate: new Date(), video });
    await fs.writeFile(outPath, md, "utf8");
    console.log(`[video]   ✓ saved ${outPath}`);
    processedIds.add(video.videoId);
    produced++;
  }
  return produced;
}


/**
 * Force le traitement d'une video YouTube specifique (par videoId), bypass
 * la recherche par chaine et le filtre trail-related. Utilise pour tester
 * end-to-end ou ingerer une video sourcee manuellement.
 */
async function processSingleVideo(client, videoId, processedIds) {
  console.log(`[video] force-process videoId: ${videoId}`);
  if (processedIds.has(videoId)) {
    console.log("[video]   deja traite, skip");
    return 0;
  }
  const details = await fetchVideoDetails(videoId).catch((e) => { console.error(`[video]   fetchVideoDetails fail: ${e.message}`); return null; });
  if (!details || !details.snippet) {
    console.error("[video]   video introuvable ou API error");
    return 0;
  }
  const video = {
    videoId,
    title: details.snippet.title,
    description: details.snippet.description || "",
    channelTitle: details.snippet.channelTitle,
    publishedAt: details.snippet.publishedAt,
    thumbnail: details.snippet.thumbnails?.maxres?.url || details.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationSec: parseIsoDurationToSeconds(details.contentDetails?.duration),
  };
  console.log(`[video]   ${video.channelTitle} — ${video.title.slice(0, 100)}`);
  if (details.status?.embeddable === false) {
    console.error("[video]   skip : embed desactive par le createur");
    return 0;
  }
  if (video.durationSec > 0 && video.durationSec < 120) {
    console.error(`[video]   skip : video trop courte (${video.durationSec}s)`);
    return 0;
  }
  // On tente d'abord la transcription. Les runners GitHub Actions se font souvent
  // bloquer par YouTube (IPs datacenter detectees comme bots) : les captionTracks
  // ne sont pas servies. Dans ce cas, on tombe en fallback sur la description
  // (fournie par l'API YouTube Data v3, non bloquee). Pour une review produit ou
  // un reportage, la description contient souvent 1-3k chars de matiere dense.
  let transcript = await fetchTranscript(videoId);
  let sourceKind = "transcription";
  if (!transcript || transcript.length < 500) {
    console.warn(`[video]   transcription indisponible (${transcript?.length || 0} chars), fallback sur description`);
    if (video.description && video.description.length >= 500) {
      transcript = video.description;
      sourceKind = "description";
      console.log(`[video]   using description as fallback (${video.description.length} chars)`);
    } else {
      console.error(`[video]   skip : ni transcript ni description exploitables (desc=${video.description?.length || 0} chars)`);
      return 0;
    }
  } else {
    console.log(`[video]   transcript OK (${transcript.length} chars)`);
  }
  let rewritten;
  try {
    rewritten = stripFences(await runClaude(client, video, transcript, sourceKind));
  } catch (e) {
    console.error(`[video]   Claude error: ${e.message}`);
    return 0;
  }
  const parsed = parseFrontmatter(rewritten);
  if (!parsed || !parsed.meta.title || !parsed.meta.excerpt) {
    console.error("[video]   frontmatter incomplet");
    return 0;
  }
  const { meta, body } = parsed;
  meta.categorySlug = meta.categorySlug || "actualites";
  const baseSlug = slugify(meta.title);
  const outPath = path.join(CONTENT_DIR, `${baseSlug}.md`);
  if (existsSync(outPath)) {
    console.error(`[video]   slug doublon (${baseSlug})`);
    return 0;
  }
  const md = buildMarkdownFile({ meta, body, pubDate: new Date(), video });
  await fs.writeFile(outPath, md, "utf8");
  console.log(`[video]   OK saved ${outPath}`);
  return 1;
}

async function main() {
  if (!YOUTUBE_API_KEY) { console.error("YOUTUBE_API_DATA missing"); process.exit(1); }
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY missing"); process.exit(1); }
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const channelArg = args.find((a) => a.startsWith("--channel="));
  const wanted = channelArg ? channelArg.split("=")[1].toLowerCase() : null;
  const videoIdArg = args.find((a) => a.startsWith("--video-id="));
  const forcedVideoId = videoIdArg ? videoIdArg.split("=")[1].trim() : null;

  // Si --video-id est fourni, on bypass totalement la recherche par chaine :
  // on force le traitement de cette video specifique. Utilise pour tester
  // end-to-end ou ingerer manuellement une video dont on connait l URL.
  if (forcedVideoId) {
    const processedIds = await loadProcessedVideoIds();
    console.log(`[video] mode force-video, ${processedIds.size} videoId(s) deja traite(s)`);
    const client = new Anthropic();
    const n = await processSingleVideo(client, forcedVideoId, processedIds).catch((e) => { console.error(`[video] force-process error: ${e.message}`); return 0; });
    console.log(`\n[video] termine — ${n} article(s) produit(s).`);
    return;
  }

  const channels = wanted
    ? WATCHED_CHANNELS.filter((c) => c.name.toLowerCase().includes(wanted) || c.handle.toLowerCase().includes(wanted))
    : WATCHED_CHANNELS;

  if (channels.length === 0) {
    console.error(`[video] no channel matches '${wanted}'`);
    process.exit(1);
  }

  const processedIds = await loadProcessedVideoIds();
  console.log(`[video] ${processedIds.size} videoId(s) déjà traité(s)`);

  const client = new Anthropic();
  let total = 0;
  for (const channel of channels) {
    if (total >= MAX_ARTICLES_PER_RUN) break;
    const remaining = MAX_ARTICLES_PER_RUN - total;
    try {
      total += await processChannel(client, channel, processedIds, remaining);
    } catch (e) {
      console.error(`[video] channel ${channel.name} error: ${e.message}`);
    }
  }

  console.log(`\n[video] terminé — ${total} article(s) produit(s).`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
