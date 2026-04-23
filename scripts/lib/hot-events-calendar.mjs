// Calendrier des courses majeures qui déclenchent un "mode boost" dans la
// veille : cap quotidien augmenté (10 au lieu de 5), Tavily à 4 runs/jour
// (au lieu de 2), queries spécifiques à l'événement, articles taggés isLive.
//
// La fenêtre chaude s'ouvre 48h avant le départ et se ferme 72h après.
// Entrées : dates approximatives — à mettre à jour chaque année selon le
// calendrier officiel publié par chaque organisation.

export const HOT_EVENTS = [
  {
    slug: "utmb",
    name: "UTMB Mont-Blanc",
    start: "2026-08-28", // vendredi fin août
    location: "Chamonix, France",
    queries: [
      '"UTMB" OR "CCC" OR "TDS" OR "OCC" Chamonix 2026 results live',
      '"UTMB 2026" finishers Kilian Jornet Courtney Dauwalter ranking',
      '"UTMB Mont-Blanc" 2026 race report analysis strategy',
    ],
    tags: ["UTMB", "ultra-trail", "live"],
  },
  {
    slug: "western-states-100",
    name: "Western States 100",
    start: "2026-06-27",
    location: "California, USA",
    queries: [
      '"Western States 100" 2026 results finishers leader',
      '"WS100" 2026 men women top ten race report',
      '"Western States" 2026 golden hour finishers',
    ],
    tags: ["Western States", "ultra-trail", "live"],
  },
  {
    slug: "hardrock-100",
    name: "Hardrock 100",
    start: "2026-07-10",
    location: "Silverton, Colorado, USA",
    queries: [
      '"Hardrock 100" 2026 results finishers',
      '"Hardrock 100" Silverton 2026 Kiss the rock',
      '"Hardrock" 2026 men women winners race report',
    ],
    tags: ["Hardrock", "ultra-trail", "live"],
  },
  {
    slug: "tor-des-geants",
    name: "Tor des Géants",
    start: "2026-09-13",
    location: "Val d'Aoste, Italie",
    queries: [
      '"Tor des Geants" 2026 results finishers 330 km',
      '"Tor des Géants" Aosta 2026 race report',
      '"Tor des Geants" 2026 leader board live',
    ],
    tags: ["Tor des Géants", "ultra-trail", "live"],
  },
  {
    slug: "diagonale-des-fous",
    name: "Diagonale des Fous",
    start: "2026-10-15",
    location: "La Réunion",
    queries: [
      '"Diagonale des Fous" 2026 Réunion résultats',
      '"Grand Raid" Réunion 2026 vainqueurs analyse',
      '"Diagonale des Fous" 2026 D+ volcan parcours',
    ],
    tags: ["Diagonale des Fous", "ultra-trail", "live"],
  },
  {
    slug: "lavaredo-ultra-trail",
    name: "Lavaredo Ultra Trail",
    start: "2026-06-26",
    location: "Dolomites, Italie",
    queries: [
      '"Lavaredo Ultra Trail" 2026 results Cortina',
      '"Lavaredo" 2026 finishers women men race',
      '"Lavaredo Ultra" 2026 Cortina Dolomiti live',
    ],
    tags: ["Lavaredo", "ultra-trail", "live"],
  },
  {
    slug: "transgrancanaria",
    name: "Transgrancanaria",
    start: "2026-02-27",
    location: "Îles Canaries",
    queries: [
      '"Transgrancanaria" 2026 results Gran Canaria',
      '"Transgrancanaria" 2026 race report analysis',
    ],
    tags: ["Transgrancanaria", "ultra-trail", "live"],
  },
  {
    slug: "marathon-des-sables",
    name: "Marathon des Sables",
    start: "2026-04-10",
    location: "Maroc",
    queries: [
      '"Marathon des Sables" 2026 Morocco results stages',
      '"MDS" 2026 Sahara desert race report',
    ],
    tags: ["MDS", "Marathon des Sables", "live"],
  },
  {
    slug: "zegama-marathon",
    name: "Zegama Marathon",
    start: "2026-05-24",
    location: "Pays Basque, Espagne",
    queries: [
      '"Zegama Marathon" 2026 Skyrunning results',
      '"Zegama Aizkorri" 2026 race finishers',
    ],
    tags: ["Zegama", "Skyrunning", "live"],
  },
  {
    slug: "ultra-trail-mount-fuji",
    name: "Ultra-Trail Mt. Fuji",
    start: "2026-04-24",
    location: "Japon",
    queries: [
      '"Ultra-Trail Mt Fuji" 2026 results UTMF',
      '"UTMF" Japan 2026 race report',
    ],
    tags: ["Ultra-Trail Mt Fuji", "ultra-trail", "live"],
  },
  {
    slug: "madeira-island-ultra-trail",
    name: "Madeira Island Ultra Trail",
    start: "2026-04-25",
    location: "Madère, Portugal",
    queries: [
      '"Madeira Island Ultra Trail" 2026 results',
      '"MIUT" Madeira 2026 race report',
    ],
    tags: ["MIUT", "ultra-trail", "live"],
  },
  {
    slug: "mozart-100",
    name: "Mozart 100",
    start: "2026-06-06",
    location: "Salzbourg, Autriche",
    queries: [
      '"Mozart 100" 2026 Salzburg ultramarathon results',
    ],
    tags: ["Mozart 100", "ultra-trail", "live"],
  },
  {
    slug: "ultra-trail-cape-town",
    name: "Ultra-Trail Cape Town",
    start: "2026-11-28",
    location: "Afrique du Sud",
    queries: [
      '"Ultra-Trail Cape Town" 2026 results',
      '"UTCT" 2026 Table Mountain race report',
    ],
    tags: ["Ultra-Trail Cape Town", "ultra-trail", "live"],
  },
  {
    slug: "hong-kong-100",
    name: "Hong Kong 100",
    start: "2026-01-17",
    location: "Hong Kong",
    queries: [
      '"Hong Kong 100" 2026 HK100 results finishers',
    ],
    tags: ["HK100", "ultra-trail", "live"],
  },
  {
    slug: "trail-du-ventoux",
    name: "Trail du Ventoux",
    start: "2026-06-13",
    location: "Provence, France",
    queries: [
      '"Trail du Ventoux" 2026 résultats',
      '"Mont Ventoux" trail 2026 course Provence',
    ],
    tags: ["Trail du Ventoux", "live"],
  },
  {
    slug: "canyons-endurance-runs",
    name: "Canyons Endurance Runs by UTMB - 100M",
    start: "2026-04-24",
    location: "Auburn, Californie, USA",
    queries: [
      "Canyons Endurance Runs 100M 2026 preview elite field Golden Ticket Western States",
      "Canyons by UTMB 100 mile Auburn California 2026 favorites startlist",
      "Canyons 100 miles 2026 results recap winner"
    ],
    tags: ["canyons", "golden-ticket", "western-states-qualifier", "utmb-world-series", "100-miles"]
  },
  {
    slug: "grand-raid-ventoux-ugp",
    name: "Grand Raid Ventoux by UTMB - UGP",
    start: "2026-04-24",
    location: "Mont Ventoux, Provence, France",
    queries: [
      "Grand Raid Ventoux UGP UTMB 2026 preview favoris plateau 24 avril Mont Ventoux",
      "Ultra Geant de Provence UGP Ventoux 2026 startlist favoris plateau",
      "Ventoux UTMB World Series France 2026 elite results recap"
    ],
    tags: ["ventoux", "ugp", "provence", "france", "utmb-world-series"]
  },
];

