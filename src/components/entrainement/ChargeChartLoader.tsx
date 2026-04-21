"use client";

import dynamic from "next/dynamic";
import { Plan } from "@/types/plan";

const ChargeChart = dynamic(() => import("./ChargeChart"), {
  ssr: false,
  loading: () => (
    <div className="bg-surface-container flex items-center justify-center" style={{ height: 340 }}>
      <span className="text-sm text-slate-500 font-headline uppercase tracking-wide">Chargement du graphique…</span>
    </div>
  ),
});

export default function ChargeChartLoader({ plan }: { plan: Plan }) {
  return <ChargeChart plan={plan} />;
}
