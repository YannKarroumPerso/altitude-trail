#!/usr/bin/env node
/**
 * Réécrit en place, avec le nouveau style éditorial analytique, tous les
 * articles existants dans content/articles/ qui ont un sourceUrl (donc issus
 * de veille). Les autres (blessures, rédaction interne) sont laissés intacts.
 *
 * - Lit chaque .md, extrait frontmatter + corps courant.
 * - Retire les images inline du corps (on les réinsère aux bonnes positions après).
 * - Appelle Claude avec le style éditorial partagé + le corps courant comme
 *   matière source. La publication d'origine est dérivée du sourceUrl et passée
 *   à Claude pour qu'il puisse la citer transparemment.
 * - Réinjecte body1 / body2 dans le nouveau corps (mêmes fichiers images).
 * - Écrit .md avec frontmatter préservé, body remplacé.
 *
 * Ne recrée PAS d'images. Ne touche PAS à publish.mjs (à lancer après).
 *
 * Flags :
 *   --force    réécrit même si l'article semble déjà au nouveau style (sinon
 *              on considère que si le script a tourné une fois, inutile de
 *              repasser — mais aucune détection automatique robuste, --force
 *              sert juste à forcer un nouveau run).
 *   --limit N  limiter au N premiers articles (debug)
 */
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import { EDITORIAL_STYLE } from "./lib/editorial-style.mjs";

const CONTENT_DIR = path.resolve("content/articles");
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const FORCE = process.argv.includes("--force");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i >= 0 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

const PUBLICATION_BY_DOMAIN = {
  "lepape-info.com": "Le Pape Info",
  "u-trail.com": "U-Trail",
  "www2.u-trail.com": "U-Trail",
  "passiontrail.fr": "Passion Trail",
  "runactu.com": "RunActu",
  "planetrail.fr": "Planetrail",
  "runninghero.com": "Running Hero",
  "irunfar.com": "iRunFar",
  "www.irunfar.com": "iRunFar",
  "trailrunnermag.com": "Trail Runner Mag",
  "www.trailrunnermag.com": "Trail Runner Mag",
  "ultrarunning.com": "UltraRunning Magazine",
  "trailrunningspain.com": "Trail Running Spain",
  "corsainmontagna.it": "Corsa in Montagna",
  "www.corsainmontagna.it": "Corsa in Montagna",
  "discoveryalps.it": "Discovery Alps",
  "ultrarunningworld.co.uk": "Ultrarunning World",
  "ultrarunnermagazine.co.uk": "Ultra Runner Magazine",
  "www.ultrarunnermagazine.co.uk": "Ultra Runner Magazine",
  "marathonhandbook.com": "Marathon Handbook",
};

function publicationFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (PUBLICATION_BY_DOMAIN[host]) return PUBLICATION_BY_DOMAIN[host];
    const stripped = host.replace(/^www\./, "");
    if (PUBLICATION_BY_DOMAIN[stripped]) return PUBLICATION_BY_DOMAIN[stripped];
    return host;
  } catch {
    return "la publication source";
  }
}

const FORMAT_INSTRUCTIONS = `FORMAT DE SORTIE (RÉÉCRITURE)

Tu reçois le corps d'un article Altitude Trail déjà rédigé à partir d'une source de presse. Tu le réécris intégralement selon le guide ci-dessus.

Réponds UNIQUEMENT avec le nouveau corps markdown (1000-1200 mots). Aucun frontmatter, aucun fence de code, aucune prose d'introduction, aucun titre H1. Commence directement par l'accroche.

Tu peux (et dois) remanier la structure : nouvelles sections, nouveaux intertitres, nouvel ordre. Tu gardes la matière factuelle (chiffres, noms propres, citations entre guillemets présentes dans la source) mais tu refonds tout autour d'un angle éditorial assumé.

Tu cites nommément la publication d'origine quand tu reprends une information spécifique.`;

const SYSTEM_PROMPT = `${EDITORIAL_STYLE}\n\n${FORMAT_INSTRUCTIONS}`;

function stripBodyImages(body) {
  return body
    .replace(/(\n\n|^)!\[[^\]]*\]\([^)]+\)(?=\n\n|\n?$)/g, "$1")
    .replace(/^\s+|\s+$/g, "");
}

