#!/usr/bin/env node
/**
 * Importe les relations OSM route=hiking en France (area ISO3166-1=FR) via
 * Overpass API, filtre sur network iwn/nwn/rwn, extrait tags + centre
 * représentatif, génère src/lib/traces-database.ts.
 *
 * Pas de clé requise (Overpass est public). Ressources utilisées : une seule
 * requête 60-300 s selon la charge serveur. Ne pas lancer plus d'une fois
 * toutes les quelques minutes (politesse envers le serveur public).
 *
 * Flags :
 *   --limit N      tronque le résultat à N traces (défaut: illimité)
 *   --dry-run      n'écrit pas le fichier final, juste logue
 *   --endpoint URL override l'endpoint Overpass
 *
 * Usage :
 *   node scripts/import-traces.mjs --limit 2000
 */
import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_JSON = path.resolve("src/lib/traces-database.json");
const OUTPUT_TS = path.resolve("src/lib/traces-database.ts");
const OVERPASS_ENDPOINTS = [
  process.env.OVERPASS_ENDPOINT,
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
].filter(Boolean);

const argLimit = process.argv.indexOf("--limit");
const LIMIT = argLimit >= 0 ? parseInt(process.argv[argLimit + 1], 10) : Infinity;
const DRY_RUN = process.argv.includes("--dry-run");

// bbox France métropolitaine — plus rapide qu'un lookup area admin_level=2.
// On post-filtre les centres pour ignorer les relations qui débordent sur
// UK/DE/CH/IT/ES/BE. La Corse est déjà incluse. Outremer : à ajouter en
// requêtes séparées si nécessaire.
const QUERY = `[out:json][timeout:600];
(
  relation["route"="hiking"]["network"~"iwn|nwn|rwn"](41.3,-5.2,51.1,9.7);
);
out tags center;`;

// Bornes approximatives du territoire français continental pour filtrer les
// centres qui débordent sur les pays voisins après la requête bbox.
function isInFrance(lat, lng) {
  // Corse (bbox distinct)
  if (lat >= 41.3 && lat <= 43.1 && lng >= 8.5 && lng <= 9.6) return true;
  // Métropole continentale — polygone grossier
  if (lat < 42.3 || lat > 51.1) return false;
  if (lng < -5.2 || lng > 8.3) return false;
  // Exclusions grossières pour zones frontalières très denses côté étranger
  // Belgique (50.5-51.3, 2.5-6.4) — on ne coupe pas car beaucoup de trails
  // frontaliers sont légitimement français.
  return true;
}

function inferDifficulty(distance, network) {
  if (!distance) {
    if (network === "iwn") return "Extrême";
    if (network === "nwn") return "Difficile";
    return "Modéré";
  }
  if (distance > 200) return "Extrême";
  if (distance > 80) return "Difficile";
  if (distance > 25) return "Modéré";
  return "Facile";
}

function parseDistance(raw) {
  if (!raw) return undefined;
  const s = String(raw).toLowerCase().replace(",", ".");
  const num = parseFloat(s);
  if (!isFinite(num)) return undefined;
  if (s.includes("mi")) return Math.round(num * 1.609 * 10) / 10;
  // assumer km par défaut (conforme aux conventions OSM)
  return Math.round(num * 10) / 10;
}

function slug(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function queryOverpass() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let lastError;
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      console.log(`[traces] tentative ${attempt}/${maxAttempts} sur ${endpoint}…`);
      try {
        const body = `data=${encodeURIComponent(QUERY)}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "User-Agent": "altitude-brut/1.0 (https://www.altitude-brut.fr)",
          },
          body,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${text.slice(0, 120)}`);
        }
        return await res.json();
      } catch (e) {
        console.warn(`[traces]   échec : ${e.message}`);
        lastError = e;
      }
    }
    const wait = attempt * 30_000;
    console.log(`[traces] attente ${wait / 1000}s avant nouvelle salve…`);
    await sleep(wait);
  }
  throw lastError || new Error("Tous les endpoints Overpass ont échoué");
}

