import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import RaceDetailMap from "@/components/courses/RaceDetailMap";
import { races, RACE_DIFFICULTY_COLORS } from "@/lib/races-database";
import {
  SITE_URL,
  SITE_NAME,
  buildSportsEventJsonLd,
} from "@/lib/seo";

export function generateStaticParams() {
  return races.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const race = races.find((r) => r.slug === slug);
  if (!race) return { title: "Course introuvable" };
  const title = `${race.name} — ${race.date}`;
  const description = `${race.name} à ${race.city} (${race.departmentName}) le ${race.date} : ${race.distance} km, +${race.elevation} m de dénivelé, difficulté ${race.difficulty.toLowerCase()}. ${race.description}`;
  const canonicalPath = `/courses/${race.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath, languages: { fr: canonicalPath } },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${canonicalPath}`,
      title: `${title} — ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      locale: "fr_FR",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const race = races.find((r) => r.slug === slug);
  if (!race) notFound();

  const related = races
    .filter((r) => r.slug !== race.slug && (r.region === race.region || r.difficulty === race.difficulty))
    .slice(0, 3);

  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: race.name },
  ];

  const difficultyColor = RACE_DIFFICULTY_COLORS[race.difficulty];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd data={buildSportsEventJsonLd(race)} />
      <Breadcrumb items={breadcrumb} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest text-white px-2 py-0.5"
          style={{ background: difficultyColor }}
        >
          {race.difficulty}
        </span>
        <span className="text-xs text-slate-500 font-headline font-bold uppercase tracking-wide">
          {race.date}
        </span>
      </div>

      <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-4">{race.name}</h1>
      <p className="text-slate-500 uppercase tracking-wide text-sm font-headline font-bold mb-8">
        {race.city} — {race.departmentName} ({race.departmentCode}) · {race.region}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface-container p-4">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Distance</div>
          <div className="font-headline text-3xl font-black mt-1">{race.distance} km</div>
        </div>
        <div className="bg-surface-container p-4">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Dénivelé +</div>
          <div className="font-headline text-3xl font-black mt-1">{race.elevation.toLocaleString("fr-FR")} m</div>
        </div>
        <div className="bg-surface-container p-4">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Départ</div>
          <div className="font-headline text-lg font-black mt-1 leading-tight">{race.city}</div>
        </div>
        <div className="bg-surface-container p-4">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Date</div>
          <div className="font-headline text-lg font-black mt-1 leading-tight">{race.date}</div>
        </div>
      </div>

      <p className="text-lg text-slate-700 leading-relaxed border-l-4 border-primary pl-6 mb-10">{race.description}</p>

      <div className="mb-10">
        <div className="newspaper-divider mb-6"><span>LOCALISATION</span></div>
        <RaceDetailMap race={race} />
      </div>

      {race.website && (
        <div className="bg-navy text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-300 mb-1">Site officiel</p>
            <p className="font-headline font-black text-lg break-all">{race.website.replace(/^https?:\/\//, "")}</p>
          </div>
          <a
            href={race.website}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-white px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            Visiter le site →
          </a>
        </div>
      )}

      <div className="bg-surface-container p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
        <div>
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-1">Calendrier complet</p>
          <p className="font-headline font-black text-lg">Voir les {races.length} courses trail de France</p>
        </div>
        <Link
          href="/courses"
          className="bg-navy text-white px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary transition-colors whitespace-nowrap"
        >
          Retour au calendrier
        </Link>
      </div>

      {related.length > 0 && (
        <div>
          <div className="newspaper-divider mb-10"><span>COURSES SIMILAIRES</span></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((r) => (
              <article
                key={r.id}
                className="group bg-white border border-surface-container hover:border-primary transition-colors flex flex-col"
              >
                <Link
                  href={`/courses/${r.slug}`}
                  className="p-5 flex flex-col gap-3 flex-grow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest text-white px-2 py-0.5"
                      style={{ background: RACE_DIFFICULTY_COLORS[r.difficulty] }}
                    >
                      {r.difficulty}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide text-right">{r.date}</span>
                  </div>
                  <h3 className="font-headline font-black text-lg leading-tight group-hover:text-primary transition-colors">
                    {r.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                    {r.city} — {r.departmentName} ({r.departmentCode})
                  </div>
                  <div className="flex gap-4 text-sm font-headline font-bold border-t border-surface-container pt-3 mt-auto">
                    <span><span className="text-primary">{r.distance}</span> km</span>
                    <span><span className="text-primary">+{r.elevation}</span> m</span>
                  </div>
                </Link>
                {r.website ? (
                  <a
                    href={r.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-surface-container hover:bg-primary hover:text-white transition-colors text-[10px] font-headline font-bold uppercase tracking-widest py-2.5 px-4 border-t border-surface-container"
                  >
                    Site officiel de l&apos;événement ↗
                  </a>
                ) : (
                  <div className="text-center text-[10px] font-headline font-bold uppercase tracking-widest text-slate-400 py-2.5 px-4 border-t border-surface-container">
                    Site officiel non renseigné
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