function countWords(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function insertImagesInBody(body, refs) {
  if (!refs.length) return body;
  const paragraphs = body.split(/\n{2,}/);
  const total = countWords(body);
  const targets = [200, Math.max(Math.floor(total / 2), 450)];
  const out = [];
  let cum = 0;
  let inserted = 0;
  for (const p of paragraphs) {
    out.push(p);
    cum += countWords(p);
    while (inserted < refs.length && cum >= targets[inserted] && cum < total) {
      const { url, alt } = refs[inserted];
      out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
      inserted++;
    }
  }
  while (inserted < refs.length) {
    const { url, alt } = refs[inserted];
    out.push(`![${alt.replace(/[\[\]]/g, "")}](${url})`);
    inserted++;
  }
  return out.join("\n\n");
}

function userPrompt({ title, sourceUrl, publication, body }) {
  return `Article à réécrire pour Altitude Trail.

Titre : ${title}
Publication d'origine : ${publication}
URL source : ${sourceUrl}

Corps actuel (à refondre entièrement selon le guide éditorial) :

${body}

Écris le nouveau corps. Directement l'accroche, pas d'introduction. 1000-1200 mots. Cite ${publication} nommément quand tu reprends une info spécifique.`;
}

async function rewriteBody(client, { title, sourceUrl, publication, body }) {
  const stream = client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 32000, // partage avec thinking:adaptive
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt({ title, sourceUrl, publication, body }) }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "Claude a atteint max_tokens (stop_reason=max_tokens) - reecriture tronquee, rejetee."
    );
  }
  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  const cleaned = raw
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^---[\s\S]*?\n---\n+/, "")
    .replace(/^#\s+[^\n]+\n+/, "")
    .trim();
  return cleaned;
}

async function main() {
  const entries = await fs.readdir(CONTENT_DIR).catch(() => []);
  const mdFiles = entries.filter((f) => f.endsWith(".md"));
  const client = new Anthropic();

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of mdFiles) {
    if (processed >= LIMIT) break;
    const filePath = path.join(CONTENT_DIR, file);
    const raw = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(raw);

    if (!data.sourceUrl) {
      console.log(`[rewrite] skip ${file} (pas de sourceUrl — article hors veille)`);
      skipped++;
      continue;
    }

    if (!FORCE && data.rewrittenAt) {
      console.log(`[rewrite] skip ${file} (déjà réécrit le ${data.rewrittenAt})`);
      skipped++;
      continue;
    }

    const publication = publicationFromUrl(data.sourceUrl);
    const currentBody = stripBodyImages(content);
    const currentWords = countWords(currentBody);
    if (currentWords < 400) {
      console.warn(`[rewrite] skip ${file} (corps trop court : ${currentWords} mots)`);
      skipped++;
      continue;
    }

    console.log(`[rewrite] ${file} (source ${publication})…`);
    try {
      const newBody = await rewriteBody(client, {
        title: data.title,
        sourceUrl: data.sourceUrl,
        publication,
        body: currentBody,
      });
      const newWords = countWords(newBody);
      if (newWords < 700) {
        console.warn(`[rewrite]   ⚠ corps retourné trop court (${newWords} mots), conservé tel quel`);
      } else {
        console.log(`[rewrite]   new body: ${newWords} mots`);
      }

      const imageRefs = [];
      const slug = data.slug;
      const body1Path = path.resolve(`public/articles/${slug}-1.jpg`);
      const body2Path = path.resolve(`public/articles/${slug}-2.jpg`);
      try { await fs.access(body1Path); imageRefs.push({ url: `/articles/${slug}-1.jpg`, alt: `Illustration ${data.category}` }); } catch {}
      try { await fs.access(body2Path); imageRefs.push({ url: `/articles/${slug}-2.jpg`, alt: `Illustration ${data.category}` }); } catch {}
      const bodyWithImages = insertImagesInBody(newBody, imageRefs);

      const newData = { ...data, rewrittenAt: new Date().toISOString().slice(0, 10) };
      const updated = matter.stringify(bodyWithImages, newData);
      await fs.writeFile(filePath, updated, "utf8");
      console.log(`[rewrite]   saved`);
      processed++;
    } catch (e) {
      console.error(`[rewrite] ${file}: FAILED — ${e.message}`);
      failed++;
    }
  }

  console.log(`[rewrite] terminé — ${processed} réécrit(s), ${skipped} passé(s), ${failed} échec(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
