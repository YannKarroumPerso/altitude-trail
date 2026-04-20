"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { Race } from "@/types";
import { RACE_DIFFICULTY_COLORS } from "@/lib/races-database";

interface RacesMapProps {
  races: Race[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  autoFit?: boolean;
}

function buildIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "altitude-marker",
    html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 2px 6px rgba(15,23,42,0.35);"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

function FitBounds({ races }: { races: Race[] }) {
  const map = useMap();
  useEffect(() => {
    if (!races.length) return;
    if (races.length === 1) {
      map.setView([races[0].lat, races[0].lng], 10, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(races.map((r) => [r.lat, r.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 8, animate: false });
  }, [races, map]);
  return null;
}

export default function RacesMap({
  races,
  center = [46.603354, 1.888334],
  zoom = 6,
  height = "520px",
  className = "",
  autoFit = true,
}: RacesMapProps) {
  return (
    <div className={className} style={{ height, width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {autoFit && <FitBounds races={races} />}
        {races.map((race) => (
          <Marker
            key={race.id}
            position={[race.lat, race.lng]}
            icon={buildIcon(RACE_DIFFICULTY_COLORS[race.difficulty])}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontFamily: "var(--font-headline, inherit)", fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                  {race.name}
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
                  {race.city} · {race.departmentName} ({race.departmentCode})
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#0f172a", marginBottom: 8 }}>
                  <span><strong>{race.distance}</strong> km</span>
                  <span>·</span>
                  <span>+{race.elevation} m</span>
                  <span>·</span>
                  <span>{race.date}</span>
                </div>
                <Link
                  href={`/courses/${race.slug}`}
                  style={{ fontSize: 11, fontWeight: 700, color: "#ea580c", textDecoration: "underline" }}
                >
                  Voir la fiche →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
