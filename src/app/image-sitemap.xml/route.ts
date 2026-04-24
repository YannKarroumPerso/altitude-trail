import { articles } from "@/lib/data";
import { DEFAULT_OG_IMAGE, absoluteUrl, articleUrl } from "@/lib/seo";

// Image sitemap spec : https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
// Aide Google à découvrir et indexer les images des articles pour Google Images.
// Une image par article (la hero image, ou fallback OG image si absente).

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const entries = articles.map((a) => {
    const imgUrl = a.image ? absoluteUrl(a.image) : DEFAULT_OG_IMAGE;
    return `  <url>
    <loc>${escapeXml(articleUrl(a.slug))}</loc>
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(a.title)}</image:title>
      <image:caption>${escapeXml((a.excerpt || "").slice(0, 250))}</image:caption>
    </image:image>
  </url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

export const revalidate = 3600;
