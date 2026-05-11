// Tracker noms propres FR pour booster l'actu chaude française dans les
// pipelines Tavily/brief. Inspiré de u-trail.com qui domine le créneau en
// piochant directement les Insta/X/FB d'athlètes francophones.
//
// Utilisation principale : pickFrenchSubjectQueries() injecte 30%+ des queries
// Tavily de chaque run sur des noms propres FR, le reste reste générique.

// ─── Athlètes français (élite + outsiders + figures historiques) ──────────
export const FRENCH_ATHLETES = [
  "Mathieu Blanchard",
  "Kilian Jornet", // FR/ES, énorme audience FR
  "François D'Haene",
  "Camille Bruyas",
  "Théo Detienne",
  "Vincent Esmiol",
  "Baptiste Chassagne",
  "Thomas Cardin",
  "Claire Bannwarth",
  "Manon Bohard",
  "Aurélien Dunand-Pallaz",
  "Beñat Marmissolle",
  "Ludovic Pommeret",
  "Audrey Tanguy",
  "Antoine Charvolin",
  "Thibaut Garrivier",
  "Anaïs Guichard",
  "Germain Grangier",
  "Sébastien Spehler",
  "Adèle Anstett",
  "Élise Poncet",
  "Nicolas Martin",
  "Caroline Chaverot",
  "Christel Dewalle",
  "Erik Clavery",
  "Blandine L'Hirondel",
  "Clémentine Geoffray",
  "Clément Molliet",
  "Xavier Thévenard",
  "Émilie Lecomte",
];

// ─── Marques FR (ou pertinentes marché FR) ─────────────────────────────────
export const FRENCH_BRANDS = [
  "Kiprun", // Decathlon, signal fort marché FR
  "Hoka", // FR market, racines françaises
  "Salomon",
  "Compressport",
  "Naak",
  "Veloce",
  "Raidlight",
  "Lafuma",
  "Buff", // FR market
  "Millet",
];

// ─── Influenceurs / figures média ──────────────────────────────────────────
export const FRENCH_INFLUENCERS = [
  "Clemquicourt", // Clément Deffrenne, ultra-followé
  "Clément Deffrenne",
  "François Beauchard",
  "Yannick Lostie de Kerhor",
  "Anthony Gay",
];

// Mois FR pour les queries (rotation par numéro de mois pour rester fluide).
const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const ATHLETE_DOMAINS_FR = [
  // Réseaux sociaux (annonces directes)
  "instagram.com", "twitter.com", "x.com", "facebook.com", "strava.com",
  // Médias FR
  "u-trail.com", "lepape-info.com", "trail-session.fr", "passiontrail.fr",
  "runactu.com", "esprit-trail.com", "journaldutrail.com",
  "wider-mag.com", "outdoor-running.com", "runningmag.fr",
  // Médias internationaux (couverture élite FR)
  "irunfar.com", "trailrunnermag.com", "ultrarunning.com",
  // ITRA pour résultats canoniques
  "itra.run",
];

const BRAND_DOMAINS_FR = [
  // Sites marques FR
  "decathlon.fr", "salomon.com", "hoka.com", "raidlight.com",
  "compressport.com", "lafuma.com", "millet.com",
  // Médias FR pour relais commercial
  "u-trail.com", "lepape-info.com", "trail-session.fr", "runactu.com",
  "passiontrail.fr", "runningmag.fr",
  // International pour reviews croisées
  "irunfar.com", "trailrunnermag.com",
];

const INFLUENCER_DOMAINS_FR = [
  "instagram.com", "twitter.com", "x.com", "facebook.com",
  "youtube.com", "strava.com",
  "u-trail.com", "lepape-info.com", "passiontrail.fr",
];

/**
 * Pioche `count` queries Tavily ciblées sur des noms propres FR, rotées par
 * heure pour éviter les doublons inter-runs. La rotation balaie
 * athlètes → marques → influenceurs en alternance déterministe.
 *
 * @param {number} count        — nombre de queries à retourner
 * @param {number} [hour]       — heure UTC du run (0-23), défaut = heure courante
 * @param {Date}   [seedDate]   — pour mois courant dans la requête
 * @returns {Array<object>}
 */
