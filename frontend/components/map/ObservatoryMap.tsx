"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { StationSummary } from "@/lib/api";
import { getAQICategory } from "@/lib/aqi-constants";

// Dynamically import Leaflet components to avoid SSR window errors
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false });

interface ObservatoryMapProps {
  stations: StationSummary[];
  selectedStationId?: string | null;
  onSelectStation?: (station: StationSummary) => void;
  center?: [number, number];
  zoom?: number;
}

export default function ObservatoryMap({
  stations,
  selectedStationId,
  onSelectStation,
  center = [22.5, 78.9],  // Central India view
  zoom = 5
}: ObservatoryMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="obs-panel w-full h-[520px] flex flex-col items-center justify-center font-mono text-xs text-[var(--obs-text-muted)]">
        <div className="w-6 h-6 border-2 border-[var(--obs-accent)] border-t-transparent rounded-full animate-spin mb-2" />
        <span>INITIALIZING OBSERVATORY CARTOGRAPHY...</span>
      </div>
    );
  }

  return (
    <div className="obs-panel reticle-corner w-full h-[520px] relative overflow-hidden">
      {/* Top Map Controls Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-[var(--obs-surface)]/90 backdrop-blur-md border border-[var(--obs-border)] px-3 py-1.5 font-mono text-[11px] text-[var(--obs-text-muted)] flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{stations.length} MONITORS ACTIVE</span>
        </span>
        <span className="text-[var(--obs-border)]">|</span>
        <span className="text-[var(--obs-text-main)] font-semibold">
          INDIA CAAQMS GRID
        </span>
      </div>

      {/* React-Leaflet Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | Data: CPCB / OpenAQ'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {stations.map((st) => {
          const aqi = st.aqi || 50;
          const cat = getAQICategory(aqi);
          const isSelected = selectedStationId === st.station_id;

          // Scale marker radius proportionally to AQI severity: 6px (Good) to 18px (Severe)
          const radius = Math.max(7, Math.min(18, 7 + (aqi / 500) * 11));

          return (
            <CircleMarker
              key={st.station_id}
              center={[st.latitude, st.longitude]}
              radius={isSelected ? radius + 4 : radius}
              pathOptions={{
                color: isSelected ? "#ffffff" : cat.color,
                weight: isSelected ? 3 : 1.5,
                fillColor: cat.color,
                fillOpacity: isSelected ? 0.95 : 0.75
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectStation) onSelectStation(st);
                }
              }}
            >
              {/* Permanent short tooltip on hover */}
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                <div className="font-mono text-xs px-1 py-0.5">
                  <strong>{st.name}</strong> ({st.city})<br />
                  AQI: <span style={{ color: cat.color, fontWeight: "bold" }}>{st.aqi ?? "--"}</span> • {cat.category}
                </div>
              </Tooltip>

              {/* Rich click popup */}
              <Popup>
                <div className="p-3 font-mono text-xs min-w-[220px]">
                  <div className="border-b border-[var(--obs-border)] pb-1.5 mb-2">
                    <div className="font-bold text-[var(--obs-text-main)] text-sm">{st.name}</div>
                    <div className="text-[10px] text-[var(--obs-text-muted)]">{st.city} • CAAQMS Monitor</div>
                  </div>

                  <div className="flex items-baseline justify-between my-2">
                    <span className="text-2xl font-black" style={{ color: cat.color }}>
                      {st.aqi ?? "--"}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border"
                      style={{
                        color: cat.color,
                        borderColor: cat.color,
                        backgroundColor: `${cat.color}20`
                      }}
                    >
                      {cat.category}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--obs-text-muted)] space-y-1">
                    <div>Dominant Pollutant: <strong className="text-[var(--obs-text-main)]">{st.dominant_pollutant || "PM2.5"}</strong></div>
                    <div>Health Advisory: <span className="text-[10px] italic">{cat.health_advisory}</span></div>
                  </div>

                  <button
                    onClick={() => onSelectStation && onSelectStation(st)}
                    className="mt-3 w-full py-1 text-center bg-[var(--obs-surface-hover)] border border-[var(--obs-border)] hover:border-[var(--obs-accent)] text-[var(--obs-accent)] text-[10px] font-semibold uppercase tracking-wider transition-all"
                  >
                    View Station Forensics →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-[var(--obs-surface)]/90 backdrop-blur-md border border-[var(--obs-border)] p-2.5 font-mono text-[10px]">
        <div className="text-[var(--obs-text-muted)] mb-1 uppercase tracking-wider font-semibold">
          CPCB AQI Category
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00B050]" />
            <span>Good (0-50)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#92D050]" />
            <span>Satisfactory (51-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            <span>Moderate (101-200)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9900]" />
            <span>Poor (201-300)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF0000]" />
            <span>Very Poor (301-400)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C00000]" />
            <span>Severe (401-500)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
