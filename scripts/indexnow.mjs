#!/usr/bin/env node

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://altitude-trail.vercel.app").replace(/\/$/, "");
const KEY = process.env.INDEXNOW_KEY || "4e7c8a2f5b9d1e3a6c4f8b2d5e7a9c1f";
const HOST = SITE_URL.replace(/^https?:\/\//, "");
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

async function fetchSitemapUrls() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`, { headers: { "User-Agent": "altitude-trail-indexnow/1.0" } });
  if (!res.ok) throw new Error(`sitemap fetch ${res.status}`);
  const xml = await res.text();
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1].trim()).filter(Boolean);
}

async function pingIndexNow(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  return { status: res.status, text: text.slice(0, 500) };
}

async function verifyKeyFile() {
  const res = await fetch(KEY_LOCATION, { headers: { "User-Agent": "altitude-trail-indexnow/1.0" } });
  if (!res.ok) throw new Error(`key file ${KEY_LOCATION} returned ${res.status}`);
  const body = (await res.text()).trim();
  if (body !== KEY) throw new Error(`key file content mismatch`);
}

async function main() {
  console.log(`[indexnow] site: ${SITE_URL}`);
  await verifyKeyFile();
  console.log(`[indexnow] key file verified: ${KEY_LOCATION}`);
  const urls = await fetchSitemapUrls();
  console.log(`[indexnow] ${urls.length} URL(s) from sitemap`);
  if (!urls.length) return;
  const chunks = [];
  for (let i = 0; i < urls.length; i += 10000) chunks.push(urls.slice(i, i + 10000));
  for (const chunk of chunks) {
    const result = await pingIndexNow(chunk);
    console.log(`[indexnow] POST ${chunk.length} urls -> ${result.status} ${result.text}`);
  }
}

main().catch((e) => {
  console.error(`[indexnow] error: ${e.message}`);
  process.exit(1);
});
