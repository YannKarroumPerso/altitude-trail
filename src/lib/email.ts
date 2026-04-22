// Service d'envoi d'emails transactionnels via Resend.
// Ce module doit rester cote serveur uniquement.

import { Resend } from "resend";

let cachedResend: Resend | null = null;

function getResend(): Resend | null {
  if (cachedResend) return cachedResend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cachedResend = new Resend(key);
  return cachedResend;
}

export interface PlanReadyEmailArgs {
  to: string;
  prenom: string | null;
  courseName: string;
  courseDate: string;
  courseDistance: number;
  courseDenivele: number;
  planUrl: string;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function sendPlanReadyEmail(args: PlanReadyEmailArgs): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY manquante, envoi ignore");
    return false;
  }

  const hello = args.prenom ? `Salut ${args.prenom},` : "Salut !";
  const dateFr = formatDate(args.courseDate);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Ton plan Altitude Trail est prêt</title>
</head>
<body style="margin:0;padding:0;background:#f8f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0b1c30;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5eeff;">
          <!-- Header -->
          <tr>
            <td style="background:#0b1c30;padding:24px 32px;">
              <div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;">Altitude Trail</div>
              <div style="color:#ff4500;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-top:4px;">Le media trail de référence</div>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td style="background:#ff4500;color:#ffffff;padding:12px 32px;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">
              Ton plan d&apos;entraînement est prêt
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;line-height:1.2;font-weight:900;letter-spacing:-0.02em;">${hello}</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#334155;">
                Ton plan personnalisé pour <strong>${args.courseName}</strong> est terminé.
                Il est disponible dès maintenant sur ton espace dédié.
              </p>

              <!-- Course summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #ff4500;background:#f8f9ff;margin:24px 0;">
                <tr>
                  <td style="padding:20px;">
                    <div style="font-size:10px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Ta course cible</div>
                    <div style="font-size:18px;font-weight:900;margin-bottom:12px;">${args.courseName}</div>
                    <div style="font-size:13px;color:#475569;line-height:1.6;">
                      📅 ${dateFr}<br>
                      📏 ${args.courseDistance} km &nbsp;·&nbsp; ⛰️ ${args.courseDenivele.toLocaleString("fr-FR")} m D+
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px 0;">
                    <a href="${args.planUrl}" style="display:inline-block;background:#ff4500;color:#ffffff;text-decoration:none;padding:16px 32px;font-size:14px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;">
                      Voir mon plan
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                Ce lien est <strong>privé</strong> : il ne figure nulle part sur le site, il n&apos;est
                pas indexé par Google et il n&apos;est accessible qu&apos;à partir de cet email.
                Tu peux le bookmarker et le consulter aussi souvent que tu veux.
              </p>

              <!-- Content preview -->
              <hr style="border:none;border-top:1px solid #e5eeff;margin:32px 0 24px 0;">
              <div style="font-size:10px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">Ce que contient ton plan</div>
              <ul style="margin:0;padding:0 0 0 18px;font-size:14px;line-height:1.8;color:#334155;">
                <li>Plan complet <strong>semaine par semaine avec dates</strong></li>
                <li>4 phases : fondation, développement, spécifique, affûtage</li>
                <li>Séances détaillées : allures, zones cardio, RPE cible</li>
                <li>Conseils nutrition périodisés</li>
                <li>Graphique de charge hebdomadaire</li>
                <li>Export PDF en un clic</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 32px;font-size:11px;color:#94a3b8;line-height:1.6;">
              Tu reçois cet email parce que tu as généré un plan sur altitude-trail.fr.
              <br>
              Altitude Trail — Le média trail de référence.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${hello}

Ton plan personnalisé pour ${args.courseName} est terminé.

Course : ${args.courseName}
Date   : ${dateFr}
Profil : ${args.courseDistance} km, ${args.courseDenivele} m D+

Voir ton plan : ${args.planUrl}

Ce lien est privé et n'est pas indexé. Tu peux le bookmarker.

—
Altitude Trail`;

  try {
    const { error } = await client.emails.send({
      from: "Altitude Trail <plans@altitude-trail.fr>",
      to: args.to,
      subject: `Ton plan pour ${args.courseName} est prêt`,
      html,
      text,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    console.log("[email] envoi OK a", args.to);
    return true;
  } catch (e) {
    console.error("[email] exception:", e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport SEO + PageSpeed hebdomadaire
// ─────────────────────────────────────────────────────────────────────────────

export interface WeeklyReportEmailArgs {
  to: string;
  psiRows: {
    url: string;
    strategy: string;
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    lcpMs: number | null;
    clsScore: number | null;
    ttfbMs: number | null;
  }[];
  auditMarkdown: string;
  weekLabel: string; // ex. "Semaine du 20 au 26 avril 2026"
  stats: {
    totalArticles: number;
    articlesPublishedThisWeek: number;
  };
}

function scoreColor(score: number | null): string {
  if (score == null) return "#999";
  if (score >= 90) return "#0a8f2e"; // vert
  if (score >= 50) return "#f4a000"; // orange
  return "#d93025"; // rouge
}

function mdToBasicHtml(md: string): string {
  // Conversion markdown minimaliste (titres, bold, listes, paragraphes).
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h3 style="font-family:system-ui,sans-serif;font-size:17px;margin:24px 0 10px;color:#0b1c30;border-bottom:2px solid #ff4500;padding-bottom:4px">${escapeHtml(line.slice(3))}</h3>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        out.push('<ul style="margin:0 0 12px 20px;padding:0;color:#333">');
        inList = true;
      }
      const body = line.slice(2);
      out.push(`<li style="margin:4px 0">${inlineFormat(body)}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    out.push(`<p style="margin:0 0 10px;color:#333;line-height:1.55">${inlineFormat(line)}</p>`);
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

