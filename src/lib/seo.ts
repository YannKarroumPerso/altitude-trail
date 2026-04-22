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
export const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80";
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

// Build a single og:image URL. For multiple aspect ratios we reuse the same
// underlying asset; Google crops as needed and the different "width/height"
// signals let it pick the right render surface (Discover, SERP, AMP).
export function articleImageSet(article: Article): { url: string; width: number; height: number }[] {
  const base = absoluteUrl(article.image);
  return [
    { url: base, width: 1200, height: 675 },
    { url: base, width: 1200, height: 1200 },
    { url: base, width: 1200, height: 900 },
  ];
}

export function buildNewsArticleJsonLd(article: Article) {
  const url = articleUrl(article.slug);
  const published = parseFrDate(article.date).toISOString();
  const images = articleImageSet(article).map((i) => i.url);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: headlineForGoogle(article.title),
    description: article.excerpt,
    image: images,
    datePublished: published,
    dateModified: published,
    author: {
      "@type": "Person",
      name: article.author || AUTHOR_NAME,
      url: AUTHOR_URL,
    },
    publisher: buildPublisherJsonLd(),
    articleSection: article.category,
    keywords: (article.tags || []).join(", "),
    wordCount: estimateWordCount(article.content),
    inLanguage: SITE_LANG_REGION,
    url,
    isAccessibleForFree: true,
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

export function buildSportsEventJsonLd(race: Race) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: race.name,
    description: race.description,
    sport: "Trail running",
    startDate: race.dateISO,
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
    ...(race.website ? { url: race.website } : {}),
  };
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
