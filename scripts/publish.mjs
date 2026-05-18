#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import matter from "gray-matter";

import { readFileSync as _readSync, existsSync as _existsSync } from "node:fs";

// Resolution du PAT GitHub. Priorite .secrets/github_token.txt (nouveau pattern),
// fallback .claude-git-token (legacy, a supprimer dans 2-3 sessions).
// Utilise par les scripts qui doivent forger une URL git avec credentials.
export function resolveGithubToken() {
  const repoRoot = path.resolve(".");
  const newPath = path.join(repoRoot, ".secrets", "github_token.txt");
  const legacyPath = path.join(repoRoot, ".claude-git-token");
  if (_existsSync(newPath)) return _readSync(newPath, "utf8").trim();
  if (_existsSync(legacyPath)) {
    console.warn("[publish] WARN .claude-git-token deprecated, migrate to .secrets/github_token.txt");
    return _readSync(legacyPath, "utf8").trim();
  }
  return null;
}

const CONTENT_DIR = path.resolve("content/articles");
const DATA_PATH = path.resolve("src/lib/data.ts");
const START_MARKER = "// AUTO-ARTICLES:START";
const END_MARKER = "// AUTO-ARTICLES:END";

function parseFrenchDate(str) {
  const months = { janvier:0, "février":1, mars:2, avril:3, mai:4, juin:5, juillet:6, "août":7, septembre:8, octobre:9, novembre:10, "décembre":11 };
  const m = str?.match?.(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
  if (!m) return new Date(0);
  const month = months[m[2].toLowerCase()];
  if (month == null) return new Date(0);
  return new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
}

async function loadArticles() {
  const entries = await fs.readdir(CONTENT_DIR).catch(() => []);
  const articles = [];
  for (const file of entries) {
    if (!file.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw);
    if (!data.slug || !data.title || !data.categorySlug) {
      console.warn(`[publish] skipping ${file}: missing required frontmatter`);
      continue;
    }
    // Sanity check : filename doit correspondre au slug frontmatter, sinon le
    // site servira l'article sous le slug frontmatter (via data.ts) pendant
    // que Google/sitemap peut avoir indexe l'URL filename -> 404.
    // Si detection : warning clair pour ajouter un 301 dans next.config.ts.
    const filenameSlug = file.replace(/\.md$/, "");
    if (filenameSlug !== data.slug) {
      console.warn(`[publish] MISMATCH filename vs frontmatter slug :\n    filename = ${filenameSlug}\n    fm slug  = ${data.slug}\n  -> ajoute un 301 dans next.config.ts pour eviter le 404 sur l'ancienne URL.`);
    }
    // Linter titres > 75 chars (decision 2026-05-18, Google Discover tronque a ~70)
    const titleLen = String(data.title || "").length;
    if (titleLen > 75) {
      console.warn(`[publish] WARN title length ${titleLen} > 75 chars : "${data.title}" (file ${file}) — Discover tronquera. Considere a raccourcir.`);
    }
    articles.push({
      slug: String(data.slug),
      title: String(data.title),
      excerpt: String(data.excerpt || ""),
      category: String(data.category || ""),
      categorySlug: String(data.categorySlug),
      author: String(data.author || "Rédaction Altitude"),
      date: String(data.date || ""),
      updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
      publishedAt: data.publishedAt ? String(data.publishedAt) : undefined,
      readTime: String(data.readTime || "7 min"),
      image: String(data.image || ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      youtubeVideoId: data.youtubeVideoId ? String(data.youtubeVideoId) : undefined,
      youtubeTitle: data.youtubeTitle ? String(data.youtubeTitle) : undefined,
      youtubeChannel: data.youtubeChannel ? String(data.youtubeChannel) : undefined,
      youtubeDuration: typeof data.youtubeDuration === "number" ? data.youtubeDuration : undefined,
      youtubeUploadDate: data.youtubeUploadDate ? String(data.youtubeUploadDate) : undefined,
      externalRefs: Array.isArray(data.externalRefs)
        ? data.externalRefs
            .filter((r) => r && r.url)
            .map((r) => ({ url: String(r.url), label: String(r.label || r.url) }))
        : undefined,
      isLive: data.isLive === true ? true : undefined,
      hotEventSlug: data.hotEventSlug ? String(data.hotEventSlug) : undefined,
      articleType: data.articleType === "brief" ? "brief" : undefined,
      briefVertical: (() => {
        const v = data.briefVertical ? String(data.briefVertical) : "";
        return (v === "equipement" || v === "marques-industrie" || v === "athletes") ? v : undefined;
      })(),
      content: content.trim(),
    });
  }
  // Tri par publishedAt ISO si disponible (precision intra-jour), fallback
  // sur parseFrenchDate(date) qui resolve au jour. Critique pour Discover :
  // avant ce fix, 5 articles publies le meme jour sortaient en ordre quasi
  // aleatoire car parseFrenchDate retournait la meme valeur jour pour tous.
  articles.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : NaN;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : NaN;
    const va = isNaN(ta) ? parseFrenchDate(a.date).getTime() : ta;
    const vb = isNaN(tb) ? parseFrenchDate(b.date).getTime() : tb;
    return vb - va;
  });
  return articles;
}

