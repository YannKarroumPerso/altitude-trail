import { articles } from "@/lib/data";
import { SITE_NAME, articleUrl, getArticlePublishedAt } from "@/lib/seo";

// Google News sitemap spec : https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
// Seuls les articles publiés dans les 48 dernières heures sont inclus (règle Google).
// Format dédié qui active l'indexation rapide en Google News pour les articles frais.

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const now = new Date();
  const cutoff = now.getTime() - 48 * 60 * 60 * 1000;

  const recent = articles.filter((a) => {
    const d = getArticlePublishedAt(a);
    return d.getTime() >= cutoff;
  });

  const entries = recent.map((a) => {
    const d = getArticlePublishedAt(a);
    return `  <url>
    <loc>${escapeXml(articleUrl(a.slug))}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${d.toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
  </url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}

// Force revalidation every 10 min (article freshness matters here)
export const revalidate = 600;
