import { NextResponse } from "next/server";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

// Manifest PWA minimal : améliore l'expérience d'ajout à l'écran d'accueil
// et signale à Google que le site est installable.
export async function GET() {
  const manifest = {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9ff",
    theme_color: "#ff4500",
    lang: "fr",
    orientation: "portrait-primary",
    icons: [
      { src: "/logo-square.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
  return NextResponse.json(manifest, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
