#!/usr/bin/env node
// Passe de nettoyage sur les articles existants pour appliquer les nouvelles
// règles de style :
//   1. Cadratins (—) → virgule ou rien selon le contexte
//   2. Tiret semi-cadratin (–) → virgule
//   3. Prix en dollars ($X ou X$) → "environ X €" avec conversion approximative
//   4. Prix en livres (£X) → "environ X €"
//
// Usage :
//   node scripts/fix-editorial-style.mjs                      # tout le corpus
//   node scripts/fix-editorial-style.mjs -- --limit=5         # 5 articles
//   node scripts/fix-editorial-style.mjs -- --slug=my-article # un seul
//   node scripts/fix-editorial-style.mjs -- --dry             # simulation
//
// Idempotent : repasse le script plusieurs fois sans créer de doublons.

import fs from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.resolve("content/articles");

const args = new Set(process.argv.slice(2));
const dry = args.has("--dry");
const limitArg = [...args].find((a) => a.startsWith("--limit="));
const slugArg = [...args].find((a) => a.startsWith("--slug="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
const TARGET_SLUG = slugArg ? slugArg.split("=")[1] : null;

// Taux de conversion approximatifs (à ajuster dans le temps)
const USD_TO_EUR = 0.92;
const GBP_TO_EUR = 1.15;
const CHF_TO_EUR = 1.05;

function round10(n) {
  return Math.round(n / 10) * 10;
}

function replaceEmDashes(text) {
  // Stratégie : on remplace "— " et " —" par ", " (virgule + espace)
  // Séparateurs combinés comme " — " → ", "
  // Au cas où le cadratin est en début/fin de phrase (rare) on met une virgule.
  let out = text;

  // Cadratins avec espaces autour
  out = out.replace(/\s—\s/g, ", ");
  out = out.replace(/\s–\s/g, ", ");
  // Cadratin collé à un mot (rare dans de la prose)
  out = out.replace(/—/g, ", ");
  out = out.replace(/–/g, ", ");

  // Nettoyage : virgules en double
  out = out.replace(/,\s*,/g, ",");
  // Espace avant virgule : retirer
  out = out.replace(/\s+,/g, ",");
  // Espace avant point : retirer
  out = out.replace(/\s+\./g, ".");

  return out;
}

function replaceCurrencies(text) {
  let out = text;

  // $XXX ou XXX$ → "environ X €" (avec arrondi à 10)
  out = out.replace(/\$\s?(\d[\d,.\s]*)/g, (_m, num) => {
    const n = parseFloat(num.replace(/[\s,]/g, ""));
    if (isNaN(n)) return `environ ${num.trim()} €`;
    return `environ ${round10(n * USD_TO_EUR)} €`;
  });
  out = out.replace(/(\d[\d,.\s]*)\s?\$/g, (_m, num) => {
    const n = parseFloat(num.replace(/[\s,]/g, ""));
    if (isNaN(n)) return `environ ${num.trim()} €`;
    return `environ ${round10(n * USD_TO_EUR)} €`;
  });

  // £XXX → "environ X €"
  out = out.replace(/£\s?(\d[\d,.\s]*)/g, (_m, num) => {
    const n = parseFloat(num.replace(/[\s,]/g, ""));
    if (isNaN(n)) return `environ ${num.trim()} €`;
    return `environ ${round10(n * GBP_TO_EUR)} €`;
  });

  // CHF XXX → "environ X €"
  out = out.replace(/CHF\s?(\d[\d,.\s]*)/gi, (_m, num) => {
    const n = parseFloat(num.replace(/[\s,]/g, ""));
    if (isNaN(n)) return `environ ${num.trim()} €`;
    return `environ ${round10(n * CHF_TO_EUR)} €`;
  });

  return out;
}

async function processFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  let changed = false;
  let out = raw;

  // On ne touche qu'au corps (après la 2e ligne "---"), pas au frontmatter
  if (out.startsWith("---")) {
    const fmEnd = out.indexOf("\n---", 3);
    if (fmEnd !== -1) {
      const frontmatter = out.slice(0, fmEnd + 4);
      const body = out.slice(fmEnd + 4);
      let newBody = body;
      newBody = replaceEmDashes(newBody);
      newBody = replaceCurrencies(newBody);
      if (newBody !== body) {
        out = frontmatter + newBody;
        changed = true;
      }
    }
  } else {
    // Pas de frontmatter, on traite tout
    let newOut = out;
    newOut = replaceEmDashes(newOut);
    newOut = replaceCurrencies(newOut);
    if (newOut !== out) {
      out = newOut;
      changed = true;
    }
  }

  if (!changed) return { changed: false };

  if (!dry) {
    await fs.writeFile(filePath, out, "utf8");
  }
  return { changed: true };
}

async function main() {
  const entries = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md")).sort();

  let files = entries;
  if (TARGET_SLUG) {
    files = entries.filter((f) => f === `${TARGET_SLUG}.md`);
    if (files.length === 0) {
      console.error(`[fix-style] slug "${TARGET_SLUG}" introuvable dans ${CONTENT_DIR}`);
      process.exit(1);
    }
  } else {
    files = files.slice(0, LIMIT);
  }

  console.log(`[fix-style] ${files.length} fichier(s) à traiter (dry=${dry})`);

  let touched = 0;
  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const { changed } = await processFile(filePath);
    if (changed) {
      touched++;
      console.log(`  ${dry ? "(dry)" : "✓"} ${file}`);
    }
  }

  console.log(`\n[fix-style] ${touched} fichier(s) modifié(s)${dry ? " (simulation)" : ""}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
