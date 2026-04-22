import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import { AUTHORS, authorUrl } from "@/lib/authors";
import {
  SITE_URL,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";

const TITLE = `La rédaction — ${SITE_NAME}`;
const DESCRIPTION =
  "La rédaction d'Altitude Trail : 4 signatures qui couvrent entraînement, nutrition, actualités courses et préparation mentale.";

export const metadata: Metadata = {
  title: "La rédaction",
  description: DESCRIPTION,
  alternates: { canonical: "/auteurs", languages: { fr: "/auteurs" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/auteurs`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function AuteursIndexPage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Rédaction" },
  ];
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd
        data={buildWebPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}/auteurs`,
          breadcrumb: [
            { label: "Accueil", url: SITE_URL },
            { label: "Rédaction", url: `${SITE_URL}/auteurs` },
          ],
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Rédaction", url: `${SITE_URL}/auteurs` },
        ])}
      />
      <Breadcrumb items={breadcrumb} />
      <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-8">
        La rédaction
      </h1>
      <p className="text-lg text-slate-600 leading-relaxed mb-6 max-w-2xl">
        {DESCRIPTION}
      </p>

      <p className="text-sm text-slate-500 mb-10 max-w-2xl">
        La ligne éditoriale et la méthodologie de la rédaction sont décrites dans notre{" "}
        <Link href="/charte-editoriale" className="text-primary hover:underline underline-offset-4">
          charte éditoriale
        </Link>
        .
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AUTHORS.map((a) => (
          <Link
            key={a.slug}
            href={`/auteurs/${a.slug}`}
            className="group block border-l-4 border-primary bg-surface-container p-6 hover:bg-surface-container-high transition-colors"
          >
            <div className="text-[10px] font-headline font-black uppercase tracking-widest text-slate-500 mb-1">
              {a.jobTitle}
            </div>
            <h2 className="font-headline font-black text-2xl text-navy mb-2 group-hover:text-primary transition-colors">
              {a.name}
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm">{a.bio}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
