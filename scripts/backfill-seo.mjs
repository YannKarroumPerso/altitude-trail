#!/usr/bin/env node
// Backfill SEO lot 1 : applique sur les articles existants les enrichissements
// que la veille pose désormais automatiquement pour les nouveaux articles.
//
// Passes appliquées (par ordre, idempotent) :
//   1) Auteur nommé via pickAuthorForCategory (si signé "Rédaction ...")
//   2) 2 liens internes contextuels (si aucun déjà présent)
//   3) Recherche YouTube (si pas de vidéo déjà attachée)
//   4) 2-4 références externes via Claude (whitelist + validation HTTP)
//   5) Bump updatedAt = date du jour
//
// Usage :
//   npm run backfill-seo                       # full
//   npm run backfill-seo -- --no-llm           # skip Claude (externalRefs)
//   npm run backfill-seo -- --no-yt            # skip YouTube
//   npm run backfill-seo -- --no-llm --no-yt   # seulement auteur + liens + updatedAt
//   npm run backfill-seo -- --dry              # aucune ecriture
//   npm run backfill-seo -- --limit=10         # N premiers articles
//
// Env : ANTHROPIC_API_KEY (pour --llm), YOUTUBE_API_DATA (pour --yt).

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import Anthropic from "@anthropic-ai/sdk";

import { pickAuthorForCategory } from "./lib/authors.mjs";
import {
  authorityDomainsListForPrompt,
  isAllowedHost,
  urlIsAlive,
} from "./lib/authority-domains.mjs";
import {
  loadExistingArticles,
  findTopRelated,
  insertInternalLinks,
} from "./lib/internal-linking.mjs";
import { findYouTubeVideoForArticle } from "./lib/youtube-search.mjs";

const CONTENT_DIR = path.resolve("content/articles");
const SITE_URL = (process.env.SITE_BASE_URL || "https://www.altitude-trail.fr").replace(/\/$/, "");
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const argv = new Set(process.argv.slice(2));
const noLlm = argv.has("--no-llm");
const noYt = argv.has("--no-yt");
const dry = argv.has("--dry");
const limitArg = [...argv].find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