function inlineFormat(s: string): string {
  const escaped = escapeHtml(s);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:90%">$1</code>');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendWeeklyReportEmail(args: WeeklyReportEmailArgs): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY manquante, rapport hebdo non envoyé");
    return false;
  }

  const rowsHtml = args.psiRows
    .map((r) => {
      const perf = r.performance;
      const seoScore = r.seo;
      const a11y = r.accessibility;
      const bp = r.bestPractices;
      return `<tr style="border-bottom:1px solid #eee">
        <td style="padding:8px 10px;font-size:12px">${escapeHtml(r.url.replace(/^https?:\/\/[^/]+/, "") || "/")}<br/><span style="color:#888;text-transform:uppercase;font-size:10px">${r.strategy}</span></td>
        <td style="padding:8px 10px;text-align:center;font-weight:700;color:${scoreColor(perf)}">${perf ?? "–"}</td>
        <td style="padding:8px 10px;text-align:center;font-weight:700;color:${scoreColor(seoScore)}">${seoScore ?? "–"}</td>
        <td style="padding:8px 10px;text-align:center;font-weight:700;color:${scoreColor(a11y)}">${a11y ?? "–"}</td>
        <td style="padding:8px 10px;text-align:center;font-weight:700;color:${scoreColor(bp)}">${bp ?? "–"}</td>
        <td style="padding:8px 10px;text-align:center;font-size:11px;color:#555">${r.lcpMs != null ? Math.round(r.lcpMs) + "ms" : "–"}</td>
        <td style="padding:8px 10px;text-align:center;font-size:11px;color:#555">${r.clsScore != null ? r.clsScore.toFixed(3) : "–"}</td>
        <td style="padding:8px 10px;text-align:center;font-size:11px;color:#555">${r.ttfbMs != null ? Math.round(r.ttfbMs) + "ms" : "–"}</td>
      </tr>`;
    })
    .join("\n");

  const auditHtml = mdToBasicHtml(args.auditMarkdown);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Rapport hebdo Altitude Trail</title></head>
<body style="margin:0;padding:0;background:#f8f9ff;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;padding:30px 10px">
    <tr><td align="center">
      <table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <tr><td style="background:#0b1c30;padding:24px 30px">
          <div style="color:#ff4500;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">ALTITUDE TRAIL · RAPPORT HEBDO</div>
          <div style="color:#fff;font-size:22px;font-weight:800">${escapeHtml(args.weekLabel)}</div>
          <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px">${args.stats.articlesPublishedThisWeek} nouvel${args.stats.articlesPublishedThisWeek > 1 ? "s" : ""} article${args.stats.articlesPublishedThisWeek > 1 ? "s" : ""} cette semaine · ${args.stats.totalArticles} au total</div>
        </td></tr>

        <tr><td style="padding:24px 30px">
          <h2 style="font-size:18px;margin:0 0 12px;color:#0b1c30">PageSpeed Insights</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px">
            <thead><tr style="background:#0b1c30;color:#fff;text-align:center">
              <th style="padding:8px 10px;text-align:left;font-weight:600">URL</th>
              <th style="padding:8px 10px;font-weight:600">Perf</th>
              <th style="padding:8px 10px;font-weight:600">SEO</th>
              <th style="padding:8px 10px;font-weight:600">A11y</th>
              <th style="padding:8px 10px;font-weight:600">BP</th>
              <th style="padding:8px 10px;font-weight:600">LCP</th>
              <th style="padding:8px 10px;font-weight:600">CLS</th>
              <th style="padding:8px 10px;font-weight:600">TTFB</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <p style="font-size:11px;color:#888;margin:8px 0 0">Score 90+ vert, 50-89 orange, &lt;50 rouge · Cibles web vitals : LCP &lt; 2.5s, CLS &lt; 0.1, TTFB &lt; 800ms</p>
        </td></tr>

        <tr><td style="padding:4px 30px 24px">
          <h2 style="font-size:18px;margin:8px 0 12px;color:#0b1c30">Audit SEO de la semaine</h2>
          ${auditHtml}
        </td></tr>

        <tr><td style="background:#f8f9ff;padding:20px 30px;text-align:center;border-top:1px solid #e5eeff">
          <div style="color:#888;font-size:11px">Rapport généré automatiquement chaque lundi · <a href="https://www.altitude-trail.fr" style="color:#ff4500;text-decoration:none">altitude-trail.fr</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { error } = await client.emails.send({
      from: "Altitude Trail Rapport <rapport@altitude-trail.fr>",
      to: args.to,
      subject: `Rapport SEO hebdo · ${args.weekLabel}`,
      html,
    });
    if (error) {
      console.error("[email] weekly report error:", error);
      return false;
    }
    console.log("[email] rapport hebdo envoyé à", args.to);
    return true;
  } catch (e) {
    console.error("[email] exception weekly:", e);
    return false;
  }
}
