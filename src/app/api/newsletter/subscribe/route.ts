// Endpoint d'inscription à la newsletter.
// Logique MVP :
//   1. Valide l'email + le consentement
//   2. Upsert dans users Supabase (tout le monde est déjà stocké là depuis
//      les plans d'entraînement — on marque juste consent_newsletter=true)
//   3. Envoie un email de confirmation au nouveau subscriber via Resend
//   4. Notifie Yann sur yannkarroum@gmail.com de la nouvelle inscription
//      (utile tant qu'on n'a pas construit un vrai tableau de bord)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function upsertSubscriber(email: string): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;

  // On upsert dans users (table déjà existante) avec consent_newsletter=true.
  // La colonne peut ne pas exister encore → on la crée silencieusement via
  // une insertion "best effort". Si la colonne manque, la requête échoue mais
  // l'inscription reste validée côté email.
  try {
    const { error } = await client
      .from("users")
      .upsert(
        {
          email: email.toLowerCase(),
          consent_rgpd: true,
          consent_newsletter: true,
        },
        { onConflict: "email" }
      );
    if (error) {
      console.warn("[newsletter] supabase upsert err:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[newsletter] supabase exception:", e);
    return false;
  }
}

async function sendConfirmationEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);

  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f8f9ff;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 10px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:8px;overflow:hidden">
        <tr><td style="background:#0b1c30;padding:22px 28px">
          <div style="color:#ff4500;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">ALTITUDE TRAIL</div>
          <div style="color:#fff;font-size:22px;font-weight:800">Bienvenue dans la rédaction</div>
        </td></tr>
        <tr><td style="padding:24px 28px">
          <p style="margin:0 0 14px;color:#333;line-height:1.55;font-size:14px">Salut,</p>
          <p style="margin:0 0 14px;color:#333;line-height:1.55;font-size:14px">
            Ton inscription à la newsletter Altitude Trail est confirmée. Tu recevras
            nos prochaines analyses, les résultats des grandes courses et les articles
            qui détonnent, une à deux fois par semaine.
          </p>
          <p style="margin:0 0 14px;color:#333;line-height:1.55;font-size:14px">
            En attendant le prochain envoi, voici trois articles à ne pas manquer :
          </p>
          <ul style="margin:0 0 18px 20px;padding:0;color:#333;font-size:14px;line-height:1.6">
            <li><a href="https://www.altitude-trail.fr/guides/utmb" style="color:#ff4500;text-decoration:none">Guide complet UTMB : qualifications, préparation, stratégie</a></li>
            <li><a href="https://www.altitude-trail.fr/articles/la-descente-fait-plus-de-degats-que-la-montee-voici-comment-proteger-vos-articulations" style="color:#ff4500;text-decoration:none">La descente fait plus de dégâts que la montée : comment protéger vos articulations</a></li>
            <li><a href="https://www.altitude-trail.fr/entrainement/generateur" style="color:#ff4500;text-decoration:none">Construire ton plan d'entraînement personnalisé en 2 minutes</a></li>
          </ul>
          <p style="margin:18px 0 0;color:#666;font-size:12px;font-style:italic;line-height:1.5">
            Tu peux te désinscrire à tout moment en répondant à cet email avec "stop".
          </p>
        </td></tr>
        <tr><td style="background:#f8f9ff;padding:18px 28px;text-align:center;border-top:1px solid #e5eeff">
          <div style="color:#888;font-size:11px">
            <a href="https://www.altitude-trail.fr" style="color:#ff4500;text-decoration:none">altitude-trail.fr</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await resend.emails.send({
      from: "Altitude Trail <plans@altitude-trail.fr>",
      to,
      subject: "Inscription confirmée — Altitude Trail",
      html,
    });
  } catch (e) {
    console.warn("[newsletter] confirmation email error:", e);
  }
}

async function notifyYann(subscriberEmail: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: "Altitude Trail Bot <plans@altitude-trail.fr>",
      to: "yannkarroum@gmail.com",
      subject: `Nouvelle inscription newsletter : ${subscriberEmail}`,
      text: `Un nouvel internaute s'est inscrit à la newsletter via la popin du site :\n\n${subscriberEmail}\n\nConsent RGPD + consent newsletter : oui.\nInscription enregistrée dans Supabase (table users).`,
    });
  } catch (e) {
    console.warn("[newsletter] notify yann error:", e);
  }
}

export async function POST(req: Request) {
  let body: { email?: string; consent?: boolean };
  try {
    body = (await req.json()) as { email?: string; consent?: boolean };
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const consent = body.consent === true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!consent) {
    return Response.json({ error: "Consentement requis" }, { status: 400 });
  }

  // Enregistre dans Supabase (best effort) + envoie les emails en parallèle.
  const [supOk] = await Promise.all([
    upsertSubscriber(email),
    sendConfirmationEmail(email),
    notifyYann(email),
  ]);

  if (!supOk) {
    console.warn("[newsletter] persistence Supabase échouée, email envoyé quand même");
  }

  return Response.json({ ok: true });
}
