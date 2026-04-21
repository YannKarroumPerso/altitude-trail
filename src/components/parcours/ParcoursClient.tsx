"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Trace, Difficulty, TraceNetwork } from "@/types";
import { PARCOURS_DIFFICULTY_COLORS, DISTANCE_BUCKETS, distanceBucket } from "@/lib/parcours-utils";

const ParcoursMap = dynamic(() => import("./ParcoursMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container flex items-center justify-center" style={{ height: 600 }}>
      <span className="text-sm text-slate-500 font-headline uppercase tracking-wide">
        Chargement de la carte…
      </span>
    </div>
  ),
});

const DIFFICULTIES: Difficulty[] = ["Facile", "Modéré", "Difficile", "Extrême"];
const NETWORKS: { value: TraceNetwork; label: string; description: string }[] = [
  { value: "iwn", label: "International", description: "GR, E-paths, sentiers transfrontaliers" },
  { value: "nwn", label: "National", description: "GR français, traversées nationales" },
  { value: "rwn", label: "Régional", description: "PR, GR de Pays, sentiers régionaux" },
];
const PAGE_SIZE = 20;

type DistanceBucket = "all" | "<10" | "10-30" | "30-50" | ">50";

const NETWORK_LABEL: Record<TraceNetwork, string> = {
  iwn: "International",
  nwn: "National",
  rwn: "Régional",
};

const NETWORK_COLOR: Record<TraceNetwork, string> = {
  iwn: "#dc2626",
  nwn: "#ea580c",
  rwn: "#10b981",
};

export default function ParcoursClient({ traces }: { traces: Trace[] }) {
  const [network, setNetwork] = useState<TraceNetwork | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [distance, setDistance] = useState<DistanceBucket>("all");
  const [hasDistanceOnly, setHasDistanceOnly] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return traces.filter((t) => {
      if (network !== "all" && t.network !== network) return false;
      if (difficulty !== "all" && t.difficulty !== difficulty) return false;
      if (hasDistanceOnly && !t.distanceKm) return false;
      if (distance !== "all") {
        if (!t.distanceKm) return false;
        if (distanceBucket(t.distanceKm) !== distance) return false;
      }
      if (q) {
        const hay = `${t.name} ${t.ref || ""} ${t.operator || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [traces, network, difficulty, distance, hasDistanceOnly, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setNetwork("all");
    setDifficulty("all");
    setDistance("all");
    setHasDistanceOnly(false);
    setSearch("");
    setPage(1);
  };

  const handleFilterChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-10">
      <div className="bg-surface-container">
        <ParcoursMap traces={filtered} height="600px" />
      </div>

      <p className="text-xs text-slate-500 italic leading-relaxed">
        {filtered.length.toLocaleString("fr-FR")} traces affichées sur un total de {traces.length.toLocaleString("fr-FR")} sentiers importés depuis OpenStreetMap via Overpass API (relations <code>route=hiking</code>, balisage <code>iwn</code>, <code>nwn</code>, <code>rwn</code>). Cliquez un point pour le nom, le balisage officiel, la distance, la difficulté estimée et les liens externes. Données sous licence ODbL © contributeurs OpenStreetMap.
      </p>

      <div className="flex flex-wrap gap-6">
        <div>
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-2">Balisage</div>
          <div className="flex gap-3 flex-wrap text-xs">
            {NETWORKS.map((n) => (
              <span key={n.value} className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: NETWORK_COLOR[n.value] }} />
                <span className="font-headline font-bold">{n.label}</span>
                <span className="text-slate-400">{n.description}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-500 mb-2">Difficulté estimée</div>
          <div className="flex gap-3 flex-wrap text-xs font-headline uppercase tracking-wide">
            {DIFFICULTIES.map((d) => (
              <span key={d} className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: PARCOURS_DIFFICULTY_COLORS[d] }} />
                <span className="text-slate-600">{d}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-container p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="block md:col-span-2">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Recherche</span>
            <input
              type="search"
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              placeholder="Nom du sentier, référence (GR20, GR10…), opérateur"
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Balisage</span>
            <select
              value={network}
              onChange={(e) => handleFilterChange(setNetwork, e.target.value as TraceNetwork | "all")}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les balisages</option>
              {NETWORKS.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Difficulté</span>
            <select
              value={difficulty}
              onChange={(e) => handleFilterChange(setDifficulty, e.target.value as Difficulty | "all")}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Toutes</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Distance</span>
            <select
              value={distance}
              onChange={(e) => handleFilterChange(setDistance, e.target.value as DistanceBucket)}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {DISTANCE_BUCKETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={hasDistanceOnly}
              onChange={(e) => handleFilterChange(setHasDistanceOnly, e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs text-slate-600">
              Afficher uniquement les sentiers avec distance renseignée ({traces.filter((t) => t.distanceKm).length.toLocaleString("fr-FR")} sur {traces.length.toLocaleString("fr-FR")})
            </span>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full border-2 border-navy text-navy font-headline font-bold text-xs uppercase tracking-widest py-2 hover:bg-navy hover:text-white transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
        <div className="bg-primary text-white text-center font-headline font-black text-sm uppercase tracking-wide py-2">
          {filtered.length.toLocaleString("fr-FR")} {filtered.length > 1 ? "sentiers trouvés" : "sentier trouvé"} sur {traces.length.toLocaleString("fr-FR")}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16 font-headline uppercase tracking-wide text-sm">
          Aucun sentier ne correspond à ces critères.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pageItems.map((t) => (
              <article
                key={t.id}
                className="group bg-white border border-surface-container p-4 flex flex-col gap-2 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest text-white px-2 py-0.5"
                    style={{ background: NETWORK_COLOR[t.network] }}
                  >
                    {NETWORK_LABEL[t.network]}
                  </span>
                  <span
                    className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest px-2 py-0.5"
                    style={{ background: PARCOURS_DIFFICULTY_COLORS[t.difficulty], color: "#ffffff" }}
                  >
                    {t.difficulty}
                  </span>
                </div>
                <h3 className="font-headline font-black text-base leading-snug">{t.name}</h3>
                {(t.ref || t.operator) && (
                  <div className="text-xs text-slate-500 font-semibold">
                    {t.ref && <span>Balisage {t.ref}</span>}
                    {t.ref && t.operator && <span> · </span>}
                    {t.operator && <span>{t.operator}</span>}
                  </div>
                )}
                {t.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{t.description}</p>
                )}
                <div className="flex gap-4 text-sm font-headline font-bold mt-auto pt-2 border-t border-surface-container">
                  {t.distanceKm != null && <span><span className="text-primary">{t.distanceKm}</span> km</span>}
                </div>
                <div className="flex gap-3 text-[11px] font-bold">
                  <a
                    href={`https://hiking.waymarkedtrails.org/#route?type=relation&id=${t.osmId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:opacity-80"
                  >
                    Waymarked Trails ↗
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/relation/${t.osmId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy underline hover:opacity-80"
                  >
                    OSM ↗
                  </a>
                  {t.website && (
                    <a
                      href={t.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-navy underline hover:opacity-80"
                    >
                      Site officiel ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="border-2 border-navy text-navy font-headline font-bold text-xs uppercase tracking-widest py-2 px-4 hover:bg-navy hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              <span className="font-headline font-bold text-xs uppercase tracking-widest px-4">
                Page {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="border-2 border-navy text-navy font-headline font-bold text-xs uppercase tracking-widest py-2 px-4 hover:bg-navy hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
