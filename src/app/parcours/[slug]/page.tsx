import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import ParcoursDetailMapLoader from "@/components/parcours/ParcoursDetailMapLoader";
import ElevationProfileLoader from "@/components/parcours/ElevationProfileLoader";
import { parcours } from "@/lib/parcours-database";
import { PARCOURS_DIFFICULTY_COLORS, formatDuration } from "@/lib/parcours-utils";
import {
  SITE_URL,
  SITE_NAME,
  buildHikingTrailJsonLd,
} from "@/lib/seo";

export function generateStaticParams() {
  return parcours.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = parcours.find((x) => x.slug === slug);
  if (!p) return { title: "Parcours introuvable" };
  const title = `${p.name} — ${p.distance} km, +${p.elevationGain} m`;
  const description = `${p.name} en ${p.departmentName} (${p.departmentCode}) : ${p.distance} km, +${p.elevationGain} m D+, difficulté ${p.difficulty.toLowerCase()}, durée estimée ${formatDuration(p.durationHours)}. ${p.description}`;
  const canonicalPath = `/parcours/${p.slug}`;
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

export default async function ParcoursDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = parcours.find((x) => x.slug === slug);
  if (!p) notFound();

  const similar = parcours
    .filter((x) => x.slug !== p.slug && (x.region === p.region || x.type === p.type))
    .slice(0, 3);

  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Parcours", href: "/parcours" },
    { label: p.name },
  ];
  const color = PARCOURS_DIFFICULTY_COLORS[p.difficulty];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd data={buildHikingTrailJsonLd(p)} />
      <Breadcrumb items={breadcrumb} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest text-white px-2 py-0.5"
          style={{ background: color }}
        >
          {p.difficulty}
        </span>
        <span className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 bg-surface-container px-2 py-0.5">
          {p.type}
        </span>
        <span className="text-xs text-slate-500 font-headline font-bold uppercase tracking-wide">
          Source : {p.source}
        </span>
      </div>

      <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-4">{p.name}</h1>
      <p className="text-slate-500 uppercase tracking-wide text-sm font-headline font-bold mb-8">
        {p.city} — {p.departmentName} ({p.departmentCode}) · {p.region}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface-container p-4">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Distance</div>
          <div className="font-headline text-3xl font-black mt-1">{p.distance} km</div>
        </div>
        <div className="bg-surface-container p-4">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Dénivelé +</div>
          <div className="font-headline text-3xl font-black mt-1">{p.elevationGain.toLocaleString("fr-FR")} m</div>
        </div>
        <div className="bg-surface-container p-4">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Dénivelé −</div>
          <div className="font-headline text-3xl font-black mt-1">{p.elevationLoss.toLocaleString("fr-FR")} m</div>
        </div>
        <div className="bg-surface-container p-4">
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500">Durée estimée</div>
          <div className="font-headline text-xl font-black mt-1 leading-tight">{formatDuration(p.durationHours)}</div>
        </div>
      </div>

      <p className="text-lg text-slate-700 leading-relaxed border-l-4 border-primary pl-6 mb-10">{p.description}</p>

      <div className="mb-10">
        <div className="newspaper-divider mb-6"><span>TRACÉ</span></div>
        <ParcoursDetailMapLoader parcours={p} />
      </div>

      <div className="mb-10">
        <div className="newspaper-divider mb-6"><span>PROFIL ALTIMÉTRIQUE</span></div>
        <ElevationProfileLoader parcours={p} />
      </div>

      <div className="bg-navy text-white p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
        <div>
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-300 mb-1">Téléchargement</p>
          <p className="font-headline font-black text-lg">Trace GPX approximative — {p.trace.length} points</p>
          <p className="text-xs text-slate-400 mt-1">Usage indicatif uniquement — ne remplace pas une cartographie officielle pour la navigation.</p>
        </div>
        <a
          href={`/parcours/${p.slug}/gpx`}
          className="bg-primary text-white px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-opacity whitespace-nowrap"
          download={`${p.slug}.gpx`}
        >
          Télécharger le GPX →
        </a>
      </div>

      {p.website && (
        <div className="bg-surface-container p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-1">Ressource externe</p>
            <p className="font-headline font-black text-lg break-all">{p.website.replace(/^https?:\/\//, "")}</p>
          </div>
          <a
            href={p.website}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-navy text-white px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary transition-colors whitespace-nowrap"
          >
            Consulter →
          </a>
        </div>
      )}

      <div className="bg-surface-container p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
        <div>
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-1">Carte complète</p>
          <p className="font-headline font-black text-lg">Voir les {parcours.length} parcours trail et randonnée</p>
        </div>
        <Link
          href="/parcours"
          className="bg-navy text-white px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary transition-colors whitespace-nowrap"
        >
          Retour aux parcours
        </Link>
      </div>

      {similar.length > 0 && (
        <div>
          <div className="newspaper-divider mb-10"><span>PARCOURS SIMILAIRES</span></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similar.map((s) => (
              <Link
                key={s.id}
                href={`/parcours/${s.slug}`}
                className="group bg-white border border-surface-container hover:border-primary transition-colors p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest text-white px-2 py-0.5"
                    style={{ background: PARCOURS_DIFFICULTY_COLORS[s.difficulty] }}
                  >
                    {s.difficulty}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide text-right">{s.type}</span>
                </div>
                <h3 className="font-headline font-black text-lg leading-tight group-hover:text-primary transition-colors">
                  {s.name}
                </h3>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                  {s.city} — {s.departmentName} ({s.departmentCode})
                </div>
                <div className="flex flex-wrap gap-4 text-sm font-headline font-bold border-t border-surface-container pt-3 mt-auto">
                  <span><span className="text-primary">{s.distance}</span> km</span>
                  <span><span className="text-primary">+{s.elevationGain.toLocaleString("fr-FR")}</span> m</span>
                  <span className="text-slate-500">{formatDuration(s.durationHours)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
