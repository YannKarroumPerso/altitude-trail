export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  author: string;
  date: string;
  // Optional : date de dernière mise à jour éditoriale significative.
  // Si absente, dateModified tombe sur date.
  updatedAt?: string;
  // Date de publication ISO 8601 complète (avec heure UTC).
  // Critique pour la précision Google News + Discover : sans cette précision
  // intra-jour, tous les articles d'un même jour ont la même seconde et
  // perdent leur ordering temporel chez Google.
  // Stamper par les pipelines de génération à new Date().toISOString().
  // Fallback sur parseFrDate(date) → 00:00:00 UTC si absent (anciens articles).
  publishedAt?: string;
  readTime: string;
  image: string;
  featured?: boolean;
  tags?: string[];
  content?: string;
  // Vidéo YouTube optionnelle attachée à l'article, affichée après les
  // premiers paragraphes. Ajoutée automatiquement par la veille quand un
  // match YouTube pertinent est trouvé.
  youtubeVideoId?: string;
  youtubeTitle?: string;
  youtubeChannel?: string;
  youtubeDuration?: number;  // secondes
  youtubeUploadDate?: string; // ISO 8601
  // Liens externes de référence (whitelist domaines d'autorité).
  // Surfacés en bas d'article comme "Sources / Pour aller plus loin".
  externalRefs?: { url: string; label: string }[];
  // Flag posé quand l'article est produit pendant une fenêtre d'événement
  // chaud (UTMB, Western States, etc.). Déclenche l'affichage d'un badge
  // "LIVE" dans les cartes pendant les 48h suivant la publication.
  isLive?: boolean;
  // Slug de l'événement chaud concerné (pour analytics + future page agrégée
  // "live UTMB 2026", "live Western States 2026", etc.).
  hotEventSlug?: string;
  // Type d'article. "standard" = article éditorial long (800-1200 mots,
  // veille RSS ou Tavily classique). "brief" = brève actualité chaude
  // (400-600 mots, format court structuré avec "L'info en 30 secondes" +
  // "Contexte" + "Notre lecture"). Les brèves ont leur propre cap quotidien
  // distinct (3/jour) et un badge visuel dédié.
  articleType?: "standard" | "brief";
  // Verticale éditoriale pour les brèves uniquement. Permet un routage
  // automatique vers la bonne catégorie et l'affichage ciblé côté front.
  briefVertical?: "equipement" | "marques-industrie" | "athletes";
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
