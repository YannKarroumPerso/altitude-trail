"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Parcours } from "@/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function ElevationProfile({ parcours }: { parcours: Parcours }) {
  const profile = parcours.elevationProfile;
  const n = profile.length;
  // Distance cumulée linéairement interpolée entre 0 et parcours.distance
  const labels = profile.map((_, i) => ((i * parcours.distance) / Math.max(n - 1, 1)).toFixed(1));
  const data = {
    labels,
    datasets: [
      {
        label: "Altitude (m)",
        data: profile,
        borderColor: "#ea580c",
        backgroundColor: "rgba(234,88,12,0.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: Array<{ label: string }>) => `${items[0].label} km`,
          label: (item: { parsed: { y: number | null } }) =>
            item.parsed.y == null ? "" : `${Math.round(item.parsed.y)} m`,
        },
        backgroundColor: "#0a1628",
        titleFont: { family: "inherit", weight: "bold" as const },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Distance (km)", color: "#475569" },
        ticks: { color: "#64748b", maxRotation: 0, autoSkipPadding: 16 },
        grid: { color: "rgba(15,23,42,0.06)" },
      },
      y: {
        title: { display: true, text: "Altitude (m)", color: "#475569" },
        ticks: { color: "#64748b" },
        grid: { color: "rgba(15,23,42,0.06)" },
      },
    },
  };
  return (
    <div style={{ height: 280, width: "100%" }}>
      <Line data={data} options={options} />
    </div>
  );
}
