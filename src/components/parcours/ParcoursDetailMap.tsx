"use client";

import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Polyline, Marker, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Parcours } from "@/types";
import { PARCOURS_DIFFICULTY_COLORS } from "@/lib/parcours-utils";

interface Props {
  parcours: Parcours;
  height?: string;
}

function buildIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: "altitude-marker",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${color};color:white;font-weight:900;font-size:12px;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(15,23,42,0.35);">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function ParcoursDetailMapInner({ parcours, height = "460px" }: Props) {
  const color = PARCOURS_DIFFICULTY_COLORS[parcours.difficulty];
  const bounds = L.latLngBounds(parcours.trace.map((c) => [c[0], c[1]] as [number, number]));
  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [32, 32] }}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="IGN Plan">
            <TileLayer
              attribution='&copy; IGN — Licence ouverte'
              url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png"
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="IGN Photos aériennes">
            <TileLayer
              attribution='&copy; IGN — Licence ouverte'
              url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <Polyline
          positions={parcours.trace}
          pathOptions={{ color, weight: 5, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
        />
        <Marker
          position={[parcours.startLat, parcours.startLng]}
          icon={buildIcon("#10b981", "D")}
        />
        <Marker
          position={[parcours.endLat, parcours.endLng]}
          icon={buildIcon("#dc2626", "A")}
        />
      </MapContainer>
    </div>
  );
}

// Re-export as dynamic would normally happen in the parent, but this file is
// already "use client" — the parent server page uses a thin wrapper.
export default ParcoursDetailMapInner;

export const ParcoursDetailMapDynamic = dynamic(
  () => Promise.resolve(ParcoursDetailMapInner),
  { ssr: false }
);