function normaliseRelation(rel) {
  const t = rel.tags || {};
  const name = t.name || t["name:fr"];
  if (!name) return null;
  const network = t.network;
  if (!["iwn", "nwn", "rwn"].includes(network)) return null;
  const distance = parseDistance(t.distance || t.length);
  const center = rel.center || {};
  if (typeof center.lat !== "number" || typeof center.lon !== "number") return null;
  if (!isInFrance(center.lat, center.lon)) return null;
  return {
    id: `osm-${rel.id}`,
    osmId: rel.id,
    name,
    ref: t.ref,
    network,
    difficulty: inferDifficulty(distance, network),
    distanceKm: distance,
    description: t.description || t.note,
    wikipedia: t.wikipedia,
    website: t.website || t.url,
    operator: t.operator,
    centerLat: Math.round(center.lat * 100000) / 100000,
    centerLng: Math.round(center.lon * 100000) / 100000,
    country: "FR",
    source: "OpenStreetMap",
  };
}

function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

async function main() {
  console.log("[traces] requête Overpass pour les relations hiking en France…");
  console.log("[traces] cette requête peut prendre 60-300 secondes selon la charge serveur");
  const json = await queryOverpass();
  const elements = json.elements || [];
  console.log(`[traces] ${elements.length} éléments reçus`);

  const seen = new Set();
  const traces = [];
  for (const rel of elements) {
    if (rel.type !== "relation") continue;
    const t = normaliseRelation(rel);
    if (!t) continue;
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    traces.push(t);
    if (traces.length >= LIMIT) break;
  }
  console.log(`[traces] ${traces.length} traces retenues après filtrage`);

  // Tri : réseaux larges en premier (iwn > nwn > rwn), puis par nom
  const netOrder = { iwn: 0, nwn: 1, rwn: 2 };
  traces.sort((a, b) => (netOrder[a.network] - netOrder[b.network]) || a.name.localeCompare(b.name));

  // Ajout d'un slug stable pour usage éventuel en URL
  for (const t of traces) {
    t.slug = `${slug(t.name)}-${t.osmId}`;
  }

  const stats = {
    total: traces.length,
    iwn: traces.filter((t) => t.network === "iwn").length,
    nwn: traces.filter((t) => t.network === "nwn").length,
    rwn: traces.filter((t) => t.network === "rwn").length,
    with_distance: traces.filter((t) => t.distanceKm).length,
    with_description: traces.filter((t) => t.description).length,
    with_website: traces.filter((t) => t.website).length,
  };
  console.log("[traces] répartition :", JSON.stringify(stats, null, 2));

  if (DRY_RUN) {
    console.log("[traces] DRY-RUN — pas d'écriture");
    console.log(JSON.stringify(traces.slice(0, 5), null, 2));
    return;
  }

  // On écrit la donnée brute en JSON (compatible TS via resolveJsonModule) et
  // un thin wrapper .ts qui importe le JSON — TypeScript refuse d'inférer
  // l'union type de 4500+ objets literaux, donc on sort la donnée du pipeline
  // de type-check.
  const clean = traces.map(stripUndefined);
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(clean), "utf8");
  const ts = `import type { Trace } from "@/types";\nimport raw from "./traces-database.json";\n\n// Données OpenStreetMap (licence ODbL), importées par scripts/import-traces.mjs.\n//\n// Statistiques du run :\n//   total=${stats.total}  iwn=${stats.iwn}  nwn=${stats.nwn}  rwn=${stats.rwn}\n//   with_distance=${stats.with_distance}  with_description=${stats.with_description}  with_website=${stats.with_website}\n//\n// Les centres géographiques sont fournis par Overpass (out center),\n// représentatifs de la relation mais pas nécessairement le point de départ.\n// La distance est parsée du tag OSM distance/length quand présent.\n\nexport const traces: Trace[] = raw as Trace[];\n`;
  await fs.writeFile(OUTPUT_TS, ts, "utf8");
  console.log(`[traces] ${OUTPUT_JSON} écrit (${(JSON.stringify(clean).length / 1024).toFixed(1)} KB)`);
  console.log(`[traces] ${OUTPUT_TS} écrit (thin wrapper)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
