"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, LayersControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import Link from "next/link";
import { Parcours } from "@/types";
import { PARCOURS_DIFFICULTY_COLORS, formatDuration } from "@/lib/parcours-utils";

interface ParcoursMapProps {
  parcours: Parcours[];
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

function buildPopupHtml(p: Parcours): string {
  const color = PARCOURS_DIFFICULTY_COLORS[p.difficulty];
  return `
    <div style="min-width:220px;font-family:inherit">
      <div style="font-family:var(--font-headline,inherit);font-weight:800;font-size:14px;line-height:1.2;margin-bottom:4px">${p.name}</div>
      <div style="font-size:12px;color:#475569;margin-bottom:6px">${p.city} — ${p.departmentName} (${p.departmentCode})</div>
      <div style="display:flex;gap:8px;font-size:11px;color:#0f172a;margin-bottom:6px;flex-wrap:wrap">
        <span><strong>${p.distance}</strong> km</span>
        <span>·</span>
        <span>+${p.elevationGain.toLocaleString("fr-FR")} m</span>
        <span>·</span>
        <span>${formatDuration(p.durationHours)}</span>
      </div>
      <div style="display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:white;background:${color};padding:2px 6px;margin-bottom:6px">${p.difficulty}</div>
      <div><a href="/parcours/${p.slug}" style="font-size:11px;font-weight:700;color:#ea580c;text-decoration:underline">Voir le parcours →</a></div>
    </div>
  `;
}

function FitBounds({ parcours }: { parcours: Parcours[] }) {
  const map = useMap();
  useEffect(() => {
    if (!parcours.length) return;
    if (parcours.length === 1) {
      map.setView([parcours[0].startLat, parcours[0].startLng], 10, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(
      parcours.map((p) => [p.startLat, p.startLng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 8, animate: false });
  }, [parcours, map]);
  return null;
}

function ClusterLayer({ parcours }: { parcours: Parcours[] }) {
  const map = useMap();
  useEffect(() => {
    const cluster = (L as unknown as { markerClusterGroup: (opts?: unknown) => L.FeatureGroup }).markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
    });
    for (const p of parcours) {
      const color = PARCOURS_DIFFICULTY_COLORS[p.difficulty];
      const marker = L.marker([p.startLat, p.startLng], { icon: buildIcon(color) });
      marker.bindPopup(buildPopupHtml(p), { maxWidth: 280 });
      cluster.addLayer(marker);
    }
    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [parcours, map]);
  return null;
}

export default function ParcoursMap({
  parcours,
  height = "560px",
  className = "",
  autoFit = true,
}: ParcoursMapProps) {
  return (
    <div className={className} style={{ height, width: "100%" }}>
      <MapContainer
        center={[46.603354, 1.888334]}
        zoom={6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="IGN Plan">
            <TileLayer
              attribution='&copy; IGN — <a href="https://geoservices.ign.fr/legal" target="_blank" rel="noopener">Licence ouverte</a>'
              url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="IGN Photos aériennes">
            <TileLayer
              attribution='&copy; IGN — <a href="https://geoservices.ign.fr/legal" target="_blank" rel="noopener">Licence ouverte</a>'
              url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        {autoFit && <FitBounds parcours={parcours} />}
        <ClusterLayer parcours={parcours} />
      </MapContainer>
      {/* prevent noisy Link warning */}
      <span style={{ display: "none" }}>
        <Link href="/parcours">preload</Link>
      </span>
    </div>
  );
}
