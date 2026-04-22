// Cron hebdomadaire de détection des articles vieillissants.
// Scanne content/articles, identifie ceux qui n'ont pas été mis à jour depuis
// 120 jours, et envoie un email récapitulatif à Yann pour action manuelle.
//
// Déclenché par Vercel Cron chaque lundi à 7h45 Paris (cf. vercel.json).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { articles } from "@/lib/data";
import { Resend } from "resend";
import { SITE_URL, parseFrDate } from "@/lib/seo";

const REPORT_RECIPIENT = "yannkarroum@gmail.com";
const STALE_THRESHOLD_DAYS = 120;

function daysSince(dateStr: string): number {
  const d = parseFrDate(dateStr);
  if (!d || isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.CRON_SECRET;
  const urlObj = new URL(req.url);
  const querySecret = urlObj.searchParams.get("secret");
  const authorized = expected && (auth === `Bearer ${expected}` || querySecret === expected);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sélectionne les articles à la référence updatedAt > 120 jours
  // (fallback sur date si updatedAt absent).
  const stale = articles
    .map((a) => {
      const ref = a.updatedAt || a.date;
      return { article: a, daysOld: daysSince(ref), ref };
    })
    .filter((x) => x.daysOld >= STALE_THRESHOLD_DAYS)
    .sort((x, y) => y.daysOld - x.daysOld); // plus vieux en tête

  const total = stale.length;

  // Si aucun article stale, on log et retourne sans envoyer d'email (évite le spam)
  if (total === 0) {
    console.log("[stale-check] Aucun article > 120 jours, skip email");
    return Response.json({ ok: true, stale: 0, emailSent: false });
  }

  // Garde les 10 plus vieux pour l'email (pas de spam)
  const top = stale.slice(0, 15);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[stale-check] RESEND_API_KEY manquante, skip envoi");
    return Response.json({ ok: true, stale: total, emailSent: false, reason: "no RESEND_API_KEY" });
  }

  const resend = new Resend(apiKey);

  const rowsHtml = top
    .map((x) => {
      const a = x.article;
      return `<tr style="border-bottom:1px solid #eee">
        <td style="padding:8px 10px;font-size:12px">
          <a href="${SITE_URL}/articles/${a.slug}" style="color:#0b1c30;text-decoration:none;font-weight:600">${escapeHtml(a.title)}</a><br/>
          <span style="color:#888;font-size:10px;text-transform:uppercase">${escapeHtml(a.category)}</span>
        </td>
        <td style="padding:8px 10px;font-size:12px;color:#666;white-space:nowrap">${escapeHtml(a.author)}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right;color:${x.daysOld > 180 ? "#d93025" : "#f4a000"};font-weight:700">${x.daysOld} j</td>
      </tr>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Articles à rafraîchir</title></head>
<body style="margin:0;padding:0;background:#f8f9ff;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 10px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden">
        <tr><td style="background:#0b1c30;padding:22px 28px">
          <div style="color:#ff4500;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">ALTITUDE TRAIL · ARTICLES À RAFRAÎCHIR</div>
          <div style="color:#fff;font-size:20px;font-weight:800">${total} article${total > 1 ? "s" : ""} dépassé${total > 1 ? "s" : ""} 120 jours</div>
          <div style="color:rgba(255,255,255,0.65);font-size:12px;margin-top:3px">Top ${Math.min(15, total)} à considérer en priorité</div>
        </td></tr>
        <tr><td style="padding:24px 28px">
          <p style="margin:0 0 14px;color:#333;line-height:1.55;font-size:14px">
            Les articles ci-dessous n'ont pas été mis à jour depuis plus de 120 jours.
            Pense à les reprendre pour ajouter des références récentes, vérifier les
            statistiques et bumper le <code style="background:#f0f0f0;padding:1px 4px">updatedAt</code> — ça envoie un signal de fraîcheur à Google et repositionne les articles dans Discover.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px">
            <thead><tr style="background:#0b1c30;color:#fff">
              <th style="padding:8px 10px;text-align:left;font-weight:600;font-size:11px">Article</th>
              <th style="padding:8px 10px;text-align:left;font-weight:600;font-size:11px">Auteur</th>
              <th style="padding:8px 10px;text-align:right;font-weight:600;font-size:11px">Ancienneté</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </td></tr>
        <tr><td style="background:#f8f9ff;padding:18px 28px;text-align:center;border-top:1px solid #e5eeff">
          <div style="color:#888;font-size:11px">
            Rapport hebdomadaire automatique · <a href="${SITE_URL}" style="color:#ff4500;text-decoration:none">altitude-trail.fr</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: "Altitude Trail Rapport <rapport@altitude-trail.fr>",
      to: REPORT_RECIPIENT,
      subject: `${total} article${total > 1 ? "s" : ""} à rafraîchir (> 120 jours)`,
      html,
    });
    if (error) {
      console.error("[stale-check] Resend error:", error);
      return Response.json({ ok: false, stale: total, emailSent: false, error: String(error) });
    }
    console.log(`[stale-check] email envoyé — ${total} articles stale`);
    return Response.json({ ok: true, stale: total, emailSent: true, topPreview: top.slice(0, 5).map((x) => ({ slug: x.article.slug, daysOld: x.daysOld })) });
  } catch (e) {
    console.error("[stale-check] exception:", e);
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
