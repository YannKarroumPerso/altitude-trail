import { getPlanById } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const plan = await getPlanById(id);
  if (!plan) return Response.json({ error: "Plan introuvable" }, { status: 404 });

  return Response.json(plan, {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}
