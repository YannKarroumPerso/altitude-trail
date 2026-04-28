import { articles } from "@/lib/data";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_LANG,
  absoluteUrl,
  articleUrl,
  getArticlePublishedAt,
} from "@/lib/seo";

// Flux RSS 2.0 complet — soumis à Google Publisher Center, ingéré par
// Feedly/Inoreader/NewsBlur, parsable par tout agrégateur tiers.
// Spec : RSS 2.0 + extensions atom: (self link), content: (full text),
// dc: (creator), media: (images responsives), sy: (fréquence de publication).

// Recalcule à chaque requête (max 600 s grâce au revalidate ci-dessous).
// Sans ce flag, Next compile la route en SSG au build et le RSS ne bouge
// plus jusqu'au prochain déploiement Vercel — incompatible avec un site qui
// publie 5+ articles/jour. 600 s = 10 min de fraîcheur, aligné sur la
// news-sitemap. Pour les agrégateurs polling, ttl=60 + Cache-Control déjà
// négociés derrière (lecteur RSS qui poll plus souvent que 10 min servi via
// CDN de toute façon).
export const revalidate = 600;

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

// Détection MIME image basée sur l'extension d'URL (avec stripping query).
// Couvre les hosts internes (.jpg/.png/.webp dans /public/articles) et les
// hosts externes (Unsplash params query). Fallback image/jpeg pour les URLs
// sans extension détectable (cas Unsplash sans `.jpg` explicite).
function imageMime(url: string): string {
  const path = url.toLowerCase().split("?")[0].split("#")[0];
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

// Mini-renderer markdown → HTML inline. Couvre exactement les patterns
// produits par scripts/veille*.mjs et brief-publish.mjs :
//   - headings ##, ###
//   - paragraphes (lignes séparées par ligne vide)
//   - images ![alt](url)
//   - liens [label](url)
//   - listes - item (regroupées en <ul>)
// Les patterns plus exotiques (tableaux, code blocks, blockquotes) ne sont
// pas produits par nos pipelines, on évite donc d'ajouter une dépendance.
// Sortie destinée à <content:encoded><![CDATA[ ... ]]></content:encoded> —
// donc pas besoin d'escape XML, le CDATA s'en occupe.
function renderMarkdownToHtml(md: string): string {
  if (!md) return "";
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let buffer: string[] = [];
  let inList = false;
  const flushParagraph = () => {
    if (!buffer.length) return;
    const para = buffer.join(" ").trim();
    buffer = [];
    if (para) out.push(`<p>${renderInline(para)}</p>`);
  };
  const flushList = () => {
    if (!inList) return;
    out.push("</ul>");
    inList = false;
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      flushParagraph();
      flushList();
      out.push(`<h2>${renderInline(h2[1])}</h2>`);
      continue;
    }
    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      flushParagraph();
      flushList();
      out.push(`<h3>${renderInline(h3[1])}</h3>`);
      continue;
    }
    const li = trimmed.match(/^[-*]\s+(.+)$/);
    if (li) {
      flushParagraph();
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${renderInline(li[1])}</li>`);
      continue;
    }
    // Image seule sur sa ligne → block-level
    const imgOnly = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgOnly) {
      flushParagraph();
      flushList();
      out.push(`<p><img src="${escapeAttr(imgOnly[2])}" alt="${escapeAttr(imgOnly[1])}" /></p>`);
      continue;
    }
    buffer.push(trimmed);
  }
  flushParagraph();
  flushList();
  return out.join("\n");
}

// Rend les patterns inline : liens, images, gras/italique simple.
function renderInline(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => `<a href="${escapeAttr(url)}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<![*\w])\*([^*]+)\*(?!\w)/g, "<em>$1</em>");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export async function GET() {
  const sorted = [...articles].sort(
    (a, b) => getArticlePublishedAt(b).getTime() - getArticlePublishedAt(a).getTime(),
  );
  const recent = sorted.slice(0, 50);
  // Heure de génération réelle : signal de fraîcheur correct pour les
  // agrégateurs qui poll lastBuildDate avant de re-fetcher le flux entier.
  const lastBuild = new Date();

  const items = recent
    .map((a) => {
      const url = articleUrl(a.slug);
      const pub = getArticlePublishedAt(a);
      const image = absoluteUrl(a.image);
      const mime = imageMime(image);
      // Filtre les category vides (plus de balise <category></category> qui
      // pollue le flux pour les articles sans tag principal).
      const mainCategory = a.category && a.category.trim()
        ? `      <category>${escapeXml(a.category)}</category>\n`
        : "";
      const tagCategories = (a.tags || [])
        .filter((t) => t && t.trim())
        .map((t) => `      <category>${escapeXml(t)}</category>`)
        .join("\n");
      const tagsBlock = tagCategories ? `${tagCategories}\n` : "";
      // content:encoded = full text rendu en HTML pour les agrégateurs RSS
      // (Feedly, Inoreader, NewsBlur) et Publisher Center. Wrappé en CDATA
      // pour ne pas avoir à échapper le HTML dans du XML.
      const contentHtml = a.content
        ? `      <content:encoded><![CDATA[${renderMarkdownToHtml(a.content)}]]></content:encoded>\n`
        : "";
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(a.excerpt)}</description>
${contentHtml}      <pubDate>${rfc822(pub)}</pubDate>
      <dc:creator>${escapeXml(a.author)}</dc:creator>
${mainCategory}${tagsBlock}      <enclosure url="${image}" type="${mime}"/>
      <media:content url="${image}" medium="image" type="${mime}"/>
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
