"use client";

import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  LineController,
  BarController,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Plan } from "@/types/plan";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Filler,
  Tooltip,
  Legend,
);

export default function ChargeChart({ plan }: { plan: Plan }) {
  const semaines = plan.semaines;
  const labels = semaines.map((s) => `S${s.numero}`);
  const volume = semaines.map((s) => s.volume_km);
  const denivele = semaines.map((s) => s.denivele_total);
  const phaseColor: Record<string, string> = {
    Fondation: "rgba(16,185,129,0.7)",
    "Développement": "rgba(59,130,246,0.7)",
    "Spécifique": "rgba(139,92,246,0.7)",
    "Affûtage": "rgba(234,88,12,0.7)",
    "Semaine course": "rgba(220,38,38,0.7)",
  };
  const barColors = semaines.map(
    (s) => phaseColor[s.phase] || "rgba(100,116,139,0.7)"
  );
  const data: ChartData<"bar" | "line", number[], string> = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Volume (km)",
        data: volume,
        backgroundColor: barColors,
        borderWidth: 0,
        yAxisID: "y",
        order: 2,
      },
      {
        type: "line" as const,
        label: "Dénivelé (m)",
        data: denivele,
        borderColor: "#0a1628",
        backgroundColor: "rgba(10,22,40,0.15)",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        yAxisID: "y1",
        order: 1,
      },
    ],
  };
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { family: "inherit", weight: "bold" as const } },
      },
      tooltip: { backgroundColor: "#0a1628" },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b" } },
      y: {
        type: "linear" as const,
        position: "left" as const,
        title: { display: true, text: "Volume (km)", color: "#475569" },
        ticks: { color: "#64748b" },
        grid: { color: "rgba(15,23,42,0.06)" },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        title: { display: true, text: "Dénivelé (m)", color: "#475569" },
        ticks: { color: "#64748b" },
        grid: { display: false },
      },
    },
  };
  return (
    <div style={{ height: 340, width: "100%" }}>
      <Chart type="bar" data={data as ChartData<"bar", number[], string>} options={options} />
    </div>
  );
}
