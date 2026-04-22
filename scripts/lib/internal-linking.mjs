// Maillage interne automatisé pour les nouveaux articles.
// Au moment de publier, on cherche 2 articles déjà en ligne les plus
// sémantiquement proches (similarité de tags + mots-clés du titre + catégorie)
// et on demande à Claude d'insérer des liens contextuels dans le corps.

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("content/articles");

// Score de similarité simple entre deux ensembles de mots-clés (tags + title).
// Combinaison :
//   - tags en commun : 3 pts chacun
//   - mot-clé significatif en commun (>=4 lettres) : 1 pt chacun
//   - catégorie identique : +2 pts
function similarityScore(a, b) {
  const tagsA = new Set((a.tags || []).map((t) => normalize(t)));
  const tagsB = new Set((b.tags || []).map((t) => normalize(t)));
  let score = 0;
  for (const t of tagsA) if (tagsB.has(t)) score += 3;

  const wordsA = extractWords(a.title);
  const wordsB = extractWords(b.title);
  for (const w of wordsA) if (wordsB.has(w)) score += 1;

  if (a.categorySlug && a.categorySlug === b.categorySlug) score += 2;
  return score;
}

const STOPWORDS = new Set([
  "pour", "avec", "dans", "votre", "vos", "sans", "plus", "moins", "mais",
  "tout", "tous", "sont", "être", "avoir", "cette", "leur", "leurs", "comme",
  "faire", "bien", "même", "quoi", "quand", "leur", "celui", "celle",
  "celui-ci", "celle-ci", "cela", "alors", "ainsi", "parce", "lors",
]);

function extractWords(s) {
  const out = new Set();
  for (const w of normalize(s).split(/\s+/)) {
    if (w.length >= 4 && !STOPWORDS.has(w)) out.add(w);
  }
  return out;
}

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Charge tous les articles existants (metadata seule, pas le body).
export async function loadExistingArticles() {
  const files = await fs.readdir(CONTENT_DIR).catch(() => []);
  const articles = [];
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    try {
      const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
      const parsed = matter(raw);
      const data = parsed.data || {};
      if (!data.slug || !data.title) continue;
      articles.push({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt || "",
        tags: data.tags || [],
        categorySlug: data.categorySlug || "",
      });
    } catch {
      // skip
    }
  }
  return articles;
}

// Trouve les N articles les plus proches d'un nouvel article (par défaut 2).
// Exclut un slug éventuel de la liste (utile si on veut éviter l'auto-link).
export function findTopRelated(newArticle, existingArticles, n = 2, excludeSlug) {
  const scored = existingArticles
    .filter((a) => a.slug !== excludeSlug)
    .map((a) => ({ article: a, score: similarityScore(newArticle, a) }))
    .filter((x) => x.score >= 3) // seuil minimal : au moins 1 tag commun OU catégorie + mot-clé
    .sort((x, y) => y.score - x.score);
  return scored.slice(0, n).map((x) => x.article);
}

// Insère jusqu'à N liens markdown dans le corps en ciblant des passages
// pertinents. Simple et robuste : on cherche la première occurrence d'un
// mot-clé du titre de l'article cible dans un paragraphe, et on encapsule
// ce mot-clé dans un lien markdown. Si aucun match, on ajoute une ligne
// "À lire aussi" après le premier H2.
export function insertInternalLinks(body, relatedArticles, siteUrl) {
  if (!relatedArticles.length) return body;

  let out = body;
  const inserted = new Set();

  for (const related of relatedArticles) {
    // Mots-clés longs du titre cible
    const keywords = [...extractWords(related.title)].sort((a, b) => b.length - a.length);

    let placed = false;
    for (const kw of keywords) {
      if (placed) break;
      // Regex insensible aux accents/casse, match d'un mot entier, dans un
      // paragraphe classique (évite les lignes H2/H3/liste/quote)
      const re = new RegExp(`(^|[^\\w])(${escapeReg(kw)})(?![\\w-])`, "i");
      const lines = out.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          !line ||
          line.startsWith("#") ||
          line.startsWith(">") ||
          line.startsWith("- ") ||
          line.startsWith("!") ||
          line.startsWith("[")
        ) continue;
        if (/\[([^\]]+)\]\([^)]+\)/.test(line)) continue; // paragraphe déjà avec lien
        const m = line.match(re);
        if (m && !inserted.has(related.slug)) {
          const url = `${siteUrl}/articles/${related.slug}`;
          lines[i] = line.replace(m[0], `${m[1]}[${m[2]}](${url})`);
          inserted.add(related.slug);
          placed = true;
          break;
        }
      }
      out = lines.join("\n");
    }
  }

  // Fallback pour les articles non placés : injecte une ligne "À lire aussi"
  // après le premier paragraphe (après le premier \n\n suivant un texte)
  const notPlaced = relatedArticles.filter((r) => !inserted.has(r.slug));
  if (notPlaced.length) {
    const links = notPlaced
      .map((r) => `[${r.title}](${siteUrl}/articles/${r.slug})`)
      .join(" · ");
    const snippet = `\n\n*À lire aussi : ${links}*\n`;
    const lines = out.split("\n");
    // Cherche la fin du premier paragraphe après la première ligne non vide
    let placed = false;
    for (let i = 1; i < lines.length - 1; i++) {
      if (lines[i].trim() === "" && lines[i - 1].trim() !== "" && !lines[i - 1].startsWith("#")) {
        lines.splice(i + 1, 0, snippet);
        placed = true;
        break;
      }
    }
    out = placed ? lines.join("\n") : out + snippet;
  }

  return out;
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
