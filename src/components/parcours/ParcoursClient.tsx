"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Parcours, Difficulty, ParcoursType } from "@/types";
import {
  PARCOURS_DIFFICULTY_COLORS,
  DISTANCE_BUCKETS,
  ELEVATION_BUCKETS,
  PARCOURS_TYPES,
  distanceBucket,
  elevationBucket,
  formatDuration,
} from "@/lib/parcours-utils";

const ParcoursMap = dynamic(() => import("./ParcoursMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container flex items-center justify-center" style={{ height: 560 }}>
      <span className="text-sm text-slate-500 font-headline uppercase tracking-wide">
        Chargement de la carte…
      </span>
    </div>
  ),
});

const DIFFICULTIES: Difficulty[] = ["Facile", "Modéré", "Difficile", "Extrême"];
const PAGE_SIZE = 20;

type DistanceBucket = "all" | "<10" | "10-30" | "30-50" | ">50";
type ElevationBucket = "all" | "<500" | "500-1500" | ">1500";

export default function ParcoursClient({ parcours }: { parcours: Parcours[] }) {
  const [region, setRegion] = useState<string>("all");
  const [departmentCode, setDepartmentCode] = useState<string>("all");
  const [type, setType] = useState<ParcoursType | "all">("all");
  const [distance, setDistance] = useState<DistanceBucket>("all");
  const [elevation, setElevation] = useState<ElevationBucket>("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const regions = useMemo(
    () => [...new Set(parcours.map((p) => p.region))].sort(),
    [parcours]
  );

  const departments = useMemo(() => {
    const relevant = region === "all" ? parcours : parcours.filter((p) => p.region === region);
    const map = new Map<string, string>();
    for (const p of relevant) map.set(p.departmentCode, p.departmentName);
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([code, name]) => ({ code, name }));
  }, [parcours, region]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parcours.filter((p) => {
      if (region !== "all" && p.region !== region) return false;
      if (departmentCode !== "all" && p.departmentCode !== departmentCode) return false;
      if (type !== "all" && p.type !== type) return false;
      if (distance !== "all" && distanceBucket(p.distance) !== distance) return false;
      if (elevation !== "all" && elevationBucket(p.elevationGain) !== elevation) return false;
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (q) {
        const hay = `${p.name} ${p.city} ${p.departmentName} ${p.region}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [parcours, region, departmentCode, type, distance, elevation, difficulty, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setRegion("all");
    setDepartmentCode("all");
    setType("all");
    setDistance("all");
    setElevation("all");
    setDifficulty("all");
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
        <ParcoursMap parcours={filtered} height="560px" />
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-headline uppercase tracking-wide">
        {DIFFICULTIES.map((d) => (
          <span key={d} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ background: PARCOURS_DIFFICULTY_COLORS[d] }}
            />
            <span className="text-slate-600">{d}</span>
          </span>
        ))}
      </div>

      <div className="bg-surface-container p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">
              Recherche
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              placeholder="Nom, ville, région…"
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Région</span>
            <select
              value={region}
              onChange={(e) => { handleFilterChange(setRegion, e.target.value); setDepartmentCode("all"); }}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Département</span>
            <select
              value={departmentCode}
              onChange={(e) => handleFilterChange(setDepartmentCode, e.target.value)}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les départements</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Type</span>
            <select
              value={type}
              onChange={(e) => handleFilterChange(setType, e.target.value as ParcoursType | "all")}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les types</option>
              {PARCOURS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
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
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">Dénivelé +</span>
            <select
              value={elevation}
              onChange={(e) => handleFilterChange(setElevation, e.target.value as ElevationBucket)}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {ELEVATION_BUCKETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
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
              <option value="all">Toutes difficultés</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
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
          {filtered.length} {filtered.length > 1 ? "parcours trouvés" : "parcours trouvé"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16 font-headline uppercase tracking-wide text-sm">
          Aucun parcours ne correspond à ces critères.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((p) => (
              <Link
                key={p.id}
                href={`/parcours/${p.slug}`}
                className="group bg-white border border-surface-container hover:border-primary transition-colors p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest text-white px-2 py-0.5"
                    style={{ background: PARCOURS_DIFFICULTY_COLORS[p.difficulty] }}
                  >
                    {p.difficulty}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide text-right">
                    {p.type}
                  </span>
                </div>
                <h3 className="font-headline font-black text-lg leading-tight group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                  {p.city} — {p.departmentName} ({p.departmentCode})
                </div>
                <div className="flex flex-wrap gap-4 text-sm font-headline font-bold border-t border-surface-container pt-3 mt-auto">
                  <span><span className="text-primary">{p.distance}</span> km</span>
                  <span><span className="text-primary">+{p.elevationGain.toLocaleString("fr-FR")}</span> m</span>
                  <span className="text-slate-500">{formatDuration(p.durationHours)}</span>
                </div>
              </Link>
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
