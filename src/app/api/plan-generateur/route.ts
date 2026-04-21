import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserPrompt, PlanFormInput } from "@/lib/entrainement-prompt";

// Plan long, on autorise un timeout long sur Vercel (Pro = 300s).
export const maxDuration = 300;
export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";

function extractJson(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON introuvable dans la réponse");
  return trimmed.slice(start, end + 1);
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY manquante côté serveur" }, { status: 500 });
  }
  let input: PlanFormInput;
  try {
    input = (await req.json()) as PlanFormInput;
  } catch {
    return Response.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  // Validations minimales
  if (!input.courseName || !input.courseDate || !input.courseDistance || !input.courseDenivele) {
    return Response.json({ error: "Champs course manquants" }, { status: 400 });
  }
  if (!input.niveau || !input.volumeActuelKm || !input.seancesMaxParSemaine || !input.objectifPrincipal) {
    return Response.json({ error: "Profil coureur incomplet" }, { status: 400 });
  }

  const client = new Anthropic();
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });
    const message = await stream.finalMessage();
    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n")
      .trim();
    const json = extractJson(raw);
    const plan = JSON.parse(json);
    return Response.json({ plan });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: `Erreur génération : ${message}` }, { status: 500 });
  }
}
