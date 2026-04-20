#!/usr/bin/env node
/**
 * ITRA import script — skeleton.
 *
 * Pour peupler src/lib/races-database.ts au-delà du dataset vérifié par défaut,
 * ce script consomme un export ITRA (ou Betrail / Kikourou) et produit des
 * entrées Race typées, enrichies des coordonnées via géocodage Nominatim.
 *
 * Sources d'entrée acceptées (via ITRA_SOURCE_PATH) :
 *   - JSON: un tableau d'objets ou un NDJSON
 *   - CSV: en-têtes attendus incluant au minimum name, date, city, department, distance_km
 *
 * Variables d'environnement :
 *   ITRA_SOURCE_PATH       Chemin local vers l'export (.json, .ndjson ou .csv)
 *   ITRA_API_BASE          (optionnel) Base URL d'une API ITRA si accessible
 *   ITRA_API_TOKEN         (optionnel) Token d'authentification
 *   NOMINATIM_USER_AGENT   (requis par l'OSM Nominatim policy)
 *   OUTPUT_PATH            Par défaut: src/lib/races-database.generated.ts
 *
 * Usage:
 *   node scripts/import-itra.mjs [--dry-run] [--limit N]
 *
 * Le script ne remplace PAS src/lib/races-database.ts : il produit un fichier
 * séparé que vous pouvez ensuite diffuser / merger à la main, une fois les
 * données relues.
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ITRA_SOURCE_PATH = process.env.ITRA_SOURCE_PATH;
const NOMINATIM_USER_AGENT = process.env.NOMINATIM_USER_AGENT || "altitude-trail-import/1.0 (contact@altitude-trail.fr)";
const OUTPUT_PATH = process.env.OUTPUT_PATH || "src/lib/races-database.generated.ts";
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i >= 0 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

if (!ITRA_SOURCE_PATH) {
  console.error("ITRA_SOURCE_PATH non défini. Exportez un JSON/CSV depuis ITRA/Betrail/Kikourou puis pointez la variable vers le fichier.");
  process.exit(1);
}
if (!existsSync(ITRA_SOURCE_PATH)) {
  console.error(`Fichier introuvable : ${ITRA_SOURCE_PATH}`);
  process.exit(1);
}

const DIFFICULTY_TIERS = [
  { max: 20, elevationMax: 500, label: "Facile" },
  { max: 45, elevationMax: 1500, label: "Modéré" },
  { max: 85, elevationMax: 4500, label: "Difficile" },
  { max: Infinity, elevationMax: Infinity, label: "Extrême" },
];

function inferDifficulty(distanceKm, elevationM) {
  for (const tier of DIFFICULTY_TIERS) {
    if (distanceKm <= tier.max && elevationM <= tier.elevationMax) return tier.label;
  }
  return "Extrême";
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function parseSource(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = await fs.readFile(filePath, "utf8");
  if (ext === ".json") return JSON.parse(raw);
  if (ext === ".ndjson") return raw.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  if (ext === ".csv") {
    const [header, ...rows] = raw.split(/\r?\n/).filter(Boolean);
    const cols = header.split(",").map((h) => h.trim());
    return rows.map((row) => {
      const values = row.split(",");
      return Object.fromEntries(cols.map((c, i) => [c, values[i]?.trim() || ""]));
    });
  }
  throw new Error(`Extension non supportée : ${ext}`);
}

const NOMINATIM_CACHE = new Map();

async function geocode(city, department) {
  const key = `${city}|${department}`;
  if (NOMINATIM_CACHE.has(key)) return NOMINATIM_CACHE.get(key);
  const q = encodeURIComponent(`${city}, ${department}, France`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const arr = await res.json();
  const coords = arr[0] ? { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) } : null;
  NOMINATIM_CACHE.set(key, coords);
  // Respect Nominatim usage policy: 1 req/sec max
  await new Promise((r) => setTimeout(r, 1100));
  return coords;
}

function normalise(record) {
  const name = record.name || record.nom || record.event_name;
  const city = record.city || record.ville || record.departure_city;
  const department = record.department || record.dept || record.departement;
  const distanceKm = Math.round(parseFloat(record.distance_km || record.distance || 0));
  const elevationM = Math.round(parseFloat(record.elevation_m || record.dplus || record.denivele || 0));
  const dateISO = record.dateISO || record.date || record.start_date;
  const region = record.region || "";
  const website = record.website || record.url;
  if (!name || !city || !department || !distanceKm || !dateISO) return null;
  return { name, city, department, distanceKm, elevationM, dateISO, region, website };
}

async function main() {
  console.log(`[itra] source: ${ITRA_SOURCE_PATH}`);
  const records = await parseSource(ITRA_SOURCE_PATH);
  console.log(`[itra] ${records.length} record(s) lus`);
  const subset = records.slice(0, LIMIT);

  const out = [];
  for (let i = 0; i < subset.length; i++) {
    const rec = normalise(subset[i]);
    if (!rec) {
      console.warn(`[itra] skip row ${i}: champs obligatoires manquants`);
      continue;
    }
    const coords = await geocode(rec.city, rec.department);
    if (!coords) {
      console.warn(`[itra] skip ${rec.name}: géocodage échoué pour ${rec.city} / ${rec.department}`);
      continue;
    }
    const d = new Date(rec.dateISO);
    const race = {
      id: `${slugify(rec.name)}-${d.getFullYear()}`,
      slug: `${slugify(rec.name)}-${d.getFullYear()}`,
      name: rec.name,
      date: rec.dateISO,
      month: d.getMonth() + 1,
      dateISO: d.toISOString().slice(0, 10),
      city: rec.city,
      departmentCode: String(rec.department).slice(0, 3),
      departmentName: "",
      region: rec.region,
      distance: rec.distanceKm,
      elevation: rec.elevationM,
      difficulty: inferDifficulty(rec.distanceKm, rec.elevationM),
      description: "",
      lat: coords.lat,
      lng: coords.lng,
      ...(rec.website ? { website: rec.website } : {}),
    };
    out.push(race);
    console.log(`[itra] ${i + 1}/${subset.length} ${race.name}`);
  }

  const body = `import { Race } from "@/types";\n\n// Généré automatiquement par scripts/import-itra.mjs — relire avant de merger.\nexport const importedRaces: Race[] = ${JSON.stringify(out, null, 2)};\n`;
  if (DRY_RUN) {
    console.log(`[itra] DRY-RUN — ${out.length} courses prêtes à écrire dans ${OUTPUT_PATH}`);
    return;
  }
  await fs.writeFile(OUTPUT_PATH, body, "utf8");
  console.log(`[itra] ${out.length} courses écrites dans ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