function renderArticlesTs(articles) {
  if (!articles.length) return "const generatedArticles: Article[] = [];";
  const entries = articles.map((a) => {
    const fields = [
      `    slug: ${JSON.stringify(a.slug)}`,
      `    title: ${JSON.stringify(a.title)}`,
      `    excerpt: ${JSON.stringify(a.excerpt)}`,
      `    category: ${JSON.stringify(a.category)}`,
      `    categorySlug: ${JSON.stringify(a.categorySlug)}`,
      `    author: ${JSON.stringify(a.author)}`,
      `    date: ${JSON.stringify(a.date)}`,
      ...(a.updatedAt ? [`    updatedAt: ${JSON.stringify(a.updatedAt)}`] : []),
      ...(a.publishedAt ? [`    publishedAt: ${JSON.stringify(a.publishedAt)}`] : []),
      `    readTime: ${JSON.stringify(a.readTime)}`,
      `    image: ${JSON.stringify(a.image)}`,
      `    tags: ${JSON.stringify(a.tags)}`,
      ...(a.youtubeVideoId ? [`    youtubeVideoId: ${JSON.stringify(a.youtubeVideoId)}`] : []),
      ...(a.youtubeTitle ? [`    youtubeTitle: ${JSON.stringify(a.youtubeTitle)}`] : []),
      ...(a.youtubeChannel ? [`    youtubeChannel: ${JSON.stringify(a.youtubeChannel)}`] : []),
      ...(a.youtubeDuration ? [`    youtubeDuration: ${a.youtubeDuration}`] : []),
      ...(a.youtubeUploadDate ? [`    youtubeUploadDate: ${JSON.stringify(a.youtubeUploadDate)}`] : []),
      ...(a.externalRefs && a.externalRefs.length
        ? [`    externalRefs: ${JSON.stringify(a.externalRefs)}`]
        : []),
      ...(a.isLive ? [`    isLive: true`] : []),
      ...(a.hotEventSlug ? [`    hotEventSlug: ${JSON.stringify(a.hotEventSlug)}`] : []),
      ...(a.articleType ? [`    articleType: ${JSON.stringify(a.articleType)}`] : []),
      ...(a.briefVertical ? [`    briefVertical: ${JSON.stringify(a.briefVertical)}`] : []),
      `    content: ${JSON.stringify(a.content)}`,
    ].join(",\n");
    return `  {\n${fields},\n  }`;
  }).join(",\n");
  return `const generatedArticles: Article[] = [\n${entries},\n];`;
}

async function updateDataFile(articles) {
  const current = await fs.readFile(DATA_PATH, "utf8");
  const startIdx = current.indexOf(START_MARKER);
  const endIdx = current.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`sentinels "${START_MARKER}" / "${END_MARKER}" introuvables dans ${DATA_PATH}`);
  }
  const before = current.slice(0, startIdx + START_MARKER.length);
  const after = current.slice(endIdx);
  const body = renderArticlesTs(articles);
  const next = `${before}\n${body}\n${after}`;
  if (next === current) return false;
  await fs.writeFile(DATA_PATH, next, "utf8");
  return true;
}

function hasGitChanges() {
  const out = execSync("git status --porcelain", { encoding: "utf8" });
  return out.trim().length > 0;
}

