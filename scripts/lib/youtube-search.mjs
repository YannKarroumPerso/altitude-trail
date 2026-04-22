// Recherche d'une vidéo YouTube pertinente pour un article, via l'API
// YouTube Data v3. La clé est lue depuis YOUTUBE_API_DATA (convention Yann)
// ou YOUTUBE_API_KEY en fallback.
//
// Si la clé n'est pas présente OU si aucun résultat convenable, on renvoie
// null : l'article est alors publié sans vidéo, conformément à la règle
// "pas obligatoire sur chaque article".

const YT_API = "https://www.googleapis.com/youtube/v3";

function getKey() {
  return process.env.YOUTUBE_API_DATA || process.env.YOUTUBE_API_KEY;
}

// Convertit la durée ISO 8601 YouTube (PT1M23S) en secondes.
function parseIsoDuration(iso) {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const mi = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + mi * 60 + s;
}

// Cherche une vidéo. Renvoie un objet { videoId, title, channel, ... } ou null.
// Règles de sélection :
//   - durée entre 90s (pour éviter les shorts) et 30 min
//   - catégorie Sports (17) ou sans filtre si peu de résultats
//   - langue fr préférée, fallback any
//   - au moins 1000 vues (filtre bas pour ne pas écarter trop)
//   - pas de titre contenant "shorts", "#reels"
export async function findYouTubeVideoForArticle({ title, tags }) {
  const apiKey = getKey();
  if (!apiKey) {
    console.warn("[youtube] YOUTUBE_API_DATA manquante, skip recherche");
    return null;
  }
  // Query dérivée : titre tronqué + tags concaténés
  const shortTitle = title.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  const tagStr = (tags || []).slice(0, 2).join(" ");
  const q = `${shortTitle} ${tagStr} trail`.trim().slice(0, 120);

  const searchUrl = `${YT_API}/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=8&relevanceLanguage=fr&safeSearch=strict&videoEmbeddable=true&key=${apiKey}`;
  let searchData;
  try {
    const res = await fetch(searchUrl);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn(`[youtube] search ${res.status}: ${txt.slice(0, 200)}`);
      return null;
    }
    searchData = await res.json();
  } catch (e) {
    console.warn(`[youtube] search fetch error: ${e.message}`);
    return null;
  }

  const items = searchData.items || [];
  if (!items.length) return null;

  const ids = items.map((i) => i.id.videoId).filter(Boolean).slice(0, 8);
  if (!ids.length) return null;

  // Appel videos pour récupérer durée + stats
  const videosUrl = `${YT_API}/videos?part=contentDetails,statistics,snippet&id=${ids.join(",")}&key=${apiKey}`;
  let videos;
  try {
    const res = await fetch(videosUrl);
    if (!res.ok) return null;
    videos = await res.json();
  } catch {
    return null;
  }

  const candidates = (videos.items || [])
    .map((v) => {
      const duration = parseIsoDuration(v.contentDetails?.duration);
      const views = parseInt(v.statistics?.viewCount || "0", 10);
      const title = v.snippet?.title || "";
      return {
        videoId: v.id,
        title,
        channel: v.snippet?.channelTitle,
        duration,
        views,
        publishedAt: v.snippet?.publishedAt,
        description: v.snippet?.description || "",
      };
    })
    .filter((c) => {
      if (!c.videoId || !c.title) return false;
      if (c.duration != null && (c.duration < 90 || c.duration > 1800)) return false;
      if (c.views < 500) return false;
      if (/shorts|#reels/i.test(c.title)) return false;
      return true;
    })
    .sort((a, b) => b.views - a.views);

  if (!candidates.length) return null;
  const best = candidates[0];
  return {
    videoId: best.videoId,
    title: best.title,
    channel: best.channel || null,
    duration: best.duration || null,
    uploadDate: best.publishedAt || null,
  };
}
