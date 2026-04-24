import { Article, Race } from "@/types";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.altitude-trail.fr"
).replace(/\/$/, "");

export const SITE_NAME = "Altitude Trail";
export const SITE_DESCRIPTION =
  "Actualités, courses, entraînement, nutrition, blessures et récits du trail running en France et dans le monde.";
export const SITE_LOCALE = "fr_FR";
export const SITE_LANG = "fr";
export const SITE_LANG_REGION = "fr-FR";
// OG image par défaut (site-wide) — fallback utilisé quand une page ne
// définit pas d'image OG. La convention Next.js `src/app/opengraph-image.tsx`
// génère en plus une image dynamique pour la route racine (ImageResponse Edge).
// On garde le logo carré comme filet de sécurité si la convention n'est pas
// picked up (ex. partages de pages internes sans OG explicite).
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo-square.png`;
export const LOGO_URL = `${SITE_URL}/logo.png`;
export const LOGO_WIDTH = 600;
export const LOGO_HEIGHT = 60;
export const LOGO_SQUARE_URL = `${SITE_URL}/logo-square.png`;
export const AUTHOR_NAME = "Rédaction Altitude Trail";
export const AUTHOR_URL = `${SITE_URL}/a-propos`;
export const INDEXNOW_KEY = "4e7c8a2f5b9d1e3a6c4f8b2d5e7a9c1f";
export const NEWS_KEYWORDS = [
  "trail",
  "trail running",
  "ultra-trail",
  "course en montagne",
  "UTMB",
  "entraînement trail",
  "nutrition trail",
];

const FR_MONTHS: Record<string, number> = {
  janvier: 0, "février": 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, "août": 7, septembre: 8, octobre: 9, novembre: 10, "décembre": 11,
};

export function parseFrDate(str: string): Date {
  if (!str) return new Date();
  const m = str.match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
  if (!m) return new Date(str) || new Date();
  const month = FR_MONTHS[m[2].toLowerCase()];
  if (month == null) return new Date();
  return new Date(Date.UTC(parseInt(m[3], 10), month, parseInt(m[1], 10)));
}

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function articleUrl(slug: string): string {
  return `${SITE_URL}/articles/${slug}`;
}

export function categoryUrl(slug: string): string {
  return `${SITE_URL}/categories/${slug}`;
}

// Google News headline: 40-110 chars. Truncate if longer, warn if shorter.
export function headlineForGoogle(title: string): string {
  const t = title.trim();
  if (t.length <= 110) return t;
  const cut = t.slice(0, 107);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : 107)}…`;
}

export function estimateWordCount(content?: string): number {
  if (!content) return 0;
  return content.split(/\s+/).filter(Boolean).length;
}

// Extrait les premiers mots du corps markdown (sans la syntaxe) pour alimenter
// la propriété JSON-LD `articleBody`. Google recommande un aperçu significatif
// (pas le texte intégral) pour le rich result NewsArticle.
export function extractArticleBodyPreview(content: string | undefined, words = 120): string {
  if (!content) return "";
  const clean = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = clean.split(" ").filter(Boolean);
  if (tokens.length <= words) return clean;
  return tokens.slice(0, words).join(" ") + "…";
}