async function commitAndPush(count) {
  if (!hasGitChanges()) {
    console.log("[publish] aucun changement à committer.");
    return;
  }
  execSync("git add content/articles public/articles src/lib/data.ts", { stdio: "inherit" });
  // Recheck APRES git add : si nos paths surveilles n ont pas de diff (le git
  // status positif venait d ailleurs, par exemple un package-lock.json modifie
  // par npm install), on skip le commit proprement plutot que de faire echouer
  // le workflow avec "nothing to commit".
  const stagedOut = execSync("git diff --cached --name-only", { encoding: "utf8" });
  if (!stagedOut.trim()) {
    console.log("[publish] git add n a rien stage dans content/articles, public/articles ou data.ts ; skip commit.");
    return;
  }
  const msg = `chore(veille): publication de ${count} article(s)`;
  execSync(`git commit -m ${JSON.stringify(msg)}`, { stdio: "inherit" });

  // Retry push avec rebase : si d'autres commits sont arrivés entre-temps,
  // on rebase puis on retente. Protège contre les pushs concurrents.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execSync("git push", { stdio: "inherit" });
      console.log(`[publish] push reussi (attempt ${attempt})`);
      return;
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(`[publish] push echec apres ${maxAttempts} tentatives`);
      }
      console.warn(`[publish] push echec attempt ${attempt}, rebase + retry...`);
      try {
        // --autostash : npm install modifie package-lock.json avant que publish.mjs
        // ne tourne, ce qui laisse la working tree dirty. Sans --autostash le rebase
        // echoue avec "You have unstaged changes". Avec, git stash temporairement ces
        // modifs, fait le rebase, puis les restaure.
        execSync("git pull --rebase --autostash origin main", { stdio: "inherit" });
      } catch (pullErr) {
        // RECOVERY DATA.TS CONFLICT (2026-05-18 task #34) :
        // Le rebase rate quand 2 crons publient en parallele et modifient tous deux
        // src/lib/data.ts. Le merge auto echoue parce que les diffs ressemblent.
        // Strategie de recuperation : abort, reset hard sur origin/main (qui contient
        // deja TOUS les .md du remote), regenere data.ts a partir de content/articles/
        // (qui contient TOUS les .md, locaux + remote car ils ont des slugs uniques
        // donc pas de collision possible), recommit et retry push.
        try {
          const conflictedRaw = execSync("git diff --name-only --diff-filter=U", { encoding: "utf8" }).trim();
          const conflictedFiles = conflictedRaw.split("\n").filter(Boolean);
          const onlyDataConflict = conflictedFiles.length === 1 && conflictedFiles[0] === "src/lib/data.ts";
          if (onlyDataConflict) {
            console.warn("[publish] conflit data.ts seul detecte, recovery automatique...");
            // 1) Sortir du rebase
            try { execSync("git rebase --abort", { stdio: "inherit" }); } catch {}
            // 2) Stash nos changements (notamment les nouveaux .md ajoutes)
            //    --include-untracked pour capturer aussi les nouveaux fichiers
            execSync("git stash push --include-untracked -m publish-conflict-recovery", { stdio: "inherit" });
            // 3) Synchro sur origin/main propre
            execSync("git fetch origin main", { stdio: "inherit" });
            execSync("git reset --hard origin/main", { stdio: "inherit" });
            // 4) Restaurer nos .md
            try {
              execSync("git stash pop", { stdio: "inherit" });
            } catch (popErr) {
              // Si stash pop conflict (cas rare : meme .md ajoute en parallele),
              // on accepte les modifs distantes (les notres restent dans stash a
              // recuperer manuellement, mais le run survit).
              console.warn("[publish] stash pop conflict, on garde origin/main propre:", popErr.message);
              execSync("git checkout --theirs .", { stdio: "inherit" });
              execSync("git stash drop", { stdio: "inherit" });
            }
            // 5) Regenerer data.ts a partir de TOUS les .md actuels (locaux + remote)
            const reloaded = await loadArticles();
            await updateDataFile(reloaded);
            // 6) Re-stage et recommit
            execSync("git add content/articles public/articles src/lib/data.ts", { stdio: "inherit" });
            const reStaged = execSync("git diff --cached --name-only", { encoding: "utf8" });
            if (reStaged.trim()) {
              const recoveryMsg = `chore(veille): publication de ${reloaded.length} article(s) [recovery merge]`;
              execSync(`git commit -m ${JSON.stringify(recoveryMsg)}`, { stdio: "inherit" });
              console.log("[publish] recovery commit cree, retry push au prochain tour");
            } else {
              console.log("[publish] rien a recommit apres recovery (deja inclus dans origin/main)");
            }
            continue; // retry push
          }
        } catch (recoveryErr) {
          console.error("[publish] recovery echec:", recoveryErr);
        }
        console.error("[publish] rebase echec (non recoverable):", pullErr);
        throw pullErr;
      }
    }
  }
}

async function main() {
  await fs.mkdir(path.resolve("public/articles"), { recursive: true });
  const articles = await loadArticles();
  console.log(`[publish] ${articles.length} article(s) dans content/articles/`);
  const updated = await updateDataFile(articles);
  console.log(updated ? "[publish] src/lib/data.ts mis à jour." : "[publish] src/lib/data.ts inchangé.");
  await commitAndPush(articles.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
