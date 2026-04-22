// Génère un audit SEO hebdomadaire via Claude à partir des scores PSI
// et de quelques stats du site. Retourne un commentaire en markdown court.

import Anthropic from "@anthropic-ai/sdk";
import type { PsiResult } from "./pagespeed";

const MODEL = process.env.ANTHROPIC_AUDIT_MODEL || "claude-sonnet-4-6";

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY || process.env.Anthropic;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export interface SiteStats {
  totalArticles: number;
  articlesPublishedThisWeek: number;
  titlesThisWeek: string[];
  totalCategories: number;
  totalRaces: number;
}

export interface AuditContext {
  siteUrl: string;
  psiResults: PsiResult[];
  stats: SiteStats;
  previousWeekScores?: { url: string; strategy: string; performance: number; seo: number }[];
}

// Transforme les résultats PSI en résumé textuel dense pour l'input LLM.
function summarizePsi(results: PsiResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    if (r.error) {
      lines.push(`- ${r.url} (${r.strategy}) : ERREUR — ${r.error}`);
      continue;
    }
    const s = r.scores;
    const v = r.webVitals;
    const opp = r.opportunitiesTop3
      .map((o) => `${o.title} (${Math.round((o.savingsMs ?? 0) / 100) / 10}s)`)
      .join(" · ");
    lines.push(
      `- ${r.url} (${r.strategy}) : Perf ${s.performance} | SEO ${s.seo} | A11y ${s.accessibility} | BP ${s.bestPractices}`
    );
    lines.push(
      `  LCP=${v.lcp != null ? Math.round(v.lcp) + "ms" : "n/a"} · CLS=${v.cls != null ? v.cls.toFixed(3) : "n/a"} · FCP=${v.fcp != null ? Math.round(v.fcp) + "ms" : "n/a"} · TTFB=${v.ttfb != null ? Math.round(v.ttfb) + "ms" : "n/a"}${v.inp != null ? ` · INP=${Math.round(v.inp)}ms (CrUX)` : ""}`
    );
    if (opp) lines.push(`  Opportunités : ${opp}`);
  }
  return lines.join("\n");
}

export async function generateSeoAudit(ctx: AuditContext): Promise<string> {
  const client = getClient();
  if (!client) {
    return "_Audit Claude indisponible : ANTHROPIC_API_KEY manquante._";
  }

  const psiSummary = summarizePsi(ctx.psiResults);
  const recentTitles = ctx.stats.titlesThisWeek.length
    ? ctx.stats.titlesThisWeek.map((t, i) => `${i + 1}. ${t}`).join("\n")
    : "(aucun nouvel article cette semaine)";

  const prompt = `Tu es consultant SEO expert. Tu analyses l'état hebdo d'un site éditorial trail running (${ctx.siteUrl}).

DONNÉES BRUTES DE LA SEMAINE :

PageSpeed Insights (${ctx.psiResults.length} runs) :
${psiSummary}

Stats contenu :
- ${ctx.stats.totalArticles} articles au total
- ${ctx.stats.articlesPublishedThisWeek} articles publiés cette semaine
- ${ctx.stats.totalCategories} catégories
- ${ctx.stats.totalRaces} courses référencées

Articles de la semaine :
${recentTitles}

RESTITUE en markdown compact (pas de H1, pas de préambule) :

## État général
Une phrase factuelle sur la santé SEO/perf du site.

## 3 points forts de la semaine
Bullet list courte, factuelle, s'appuyant sur les chiffres PSI.

## 3 priorités d'action
Classées par impact vs effort. Très concrètes (fichier, route, métrique visée, gain attendu).
Si un score mobile Performance est < 80, c'est prioritaire. Si LCP > 2.5s en mobile, prioritaire.

## Trajectoire
Une phrase : est-ce que le site progresse, stagne, régresse ? (utilise les chiffres fournis, pas d'invention)

## Indicateur de confiance
Note de 0 à 10 sur la solidité SEO actuelle, justifiée en une ligne.

Règles :
- Pas de baratin. Chiffres à l'appui de chaque affirmation.
- Français, ton direct, tutoiement, pas d'emoji.
- Si des données manquent, dis-le (ne jamais inventer).
- Longueur totale : 250 mots max.`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    return text.trim();
  } catch (e) {
    return `_Erreur audit Claude : ${e instanceof Error ? e.message : String(e)}_`;
  }
}
