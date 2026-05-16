// Source unique pour le calendrier des courses "hot events" cote UI.
// IMPORTANT : ce fichier doit rester en sync avec scripts/lib/hot-events-calendar.mjs
// (qui contient les memes events PLUS les `queries` Tavily utilisees par les pipelines).
// Une modif d'un event ici doit etre repercutee dans le .mjs et vice-versa.
//
// Une CI legere peut etre ajoutee plus tard pour comparer les slugs.

export type HotEvent = {
  slug: string;
  name: string;
  /** Date de debut au format YYYY-MM-DD */
  start: string;
  location: string;
  /** Optionnel : distance officielle (ex "42 km", "161 km") */
  distance?: string;
  /** Optionnel : denivele positif (ex "2 736 m+") */
  elevation?: string;
  /** Optionnel : URL hero ou logo de l'event */
  heroImage?: string;
};

/**
 * Calendrier des courses prioritaires couvertes editorialement.
 * Ordre interne sans importance, les helpers trient par date.
 */
export const HOT_EVENTS: HotEvent[] = [
  { slug: "hong-kong-100", name: "Hong Kong 100", start: "2026-01-17", location: "Hong Kong" },
  { slug: "transgrancanaria", name: "Transgrancanaria", start: "2026-02-27", location: "Iles Canaries, Espagne" },
  { slug: "marathon-des-sables", name: "Marathon des Sables", start: "2026-04-10", location: "Maroc" },
  { slug: "canyons-endurance-runs", name: "Canyons by UTMB 100M", start: "2026-04-24", location: "Auburn, Californie, USA", distance: "161 km", elevation: "5 550 m+" },
  { slug: "grand-raid-ventoux-ugp", name: "Grand Raid Ventoux by UTMB", start: "2026-04-24", location: "Mont Ventoux, France", distance: "125 km", elevation: "5 700 m+" },
  { slug: "madeira-island-ultra-trail", name: "Madeira Island Ultra Trail", start: "2026-04-25", location: "Madere, Portugal", distance: "118 km" },
  { slug: "zegama-aizkorri-2026", name: "Zegama-Aizkorri 2026", start: "2026-05-17", location: "Pays Basque, Espagne", distance: "42 km", elevation: "2 736 m+" },
  { slug: "mozart-100", name: "Mozart 100", start: "2026-06-06", location: "Salzbourg, Autriche" },
  { slug: "trail-du-ventoux", name: "Trail du Ventoux", start: "2026-06-13", location: "Provence, France" },
  { slug: "lavaredo-ultra-trail", name: "Lavaredo Ultra Trail", start: "2026-06-26", location: "Dolomites, Italie", distance: "120 km" },
  { slug: "western-states-100", name: "Western States 100", start: "2026-06-27", location: "Californie, USA", distance: "161 km" },
  { slug: "hardrock-100", name: "Hardrock 100", start: "2026-07-10", location: "Silverton, Colorado, USA", distance: "161 km", elevation: "10 000 m+" },
  { slug: "utmb", name: "UTMB Mont-Blanc", start: "2026-08-28", location: "Chamonix, France", distance: "176 km", elevation: "10 000 m+" },
  { slug: "tor-des-geants", name: "Tor des Geants", start: "2026-09-13", location: "Val d'Aoste, Italie", distance: "330 km", elevation: "24 000 m+" },
  { slug: "diagonale-des-fous", name: "Diagonale des Fous", start: "2026-10-15", location: "La Reunion", distance: "175 km", elevation: "10 500 m+" },
  { slug: "ultra-trail-cape-town", name: "Ultra-Trail Cape Town", start: "2026-11-28", location: "Le Cap, Afrique du Sud" },
];

// Fenetre "chaude" autour de l'event : on considere l'event comme actif
// editorialement de J-5 a J+3 (cycle preview/live/recap).
const HOURS_BEFORE_HOT = 120;  // J-5
const HOURS_AFTER_HOT = 72;    // J+3

