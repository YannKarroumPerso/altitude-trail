// Wrapper Google PageSpeed Insights API v5.
// Doc : https://developers.google.com/speed/docs/insights/v5/get-started
//
// Sans clé API, la limite est ~1 req/sec (suffisant pour 8 runs hebdo).
// Avec PAGESPEED_API_KEY, on bénéficie d'un quota plus large.

export type PsiStrategy = "mobile" | "desktop";

export interface PsiResult {
  url: string;
  strategy: PsiStrategy;
  scores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  webVitals: {
    lcp: number | null; // ms
    cls: number | null; // score
    fcp: number | null; // ms
    inp: number | null; // ms (si dispo via field data)
    ttfb: number | null; // ms
    speedIndex: number | null; // ms
  };
  opportunitiesTop3: { id: string; title: string; savingsMs: number | null }[];
  error?: string;
}

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

function audit(obj: Record<string, unknown> | undefined, id: string): Record<string, unknown> | undefined {
  if (!obj) return undefined;
  const audits = obj as { audits?: Record<string, Record<string, unknown>> };
  return audits.audits?.[id];
}

function num(a: Record<string, unknown> | undefined, key = "numericValue"): number | null {
  if (!a) return null;
  const v = a[key];
  return typeof v === "number" ? v : null;
}

export async function runPsi(url: string, strategy: PsiStrategy): Promise<PsiResult> {
  const params = new URLSearchParams({
    url,
    strategy,
    locale: "fr",
  });
  // Plusieurs categories : on les ajoute manuellement (même clé répétée)
  const base = [
    "category=performance",
    "category=accessibility",
    "category=best-practices",
    "category=seo",
  ].join("&");
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (apiKey) params.set("key", apiKey);

  const fullUrl = `${PSI_ENDPOINT}?${params.toString()}&${base}`;

  const result: PsiResult = {
    url,
    strategy,
    scores: { performance: null, accessibility: null, bestPractices: null, seo: null },
    webVitals: { lcp: null, cls: null, fcp: null, inp: null, ttfb: null, speedIndex: null },
    opportunitiesTop3: [],
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const res = await fetch(fullUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      result.error = `PSI ${res.status}: ${t.slice(0, 150)}`;
      return result;
    }
    const data = await res.json();
    const lh = data.lighthouseResult as
      | { categories?: Record<string, { score: number | null }>; audits?: Record<string, Record<string, unknown>> }
      | undefined;

    if (lh?.categories) {
      result.scores.performance = Math.round((lh.categories.performance?.score ?? 0) * 100);
      result.scores.accessibility = Math.round((lh.categories.accessibility?.score ?? 0) * 100);
      result.scores.bestPractices = Math.round((lh.categories["best-practices"]?.score ?? 0) * 100);
      result.scores.seo = Math.round((lh.categories.seo?.score ?? 0) * 100);
    }

    result.webVitals.lcp = num(audit(lh, "largest-contentful-paint"));
    result.webVitals.cls = num(audit(lh, "cumulative-layout-shift"));
    result.webVitals.fcp = num(audit(lh, "first-contentful-paint"));
    result.webVitals.ttfb = num(audit(lh, "server-response-time"));
    result.webVitals.speedIndex = num(audit(lh, "speed-index"));

    // INP (field data, CrUX) si dispo
    const loading = data.loadingExperience as { metrics?: Record<string, { percentile?: number }> } | undefined;
    const inpMetric = loading?.metrics?.INTERACTION_TO_NEXT_PAINT;
    if (inpMetric?.percentile != null) result.webVitals.inp = inpMetric.percentile;

    // Top 3 opportunités d'amélioration (par savings)
    const audits = lh?.audits ?? {};
    const opps = Object.entries(audits)
      .filter(([, a]) => {
        const r = a as { details?: { type?: string }; numericValue?: number };
        return r.details?.type === "opportunity" && typeof r.numericValue === "number" && r.numericValue > 50;
      })
      .map(([id, a]) => {
        const r = a as { title?: string; numericValue?: number };
        return { id, title: r.title ?? id, savingsMs: r.numericValue ?? null };
      })
      .sort((x, y) => (y.savingsMs ?? 0) - (x.savingsMs ?? 0))
      .slice(0, 3);
    result.opportunitiesTop3 = opps;
  } catch (e) {
    result.error = `PSI fetch error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return result;
}

export async function runPsiBatch(urls: string[]): Promise<PsiResult[]> {
  const out: PsiResult[] = [];
  // Délai entre appels : 1.5s avec clé (quota large), 3s sans (rate limit
  // anonyme partagé ~1 req/sec). Ça rallonge le cron mais garantit la
  // collecte complète.
  const hasKey = !!process.env.PAGESPEED_API_KEY;
  const delayMs = hasKey ? 1500 : 3000;
  for (const url of urls) {
    for (const strategy of ["mobile", "desktop"] as PsiStrategy[]) {
      out.push(await runPsi(url, strategy));
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return out;
}