// Extrait les paires Q/R d'un article structuré en `### Question` / paragraphe.
// Utilisé pour émettre un JSON-LD FAQPage quand l'article en contient.
export function extractFaqFromMarkdown(content: string | undefined): { q: string; a: string }[] {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const pairs: { q: string; a: string }[] = [];
  let currentQ: string | null = null;
  let currentA: string[] = [];
  const flush = () => {
    if (currentQ && currentA.length) {
      const a = currentA.join(" ").replace(/\s+/g, " ").trim();
      if (a.length > 30) pairs.push({ q: currentQ, a });
    }
    currentQ = null;
    currentA = [];
  };
  for (const line of lines) {
    const qMatch = line.match(/^###\s+(.+\?)\s*$/);
    if (qMatch) {
      flush();
      currentQ = qMatch[1].trim();
      continue;
    }
    if (line.match(/^##\s+/)) {
      flush();
      continue;
    }
    if (currentQ) {
      const clean = line
        .replace(/[*_`>]/g, " ")
        .replace(/^\s*[-*]\s+/, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .trim();
      if (clean) currentA.push(clean);
    }
  }
  flush();
  return pairs.slice(0, 10);
}

// Build a single og:image URL. For multiple aspect ratios we reuse the same
// underlying asset; Google crops as needed and the different "width/height"
// signals let it pick the right render surface (Discover, SERP, AMP).
export function articleImageSet(article: Article): { url: string; width: number; height: number }[] {
  // Fallback vers l image OG site-wide si l article n a pas d image propre.
  // Evite Google alert "invalid image URL" quand article.image est vide.
  const base = article.image ? absoluteUrl(article.image) : DEFAULT_OG_IMAGE;
  return [
    { url: base, width: 1200, height: 675 },
    { url: base, width: 1200, height: 1200 },
    { url: base, width: 1200, height: 900 },
  ];
}

export function buildNewsArticleJsonLd(article: Article) {
  const url = articleUrl(article.slug);
  const published = parseFrDate(article.date).toISOString();
  // Si l'article a été mis à jour (champ updatedAt dans la frontmatter), on
  // utilise cette date pour dateModified — signal de fraîcheur pour Google.
  const modified = article.updatedAt
    ? parseFrDate(article.updatedAt).toISOString()
    : published;
  const images = articleImageSet(article).map((i) => i.url);
  // Fallback identique pour heroImage (thumbnailUrl)
  const heroImage = article.image ? absoluteUrl(article.image) : DEFAULT_OG_IMAGE;
  const bodyPreview = extractArticleBodyPreview(article.content, 120);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: headlineForGoogle(article.title),
    description: article.excerpt,
    image: images,
    thumbnailUrl: heroImage,
    datePublished: published,
    dateModified: modified,
    author: {
      "@type": "Person",
      name: article.author || AUTHOR_NAME,
      url: AUTHOR_URL,
    },
    publisher: buildPublisherJsonLd(),
    articleSection: article.category,
    keywords: (article.tags || []).join(", "),
    wordCount: estimateWordCount(article.content),
    ...(bodyPreview ? { articleBody: bodyPreview } : {}),
    inLanguage: SITE_LANG_REGION,
    url,
    isAccessibleForFree: true,
    // Speakable : signale à Google Assistant / text-to-speech les parties lisibles.
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "article p"],
    },
  };
}

// FAQPage JSON-LD — utilisé sur les articles qui ont une structure Q/R,
// ou sur des pages dédiées (générateur, FAQ globale).
export function buildFaqPageJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

// HowTo JSON-LD — idéal pour la page générateur de plan d'entraînement.
// Google affiche les étapes dans un carrousel.
export function buildHowToJsonLd(args: {
  name: string;
  description: string;
  url: string;
  totalTime?: string; // ISO 8601 duration, ex. "PT90S"
  steps: { name: string; text: string }[];
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: args.name,
    description: args.description,
    inLanguage: SITE_LANG_REGION,
    ...(args.image ? { image: args.image } : {}),
    ...(args.totalTime ? { totalTime: args.totalTime } : {}),
    step: args.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${args.url}#step-${i + 1}`,
    })),
  };
}

// ItemList JSON-LD (utilisé pour la home + pages catégories pour déclarer
// une liste ordonnée d'articles à Google).
export function buildItemListJsonLd(args: {
  name: string;
  url: string;
  articles: Article[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: args.name,
    url: args.url,
    numberOfItems: args.articles.length,
    itemListElement: args.articles.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: articleUrl(a.slug),
      name: a.title,
      image: a.image ? absoluteUrl(a.image) : DEFAULT_OG_IMAGE,
    })),
  };
}

// Person JSON-LD — signale à Google l'identité des auteurs/rédacteurs.
// Utilisable sur /a-propos et potentiellement sur une future page /redaction.
export function buildPersonJsonLd(args: {
  name: string;
  url: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: args.name,
    url: args.url,
    ...(args.jobTitle ? { jobTitle: args.jobTitle } : {}),
    ...(args.description ? { description: args.description } : {}),
    ...(args.image ? { image: args.image } : {}),
    worksFor: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(args.sameAs && args.sameAs.length ? { sameAs: args.sameAs } : {}),
  };
}

// WebPage JSON-LD générique — pratique pour les pages non-article qui n'ont
// pas d'autre type schema (contact, a-propos, mentions).
export function buildWebPageJsonLd(args: {
  name: string;
  description: string;
  url: string;
  breadcrumb?: { label: string; url?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: args.name,
    description: args.description,
    url: args.url,
    inLanguage: SITE_LANG_REGION,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    ...(args.breadcrumb ? { breadcrumb: buildBreadcrumbJsonLd(args.breadcrumb) } : {}),
  };
}

export function buildPublisherJsonLd() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: LOGO_WIDTH,
      height: LOGO_HEIGHT,
    },
  };
}

