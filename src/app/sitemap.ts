import type { MetadataRoute } from "next";
import { articles, categories } from "@/lib/data";
import { races } from "@/lib/races-database";
import { SITE_URL, parseFrDate } from "@/lib/seo";

// Priorité articles décroissante avec l'âge : les plus récents = 0.8,
// puis dégressif jusqu'à 0.4 au-delà de 90 jours.
function articlePriority(date: Date, now: Date): number {
  const days = Math.max(0, (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return 0.9;
  if (days <= 7) return 0.85;
  if (days <= 30) return 0.75;
  if (days <= 90) return 0.6;
  return 0.4;
}

function articleChangeFreq(date: Date, now: Date): "daily" | "weekly" | "monthly" {
  const days = Math.max(0, (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return "daily";
  if (days <= 30) return "weekly";
  return "monthly";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/entrainement/generateur`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/trouver-une-course`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/parcours`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/lexique`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/guides/utmb`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/auteurs`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => {
    const d = parseFrDate(a.date);
    return {
      url: `${SITE_URL}/articles/${a.slug}`,
      lastModified: d,
      changeFrequency: articleChangeFreq(d, now),
      priority: articlePriority(d, now),
    };
  });

  const raceRoutes: MetadataRoute.Sitemap = races.map((r) => ({
    url: `${SITE_URL}/courses/${r.slug}`,
    lastModified: new Date(r.dateISO),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes, ...raceRoutes];
}
