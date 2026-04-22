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

  const SITE = "https://www.altitude-trail.fr";
  // Articles phares à recommander dans le mail. On pointe sur des pages
  // connues stables du site + images hero hébergées sur /public/articles/.
  const FEATURED = [
    {
      url: `${SITE}/guides/utmb`,
      image: `${SITE}/articles/utmb-wildcards-elites-protestation-systeme-1.jpg`,
      category: "Guide de référence",
      title: "UTMB : qualifications, préparation, stratégie de course",
      excerpt:
        "Tout ce qu'il faut savoir pour courir l'UTMB, de la collecte des Running Stones à la gestion du sommeil pendant la course.",
    },
    {
      url: `${SITE}/articles/la-descente-fait-plus-de-degats-que-la-montee-voici-comment-proteger-vos-articulations`,
      image: `${SITE}/articles/descente-trail-articulations-mo9t6xjv-hero.jpg`,
      category: "Blessures & préventions",
      title: "La descente fait plus de dégâts que la montée",
      excerpt:
        "Pourquoi les impacts atteignent 8 à 12 fois ton poids en descente, et comment protéger tes articulations avec la bonne technique.",
    },
    {
      url: `${SITE}/entrainement/generateur`,
      image: `${SITE}/articles/plan-entrainement-ultra-quatre-blocs-essentiels-hero.jpg`,
      category: "Outil gratuit",
      title: "Construis ton plan d'entraînement en 2 minutes",
      excerpt:
        "Indique ta course cible, ton niveau, ton volume actuel. On te génère un plan complet semaine par semaine, inspiré des méthodes UTMB.",
    },
  ];

  const articlesHtml = FEATURED.map((a) => {
    return `<tr>
      <td style="padding:0 0 20px 0">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5eeff">
          <tr>
            <td style="padding:0">
              <a href="${a.url}" style="display:block;text-decoration:none">
                <img src="${a.image}" alt="${escapeAttr(a.title)}" width="540" style="display:block;width:100%;height:auto;max-height:180px;object-fit:cover" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px 18px 20px">
              <div style="font-size:10px;font-weight:800;color:#ff4500;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">${escapeHtml(a.category)}</div>
              <a href="${a.url}" style="color:#0b1c30;text-decoration:none">
                <div style="font-size:18px;font-weight:800;color:#0b1c30;line-height:1.3;margin-bottom:8px;font-family:Georgia,serif">${escapeHtml(a.title)}</div>
              </a>
              <div style="font-size:14px;color:#5a6a80;line-height:1.55;margin-bottom:12px">${escapeHtml(a.excerpt)}</div>
              <a href="${a.url}" style="display:inline-block;font-size:11px;font-weight:700;color:#ff4500;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase">Lire l'article →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join("\n");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bienvenue dans la rédaction</title>
  <style>
    @media only screen and (max-width:600px) {
      .container { width:100% !important; max-width:100% !important }
      .px-mobile { padding-left:20px !important; padding-right:20px !important }
      .hero-title { font-size:30px !important; line-height:1.1 !important }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <!-- Preheader invisible (aperçu dans l'inbox) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f0f2f7">
    Ton inscription à la newsletter Altitude Trail est confirmée. Trois articles phares t'attendent pour commencer.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f7">
    <tr>
      <td align="center" style="padding:30px 10px 30px 10px">
        <!-- Conteneur principal -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;box-shadow:0 2px 20px rgba(0,0,0,0.08)">

          <!-- Hero -->
          <tr>
            <td style="background-color:#0b1c30;background-image:url('${SITE}/articles/preparer-premier-trail-10-km-conseils-cles-hero.jpg');background-size:cover;background-position:center;padding:0">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,rgba(11,28,48,0.55) 0%,rgba(11,28,48,0.9) 100%)">
                <tr>
                  <td class="px-mobile" style="padding:48px 40px 40px 40px;text-align:left">
                    <div style="font-size:11px;font-weight:800;color:#ff4500;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px">
                      ALTITUDE TRAIL
                    </div>
                    <div class="hero-title" style="font-size:38px;font-weight:900;color:#ffffff;line-height:1.05;letter-spacing:-0.01em;font-family:Georgia,serif">
                      Bienvenue dans<br/>la rédaction.
                    </div>
                    <div style="width:60px;height:4px;background-color:#ff4500;margin-top:20px"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message d'intro -->
          <tr>
            <td class="px-mobile" style="padding:36px 40px 12px 40px">
              <p style="margin:0 0 14px 0;font-size:16px;color:#0b1c30;line-height:1.55;font-weight:600">
                Ton inscription est confirmée.
              </p>
              <p style="margin:0 0 14px 0;font-size:15px;color:#5a6a80;line-height:1.65">
                Une à deux fois par semaine, tu recevras les analyses d'Altitude Trail : les résultats des grandes courses, les enjeux du trail international, les recherches scientifiques qui font bouger la pratique, et nos guides d'entraînement signés par la rédaction.
              </p>
              <p style="margin:0;font-size:15px;color:#5a6a80;line-height:1.65">
                En attendant le prochain envoi, trois articles à découvrir.
              </p>
            </td>
          </tr>

          <!-- Divider décoratif -->
          <tr>
            <td class="px-mobile" style="padding:28px 40px 20px 40px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:1px;background-color:#e5eeff;font-size:0;line-height:0">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Articles phares -->
          <tr>
            <td class="px-mobile" style="padding:0 40px 12px 40px">
              <div style="font-size:11px;font-weight:800;color:#0b1c30;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:16px">
                À lire en premier
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${articlesHtml}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px-mobile" style="padding:12px 40px 40px 40px;text-align:center">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto">
                <tr>
                  <td style="background-color:#ff4500">
                    <a href="${SITE}" style="display:inline-block;padding:16px 32px;color:#ffffff;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;text-decoration:none">
                      Explorer le magazine →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0b1c30;padding:30px 40px">
              <div style="font-size:14px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;font-family:Georgia,serif">
                ALTITUDE TRAIL
              </div>
              <div style="font-size:12px;color:#8a9bb5;line-height:1.6">
                Magazine indépendant de trail running et d'ultra-endurance.
              </div>
              <div style="margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#8a9bb5;line-height:1.6">
                Tu reçois cet email parce que tu t'es inscrit à la newsletter sur altitude-trail.fr. <br/>
                Pour te désinscrire, réponds à cet email avec "stop" ou contacte <a href="mailto:redaction@altitude-trail.fr" style="color:#ff4500;text-decoration:none">redaction@altitude-trail.fr</a>.<br/>
                <a href="${SITE}/charte-editoriale" style="color:#ff4500;text-decoration:none">Charte éditoriale</a> · <a href="${SITE}/a-propos" style="color:#ff4500;text-decoration:none">À propos</a> · <a href="${SITE}" style="color:#ff4500;text-decoration:none">altitude-trail.fr</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "Altitude Trail <plans@altitude-trail.fr>",
      to,
      subject: "Bienvenue dans la rédaction d'Altitude Trail",
      html,
    });
  } catch (e) {
    console.warn("[newsletter] confirmation email error:", e);
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
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
