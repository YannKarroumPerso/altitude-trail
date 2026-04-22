// Cron hebdomadaire : lance PageSpeed Insights sur les URLs clés, demande à
// Claude un audit SEO, et envoie le tout par email à yannkarroum@gmail.com.
//
// Déclenché par Vercel Cron chaque lundi à 7h15 (cf. vercel.json).
// Auth par CRON_SECRET Bearer header (même convention que les autres crons).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { runPsiBatch } from "@/lib/pagespeed";
import { generateSeoAudit } from "@/lib/seo-audit";
import { sendWeeklyReportEmail } from "@/lib/email";
import { SITE_URL, parseFrDate } from "@/lib/seo";
import { articles, categories } from "@/lib/data";
import { races } from "@/lib/races-database";

const REPORT_RECIPIENT = "yannkarroum@gmail.com";

function frenchWeekLabel(now: Date): string {
  const dayOfWeek = now.getUTCDay() || 7; // lundi = 1
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - (dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
  return `Semaine du ${fmt(monday)} au ${fmt(sunday)}`;
}

function articlesThisWeek(now: Date) {
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return articles.filter((a) => {
    const d = parseFrDate(a.date).getTime();
    return d > 0 && d >= sevenDaysAgo;
  });
}

export async function GET(req: Request) {
  // Auth : Bearer CRON_SECRET (Vercel Cron) ou accès manuel via ?secret=
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;
  const urlObj = new URL(req.url);
  const querySecret = urlObj.searchParams.get("secret");
  const authorized =
    expected && (auth === `Bearer ${expected}` || querySecret === expected);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  console.log("[weekly-report] démarrage", now.toISOString());

  // URLs auditées : home, générateur, courses, article le plus récent
  const recentArticle = articles
    .slice()
    .sort((a, b) => parseFrDate(b.date).getTime() - parseFrDate(a.date).getTime())[0];
  const urlsToAudit = [
    SITE_URL,
    `${SITE_URL}/entrainement/generateur`,
    `${SITE_URL}/courses`,
    ...(recentArticle ? [`${SITE_URL}/articles/${recentArticle.slug}`] : []),
  ];

  // Override par query pour test manuel : ?urls=/a,/b
  const override = urlObj.searchParams.get("urls");
  const targets = override
    ? override.split(",").map((u) => (u.startsWith("http") ? u : `${SITE_URL}${u}`))
    : urlsToAudit;

  console.log("[weekly-report] PSI sur", targets.length, "URLs");
  const psiResults = await runPsiBatch(targets);

  const recent = articlesThisWeek(now);
  const stats = {
    totalArticles: articles.length,
    articlesPublishedThisWeek: recent.length,
    titlesThisWeek: recent.map((a) => a.title),
    totalCategories: categories.length,
    totalRaces: races.length,
  };

  console.log("[weekly-report] génération audit Claude…");
  const auditMarkdown = await generateSeoAudit({
    siteUrl: SITE_URL,
    psiResults,
    stats,
  });

  const psiRows = psiResults.map((r) => ({
    url: r.url,
    strategy: r.strategy,
    performance: r.scores.performance,
    seo: r.scores.seo,
    accessibility: r.scores.accessibility,
    bestPractices: r.scores.bestPractices,
    lcpMs: r.webVitals.lcp,
    clsScore: r.webVitals.cls,
    ttfbMs: r.webVitals.ttfb,
  }));

  const weekLabel = frenchWeekLabel(now);
  const sent = await sendWeeklyReportEmail({
    to: REPORT_RECIPIENT,
    psiRows,
    auditMarkdown,
    weekLabel,
    stats: {
      totalArticles: stats.totalArticles,
      articlesPublishedThisWeek: stats.articlesPublishedThisWeek,
    },
  });

  return Response.json({
    ok: sent,
    weekLabel,
    urlsAudited: targets.length,
    runsTotal: psiResults.length,
    errors: psiResults.filter((r) => r.error).map((r) => ({ url: r.url, strategy: r.strategy, error: r.error })),
    avgPerformanceMobile: (() => {
      const mob = psiResults.filter((r) => r.strategy === "mobile" && r.scores.performance != null);
      if (!mob.length) return null;
      return Math.round(mob.reduce((s, r) => s + (r.scores.performance ?? 0), 0) / mob.length);
    })(),
    avgSeoMobile: (() => {
      const mob = psiResults.filter((r) => r.strategy === "mobile" && r.scores.seo != null);
      if (!mob.length) return null;
      return Math.round(mob.reduce((s, r) => s + (r.scores.seo ?? 0), 0) / mob.length);
    })(),
  });
}
