import { articles } from "@/lib/data";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

// Sitemap dédié aux images — aide Google Images à crawler les hero images
// et les illustrations des articles. Le format <image:image> est officiel
// même si déprécié en annonce : Google continue de l'indexer et il reste
// recommandé pour les sites éditoriaux riches en visuels.

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const items = articles
    .filter((a) => a.image)
    .map((a) => {
      const url = `${SITE_URL}/articles/${a.slug}`;
      const imgUrl = absoluteUrl(a.image);
      return `  <url>
    <loc>${url}</loc>
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(a.title)}</image:title>
      <image:caption>${escapeXml(a.excerpt)}</image:caption>
    </image:image>
  </url>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
