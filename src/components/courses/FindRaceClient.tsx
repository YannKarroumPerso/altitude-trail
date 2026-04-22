"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Race } from "@/types";

interface FindRaceClientProps {
  races: Race[];
}

const DISTANCE_BUCKETS = [
  { label: "Tous", min: 0, max: Infinity },
  { label: "Découverte (< 20 km)", min: 0, max: 20 },
  { label: "Trail moyen (20-42 km)", min: 20, max: 42 },
  { label: "Trail long (42-80 km)", min: 42, max: 80 },
  { label: "Ultra (> 80 km)", min: 80, max: Infinity },
];

const DENIV_BUCKETS = [
  { label: "Tous", min: 0, max: Infinity },
  { label: "Plat (< 500 D+)", min: 0, max: 500 },
  { label: "Vallonné (500-1500)", min: 500, max: 1500 },
  { label: "Montagneux (1500-3000)", min: 1500, max: 3000 },
  { label: "Alpin (> 3000)", min: 3000, max: Infinity },
];

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function FindRaceClient({ races }: FindRaceClientProps) {
  const [distanceIdx, setDistanceIdx] = useState(0);
  const [denivIdx, setDenivIdx] = useState(0);
  const [region, setRegion] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");

  // Extraire les régions et difficultés uniques
  const regions = useMemo(() => {
    const set = new Set(races.map((r) => r.region).filter(Boolean));
    return Array.from(set).sort();
  }, [races]);

  const filtered = useMemo(() => {
    return races.filter((r) => {
      const d = DISTANCE_BUCKETS[distanceIdx];
      if (r.distance < d.min || r.distance >= d.max) return false;

      const e = DENIV_BUCKETS[denivIdx];
      if (r.elevation < e.min || r.elevation >= e.max) return false;

      if (region !== "all" && r.region !== region) return false;
      if (month !== "all" && r.month !== Number(month)) return false;
      if (difficulty !== "all" && r.difficulty !== difficulty) return false;

      return true;
    });
  }, [races, distanceIdx, denivIdx, region, month, difficulty]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = new Date(a.dateISO).getTime();
      const db = new Date(b.dateISO).getTime();
      return da - db;
    });
  }, [filtered]);

  const resetFilters = () => {
    setDistanceIdx(0);
    setDenivIdx(0);
    setRegion("all");
    setMonth("all");
    setDifficulty("all");
  };

  return (
    <div>
      {/* Filtres */}
      <div className="bg-surface-container p-6 mb-8 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-black text-lg uppercase tracking-tighter">
            Filtres
          </h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-primary hover:underline font-headline font-bold uppercase tracking-widest"
          >
            Réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Distance */}
          <div>
            <label className="block text-[10px] font-headline font-black uppercase tracking-widest text-slate-600 mb-1">
              Distance
            </label>
            <select
              value={distanceIdx}
              onChange={(e) => setDistanceIdx(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-medium"
            >
              {DISTANCE_BUCKETS.map((b, i) => (
                <option key={b.label} value={i}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Dénivelé */}
          <div>
            <label className="block text-[10px] font-headline font-black uppercase tracking-widest text-slate-600 mb-1">
              Dénivelé positif
            </label>
            <select
              value={denivIdx}
              onChange={(e) => setDenivIdx(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-medium"
            >
              {DENIV_BUCKETS.map((b, i) => (
                <option key={b.label} value={i}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Région */}
          <div>
            <label className="block text-[10px] font-headline font-black uppercase tracking-widest text-slate-600 mb-1">
              Région
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-medium"
            >
              <option value="all">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Mois */}
          <div>
            <label className="block text-[10px] font-headline font-black uppercase tracking-widest text-slate-600 mb-1">
              Mois
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-medium"
            >
              <option value="all">Tous les mois</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Difficulté */}
          <div>
            <label className="block text-[10px] font-headline font-black uppercase tracking-widest text-slate-600 mb-1">
              Difficulté
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-white border border-slate-200 px-3 py-2 text-sm font-medium"
            >
              <option value="all">Toutes</option>
              <option value="Facile">Facile</option>
              <option value="Modéré">Modéré</option>
              <option value="Difficile">Difficile</option>
              <option value="Extrême">Extrême</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-slate-600 font-medium">
          <span className="text-primary font-black">{sortedFiltered.length}</span>{" "}
          course{sortedFiltered.length > 1 ? "s" : ""}{" "}
          correspondent à ta recherche sur {races.length} référencées
        </p>
      </div>

      {/* Résultats */}
      {sortedFiltered.length === 0 ? (
        <div className="bg-white border border-surface-container p-10 text-center">
          <p className="text-slate-500 italic mb-4">
            Aucune course ne correspond à ces critères.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="bg-primary text-white px-6 py-2 font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedFiltered.map((race) => (
            <Link
              key={race.id}
              href={`/courses/${race.slug}`}
              className="group block bg-white border border-surface-container hover:border-primary transition-colors p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-headline font-black text-xl leading-tight text-navy group-hover:text-primary transition-colors">
                  {race.name}
                </h3>
                <span className={`shrink-0 text-[10px] font-headline font-black uppercase tracking-widest px-2 py-0.5 text-white ${
                  race.difficulty === "Extrême" ? "bg-red-700" :
                  race.difficulty === "Difficile" ? "bg-orange-600" :
                  race.difficulty === "Modéré" ? "bg-yellow-600" :
                  "bg-emerald-600"
                }`}>
                  {race.difficulty}
                </span>
              </div>

              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-3">
                {race.city} · {race.region} · {race.date}
              </p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500 text-xs">Distance</span>
                  <div className="font-headline font-black text-navy">
                    {race.distance} km
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Dénivelé +</span>
                  <div className="font-headline font-black text-primary">
                    {race.elevation.toLocaleString("fr-FR")} m
                  </div>
                </div>
              </div>

              {race.description && (
                <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                  {race.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
