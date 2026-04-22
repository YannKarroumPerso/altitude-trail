import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import { LEXICON } from "@/lib/lexicon";
import {
  SITE_URL,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  buildFaqPageJsonLd,
} from "@/lib/seo";

const TITLE = "Lexique du trail running";
const DESCRIPTION =
  "40 termes essentiels du trail expliqués : D+, D-, VMA, FKT, UTMB, périodisation, hypoglycémie, excentrique, ITRA… Le dictionnaire pour comprendre le vocabulaire des coureurs de montagne.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/lexique", languages: { fr: "/lexique" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/lexique`,
    title: `${TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function LexiquePage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Lexique" },
  ];

  // Tri alphabétique, groupement par première lettre
  const sorted = [...LEXICON].sort((a, b) =>
    normalize(a.term).localeCompare(normalize(b.term), "fr")
  );
  const letters = Array.from(
    new Set(sorted.map((t) => normalize(t.term).charAt(0).toUpperCase()))
  );

  // FAQPage JSON-LD : chaque terme devient une Q/R pour Google
  const faqData = sorted.map((t) => ({
    q: `Qu'est-ce que « ${t.term} » en trail running ?`,
    a: t.definition,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd
        data={buildWebPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}/lexique`,
          breadcrumb: [
            { label: "Accueil", url: SITE_URL },
            { label: "Lexique", url: `${SITE_URL}/lexique` },
          ],
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Lexique", url: `${SITE_URL}/lexique` },
        ])}
      />
      <JsonLd data={buildFaqPageJsonLd(faqData)} />

      <Breadcrumb items={breadcrumb} />

      <div className="border-b-2 border-navy pb-8 mb-10">
        <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-6">
          {TITLE}
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
          {DESCRIPTION}
        </p>
      </div>

      {/* Navigation alphabet */}
      <nav aria-label="Index alphabétique" className="bg-surface-container p-4 mb-12 flex flex-wrap gap-2">
        <span className="text-[10px] font-headline font-black uppercase tracking-widest text-slate-500 mr-2 self-center">
          Aller à :
        </span>
        {letters.map((l) => (
          <a
            key={l}
            href={`#lettre-${l}`}
            className="bg-white text-navy hover:bg-primary hover:text-white transition-colors px-3 py-1 font-headline font-bold text-sm border border-slate-200"
          >
            {l}
          </a>
        ))}
      </nav>

      {/* Termes groupés par lettre */}
      <div className="space-y-12">
        {letters.map((letter) => {
          const termsInLetter = sorted.filter(
            (t) => normalize(t.term).charAt(0).toUpperCase() === letter
          );
          return (
            <section
              key={letter}
              id={`lettre-${letter}`}
              className="scroll-mt-24"
            >
              <h2 className="font-headline text-5xl font-black text-primary border-b border-surface-container pb-2 mb-6">
                {letter}
              </h2>
              <dl className="space-y-6">
                {termsInLetter.map((t) => (
                  <div
                    key={t.term}
                    id={`terme-${normalize(t.term).replace(/\s+/g, "-")}`}
                    className="scroll-mt-24 border-l-4 border-primary pl-5 py-1"
                  >
                    <dt className="flex items-baseline gap-3 flex-wrap">
                      <span className="font-headline font-black text-2xl text-navy">
                        {t.term}
                      </span>
                      {t.aliases && t.aliases.length > 0 && (
                        <span className="text-xs text-slate-500 italic">
                          aussi : {t.aliases.join(", ")}
                        </span>
                      )}
                      <span className="text-[10px] font-headline font-black uppercase tracking-widest bg-navy text-white px-2 py-0.5 ml-auto">
                        {t.category}
                      </span>
                    </dt>
                    <dd className="text-slate-700 leading-relaxed mt-2">
                      {t.definition}
                    </dd>
                    {t.seeAlso && t.seeAlso.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <span className="text-xs text-slate-500 italic">
                          À lire :
                        </span>
                        {t.seeAlso.map((href) => (
                          <Link
                            key={href}
                            href={href}
                            className="text-primary hover:underline underline-offset-4"
                          >
                            {href.replace(/^\/(articles|categories)\//, "").replace(/-/g, " ")}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>

      <div className="mt-16 pt-10 border-t-2 border-navy">
        <p className="text-sm text-slate-500 italic">
          Ce lexique est complété au fil des publications.{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Un terme manque ?
          </Link>
        </p>
      </div>
    </div>
  );
}
