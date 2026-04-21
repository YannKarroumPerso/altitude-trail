import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { SYSTEM_PROMPT, buildUserPrompt, PlanFormInput } from "@/lib/entrainement-prompt";
import { createPendingPlan, finalizePlan, markPlanFailed } from "@/lib/supabase";

export const maxDuration = 300;
export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

function extractJson(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON introuvable dans la reponse");
  return trimmed.slice(start, end + 1);
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

  // 1) On cree immediatement un plan en status=generating et on renvoie son id.
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

  const { planId } = pending;
  console.log("[plan-generateur] start async generation, planId=", planId);

  // 2) La generation Anthropic tourne en background via after() sans bloquer la reponse.
  after(async () => {
    const t0 = Date.now();
    try {
      const client = new Anthropic({ apiKey });
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 64000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(input) }],
      });
      const message = await stream.finalMessage();
      const elapsed = Date.now() - t0;
      console.log(
        "[plan-generateur] Anthropic fini en", elapsed + "ms, planId=", planId,
      );

      if (message.stop_reason === "max_tokens") {
        await markPlanFailed(planId, "Plan tronque (max_tokens atteint)");
        return;
      }

      const raw = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("\n")
        .trim();
      const json = extractJson(raw);
      const parsedPlan = JSON.parse(json);
      await finalizePlan(planId, parsedPlan);
      console.log("[plan-generateur] plan finalise: planId=", planId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[plan-generateur] erreur background:", msg, "planId=", planId);
      await markPlanFailed(planId, msg);
    }
  });

  // 3) Reponse immediate au client avec l id du plan a poller
  return Response.json({ planId });
}
