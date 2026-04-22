import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("content/articles");
const DATA_PATH = path.resolve("src/lib/data.ts");
const START_MARKER = "// AUTO-ARTICLES:START";
const END_MARKER = "// AUTO-ARTICLES:END";

function parseFrenchDate(str) {
  const months = { janvier:0, "fevrier":1, "février":1, mars:2, avril:3, mai:4, juin:5, juillet:6, "aout":7, "août":7, septembre:8, octobre:9, novembre:10, "decembre":11, "décembre":11 };
  const m = str?.match?.(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
  if (!m) return new Date(0);
  const month = months[m[2].toLowerCase()];
  if (month == null) return new Date(0);
  return new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
}

async function loadArticles() {
  const entries = await fs.readdir(CONTENT_DIR).catch(() => []);
  const articles = [];
  for (const file of entries) {
    if (!file.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
    const { data, content } = matter(raw);
    if (!data.slug || !data.title || !data.categorySlug) continue;
    articles.push({
      slug: String(data.slug),
      title: String(data.title),
      excerpt: String(data.excerpt || ""),
      category: String(data.category || ""),
      categorySlug: String(data.categorySlug),
      author: String(data.author || "Redaction Altitude"),
      date: String(data.date || ""),
      updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
      readTime: String(data.readTime || "7 min"),
      image: String(data.image || ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      youtubeVideoId: data.youtubeVideoId ? String(data.youtubeVideoId) : undefined,
      youtubeTitle: data.youtubeTitle ? String(data.youtubeTitle) : undefined,
      youtubeChannel: data.youtubeChannel ? String(data.youtubeChannel) : undefined,
      youtubeDuration: typeof data.youtubeDuration === "number" ? data.youtubeDuration : undefined,
      youtubeUploadDate: data.youtubeUploadDate ? String(data.youtubeUploadDate) : undefined,
      externalRefs: Array.isArray(data.externalRefs)
        ? data.externalRefs.filter((r) => r && r.url).map((r) => ({ url: String(r.url), label: String(r.label || r.url) }))
        : undefined,
      content: content.trim(),
    });
  }
  articles.sort((a, b) => parseFrenchDate(b.date) - parseFrenchDate(a.date));
  return articles;
}

function renderArticlesTs(articles) {
  if (!articles.length) return "const generatedArticles: Article[] = [];";
  const entries = articles.map((a) => {
    const fields = [
      `    slug: ${JSON.stringify(a.slug)}`,
      `    title: ${JSON.stringify(a.title)}`,
      `    excerpt: ${JSON.stringify(a.excerpt)}`,
      `    category: ${JSON.stringify(a.category)}`,
      `    categorySlug: ${JSON.stringify(a.categorySlug)}`,
      `    author: ${JSON.stringify(a.author)}`,
      `    date: ${JSON.stringify(a.date)}`,
      ...(a.updatedAt ? [`    updatedAt: ${JSON.stringify(a.updatedAt)}`] : []),
      `    readTime: ${JSON.stringify(a.readTime)}`,
      `    image: ${JSON.stringify(a.image)}`,
      `    tags: ${JSON.stringify(a.tags)}`,
      ...(a.youtubeVideoId ? [`    youtubeVideoId: ${JSON.stringify(a.youtubeVideoId)}`] : []),
      ...(a.youtubeTitle ? [`    youtubeTitle: ${JSON.stringify(a.youtubeTitle)}`] : []),
      ...(a.youtubeChannel ? [`    youtubeChannel: ${JSON.stringify(a.youtubeChannel)}`] : []),
      ...(a.youtubeDuration ? [`    youtubeDuration: ${a.youtubeDuration}`] : []),
      ...(a.youtubeUploadDate ? [`    youtubeUploadDate: ${JSON.stringify(a.youtubeUploadDate)}`] : []),
      ...(a.externalRefs && a.externalRefs.length ? [`    externalRefs: ${JSON.stringify(a.externalRefs)}`] : []),
      `    content: ${JSON.stringify(a.content)}`,
    ].join(",\n");
    return `  {\n${fields},\n  }`;
  }).join(",\n");
  return `const generatedArticles: Article[] = [\n${entries},\n];`;
}

async function main() {
  const articles = await loadArticles();
  console.log(`[regen] ${articles.length} articles`);
  const current = await fs.readFile(DATA_PATH, "utf8");
  const s = current.indexOf(START_MARKER);
  const e = current.indexOf(END_MARKER);
  if (s === -1 || e === -1) throw new Error("markers missing");
  const next = current.slice(0, s + START_MARKER.length) + "\n" + renderArticlesTs(articles) + "\n" + current.slice(e);
  if (next === current) {
    console.log("[regen] data.ts inchange");
  } else {
    await fs.writeFile(DATA_PATH, next, "utf8");
    console.log("[regen] data.ts ecrit");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