export type HotEventStatus =
  | { kind: "live"; event: HotEvent; relativeHours: number }
  | { kind: "upcoming"; event: HotEvent; relativeHours: number }       // J-5 a J-1
  | { kind: "just-finished"; event: HotEvent; relativeHours: number }  // J+1 a J+3
  | { kind: "next"; event: HotEvent; daysUntil: number }               // futur hors fenetre chaude
  | null;

/**
 * Retourne l'event actif (si dans fenetre J-5..J+3) ou le prochain event futur.
 * - Si plusieurs events sont dans la fenetre chaude, retourne le plus proche du jour J.
 * - Si aucun event en fenetre, retourne le prochain event futur le plus proche.
 * - Si aucun event futur dans HOT_EVENTS, retourne null (a l'usage : il faut
 *   refresh le calendrier annuel).
 */
export function getActiveOrNextHotEvent(now: Date = new Date()): HotEventStatus {
  const tNow = now.getTime();
  const inWindow: { event: HotEvent; relativeHours: number }[] = [];
  for (const event of HOT_EVENTS) {
    const eventStart = new Date(event.start + "T08:00:00Z").getTime();
    const diffHours = (tNow - eventStart) / (1000 * 60 * 60);
    if (diffHours >= -HOURS_BEFORE_HOT && diffHours <= HOURS_AFTER_HOT) {
      inWindow.push({ event, relativeHours: Math.round(diffHours) });
    }
  }
  if (inWindow.length > 0) {
    // On garde celui dont relativeHours est le plus proche de 0
    inWindow.sort((a, b) => Math.abs(a.relativeHours) - Math.abs(b.relativeHours));
    const best = inWindow[0];
    let kind: "live" | "upcoming" | "just-finished" = "upcoming";
    if (best.relativeHours >= -24 && best.relativeHours <= 24) kind = "live";
    else if (best.relativeHours > 24) kind = "just-finished";
    return { kind, event: best.event, relativeHours: best.relativeHours };
  }
  // Sinon, prochain event futur
  const future = HOT_EVENTS
    .map((event) => {
      const eventStart = new Date(event.start + "T08:00:00Z").getTime();
      const daysUntil = Math.ceil((eventStart - tNow) / (1000 * 60 * 60 * 24));
      return { event, daysUntil };
    })
    .filter((e) => e.daysUntil > 3)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  if (future.length === 0) return null;
  return { kind: "next", event: future[0].event, daysUntil: future[0].daysUntil };
}

/**
 * Retourne les N prochaines courses futures (hors event deja affiche dans le hero).
 */
export function getUpcomingHotEvents(now: Date = new Date(), limit = 6, excludeSlug?: string): HotEvent[] {
  const tNow = now.getTime();
  return HOT_EVENTS
    .map((event) => ({ event, ts: new Date(event.start + "T08:00:00Z").getTime() }))
    .filter(({ event, ts }) => ts > tNow - 24 * 3600 * 1000 && event.slug !== excludeSlug)
    .sort((a, b) => a.ts - b.ts)
    .slice(0, limit)
    .map((x) => x.event);
}

/**
 * Format de date relative court pour l'affichage UI.
 * Ex : "EN COURS", "dans 3 jours", "dans 2 semaines", "dans 4 mois", "17 mai".
 */
export function formatRelativeEventDate(event: HotEvent, now: Date = new Date()): string {
  const eventStart = new Date(event.start + "T08:00:00Z").getTime();
  const diffMs = eventStart - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffHours) < 24) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === -1) return "Hier";
  if (diffDays > 1 && diffDays <= 14) return `Dans ${diffDays} jours`;
  if (diffDays > 14 && diffDays <= 60) return `Dans ${Math.round(diffDays / 7)} semaines`;
  if (diffDays > 60) return `Dans ${Math.round(diffDays / 30)} mois`;
  if (diffDays < -1 && diffDays >= -14) return `Il y a ${Math.abs(diffDays)} jours`;
  // Au-dela, format date courte FR
  const d = new Date(eventStart);
  const months = ["jan", "fev", "mars", "avr", "mai", "juin", "juil", "aout", "sept", "oct", "nov", "dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Format date longue FR pour le hero : "samedi 17 mai 2026".
 */
export function formatLongFr(dateStr: string): string {
  const d = new Date(dateStr + "T08:00:00Z");
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
