// scripts/lib/image-generation.mjs
//
// Generation d'images via Nano Banana 2 Flash (Gemini API).
// Remplace l'ancien pipeline Flux Pro 1.1 (fal.run) precedemment duplique
// dans plusieurs scripts. Sortie : JPEG 16:9 (~1376x768 px).
//
// Prerequis : GEMINI_API_KEY dans process.env.

import fs from "node:fs/promises";
import path from "node:path";

// Nano Banana 2 Pro : meilleure qualite, moins sature que Flash (qui a tape
// 100% de 503 lors du run #25812789183 du 2026-05-13). Cout : 0.06$/image
// contre 0.01$ pour Flash. Acceptable car parc total petit (~150 articles).
const GEMINI_MODEL = "gemini-3-pro-image-preview"; // Nano Banana 2 Pro
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Style suffix repris a l'identique de l'ancien pipeline Flux.
export const STYLE_SUFFIX =
  ", cinematic trail running photography, summer mountain trail, dirt and rocky singletrack, dramatic natural lighting, shallow depth of field, 35mm film, ultra realistic, editorial magazine style, no skiing, no snow, no winter gear";

// Max retries baisse de 8 a 5 : avec backoff exponentiel 5s+15s+45s+90s+180s,
// on plafonne le temps d'attente par image a ~5.5 min, ce qui laisse de la marge
// pour traiter plusieurs articles dans un timeout GH Actions de 30 min.
// Au-dela, on skip l'article : on preferera retenter dans un run ulterieur
// plutot que de griller l'entiere fenetre sur un seul article.
const MAX_RETRIES = 5;
const DEFAULT_RETRY_DELAY_MS = 5000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractRetryDelayMs(errBody) {
  // Le 429 Gemini renvoie un message contenant souvent : "retryDelay": "28s"
  try {
    const txt = typeof errBody === "string" ? errBody : JSON.stringify(errBody || "");
    const m = txt.match(/retryDelay["\'\s:]+(\d+)s/i);
    if (m) return Number(m[1]) * 1000;
  } catch {}
  return DEFAULT_RETRY_DELAY_MS;
}

/**
 * Genere une image avec Nano Banana 2 Flash.
 * L'API renvoie un JPEG en 16:9 (~1376x768 px).
 *
 * @param {string} prompt - prompt en anglais, le suffix style est applique automatiquement.
 * @param {object} [options]
 * @param {boolean} [options.appendStyleSuffix=true] - desactive l'ajout automatique du suffix style.
 * @param {string} [options.aspectRatio="16:9"]
 * @returns {Promise<Buffer>} Buffer (JPEG) renvoye par Gemini.
 */
export async function generateImage(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY manquante");
  const appendStyleSuffix = options.appendStyleSuffix !== false;
  const aspectRatio = options.aspectRatio || "16:9";
  const fullPrompt = appendStyleSuffix
    ? `${(prompt || "").trim()}${STYLE_SUFFIX}`
    : (prompt || "").trim();

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio },
    },
  };

  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Retry agressif sur 429 (rate limit), 503 (service unavailable),
    // 500 (internal server error transitoire). Backoff exponentiel avec
    // jitter pour ne pas spammer en cas de saturation Gemini.
    if (res.status === 429 || res.status === 503 || res.status === 500) {
      const errText = await res.text().catch(() => "");
      // Pour 429 : utilise le retryDelay renvoye par Gemini si fourni.
      // Pour 503/500 : backoff exponentiel 5s, 15s, 45s, 90s, 180s, 300s...
      const expBackoff = Math.min(300, 5 * Math.pow(3, attempt)) * 1000;
      const jitter = Math.random() * 2000;
      const delay = res.status === 429
        ? extractRetryDelayMs(errText)
        : expBackoff + jitter;
      lastErr = new Error(`gemini ${res.status}: ${errText.slice(0, 200)}`);
      if (attempt < MAX_RETRIES - 1) {
        console.warn(`  gemini ${res.status} retry in ${Math.round(delay/1000)}s (attempt ${attempt+1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }
      throw lastErr;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`gemini ${res.status}: ${text.slice(0, 250)}`);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    // parts[0] est parfois un texte d'intro ("Here's your image") -> on filtre
    // et on prend la premiere part qui contient un inlineData.
    const imagePart = parts.find((p) => p?.inlineData?.data);
    if (!imagePart) {
      throw new Error(
        `gemini: aucune image dans la reponse (parts=${parts.length})`
      );
    }
    return Buffer.from(imagePart.inlineData.data, "base64");
  }
  throw lastErr || new Error("gemini: retries exhausted");
}

/**
 * Sauve un buffer image sur disque.
 * Nano Banana 2 renvoie deja un JPEG, donc on ecrit les bytes bruts ; l'extension
 * du fichier (.jpg ou .png) est purement cosmetique cote frontmatter Markdown.
 */
export async function saveImage(buffer, destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
  return destPath;
}
