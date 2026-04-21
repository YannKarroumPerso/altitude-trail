import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserPrompt, PlanFormInput } from "@/lib/entrainement-prompt";
import { persistPlanGeneration } from "@/lib/supabase";

// Vercel Pro : 300s max, largement suffisant en streaming.
export const maxDuration = 300;
export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// Sentinelle reservee pour signaler une erreur en plein stream cote client.
const ERROR_MARKER = "__STREAM_ERROR__";

export async function POST(req: Request) {
  const apiKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.Anthropic ||
    process.env.ANTHROPIC;
  if (!apiKey || !apiKey.trim()) {
    return Response.json(
      { error: "Cle API Anthropic manquante cote serveur." },
      { status: 500 },
    );
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
  console.log(
    "[plan-generateur] email collecte:", input.email.trim(),
    "- course:", input.courseName, "(" + input.courseDate + ")",
  );

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();
  const t0 = Date.now();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: MODEL,
          max_tokens: 64000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(input) }],
        });

        // Forward chaque chunk de texte au client au fur et a mesure.
        anthropicStream.on("text", (text: string) => {
          try {
            controller.enqueue(encoder.encode(text));
          } catch {
            // Controller ferme cote client : on ignore.
          }
        });

        const finalMessage = await anthropicStream.finalMessage();
        const elapsed = Date.now() - t0;
        const outTokens = finalMessage.usage?.output_tokens ?? 0;
        console.log(
          "[plan-generateur] stream fini en", elapsed + "ms,", outTokens, "tokens, modele=" + MODEL,
        );

        if (finalMessage.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode(ERROR_MARKER + "Plan tronque (max_tokens atteint)"));
          controller.close();
          return;
        }

        // Persistance asynchrone en DB (fire-and-forget : pas bloquant pour le client)
        try {
          const rawText = finalMessage.content
            .filter((b) => b.type === "text")
            .map((b) => (b as { type: "text"; text: string }).text)
            .join("\n")
            .trim();
          const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
          const startIdx = cleaned.indexOf("{");
          const endIdx = cleaned.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1) {
            const parsedPlan = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
            persistPlanGeneration({
              email: input.email,
              prenom: input.prenom,
              age: input.age,
              sexe: input.sexe,
              region: input.region,
              consentRGPD: input.consentRGPD,
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
              plan: parsedPlan,
            })
              .then((result) => {
                if (result) {
                  console.log("[plan-generateur] persiste en DB: user=", result.userId, "plan=", result.planId);
                } else {
                  console.log("[plan-generateur] Supabase non configure, persistance ignoree");
                }
              })
              .catch((e) => console.error("[plan-generateur] persistance error:", e));
          }
        } catch (persistErr) {
          console.error("[plan-generateur] parse pour persistance echoue:", persistErr);
        }

        controller.close();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[plan-generateur] erreur stream:", msg);
        try {
          controller.enqueue(encoder.encode(ERROR_MARKER + msg));
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
