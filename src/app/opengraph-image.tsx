import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

// Image OpenGraph par défaut du site — générée dynamiquement par Edge.
// Next.js l'expose automatiquement à /opengraph-image et l'injecte dans
// les meta OG des pages qui n'en définissent pas explicitement.
export const runtime = "edge";
export const alt = `${SITE_NAME} — Le magazine du trail running`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0b1c30 0%, #1a2f47 55%, #ff4500 100%)",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#ff4500",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            ALTITUDE TRAIL
          </div>
          <div
            style={{
              width: "120px",
              height: "6px",
              background: "#ff4500",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            Le magazine du trail running
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.85)",
              lineHeight: 1.3,
              maxWidth: "900px",
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.65)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          altitude-trail.fr
        </div>
      </div>
    ),
    { ...size }
  );
}
