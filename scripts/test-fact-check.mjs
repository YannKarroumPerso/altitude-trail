#!/usr/bin/env node
// Script de test du fact-checker. Mode dry-run, lit un article markdown et
// affiche le score + decision.
//
// Usage : node scripts/test-fact-check.mjs <path/to/article.md>

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { factCheckArticle, notifyIfDoubt } from "./lib/fact-checker.mjs";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage : node scripts/test-fact-check.mjs <path/to/article.md>");
    process.exit(1);
  }
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);
  const article = {
    slug: data.slug || path.basename(filePath, ".md"),
    title: data.title,
    content,
    externalRefs: data.externalRefs || [],
    tags: data.tags || [],
    hotEventSlug: data.hotEventSlug,
  };
  console.log(`\n[test] Fact-check : ${article.slug}`);
  console.log(`[test] Title : ${article.title}`);
  const result = await factCheckArticle(article);
  console.log(`\n[result] Score : ${result.score}/100`);
  console.log(`[result] Decision : ${result.decision}`);
  console.log(`[result] Summary : ${result.summary}`);
  console.log(`[result] Issues :`);
  result.issues.forEach((i) => console.log(`  - ${i}`));

  const notif = await notifyIfDoubt(article, result);
  console.log(`\n[notif]`, notif);
}

main().catch((e) => { console.error(e); process.exit(1); });