// Fenêtre chaude : 48h avant, jusqu'à 72h après le jour de départ.
const HOURS_BEFORE = 48;
const HOURS_AFTER = 72;

/**
 * Retourne l'événement actif si on est dans sa fenêtre chaude, sinon null.
 * @param {Date} [now=new Date()]
 * @returns {null | { event: typeof HOT_EVENTS[number], relativeHours: number }}
 *          relativeHours négatif = avant l'événement, positif = après
 */
export function isInHotEventWindow(now = new Date()) {
  const tNow = now.getTime();
  for (const event of HOT_EVENTS) {
    const eventStart = new Date(event.start + "T08:00:00Z").getTime();
    const diffHours = (tNow - eventStart) / (1000 * 60 * 60);
    if (diffHours >= -HOURS_BEFORE && diffHours <= HOURS_AFTER) {
      return { event, relativeHours: Math.round(diffHours) };
    }
  }
  return null;
}

// Queries spécifiques à l'événement pour Tavily (3 queries par événement).
export function getEventSpecificQueries(event) {
  const defaultCategorySlug = "courses-recits";
  const domains = [
    "irunfar.com",
    "trailrunnermag.com",
    "ultrarunning.com",
    "lepape-info.com",
    "u-trail.com",
    "utmbmontblanc.com",
    "utmb.world",
    "wser.org",
    "hardrock100.com",
    "tordesgeants.it",
    "runnersworld.com",
    "runningmagazine.ca",
  ];
  return event.queries.map((q) => ({
    query: q,
    categorySlug: defaultCategorySlug,
    angle: `Couverture live de ${event.name} : résultats, analyses, performances clés. Angle éditorial propre au média trail francophone.`,
    include_domains: domains,
    hotEvent: event.slug,
  }));
}

// Cap quotidien dynamique : 10 articles pendant un événement chaud, 5 sinon.
export function getDynamicDailyCap(now = new Date()) {
  return isInHotEventWindow(now) ? 10 : 5;
}
