// Wrapper de l'API Tavily (https://tavily.com).
//
// Tavily est un moteur de recherche conçu pour les agents LLM : les résultats
// sont dédupliqués, ré-ordonnés par pertinence, et accompagnés d'extraits
// lisibles par un modèle de langage. On l'utilise pour une veille trail
// thématique qui complète le flux RSS existant sans le remplacer.
//
// Clé API : variable d'environnement TAVILY_API_KEY.
// Plan gratuit : 1000 recherches / mois (largement suffisant pour notre usage).

const ENDPOINT = "https://api.tavily.com/search";

/**
 * @typedef {Object} TavilyResult
 * @property {string} url       — URL de la source
 * @property {string} title     — titre de la source
 * @property {string} content   — résumé/extrait pertinent (~500-1500 chars)
 * @property {number} score     — score de pertinence Tavily (0-1)
 * @property {string} [published_date] — date ISO si connue
 * @property {string} [raw_content] — contenu brut si demandé
 */

/**
 * @typedef {Object} TavilySearchOptions
 * @property {"basic"|"advanced"} [search_depth="basic"]
 * @property {number} [max_results=8]
 * @property {"news"|"general"} [topic="news"]
 * @property {number} [days]  — filtre fraîcheur (ex. 7 = derniers 7 jours)
 * @property {boolean} [include_answer=true]
 * @property {boolean} [include_raw_content=false]
 * @property {string[]} [include_domains] — limiter aux domaines
 * @property {string[]} [exclude_domains] — exclure certains domaines
 */

/**
 * Recherche Tavily.
 * @param {string} query
 * @param {TavilySearchOptions} [opts]
 * @returns {Promise<{answer?: string, results: TavilyResult[]}>}
 */
export async function tavilySearch(query, opts = {}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY manquante dans l'environnement");
  }

  const body = {
    api_key: apiKey,
    query,
    search_depth: opts.search_depth || "basic",
    max_results: opts.max_results ?? 8,
    topic: opts.topic || "news",
    include_answer: opts.include_answer ?? true,
    include_raw_content: opts.include_raw_content ?? false,
    ...(opts.days ? { days: opts.days } : {}),
    ...(opts.include_domains ? { include_domains: opts.include_domains } : {}),
    ...(opts.exclude_domains ? { exclude_domains: opts.exclude_domains } : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tavily ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    answer: data.answer,
    results: Array.isArray(data.results) ? data.results : [],
  };
}

// Domaines à exclure (trop généralistes, trop bruyants, ou risques légaux).
// On préfère les laisser hors whitelist que d'avoir Tavily qui nous renvoie
// des contenus que Claude citerait faute de mieux.
export const TAVILY_EXCLUDE_DOMAINS = [
  "pinterest.com",
  "pinterest.fr",
  "reddit.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "quora.com",
];

// Domaines prioritaires : si on les trouve dans les résultats, on les met en
// tête de pile pour enrichir Claude avec les meilleures sources.
export const TAVILY_PRIORITY_DOMAINS = [
  "irunfar.com",
  "trailrunnermag.com",
  "ultrarunning.com",
  "utmbmontblanc.com",
  "itra.run",
  "lepape-info.com",
  "u-trail.com",
  "runnersworld.com",
  "trail-session.fr",
  "runningmagazine.ca",
  "bjsm.bmj.com",
  "pubmed.ncbi.nlm.nih.gov",
  "insep.fr",
];

export function rerankByPriority(results) {
  if (!Array.isArray(results)) return [];
  const isPriority = (url) => {
    try {
      const h = new URL(url).hostname.replace(/^www\./, "");
      return TAVILY_PRIORITY_DOMAINS.some((d) => h.endsWith(d));
    } catch {
      return false;
    }
  };
  return [...results].sort((a, b) => {
    const pa = isPriority(a.url) ? 1 : 0;
    const pb = isPriority(b.url) ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return (b.score || 0) - (a.score || 0);
  });
}
