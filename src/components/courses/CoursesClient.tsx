"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Race, Difficulty } from "@/types";
import {
  RACE_DIFFICULTY_COLORS,
  DISTANCE_BUCKETS,
  distanceBucket,
  MONTHS_FR,
} from "@/lib/races-database";

const RacesMap = dynamic(() => import("./RacesMap"), {
  ssr: false,
  loading: () => (
    <div
      className="bg-surface-container flex items-center justify-center"
      style={{ height: 520 }}
    >
      <span className="text-sm text-slate-500 font-headline uppercase tracking-wide">
        Chargement de la carte…
      </span>
    </div>
  ),
});

type DistanceBucket = "all" | "<20" | "20-50" | "50-100" | ">100";

interface CoursesClientProps {
  races: Race[];
}

const DIFFICULTIES: Difficulty[] = ["Facile", "Modéré", "Difficile", "Extrême"];

export default function CoursesClient({ races }: CoursesClientProps) {
  const [region, setRegion] = useState<string>("all");
  const [departmentCode, setDepartmentCode] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [distance, setDistance] = useState<DistanceBucket>("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [search, setSearch] = useState<string>("");

  const regions = useMemo(
    () => [...new Set(races.map((r) => r.region))].sort(),
    [races]
  );

  const departments = useMemo(() => {
    const relevant = region === "all" ? races : races.filter((r) => r.region === region);
    const map = new Map<string, string>();
    for (const r of relevant) map.set(r.departmentCode, r.departmentName);
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([code, name]) => ({ code, name }));
  }, [races, region]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return races.filter((race) => {
      if (region !== "all" && race.region !== region) return false;
      if (departmentCode !== "all" && race.departmentCode !== departmentCode) return false;
      if (month !== "all" && race.month !== parseInt(month, 10)) return false;
      if (distance !== "all" && distanceBucket(race.distance) !== distance) return false;
      if (difficulty !== "all" && race.difficulty !== difficulty) return false;
      if (q) {
        const haystack = `${race.name} ${race.city} ${race.departmentName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [races, region, departmentCode, month, distance, difficulty, search]);

  const resetFilters = () => {
    setRegion("all");
    setDepartmentCode("all");
    setMonth("all");
    setDistance("all");
    setDifficulty("all");
    setSearch("");
  };

  const handleRegionChange = (v: string) => {
    setRegion(v);
    setDepartmentCode("all");
  };

  return (
    <div className="space-y-10">
      {/* Carte */}
      <div className="bg-surface-container">
        <RacesMap races={filtered} height="520px" />
      </div>

      {/* Légende difficulté */}
      <div className="flex flex-wrap gap-4 text-xs font-headline uppercase tracking-wide">
        {DIFFICULTIES.map((d) => (
          <span key={d} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ background: RACE_DIFFICULTY_COLORS[d] }}
            />
            <span className="text-slate-600">{d}</span>
          </span>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-surface-container p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">
              Recherche
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, ville…"
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">
              Région
            </span>
            <select
              value={region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">
              Département
            </span>
            <select
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value)}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les départements</option>
              {departments.map((d) => (
                <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">
              Mois
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les mois</option>
              {MONTHS_FR.map((m, i) => (
                <option key={m} value={i + 1}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">
              Distance
            </span>
            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value as DistanceBucket)}
              className="w-full border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {DISTANCE_BUCKETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-headline font-bold uppercase tracking-widest text-slate-600 mb-1">
              Difficulté
            </span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty | "all")}
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
          <div className="flex items-end">
            <div className="w-full bg-primary text-white text-center font-headline font-black text-sm uppercase tracking-wide py-2">
              {filtered.length} {filtered.length > 1 ? "courses trouvées" : "course trouvée"}
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-16 font-headline uppercase tracking-wide text-sm">
          Aucune course ne correspond à ces critères.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((race) => (
            <Link
              key={race.id}
              href={`/courses/${race.slug}`}
              className="group bg-white border border-surface-container hover:border-primary transition-colors p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="inline-block text-[10px] font-headline font-bold uppercase tracking-widest text-white px-2 py-0.5"
                  style={{ background: RACE_DIFFICULTY_COLORS[race.difficulty] }}
                >
                  {race.difficulty}
                </span>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide text-right">
                  {race.date}
                </span>
              </div>
              <h3 className="font-headline font-black text-lg leading-tight group-hover:text-primary transition-colors">
                {race.name}
              </h3>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                {race.city} — {race.departmentName} ({race.departmentCode})
              </div>
              <div className="flex gap-4 text-sm font-headline font-bold border-t border-surface-container pt-3 mt-auto">
                <span><span className="text-primary">{race.distance}</span> km</span>
                <span><span className="text-primary">+{race.elevation}</span> m</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
