#!/usr/bin/env node
// Estimateur de cout : simule UN run reel de chaque pipeline et imprime
// la projection mensuelle avec la frequence cron actuelle.
//
// Usage : npm run cost-estimate
//   ou : node scripts/dev/cost-estimate.mjs [--pipeline=veille-tavily]
//
// IMPORTANT : a executer AVANT chaque patch de modele, max_tokens ou
// frequence cron. C'est le guard-rail qui evite les regressions de cout.
//
// Comportement : pour eviter de cramer du budget pendant l'estimation,
// on simule UN seul run de chaque pipeline (avec un cap MAX_ARTICLES_PER_RUN=1
// et un DAILY_CAP=1). Puis on extrapole mensuellement.

import { spawn } from "node:child_process";
import path from "node:path";

const PIPELINES = [
  { name: "veille-tavily", script: "scripts/veille-tavily.mjs", runsPerDay: 2,
    env: { MAX_ARTICLES_PER_RUN: "1", DAILY_CAP: "1" } },
  { name: "brief-publish", script: "scripts/brief-publish.mjs", runsPerDay: 2,
    env: { MAX_ARTICLES_PER_RUN: "1", DAILY_CAP: "1" } },
  { name: "veille-rss", script: "scripts/veille.mjs", runsPerDay: 3,
    env: { MAX_ARTICLES_PER_RUN: "1", DAILY_CAP: "1" } },
  { name: "veille-video", script: "scripts/veille-video.mjs", runsPerDay: 2,
    env: { MAX_ARTICLES_PER_RUN: "1", DAILY_CAP: "1" } },
];

const filter = process.argv.find((a) => a.startsWith("--pipeline="))?.slice("--pipeline=".length);

function runOne(p) {
  return new Promise((resolve) => {
    const env = { ...process.env, ...p.env };
    const start = Date.now();
    let stdout = "";
    const proc = spawn("node", [p.script], { env });
    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stdout += d.toString(); });
    proc.on("close", (code) => {
      const ms = Date.now() - start;
      // Parser les lignes [cost] pour extraire les couts
      const costLines = stdout.split("\n").filter((l) => l.includes("[cost]"));
      let totalCost = 0;
      for (const l of costLines) {
        const m = l.match(/\$([0-9.]+)/);
        if (m) totalCost += parseFloat(m[1]);
      }
      resolve({ code, ms, totalCost, callCount: costLines.length });
    });
  });
}

async function main() {
  console.log("=== Cost estimation Altitude Trail ===");
  console.log("Simulation : 1 article par pipeline (cap MAX_ARTICLES_PER_RUN=1)");
  console.log("");
  let grandTotalMonthly = 0;
  for (const p of PIPELINES) {
    if (filter && filter !== p.name) continue;
    console.log(`\n→ ${p.name} (${p.script})`);
    const r = await runOne(p);
    if (r.code !== 0) {
      console.log(`  ✗ exit ${r.code} en ${(r.ms/1000).toFixed(1)}s, cout partiel : $${r.totalCost.toFixed(4)}`);
    } else {
      console.log(`  ✓ run en ${(r.ms/1000).toFixed(1)}s, ${r.callCount} appel(s), $${r.totalCost.toFixed(4)}`);
    }
    const monthly = r.totalCost * p.runsPerDay * 30;
    grandTotalMonthly += monthly;
    console.log(`  → mensuel projete (${p.runsPerDay} run/jour x 30j) : $${monthly.toFixed(2)}`);
  }
  console.log("");
  console.log("═══════════════════════════════════════");
  console.log(`COUT MENSUEL TOTAL PROJETE : $${grandTotalMonthly.toFixed(2)}`);
  console.log("═══════════════════════════════════════");
  console.log("");
  console.log("Si superieur a votre budget : revoir le modele (Sonnet->Haiku),");
  console.log("le max_tokens, ou la frequence cron AVANT de pousser.");
}

main().catch((e) => { console.error(e); process.exit(1); });
