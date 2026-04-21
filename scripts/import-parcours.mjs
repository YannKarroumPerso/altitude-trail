#!/usr/bin/env node
/**
 * Skeleton d'import pour enrichir src/lib/parcours-database.ts au-delà du
 * dataset curé par défaut. Trois modes :
 *
 *   MODE=overpass   : requête Overpass API sur les relations OSM route=hiking
 *                     (network=iwn/nwn/rwn) dans une zone (bbox ou country=FR).
 *   MODE=gpx-dir    : lit un dossier rempli de fichiers .gpx, extrait la trace,
 *                     le dénivelé et le profil altimétrique.
 *   MODE=csv        : lit un CSV avec colonnes name,type,difficulty,distance,
 *                     elevation_gain,elevation_loss,region,dept,city,lat,lng,
 *                     website,description.
 *
 * Variables d'env :
 *   MODE                         overpass | gpx-dir | csv
 *   OVERPASS_BBOX                "minLat,minLng,maxLat,maxLng" (défaut France)
 *   GPX_DIR                      chemin vers un dossier de fichiers .gpx
 *   CSV_PATH                     chemin vers le CSV
 *   OUTPUT_PATH                  défaut: src/lib/parcours-database.generated.ts
 *
 * Le script ne remplace PAS le dataset curé : il produit un fichier séparé
 * `parcours-database.generated.ts` à relire/nettoyer avant merge manuel.
 *
 * Usage :
 *   MODE=overpass node scripts/import-parcours.mjs --limit 100 --dry-run
 *   MODE=gpx-dir GPX_DIR=./gpx node scripts/import-parcours.mjs
 *   MODE=csv CSV_PATH=./parcours.csv node scripts/import-parcours.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

const MODE = process.env.MODE || "overpass";
const OUTPUT_PATH = process.env.OUTPUT_PATH || "src/lib/parcours-database.generated.ts";
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i >= 0 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferDifficulty(distanceKm, elevationGain) {
  if (distanceKm > 100 || elevationGain > 5000) return "Extrême";
  if (distanceKm > 45 || elevationGain > 2500) return "Difficile";
  if (distanceKm > 15 || elevationGain > 800) return "Modéré";
  return "Facile";
}

function inferType(distanceKm, elevationGain) {
  if (distanceKm > 80 || elevationGain > 5000) return "Ultra";
  if (distanceKm > 25 || elevationGain > 1000) return "Trail";
  return "Randonnée";
}

async function modeOverpass() {
  const bbox = process.env.OVERPASS_BBOX || "41.3,-5.2,51.1,9.7"; // France métropolitaine
  const [minLat, minLng, maxLat, maxLng] = bbox.split(",").map((v) => v.trim());
  // Relations route=hiking, network parmi iwn/nwn/rwn
  const query = `[out:json][timeout:300];
(
  relation["route"="hiking"]["network"~"iwn|nwn|rwn"](${minLat},${minLng},${maxLat},${maxLng});
);
out tags;`;
  console.log("[overpass] requête envoyée, attente de la réponse (peut prendre 30-120 s)…");
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();
  const relations = data.elements.filter((e) => e.type === "relation").slice(0, LIMIT);
  console.log(`[overpass] ${relations.length} relations récupérées`);

  const out = [];
  for (const rel of relations) {
    const tags = rel.tags || {};
    const name = tags.name || tags["name:fr"];
    if (!name) continue;
    const distanceKm = parseFloat(tags.distance) || 0;
    const item = {
      id: `osm-${rel.id}`,
      slug: slugify(name),
      name,
      type: inferType(distanceKm, 0),
      difficulty: inferDifficulty(distanceKm, 0),
      distance: Math.round(distanceKm),
      elevationGain: 0,
      elevationLoss: 0,
      region: tags["ref:region"] || "",
      departmentCode: tags["ref:INSEE:department"] || "",
      departmentName: "",
      city: tags["start"] || "",
      description: tags.description || tags.note || `Relation OSM ${rel.id}`,
      startLat: 0,
      startLng: 0,
      endLat: 0,
      endLng: 0,
      trace: [],
      elevationProfile: [],
      source: "OpenStreetMap",
      osmRelationId: rel.id,
      website: tags.website || undefined,
    };
    out.push(item);
  }
  return out;
}

async function modeGpxDir() {
  const dir = process.env.GPX_DIR;
  if (!dir || !existsSync(dir)) throw new Error(`GPX_DIR non valide: ${dir}`);
  const entries = await fs.readdir(dir);
  const gpxFiles = entries.filter((f) => f.toLowerCase().endsWith(".gpx")).slice(0, LIMIT);
  console.log(`[gpx-dir] ${gpxFiles.length} fichiers GPX trouvés`);
  const out = [];
  for (const f of gpxFiles) {
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    const name = raw.match(/<name>([^<]+)<\/name>/)?.[1] || path.basename(f, ".gpx");
    const trkpts = [...raw.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[\s\S]*?(?:<ele>([^<]+)<\/ele>)?[\s\S]*?<\/trkpt>/g)];
    const trace = trkpts.map((m) => [parseFloat(m[1]), parseFloat(m[2])]);
    const profile = trkpts.map((m) => parseFloat(m[3] || "0"));
    const distanceKm = haversineTotal(trace);
    const elevationGain = profileGain(profile);
    out.push({
      id: slugify(name),
      slug: slugify(name),
      name,
      type: inferType(distanceKm, elevationGain),
      difficulty: inferDifficulty(distanceKm, elevationGain),
      distance: Math.round(distanceKm),
      elevationGain,
      elevationLoss: profileLoss(profile),
      region: "",
      departmentCode: "",
      departmentName: "",
      city: "",
      description: `Importé depuis ${f}`,
      startLat: trace[0]?.[0] || 0,
      startLng: trace[0]?.[1] || 0,
      endLat: trace[trace.length - 1]?.[0] || 0,
      endLng: trace[trace.length - 1]?.[1] || 0,
      trace: simplifyTrace(trace, 100),
      elevationProfile: simplifyProfile(profile, 100),
      source: "curated",
    });
  }
  return out;
}

function haversineTotal(coords) {
  let d = 0;
  for (let i = 1; i < coords.length; i++) d += haversine(coords[i - 1], coords[i]);
  return d;
}

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function profileGain(profile) {
  let gain = 0;
  for (let i = 1; i < profile.length; i++) if (profile[i] > profile[i - 1]) gain += profile[i] - profile[i - 1];
  return Math.round(gain);
}

function profileLoss(profile) {
  let loss = 0;
  for (let i = 1; i < profile.length; i++) if (profile[i] < profile[i - 1]) loss += profile[i - 1] - profile[i];
  return Math.round(loss);
}

function simplifyTrace(trace, targetLen) {
  if (trace.length <= targetLen) return trace;
  const step = trace.length / targetLen;
  const out = [];
  for (let i = 0; i < targetLen; i++) out.push(trace[Math.floor(i * step)]);
  out.push(trace[trace.length - 1]);
  return out;
}

function simplifyProfile(profile, targetLen) {
  if (profile.length <= targetLen) return profile;
  const step = profile.length / targetLen;
  const out = [];
  for (let i = 0; i < targetLen; i++) out.push(profile[Math.floor(i * step)]);
  return out;
}

async function modeCsv() {
  const p = process.env.CSV_PATH;
  if (!p || !existsSync(p)) throw new Error(`CSV_PATH non valide: ${p}`);
  const raw = await fs.readFile(p, "utf8");
  const [header, ...rows] = raw.split(/\r?\n/).filter(Boolean);
  const cols = header.split(",").map((s) => s.trim());
  const out = [];
  for (const row of rows.slice(0, LIMIT)) {
    const v = row.split(",").map((s) => s.trim());
    const rec = Object.fromEntries(cols.map((c, i) => [c, v[i] || ""]));
    const distanceKm = parseFloat(rec.distance) || 0;
    const elevationGain = parseFloat(rec.elevation_gain) || 0;
    const item = {
      id: slugify(rec.name),
      slug: slugify(rec.name),
      name: rec.name,
      type: rec.type || inferType(distanceKm, elevationGain),
      difficulty: rec.difficulty || inferDifficulty(distanceKm, elevationGain),
      distance: Math.round(distanceKm),
      elevationGain,
      elevationLoss: parseFloat(rec.elevation_loss) || elevationGain,
      region: rec.region || "",
      departmentCode: rec.dept || "",
      departmentName: "",
      city: rec.city || "",
      description: rec.description || "",
      startLat: parseFloat(rec.lat) || 0,
      startLng: parseFloat(rec.lng) || 0,
      endLat: parseFloat(rec.lat) || 0,
      endLng: parseFloat(rec.lng) || 0,
      trace: [],
      elevationProfile: [],
      source: "curated",
      website: rec.website || undefined,
    };
    out.push(item);
  }
  return out;
}

async function main() {
  console.log(`[import-parcours] mode: ${MODE}`);
  let items;
  if (MODE === "overpass") items = await modeOverpass();
  else if (MODE === "gpx-dir") items = await modeGpxDir();
  else if (MODE === "csv") items = await modeCsv();
  else throw new Error(`Mode inconnu: ${MODE}`);

  console.log(`[import-parcours] ${items.length} items`);
  if (DRY_RUN) {
    console.log("[import-parcours] DRY-RUN — pas d'écriture");
    console.log(JSON.stringify(items.slice(0, 3), null, 2));
    return;
  }
  const body = `import { Parcours } from "@/types";\n\n// Généré par scripts/import-parcours.mjs — relire avant merge.\nexport const importedParcours: Parcours[] = ${JSON.stringify(items, null, 2)};\n`;
  await fs.writeFile(OUTPUT_PATH, body, "utf8");
  console.log(`[import-parcours] écrit ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
