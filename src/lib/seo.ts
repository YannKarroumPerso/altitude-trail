import { Article, Race } from "@/types";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://altitude-trail.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Altitude Trail";
export const SITE_DESCRIPTION =
  "Actualités, courses, entraînement, nutrition, blessures et récits du trail running en France et dans le monde.";
export const SITE_LOCALE = "fr_FR";
export const SITE_LANG = "fr";
export const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=80";
export const ORG_LOGO = `${SITE_URL}/favicon.ico`;
export const INDEXNOW_KEY = "4e7c8a2f5b9d1e3a6c4f8b2d5e7a9c1f";

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

export function buildNewsArticleJsonLd(article: Article) {
  const url = articleUrl(article.slug);
  const published = parseFrDate(article.date).toISOString();
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title,
    description: article.excerpt,
    image: [absoluteUrl(article.image)],
    datePublished: published,
    dateModified: published,
    author: { "@type": "Organization", name: article.author || SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: ORG_LOGO },
    },
    articleSection: article.category,
    keywords: article.tags?.join(", "),
    inLanguage: SITE_LANG,
    url,
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
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: ORG_LOGO,
    description: SITE_DESCRIPTION,
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANG,
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
    inLanguage: SITE_LANG,
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
