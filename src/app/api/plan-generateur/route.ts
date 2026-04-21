import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserPrompt, PlanFormInput } from "@/lib/entrainement-prompt";

// Vercel Hobby : fonctions serverless limitees a 60s.
// Haiku 4.5 est 3-5x plus rapide que Sonnet pour ce type de prompt structure,
// on rentre tranquillement dans la fenetre.
export const maxDuration = 60;
export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

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
    return Response.json(
      { error: "Cle API Anthropic manquante cote serveur. Verifier la variable ANTHROPIC_API_KEY (ou Anthropic) dans .env.local (dev) / Vercel Environment Variables (prod)." },
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
    return Response.json({ error: "Consentement requis pour recevoir le plan" }, { status: 400 });
  }
  console.log(
    "[plan-generateur] email collecte:", input.email.trim(),
    "- course:", input.courseName, "(" + input.courseDate + ")",
  );

  const client = new Anthropic({ apiKey });
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "max_tokens") {
      console.error("[plan-generateur] reponse tronquee (stop_reason=max_tokens)");
      return Response.json(
        { error: "Le plan est trop long pour tenir en une seule reponse. Reduis le nombre de seances max par semaine ou rapproche la date de course." },
        { status: 500 },
      );
    }

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n")
      .trim();
    const json = extractJson(raw);
    const plan = JSON.parse(json);
    return Response.json({ plan });
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("[plan-generateur] erreur Anthropic:", errorMsg);
    return Response.json({ error: "Erreur generation : " + errorMsg }, { status: 500 });
  }
}
