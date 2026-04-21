import { Parcours } from "@/types";

// Règle de Naismith légèrement ajustée au trail français :
// 1h pour 4 km sur le plat + 1h pour 600 m de D+.
export function estimateDurationHours(distanceKm: number, elevationGain: number): number {
  return distanceKm / 4 + elevationGain / 600;
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h} h ${m.toString().padStart(2, "0")}` : `${h} h`;
  }
  const d = Math.floor(hours / 24);
  const h = Math.round(hours - d * 24);
  return `${d} j ${h} h`;
}

export function distanceBucket(km: number): "<10" | "10-30" | "30-50" | ">50" {
  if (km < 10) return "<10";
  if (km < 30) return "10-30";
  if (km < 50) return "30-50";
  return ">50";
}

export const DISTANCE_BUCKETS = [
  { value: "all", label: "Toutes distances" },
  { value: "<10", label: "Moins de 10 km" },
  { value: "10-30", label: "10 à 30 km" },
  { value: "30-50", label: "30 à 50 km" },
  { value: ">50", label: "Plus de 50 km" },
] as const;

export function elevationBucket(dplus: number): "<500" | "500-1500" | ">1500" {
  if (dplus < 500) return "<500";
  if (dplus < 1500) return "500-1500";
  return ">1500";
}

export const ELEVATION_BUCKETS = [
  { value: "all", label: "Tous dénivelés" },
  { value: "<500", label: "Moins de 500 m D+" },
  { value: "500-1500", label: "500 à 1 500 m D+" },
  { value: ">1500", label: "Plus de 1 500 m D+" },
] as const;

export const PARCOURS_TYPES = ["Trail", "Randonnée", "Ultra"] as const;

// Interpolation linéaire d'un profil altimétrique brut sur N points.
export function interpolateProfile(profile: number[], targetLength: number): number[] {
  if (profile.length <= 1) return new Array(targetLength).fill(profile[0] ?? 0);
  const out: number[] = [];
  for (let i = 0; i < targetLength; i++) {
    const pos = (i * (profile.length - 1)) / (targetLength - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const frac = pos - lo;
    out.push(profile[lo] * (1 - frac) + profile[hi] * frac);
  }
  return out;
}

// GPX 1.1 minimaliste — distance calculée implicitement par le client GPX,
// altitude intégrée quand elle est dispo dans elevationProfile.
export function buildGpx(parcours: Parcours): string {
  const trace = parcours.trace;
  const profile = parcours.elevationProfile.length === trace.length
    ? parcours.elevationProfile
    : interpolateProfile(parcours.elevationProfile, trace.length);
  const now = new Date().toISOString();
  const points = trace
    .map(([lat, lng], i) => {
      const ele = profile[i];
      const eleTag = ele != null ? `      <ele>${ele.toFixed(1)}</ele>\n` : "";
      return `    <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}">\n${eleTag}    </trkpt>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Altitude Trail — altitude-trail.fr" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(parcours.name)}</name>
    <desc>${escapeXml(parcours.description)}</desc>
    <time>${now}</time>
    <link href="https://www.altitude-trail.fr/parcours/${parcours.slug}">
      <text>Fiche parcours Altitude Trail</text>
    </link>
  </metadata>
  <trk>
    <name>${escapeXml(parcours.name)}</name>
    <type>${parcours.type}</type>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>
`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const PARCOURS_DIFFICULTY_COLORS: Record<Parcours["difficulty"], string> = {
  "Facile": "#10b981",
  "Modéré": "#f59e0b",
  "Difficile": "#ea580c",
  "Extrême": "#dc2626",
};

// Centroïdes approximatifs des régions françaises — utilisés pour classer une
// trace OSM par plus-proche-région (Euclidien en degrés, largement suffisant
// à cette échelle). L'Outre-mer est absent volontairement : les traces
// importées sont métropole + Corse.
export const FR_REGION_CENTROIDS: { name: string; lat: number; lng: number }[] = [
  { name: "Auvergne-Rhône-Alpes", lat: 45.70, lng: 5.00 },
  { name: "Bourgogne-Franche-Comté", lat: 47.30, lng: 4.80 },
  { name: "Bretagne", lat: 48.20, lng: -2.90 },
  { name: "Centre-Val de Loire", lat: 47.50, lng: 1.60 },
  { name: "Corse", lat: 42.20, lng: 9.10 },
  { name: "Grand Est", lat: 48.70, lng: 5.30 },
  { name: "Hauts-de-France", lat: 50.00, lng: 2.90 },
  { name: "Île-de-France", lat: 48.70, lng: 2.50 },
  { name: "Normandie", lat: 49.20, lng: 0.10 },
  { name: "Nouvelle-Aquitaine", lat: 45.00, lng: 0.20 },
  { name: "Occitanie", lat: 43.70, lng: 1.90 },
  { name: "Pays de la Loire", lat: 47.60, lng: -0.70 },
  { name: "Provence-Alpes-Côte d'Azur", lat: 44.00, lng: 6.10 },
];

export function classifyRegion(lat: number, lng: number): string {
  let bestIdx = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < FR_REGION_CENTROIDS.length; i++) {
    const c = FR_REGION_CENTROIDS[i];
    const dLat = lat - c.lat;
    const dLng = lng - c.lng;
    const dSq = dLat * dLat + dLng * dLng;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
    }
  }
  return FR_REGION_CENTROIDS[bestIdx].name;
}
