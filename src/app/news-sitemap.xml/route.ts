import { articles } from "@/lib/data";
import { SITE_URL, SITE_NAME, SITE_LANG, parseFrDate } from "@/lib/seo";

// Google News Sitemap — n'inclut que les articles publiés dans les 2 derniers
// jours (contrainte officielle du format Google News). Google News ne
// considère ce sitemap que pour les éditeurs enregistrés dans son programme.
// Pour un éditeur hors programme, le fichier reste valide et peut être pris
// en compte comme indice de fraîcheur par Googlebot classique.

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const now = Date.now();
  const recent = articles.filter((a) => {
    const d = parseFrDate(a.date).getTime();
    return d > 0 && now - d <= TWO_DAYS_MS;
  });

  const items = recent
    .map((a) => {
      const pub = parseFrDate(a.date).toISOString();
      const keywords = (a.tags || []).join(", ");
      return `  <url>
    <loc>${SITE_URL}/articles/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>${SITE_LANG}</news:language>
      </news:publication>
      <news:publication_date>${pub}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>${keywords ? `\n      <news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
