"use client";

import dynamic from "next/dynamic";
import { Parcours } from "@/types";

const ElevationProfile = dynamic(() => import("./ElevationProfile"), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container flex items-center justify-center" style={{ height: 280 }}>
      <span className="text-sm text-slate-500 font-headline uppercase tracking-wide">Chargement du profil…</span>
    </div>
  ),
});

export default function ElevationProfileLoader({ parcours }: { parcours: Parcours }) {
  return <ElevationProfile parcours={parcours} />;
}