const FR_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
function todayFr() {
  const d = new Date();
  return `${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const EXTERNAL_REFS_SYSTEM = `Tu proposes des references externes FIABLES pour des articles editoriaux trail running publies sur altitude-trail.fr.

Tu choisis UNIQUEMENT des URLs dans la whitelist suivante, et uniquement des pages dont tu es absolument sur qu'elles existent. En cas de doute, tu privilegies la page d'accueil du domaine autorise plutot qu'une URL profonde speculative.

Whitelist :
${authorityDomainsListForPrompt()}

Tu reponds UNIQUEMENT en JSON strict, format :
{"refs":[{"url":"https://...","label":"Titre descriptif"}, ...]}

Regles :
- 2 a 4 references maximum
- Labels descriptifs en francais
- Preferer la page d'accueil si pas sur de la page profonde
- 0 reference si rien de pertinent
- Aucun texte hors JSON`;

function buildExternalRefsPrompt(article) {
  return `Article a referencer :

Titre : ${article.title}
Categorie : ${article.category} (${article.categorySlug})
Extrait : ${article.excerpt}
Tags : ${(article.tags || []).join(", ")}

Debut du corps :
${(article.body || "").slice(0, 1500)}

Propose 2 a 4 references externes pertinentes dans la whitelist.`;
}

async function generateExternalRefs(client, article) {
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: EXTERNAL_REFS_SYSTEM,
      messages: [{ role: "user", content: buildExternalRefsPrompt(article) }],
    });
    const text = msg.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return [];
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return Array.isArray(parsed.refs) ? parsed.refs : [];
  } catch (e) {
    console.warn(`  externalRefs Claude error: ${e.message}`);
    return [];
  }
}

async function validateExternalRefs(refs) {
  if (!Array.isArray(refs)) return [];
  const out = [];
  for (const ref of refs.slice(0, 4)) {
    if (!ref?.url || !ref?.label) continue;
    if (!isAllowedHost(ref.url)) {
      console.log(`    ref rejetee (hors whitelist) : ${ref.url}`);
      continue;
    }
    const alive = await urlIsAlive(ref.url);
    if (!alive) {
      console.log(`    ref rejetee (HTTP mort) : ${ref.url}`);
      continue;
    }
    out.push({ url: ref.url, label: ref.label });
  }
  return out;
}

async function main() {
  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md")).sort();
  const toProcess = files.slice(0, LIMIT);
  console.log(`[backfill] ${toProcess.length} articles (dry=${dry}, no-llm=${noLlm}, no-yt=${noYt})\n`);

  const client = noLlm ? null : new Anthropic();
  const allArticlesIndex = await loadExistingArticles();

  let stats = {
    authorAssigned: 0,
    internalLinksAdded: 0,
    youtubeFound: 0,
    externalRefsAdded: 0,
    updatedAtBumped: 0,
    unchanged: 0,
    errors: 0,
  };

  for (let i = 0; i < toProcess.length; i++) {
    const file = toProcess[i];
    const filePath = path.join(CONTENT_DIR, file);
    console.log(`[${i + 1}/${toProcess.length}] ${file}`);

    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      const data = { ...parsed.data };
      let body = parsed.content;
      let changed = false;

      const authorLower = String(data.author || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const needsAuthor = !data.author || /^\s*redaction\b/i.test(authorLower) || String(data.author).trim() === "";
      if (needsAuthor && data.categorySlug) {
        const picked = pickAuthorForCategory(
          String(data.categorySlug),
          data.slug || data.title || file
        );
        data.author = picked.name;
        stats.authorAssigned++;
        changed = true;
        console.log(`  + auteur : ${picked.name}`);
      }

      const internalRx = new RegExp(
        `\\[[^\\]]+\\]\\(${SITE_URL.replace(/[.\/\-]/g, "\\$&")}/articles/[^)]+\\)`,
        "i"
      );
      const hasInternalLinks = internalRx.test(body);
      if (!hasInternalLinks) {
        const newArticleMeta = {
          slug: data.slug,
          title: data.title,
          tags: data.tags || [],
          categorySlug: data.categorySlug || "",
        };
        const related = findTopRelated(newArticleMeta, allArticlesIndex, 2, data.slug);
        if (related.length) {
          body = insertInternalLinks(body, related, SITE_URL);
          stats.internalLinksAdded += related.length;
          changed = true;
          console.log(`  + ${related.length} liens internes`);
        }
      }

      if (!noYt && !data.youtubeVideoId) {
        try {
          const yt = await findYouTubeVideoForArticle({ title: data.title, tags: data.tags });
          if (yt) {
            data.youtubeVideoId = yt.videoId;
            data.youtubeTitle = yt.title;
            if (yt.channel) data.youtubeChannel = yt.channel;
            if (yt.duration) data.youtubeDuration = yt.duration;
            if (yt.uploadDate) data.youtubeUploadDate = yt.uploadDate;
            stats.youtubeFound++;
            changed = true;
            console.log(`  + YouTube : ${yt.title.slice(0, 60)}`);
          }
        } catch (e) {
          console.warn(`  ! YouTube error : ${e.message}`);
        }
      }

      if (!noLlm && client && (!data.externalRefs || data.externalRefs.length === 0)) {
        const proposed = await generateExternalRefs(client, {
          title: data.title,
          excerpt: data.excerpt,
          category: data.category,
          categorySlug: data.categorySlug,
          tags: data.tags,
          body,
        });
        if (proposed.length) {
          const validated = await validateExternalRefs(proposed);
          if (validated.length) {
            data.externalRefs = validated;
            stats.externalRefsAdded += validated.length;
            changed = true;
            console.log(`  + ${validated.length}/${proposed.length} refs externes`);
          }
        }
      }

      if (changed) {
        data.updatedAt = todayFr();
        stats.updatedAtBumped++;
      }

      if (!changed) {
        stats.unchanged++;
        console.log(`  - inchange`);
        continue;
      }

      const out = matter.stringify(body, data);
      if (dry) {
        console.log(`  > (dry) pas d ecriture`);
      } else {
        await fs.writeFile(filePath, out, "utf8");
        console.log(`  > ecrit`);
      }
    } catch (e) {
      stats.errors++;
      console.error(`  X ERREUR : ${e.message}`);
    }

    if (!noYt || !noLlm) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  console.log("\n=== RECAP ===");
  console.log(`  Auteurs attribues      : ${stats.authorAssigned}`);
  console.log(`  Liens internes ajoutes : ${stats.internalLinksAdded}`);
  console.log(`  Videos YouTube         : ${stats.youtubeFound}`);
  console.log(`  Refs externes ajoutees : ${stats.externalRefsAdded}`);
  console.log(`  updatedAt bumpes       : ${stats.updatedAtBumped}`);
  console.log(`  Sans changement        : ${stats.unchanged}`);
  console.log(`  Erreurs                : ${stats.errors}`);
  if (dry) console.log("\n(Dry-run - aucune ecriture)");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