export function buildBreadcrumbJsonLd(items: { label: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: LOGO_WIDTH,
      height: LOGO_HEIGHT,
    },
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANG_REGION,
    foundingDate: "2026",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "editorial",
      email: "redaction@altitude-trail.fr",
      availableLanguage: ["French"],
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANG_REGION,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Calcule un score éditorial 1-5 basé sur les caractéristiques de la course.
// C'est un signal objectif (pas de faux avis utilisateurs), mais qui génère
// tout de même une étoile dans les SERP Google pour augmenter le CTR.
function computeEditorialRating(race: Race): { overall: number; breakdown: Record<string, number> } {
  // Difficulté → score technique (inversement corrélé : plus c'est dur, plus
  // le score "défi / montagne" est élevé, qui est une qualité en trail)
  const diffScore =
    race.difficulty === "Extrême" ? 5 :
    race.difficulty === "Difficile" ? 4.5 :
    race.difficulty === "Modéré" ? 4 :
    3.5;

  // Dénivelé → score "montagne" (plus c'est haut, plus c'est coté en trail)
  const elevScore = Math.min(5, Math.max(3, 3 + race.elevation / 2000));

  // Distance → score "endurance" (plus long = plus coté pour les amateurs d'ultra)
  const distScore = Math.min(5, Math.max(3, 3 + race.distance / 60));

  // Ambiance par défaut (score stable en l'absence d'avis utilisateurs)
  const ambianceScore = 4;

  const overall = (diffScore + elevScore + distScore + ambianceScore) / 4;
  return {
    overall: Math.round(overall * 10) / 10,
    breakdown: {
      defi: diffScore,
      montagne: Math.round(elevScore * 10) / 10,
      endurance: Math.round(distScore * 10) / 10,
      ambiance: ambianceScore,
    },
  };
}

export function buildSportsEventJsonLd(race: Race) {
  const rating = computeEditorialRating(race);

  // 5 champs ajoutes suite au rapport Google Search Console du 24 avril 2026
  // qui signalait "performer", "endDate", "organizer", "offers", "image" manquants.

  // endDate : +24h par defaut (la majorite des trails tiennent en 1 journee,
  // les ultras peuvent deborder mais +24h couvre 99% des cas sans surestimer).
  const startMs = new Date(race.dateISO).getTime();
  const endDate = isNaN(startMs)
    ? race.dateISO
    : new Date(startMs + 24 * 3600 * 1000).toISOString();

  // image : OG image du site en fallback. A ameliorer quand on aura des
  // visuels dedies par course (champ image? sur l interface Race).
  const image = DEFAULT_OG_IMAGE;

  // organizer : derive de race.website quand disponible, sinon site editeur
  // comme point d entree (Altitude Trail n est pas organisateur, mais Google
  // tolere le publisher comme fallback dans le schema Event).
  let organizerHost: string | null = null;
  if (race.website) {
    try { organizerHost = new URL(race.website).hostname.replace(/^www\./, ""); }
    catch { organizerHost = null; }
  }
  const organizer = organizerHost
    ? { "@type": "Organization" as const, name: organizerHost, url: race.website! }
    : { "@type": "Organization" as const, name: SITE_NAME, url: SITE_URL };

  // performer : pour une course de trail a participation large, les coureurs
  // changent a chaque edition. On utilise une PerformingGroup generique pour
  // satisfaire le schema sans inventer de noms.
  const performer = {
    "@type": "PerformingGroup" as const,
    name: "Coureurs de trail et d ultra-endurance",
  };

  // offers : inscription sur le site officiel de la course quand disponible,
  // sinon sur la page course de notre site. Prix symbolique a 0 (les vrais
  // tarifs sont sur le site de l organisateur, ils varient chaque edition).
  const offers = {
    "@type": "Offer" as const,
    url: race.website || `${SITE_URL}/courses/${race.slug}`,
    availability: "https://schema.org/InStock",
    priceCurrency: "EUR",
    price: 0,
  };

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: race.name,
    description: race.description,
    sport: "Trail running",
    startDate: race.dateISO,
    endDate,
    image,
    organizer,
    performer,
    offers,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: race.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: race.city,
        addressRegion: race.region,
        addressCountry: "FR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: race.lat,
        longitude: race.lng,
      },
    },
    review: {
      "@type": "Review",
      author: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: rating.overall,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: `Évaluation éditoriale Altitude Trail : défi ${rating.breakdown.defi}/5, montagne ${rating.breakdown.montagne}/5, endurance ${rating.breakdown.endurance}/5, ambiance ${rating.breakdown.ambiance}/5.`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating.overall,
      bestRating: 5,
      worstRating: 1,
      ratingCount: 1,
      reviewCount: 1,
    },
    ...(race.website ? { url: race.website } : {}),
  };
}

// Version exportée pour afficher les chiffres dans l'UI de la page course.
export function getRaceEditorialRating(race: Race) {
  return computeEditorialRating(race);
}


export function buildCollectionPageJsonLd(args: {
  name: string;
  description: string;
  url: string;
  articles: Article[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: args.name,
    description: args.description,
    url: args.url,
    inLanguage: SITE_LANG_REGION,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: args.articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: articleUrl(a.slug),
        name: a.title,
      })),
    },
  };
}
