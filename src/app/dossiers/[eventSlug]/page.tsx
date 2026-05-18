import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPillarBySlug, getRelatedArticles, PILLARS } from "@/lib/pillars";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/seo";
import { formatRelativeEventDate, formatLongFr } from "@/lib/hot-events";
import JsonLd from "@/components/ui/JsonLd";
import ArticleCard from "@/components/ui/ArticleCard";

type RouteProps = { params: Promise<{ eventSlug: string }> };

export const revalidate = 1800; // 30 min : la couverture grossit en continu

export async function generateStaticParams() {
  return PILLARS.map((p) => ({ eventSlug: p.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { eventSlug } = await params;
  const pillar = getPillarBySlug(eventSlug);
  if (!pillar) return { title: "Dossier introuvable" };
  const title = `${pillar.name} : dossier complet, programme, palmarès, comment suivre`;
  const url = absoluteUrl(`/dossiers/${pillar.slug}`);
  return {
    title: `${title} — ${SITE_NAME}`,
    description: pillar.tagline,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description: pillar.tagline,
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title, description: pillar.tagline },
  };
}

export default async function PillarPage({ params }: RouteProps) {
  const { eventSlug } = await params;
  const pillar = getPillarBySlug(eventSlug);
  if (!pillar) notFound();

  const related = getRelatedArticles(pillar, 30);
  const url = absoluteUrl(`/dossiers/${pillar.slug}`);

  // JSON-LD : SportsEvent + BreadcrumbList + ItemList
  const sportsEventJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: pillar.name,
    description: pillar.tagline,
    startDate: pillar.nextEditionDate,
    location: { "@type": "Place", name: pillar.specs.find((s) => /Pays|Altitude/.test(s.label))?.value || "" },
    url,
    sameAs: pillar.officialUrl,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Dossiers courses", item: absoluteUrl("/dossiers") },
      { "@type": "ListItem", position: 3, name: pillar.name, item: url },
    ],
  };
  const faqJsonLd = pillar.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pillar.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <article className="bg-white">
      <JsonLd data={sportsEventJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      {/* Hero */}
      <header className="bg-navy text-white">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 font-headline font-black mb-4">
            <Link href="/" className="hover:text-white">Altitude Trail</Link>
            <span>›</span>
            <Link href="/dossiers" className="hover:text-white">Dossiers courses</Link>
            <span>›</span>
            <span className="text-primary">{pillar.name}</span>
          </div>
          <span className="inline-block bg-primary text-white text-[11px] font-headline font-black uppercase tracking-[0.15em] px-3 py-1 mb-4">
            {formatRelativeEventDate({ slug: pillar.slug, name: pillar.name, start: pillar.nextEditionDate, location: "" })}
          </span>
          <h1 className="font-headline font-black text-4xl md:text-5xl lg:text-6xl tracking-tighter leading-[1.02] mb-4">
            {pillar.name}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl">
            {pillar.tagline}
          </p>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Colonne principale */}
        <div className="lg:col-span-8 space-y-12">
          {/* Intro */}
          <section className="prose prose-lg max-w-none">
            {pillar.intro.split("\n\n").map((p, i) => (
              <p key={i} className="text-base md:text-lg text-slate-700 leading-relaxed mb-4">{p}</p>
            ))}
          </section>

          {/* Programme */}
          <section>
            <h2 className="font-headline font-black text-2xl md:text-3xl tracking-tighter uppercase mb-5 border-l-4 border-primary pl-4">
              Programme de la prochaine édition
            </h2>
            <ul className="divide-y divide-surface-container">
              {pillar.programme.map((p, i) => (
                <li key={i} className="py-3 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2">
                  <span className="font-headline font-bold text-navy text-sm uppercase tracking-wider">{p.label}</span>
                  <span className="text-slate-700">{p.value}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Palmares */}
          <section>
            <h2 className="font-headline font-black text-2xl md:text-3xl tracking-tighter uppercase mb-5 border-l-4 border-primary pl-4">
              Palmarès récent
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-left">
                  <tr>
                    <th className="px-3 py-2 font-headline uppercase text-xs">Année</th>
                    <th className="px-3 py-2 font-headline uppercase text-xs">Hommes</th>
                    <th className="px-3 py-2 font-headline uppercase text-xs">Chrono</th>
                    <th className="px-3 py-2 font-headline uppercase text-xs">Femmes</th>
                    <th className="px-3 py-2 font-headline uppercase text-xs">Chrono</th>
                  </tr>
                </thead>
                <tbody>
                  {pillar.palmares.map((p) => (
                    <tr key={p.year} className="border-b border-surface-container">
                      <td className="px-3 py-2 font-headline font-black">{p.year}</td>
                      <td className="px-3 py-2">{p.men}</td>
                      <td className="px-3 py-2 text-slate-600">{p.menTime || "—"}</td>
                      <td className="px-3 py-2">{p.women}</td>
                      <td className="px-3 py-2 text-slate-600">{p.womenTime || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Glossaire */}
          <section>
            <h2 className="font-headline font-black text-2xl md:text-3xl tracking-tighter uppercase mb-5 border-l-4 border-primary pl-4">
              Comprendre la course en 6 termes
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {pillar.glossary.map((g) => (
                <div key={g.term}>
                  <dt className="font-headline font-black text-navy text-base mb-1">{g.term}</dt>
                  <dd className="text-sm text-slate-600 leading-relaxed">{g.definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="font-headline font-black text-2xl md:text-3xl tracking-tighter uppercase mb-5 border-l-4 border-primary pl-4">
              Questions fréquentes
            </h2>
            <div className="space-y-5">
              {pillar.faq.map((f) => (
                <details key={f.question} className="group border border-surface-container p-4 hover:border-primary transition-colors">
                  <summary className="font-headline font-bold text-base text-navy cursor-pointer flex items-center justify-between">
                    <span>{f.question}</span>
                    <span className="text-primary group-open:rotate-45 transition-transform text-xl">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-700 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Comment suivre */}
          <section>
            <h2 className="font-headline font-black text-2xl md:text-3xl tracking-tighter uppercase mb-5 border-l-4 border-primary pl-4">
              Comment suivre la course en direct
            </h2>
            <ul className="space-y-4">
              {pillar.howToWatch.map((h, i) => (
                <li key={i} className="border-l-2 border-primary pl-4">
                  {h.url ? (
                    <a href={h.url} target="_blank" rel="noopener" className="font-headline font-black text-navy hover:text-primary">{h.label} ↗</a>
                  ) : (
                    <span className="font-headline font-black text-navy">{h.label}</span>
                  )}
                  <p className="text-sm text-slate-600 mt-1">{h.description}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Articles lies */}
          {related.length > 0 && (
            <section>
              <h2 className="font-headline font-black text-2xl md:text-3xl tracking-tighter uppercase mb-5 border-l-4 border-primary pl-4">
                Toute notre couverture ({related.length} articles)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((a) => (
                  <ArticleCard key={a.slug} article={a} variant="default" />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar specs + officiel */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-navy text-white p-6 sticky top-24">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-headline font-black mb-3">L&apos;épreuve en chiffres</p>
            <ul className="space-y-2 mb-6">
              {pillar.specs.map((s) => (
                <li key={s.label} className="flex justify-between border-b border-white/10 pb-2 text-sm">
                  <span className="text-slate-300">{s.label}</span>
                  <span className="font-headline font-bold text-right">{s.value}</span>
                </li>
              ))}
            </ul>
            <div className="bg-primary text-white p-3 text-center mb-4">
              <p className="text-[10px] uppercase tracking-widest mb-1 opacity-80">Prochaine édition</p>
              <p className="font-headline font-black text-base">{formatLongFr(pillar.nextEditionDate)}</p>
            </div>
            <a href={pillar.officialUrl} target="_blank" rel="noopener" className="block bg-white text-navy text-center py-3 font-headline font-black text-xs uppercase tracking-widest hover:bg-surface-container transition-colors">
              Site officiel ↗
            </a>
          </div>
        </aside>
      </div>
    </article>
  );
}
