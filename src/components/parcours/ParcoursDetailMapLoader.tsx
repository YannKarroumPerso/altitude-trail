"use client";

import dynamic from "next/dynamic";
import { Parcours } from "@/types";

const ParcoursDetailMap = dynamic(() => import("./ParcoursDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container flex items-center justify-center" style={{ height: 460 }}>
      <span className="text-sm text-slate-500 font-headline uppercase tracking-wide">Chargement de la carte…</span>
    </div>
  ),
});

export default function ParcoursDetailMapLoader({ parcours }: { parcours: Parcours }) {
  return <ParcoursDetailMap parcours={parcours} height="460px" />;
}
