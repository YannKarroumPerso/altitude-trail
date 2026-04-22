import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/ui/JsonLd";
import NewsletterPopin from "@/components/ui/NewsletterPopin";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  NEWS_KEYWORDS,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo";

// next/font self-hosts Google Fonts au build (pas de blocage render, FOIT limité,
// zero layout shift, zero round-trip vers fonts.googleapis.com en prod).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-headline",
  display: "swap",
  preload: true,
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-THC9PSGZ14";
const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ||
  "yxW25KZGmXLzlnfxImJlUXpjFwgvoyBLBfVhbwMd2yk";
const GOOGLE_PUBLISHER_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_PUBLISHER_VERIFICATION || "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Le magazine du trail running`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "trail running", "ultra-trail", "trail", "course en montagne", "UTMB",
    "entraînement trail", "nutrition trail", "récits de courses", "magazine trail",
  ],
  authors: [{ name: `Rédaction ${SITE_NAME}`, url: `${SITE_URL}/a-propos` }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
    languages: { fr: "/" },
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    url: SITE_URL,
    title: `${SITE_NAME} — Le magazine du trail running`,
    description: SITE_DESCRIPTION,
    // Pas d'images explicites ici : Next.js injecte automatiquement l'OG
    // dynamique via src/app/opengraph-image.tsx (ImageResponse Edge). Les
    // pages qui veulent override fournissent leurs propres `openGraph.images`.
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Le magazine du trail running`,
    description: SITE_DESCRIPTION,
    // Idem Twitter : la convention `twitter-image.tsx` (via opengraph-image)
    // prend le relais automatiquement.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  verification: GOOGLE_SITE_VERIFICATION
    ? { google: GOOGLE_SITE_VERIFICATION }
    : undefined,
  manifest: "/manifest.webmanifest",
  formatDetection: { email: false, address: false, telephone: false },
  other: {
    "news_keywords": NEWS_KEYWORDS.join(", "),
    "syndication-source": SITE_URL,
    "original-source": SITE_URL,
    ...(GOOGLE_PUBLISHER_VERIFICATION
      ? { "google-publisher-site-verification": GOOGLE_PUBLISHER_VERIFICATION }
      : {}),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff4500" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1c30" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // On laisse volontairement l'utilisateur zoomer (accessibilité WCAG 1.4.4).
  // Le souci de décalage au pinch-zoom vient d'un scroll horizontal sur la
  // page, corrigé par overflow-x:hidden sur html+body dans globals.css.
  userScalable: true,
  maximumScale: 5,
  // Gère proprement la safe area des iPhones (encoche, home indicator)
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <link rel="alternate" type="application/rss+xml" title={`${SITE_NAME} — RSS`} href="/rss.xml" />
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
      </head>
      <body>
        <JsonLd data={buildOrganizationJsonLd()} />
        <JsonLd data={buildWebSiteJsonLd()} />
        <Header />
        <main>{children}</main>
        <Footer />
        <NewsletterPopin />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
