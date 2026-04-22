import Anthropic from "@anthropic-ai/sdk";
import { waitUntil } from "@vercel/functions";
import { SYSTEM_PROMPT, buildUserPrompt, PlanFormInput } from "@/lib/entrainement-prompt";
import {
  createPendingPlan,
  finalizePlan,
  markPlanFailed,
  getUserForPlan,
} from "@/lib/supabase";
import { sendPlanReadyEmail } from "@/lib/email";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.altitude-trail.fr";

function extractJson(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON introuvable");
  return trimmed.slice(start, end + 1);
}

async function runGeneration(args: {
  planId: string;
  accessToken: string;
  input: PlanFormInput;
  apiKey: string;
  planUrl: string;
}): Promise<void> {
  const { planId, input, apiKey, planUrl } = args;
  const t0 = Date.now();
  try {
    console.log("[plan-generateur] bg start, planId=", planId);
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });
    const message = await stream.finalMessage();
    const elapsed = Date.now() - t0;
    console.log("[plan-generateur] Anthropic fini en", elapsed + "ms, planId=", planId);

    if (message.stop_reason === "max_tokens") {
      await markPlanFailed(planId, "Plan tronque (max_tokens atteint)");
      return;
    }

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n")
      .trim();
    const parsedPlan = JSON.parse(extractJson(raw));
    await finalizePlan(planId, parsedPlan);
    console.log("[plan-generateur] plan finalise:", planId);

    try {
      const user = await getUserForPlan(planId);
      if (user?.email) {
        await sendPlanReadyEmail({
          to: user.email,
          prenom: user.prenom,
          courseName: input.courseName,
          courseDate: input.courseDate,
          courseDistance: input.courseDistance,
          courseDenivele: input.courseDenivele,
          planUrl,
        });
      }
    } catch (mailErr) {
      console.error("[plan-generateur] email error:", mailErr);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[plan-generateur] erreur bg:", msg, "planId=", planId);
    await markPlanFailed(planId, msg);
  }
}

export async function POST(req: Request) {
  const apiKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.Anthropic ||
    process.env.ANTHROPIC;
  if (!apiKey || !apiKey.trim()) {
    return Response.json({ error: "Cle API Anthropic manquante cote serveur." }, { status: 500 });
  }

  let input: PlanFormInput;
  try {
    input = (await req.json()) as PlanFormInput;
  } catch {
    return Response.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  if (!input.courseName || !input.courseDate || !input.courseDistance || !input.courseDenivele) {
    return Response.json({ error: "Champs course manquants" }, { status: 400 });
  }
  if (!input.niveau || !input.volumeActuelKm || !input.seancesMaxParSemaine || !input.objectifPrincipal) {
    return Response.json({ error: "Profil coureur incomplet" }, { status: 400 });
  }
  const emailOk =
    typeof input.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim());
  if (!emailOk) {
    return Response.json({ error: "Adresse email invalide" }, { status: 400 });
  }
  if (!input.consentRGPD) {
    return Response.json({ error: "Consentement requis" }, { status: 400 });
  }

  const pending = await createPendingPlan({
    user: {
      email: input.email,
      prenom: input.prenom ?? null,
      age: input.age ?? null,
      sexe: input.sexe ?? null,
      region: input.region ?? null,
      consentRGPD: input.consentRGPD,
    },
    form: {
      courseName: input.courseName,
      courseDate: input.courseDate,
      courseDistance: input.courseDistance,
      courseDenivele: input.courseDenivele,
      niveau: input.niveau,
      volumeActuelKm: input.volumeActuelKm,
      seancesMaxParSemaine: input.seancesMaxParSemaine,
      objectifPrincipal: input.objectifPrincipal,
      blessuresRecurrentes: input.blessuresRecurrentes,
    },
  });

  if (!pending) {
    return Response.json(
      { error: "Impossible d enregistrer le plan (Supabase indisponible)." },
      { status: 500 },
    );
  }

  const { planId, accessToken } = pending;
  const planUrl = `${SITE_URL}/mon-plan/${accessToken}`;
  console.log("[plan-generateur] start async, planId=", planId, "url=", planUrl);

  // Lance la generation en background via waitUntil (robuste sur Vercel)
  waitUntil(runGeneration({ planId, accessToken, input, apiKey, planUrl }));

  return Response.json({ planId, accessToken });
}
