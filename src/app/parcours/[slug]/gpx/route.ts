import { parcours } from "@/lib/parcours-database";
import { buildGpx } from "@/lib/parcours-utils";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return parcours.map((p) => ({ slug: p.slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const p = parcours.find((x) => x.slug === slug);
  if (!p) return new Response("Not found", { status: 404 });
  const body = buildGpx(p);
  return new Response(body, {
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${p.slug}.gpx"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
