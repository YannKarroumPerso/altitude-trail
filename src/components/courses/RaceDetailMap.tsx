"use client";

import dynamic from "next/dynamic";
import { Race } from "@/types";

const RacesMap = dynamic(() => import("./RacesMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container flex items-center justify-center" style={{ height: 360 }}>
      <span className="text-sm text-slate-500 font-headline uppercase tracking-wide">
        Chargement de la carte…
      </span>
    </div>
  ),
});

export default function RaceDetailMap({ race }: { race: Race }) {
  return <RacesMap races={[race]} height="360px" autoFit />;
}