export function pickFrenchSubjectQueries(count, hour, seedDate = new Date()) {
  const h = typeof hour === "number" ? hour : seedDate.getUTCHours();
  const dayKey = `${seedDate.getUTCFullYear()}-${seedDate.getUTCMonth()}-${seedDate.getUTCDate()}-${h}`;
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) hash = (hash * 31 + dayKey.charCodeAt(i)) & 0xffffffff;
  const absHash = Math.abs(hash);

  const monthLabel = MONTHS_FR[seedDate.getUTCMonth()];
  const year = seedDate.getUTCFullYear();

  // Trois groupes pour le round-robin déterministe.
  const groups = [
    {
      kind: "athlete",
      names: FRENCH_ATHLETES,
      domains: ATHLETE_DOMAINS_FR,
      categorySlug: "courses-recits",
      vertical: "athletes",
      buildQuery: (name) => `"${name}" actualité ${monthLabel} ${year} course annonce`,
      buildAngle: (name) =>
        `Actualité ${name} : annonce de course, performance, déclaration publique récente. Vérifier les déclarations officielles (Insta, communiqués) et croiser avec médias FR (u-trail, lepape-info, trail-session).`,
    },
    {
      kind: "brand",
      names: FRENCH_BRANDS,
      domains: BRAND_DOMAINS_FR,
      categorySlug: "equipement",
      vertical: "equipement",
      buildQuery: (brand) => `"${brand}" trail running ${monthLabel} ${year} nouveauté annonce France`,
      buildAngle: (brand) =>
        `Actualité ${brand} sur le marché trail FR : nouveauté produit, prix en euros, disponibilité Decathlon/revendeurs FR, positionnement vs Salomon/Hoka.`,
    },
    {
      kind: "influencer",
      names: FRENCH_INFLUENCERS,
      domains: INFLUENCER_DOMAINS_FR,
      categorySlug: "actualites",
      vertical: "athletes",
      buildQuery: (name) => `"${name}" trail running ${monthLabel} ${year} actualité`,
      buildAngle: (name) =>
        `Actualité ${name} : prises de position, contenus publiés, déclarations en lien avec l'actu trail FR. Angle factuel, pas de jugement gratuit.`,
    },
  ];

  const startGroup = (h + absHash) % groups.length;
  const out = [];
  const seen = new Set();
  let attempts = 0;
  let groupIdx = startGroup;
  let pickIdx = 0;

  while (out.length < count && attempts < count * groups.length * 4) {
    const group = groups[groupIdx % groups.length];
    const nameIdx = (absHash + pickIdx * 13 + groupIdx * 7) % group.names.length;
    const subject = group.names[nameIdx];
    const query = group.buildQuery(subject);
    if (!seen.has(query)) {
      seen.add(query);
      out.push({
        query,
        angle: group.buildAngle(subject),
        categorySlug: group.categorySlug,
        vertical: group.vertical,
        include_domains: group.domains,
        frenchSubject: subject,
        frenchSubjectKind: group.kind,
      });
    }
    groupIdx++;
    if (groupIdx % groups.length === startGroup) pickIdx++;
    attempts++;
  }
  return out;
}

/**
 * Helper pour mixer des queries FR dans un set existant (au moins minRatio FR).
 *
 * @param {Array<object>} baseQueries
 * @param {number} minRatio
 * @param {Date}   [seedDate]
 * @returns {Array<object>}
 */
export function mixWithFrenchQueries(baseQueries, minRatio = 0.3, seedDate = new Date()) {
  if (!Array.isArray(baseQueries) || baseQueries.length === 0) {
    return pickFrenchSubjectQueries(3, undefined, seedDate);
  }
  const total = baseQueries.length;
  const frCount = Math.max(1, Math.ceil(total * minRatio));
  const frQueries = pickFrenchSubjectQueries(frCount, undefined, seedDate);
  const keepGeneric = baseQueries.slice(0, total - frCount);
  return [...frQueries, ...keepGeneric];
}
