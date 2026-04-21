import { articles } from "@/lib/data";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_LANG,
  absoluteUrl,
  articleUrl,
  parseFrDate,
} from "@/lib/seo";

// Flux RSS 2.0 complet — ingéré par Google Actualités, Feedly, agrégateurs
// tiers. Les champs suivent la spec RSS 2.0 + extensions content:, atom:,
// media:, dc: et sy: pour la fréquence de publication.

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(date: Date): string {
  return date.toUTCString();
}

export async function GET() {
  const sorted = [...articles].sort(
    (a, b) => parseFrDate(b.date).getTime() - parseFrDate(a.date).getTime(),
  );
  const recent = sorted.slice(0, 50);
  const lastBuild = recent[0] ? parseFrDate(recent[0].date) : new Date();

  const items = recent
    .map((a) => {
      const url = articleUrl(a.slug);
      const pub = parseFrDate(a.date);
      const image = absoluteUrl(a.image);
      const categories = (a.tags || []).map(
        (t) => `      <category>${escapeXml(t)}</category>`,
      ).join("\n");
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(a.excerpt)}</description>
      <pubDate>${rfc822(pub)}</pubDate>
      <dc:creator>${escapeXml(a.author)}</dc:creator>
      <category>${escapeXml(a.category)}</category>
${categories}
      <enclosure url="${image}" type="image/jpeg" length="0"/>
      <media:content url="${image}" medium="image" type="image/jpeg"/>
      <media:thumbnail url="${image}"/>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>${SITE_LANG}</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(SITE_NAME)}</copyright>
    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
    <pubDate>${rfc822(lastBuild)}</pubDate>
    <ttl>60</ttl>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
      <width>600</width>
      <height>60</height>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
