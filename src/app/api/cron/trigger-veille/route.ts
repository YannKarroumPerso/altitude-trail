// Endpoint appele par Vercel Cron (et uniquement par lui grace a CRON_SECRET)
// pour declencher le workflow GitHub "Veille quotidienne" via workflow_dispatch.
// Sert de filet de securite quand le cron natif GitHub Actions skip un run.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GITHUB_OWNER = "YannKarroumPerso";
const GITHUB_REPO = "altitude-trail";
const WORKFLOW_FILE = "veille.yml";

export async function GET(req: Request) {
  // Securite : Vercel Cron envoie un header Authorization Bearer avec CRON_SECRET.
  // On refuse toute autre source pour eviter qu'un tiers ne spam nos lancements.
  const authHeader = req.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron-trigger-veille] unauthorized call, header=", authHeader.slice(0, 20));
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pat = process.env.GITHUB_TRIGGER_PAT;
  if (!pat) {
    console.error("[cron-trigger-veille] GITHUB_TRIGGER_PAT manquant");
    return Response.json({ error: "GITHUB_TRIGGER_PAT manquant" }, { status: 500 });
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "altitude-trail-cron-relay",
      },
      body: JSON.stringify({ ref: "main" }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[cron-trigger-veille] GitHub API error:", res.status, txt.slice(0, 500));
      return Response.json(
        { error: "GitHub API refused", status: res.status, detail: txt.slice(0, 500) },
        { status: 502 },
      );
    }

    console.log("[cron-trigger-veille] veille triggered OK at", new Date().toISOString());
    return Response.json({
      ok: true,
      triggered_at: new Date().toISOString(),
      workflow: WORKFLOW_FILE,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cron-trigger-veille] exception:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
