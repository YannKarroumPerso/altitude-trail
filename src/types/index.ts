export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
  tags?: string[];
  content?: string;
}

export type Difficulty = "Facile" | "Modéré" | "Difficile" | "Extrême";

export interface Race {
  id: string;
  slug: string;
  name: string;
  date: string;
  month: number;
  dateISO: string;
  city: string;
  departmentCode: string;
  departmentName: string;
  region: string;
  distance: number;
  elevation: number;
  difficulty: Difficulty;
  description: string;
  lat: number;
  lng: number;
  website?: string;
}

export interface Category {
  slug: string;
  label: string;
  description: string;
}

export type ParcoursType = "Trail" | "Randonnée" | "Ultra";

export interface Parcours {
  id: string;
  slug: string;
  name: string;
  type: ParcoursType;
  difficulty: Difficulty;
  distance: number; // km
  elevationGain: number; // m D+
  elevationLoss: number; // m D-
  durationHours: number; // en heures
  region: string;
  departmentCode: string;
  departmentName: string;
  city: string;
  description: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  trace: Array<[number, number]>; // [lat, lng] waypoints
  elevationProfile: number[]; // altitudes en mètres, même pas que trace
  source: "OpenStreetMap" | "IGN" | "curated";
  website?: string;
  notes?: string; // traces approximées, usage indicatif
}

export type TraceNetwork = "iwn" | "nwn" | "rwn";

export interface Trace {
  id: string; // "osm-{osmId}"
  osmId: number;
  name: string;
  ref?: string;
  network: TraceNetwork;
  difficulty: Difficulty;
  distanceKm?: number;
  description?: string;
  wikipedia?: string;
  website?: string;
  operator?: string;
  centerLat: number;
  centerLng: number;
  country: "FR";
  source: "OpenStreetMap";
}
