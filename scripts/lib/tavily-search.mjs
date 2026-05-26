// Wrapper de l'API Tavily (https://tavily.com).
//
// Tavily est un moteur de recherche conçu pour les agents LLM : les résultats
// sont dédupliqués, ré-ordonnés par pertinence, et accompagnés d'extraits
// lisibles par un modèle de langage. On l'utilise pour une veille trail
// thématique qui complète le flux RSS existant sans le remplacer.
//
// Clé API : variable d'environnement TAVILY_API_KEY.
// Plan gratuit : 1000 recherches / mois (largement suffisant pour notre usage).

// Helper alerte email Yann si Tavily renvoie HTTP 432 (quota epuise).
// Lazy import via dynamic import() pour eviter dependance forte et permettre
// au notifier de fallback en dry-run automatique si pas de gmail_app_password.
let _lastAlertSent432 = 0;
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1h

async function alertTavily432IfNeeded(errBody) {
  const now = Date.now();
  if (now - _lastAlertSent432 < ALERT_COOLDOWN_MS) {
    console.log("[tavily-alert] cooldown actif (-1h), alerte 432 deja envoyee dans ce run, skip");
    return;
  }
  _lastAlertSent432 = now;
  try {
    const { notifyYann } = await import("./email-notifier.mjs");
    const runUrl = process.env.GITHUB_SERVER_URL
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : "local";
    await notifyYann({
      subject: "[URGENT] Altitude Trail : Tavily quota epuise (HTTP 432)",
      body: `Tavily renvoie HTTP 432 = quota mensuel epuise.

PIPELINES IMPACTES (tous a l'arret tant que non resolu) :
- veille-tavily (synthese articles)
- brief-publish (breves)
- veille RSS (si requete Tavily fallback)
- live-coverage update (mise a jour articles isLive)

ACTION REQUISE :
1. Verifier conso sur https://app.tavily.com/account
2. Upgrade plan si quota atteint trop tot (Project = $30/mo, 4 000 credits, cancel anytime)
3. Ou attendre reset mensuel

Sans action, AUCUN article ne sera produit.

Detail erreur Tavily :
${(errBody || "").slice(0, 500)}

Cron source : ${process.env.GITHUB_WORKFLOW || "manuel"}
Run : ${runUrl}
`,
    });
    console.log("[tavily-alert] Email d'alerte 432 envoye a yannkarroum@gmail.com");
  } catch (notifErr) {
    console.error("[tavily-alert] Echec envoi alerte 432 :", notifErr.message);
  }
}

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
    // HTTP 432 = Tavily quota epuise. Envoyer une alerte email immediate
    // a Yann pour eviter le blackout silencieux (lecon 2026-05-26).
    if (res.status === 432) {
      await alertTavily432IfNeeded(text);
    }
    throw new Error(`Tavily ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    answer: data.answer,
    results: Array.isArray(data.results) ? data.results : [],
  };
}

// Domaines à exclure (trop généralistes, trop bruyants, ou risques légaux).
// NOTE : on a retiré instagram/twitter/x/facebook depuis le boost actu FR :
// ils sont désormais des SOURCES utiles pour les annonces d'athlètes francophones
// (calqué sur la stratégie u-trail.com). Pinterest, Reddit, TikTok, YouTube et
// Quora restent bannis car trop bruyants ou inadaptés au texte structuré.
export const TAVILY_EXCLUDE_DOMAINS = [
  "pinterest.com",
  "pinterest.fr",
  "reddit.com",
  "tiktok.com",
  "youtube.com",
  "quora.com",
  // u-trail.com BLACKLISTE (decision editoriale Yann 2026-05-14) :
  // on refuse de citer ce concurrent comme source primaire. Toutes les
  // variantes sont bloquees (www2, www3, sous-domaines, .fr).
  "u-trail.com",
  "u-trail.fr",
  "utrail.com",
  "utrail.fr",
];

// Helper : verifie si une URL appartient a un domaine blackliste.
// Test sur le hostname complet ET sur le domaine racine (= match aussi
// www2.u-trail.com, blog.u-trail.com, etc.).
export function isBlacklistedSource(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TAVILY_EXCLUDE_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    // Fallback : recherche string si l URL n est pas parsable.
    const lo = String(url).toLowerCase();
    return TAVILY_EXCLUDE_DOMAINS.some((d) => lo.includes(d));
  }
}

// Domaines prioritaires : si on les trouve dans les résultats, on les met en
// tête de pile pour enrichir Claude avec les meilleures sources.
// On AJOUTE des sources FR + réseaux sociaux sans supprimer l'existant.
export const TAVILY_PRIORITY_DOMAINS = [
  // Médias trail internationaux (existant)
  "irunfar.com",
  "trailrunnermag.com",
  "ultrarunning.com",
  "utmbmontblanc.com",
  "itra.run",
  "runnersworld.com",
  "runningmagazine.ca",
  // Science / santé (existant)
  "bjsm.bmj.com",
  "pubmed.ncbi.nlm.nih.gov",
  "insep.fr",
  // Médias FR (existant + ajouts P1)
  "lepape-info.com",
  // u-trail.com BLACKLISTE -- voir TAVILY_EXCLUDE_DOMAINS ci-dessous.
  "trail-session.fr",
  "runactu.com",
  "passiontrail.fr",
  "wider-mag.com",
  "esprit-trail.com",
  "journaldutrail.com",
  "runningmag.fr",
  // Réseaux sociaux (ajouts P1) — annonces directes d'athlètes/marques FR.
  // Inspiré de u-trail.com qui pioche dans Insta/X/FB pour l'actu chaude FR.
  "instagram.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "strava.com",
  // Sites marques FR (ajouts P1)
  "decathlon.fr",
  "salomon.com",
  "hoka.com",
  "raidlight.com",
  "compressport.com",
  "lafuma.com",
  "millet.com",
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
