"use client";

import React from "react";
import { getAQICategory, CPCB_AQI_CATEGORIES } from "@/lib/aqi-constants";
import { Gauge, AlertTriangle, Activity, Wind } from "lucide-react";

interface InstrumentReadoutProps {
  aqi: number | null | undefined;
  dominantPollutant?: string | null;
  stationName?: string;
  city?: string;
  lastUpdated?: string | null;
}

export default function InstrumentReadout({
  aqi,
  dominantPollutant = "PM2.5",
  stationName,
  city,
  lastUpdated
}: InstrumentReadoutProps) {
  const category = getAQICategory(aqi);
  const displayAqi = aqi !== null && aqi !== undefined ? aqi : "--";

  // Compute gauge rotation angle (-90deg to +90deg for 0 to 500)
  const clampedAqi = Math.max(0, Math.min(500, aqi || 0));
  const angle = -90 + (clampedAqi / 500) * 180;

  return (
    <div className="obs-panel reticle-corner p-6 rounded-none flex flex-col justify-between relative overflow-hidden">
      {/* Background Instrument Watermark */}
      <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
        <Gauge className="w-56 h-56 text-[var(--obs-text-main)]" />
      </div>

      {/* Header Tag */}
      <div className="flex items-center justify-between border-b border-[var(--obs-border)] pb-3 mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--obs-accent)]" />
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--obs-text-muted)]">
            ATMOSPHERIC AIR QUALITY INDEX (CPCB METHODOLOGY)
          </span>
        </div>
        {city && (
          <span className="font-mono text-xs text-[var(--obs-accent)] bg-[var(--obs-border)] px-2 py-0.5 rounded">
            {stationName ? `${stationName}` : city}
          </span>
        )}
      </div>

      {/* Primary Readout Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Analog Dial Visualization */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative py-2">
          <svg viewBox="0 0 200 120" className="w-full max-w-[260px] overflow-visible">
            {/* Background Arc */}
            <path
              d="M 20 105 A 80 80 0 0 1 180 105"
              fill="none"
              stroke="#1e2a35"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Colored Category Segments on Dial */}
            {CPCB_AQI_CATEGORIES.map((cat, idx) => {
              const startPct = cat.min_aqi / 500;
              const endPct = cat.max_aqi / 500;
              const startAngle = Math.PI - startPct * Math.PI;
              const endAngle = Math.PI - endPct * Math.PI;
              const x1 = 100 + 80 * Math.cos(startAngle);
              const y1 = 105 - 80 * Math.sin(startAngle);
              const x2 = 100 + 80 * Math.cos(endAngle);
              const y2 = 105 - 80 * Math.sin(endAngle);

              return (
                <path
                  key={cat.category}
                  d={`M ${x1} ${y1} A 80 80 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth="16"
                  opacity={0.85}
                />
              );
            })}
            {/* Pivot Point */}
            <circle cx="100" cy="105" r="7" fill="#f0f4f8" stroke="#11171d" strokeWidth="3" />
            {/* Dial Needle */}
            <g transform={`rotate(${angle}, 100, 105)`}>
              <line x1="100" y1="105" x2="100" y2="30" stroke="#f0f4f8" strokeWidth="3" strokeLinecap="round" />
              <polygon points="97,35 103,35 100,22" fill="#f0f4f8" />
            </g>
          </svg>

          {/* Sub-scale Labels */}
          <div className="w-full max-w-[260px] flex justify-between text-[10px] font-mono text-[var(--obs-text-faint)] mt-1 px-2">
            <span>0 (GOOD)</span>
            <span>200</span>
            <span>500 (SEVERE)</span>
          </div>
        </div>

        {/* Digital Numeric Readout & Categorization */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-3">
          <div className="flex items-baseline gap-3">
            <span
              className="text-6xl md:text-7xl font-mono font-black tracking-tight"
              style={{ color: category.color }}
            >
              {displayAqi}
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--obs-text-muted)]">
                AQI SUB-INDEX
              </span>
              <span
                className="font-mono text-sm font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border inline-block mt-1"
                style={{
                  color: category.color,
                  borderColor: category.color,
                  backgroundColor: `${category.color}15`
                }}
              >
                {category.category}
              </span>
            </div>
          </div>

          {/* Governing Pollutant */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Wind className="w-3.5 h-3.5 text-[var(--obs-text-muted)]" />
            <span className="text-[var(--obs-text-muted)]">GOVERNING POLLUTANT:</span>
            <span className="font-bold text-[var(--obs-accent)] bg-[var(--obs-surface-hover)] px-2 py-0.5 border border-[var(--obs-border)]">
              {dominantPollutant || "PM2.5"}
            </span>
          </div>

          {/* Health Advisory */}
          <p className="text-xs text-[var(--obs-text-muted)] border-l-2 border-[var(--obs-border-light)] pl-3 leading-relaxed">
            {category.health_advisory}
          </p>
        </div>
      </div>

      {/* CPCB Spectrum Bar at Bottom */}
      <div className="mt-6 pt-4 border-t border-[var(--obs-border)]">
        <div className="flex justify-between items-center text-[10px] font-mono text-[var(--obs-text-muted)] mb-1.5">
          <span>CPCB NATIONAL AIR QUALITY CATEGORY SPECTRUM</span>
          <span>MAX 24-HR SUB-INDEX</span>
        </div>
        <div className="grid grid-cols-6 gap-1 h-2 rounded overflow-hidden">
          {CPCB_AQI_CATEGORIES.map((c) => {
            const isCurrent = category.category === c.category;
            return (
              <div
                key={c.category}
                className="relative group transition-all"
                style={{
                  backgroundColor: c.color,
                  opacity: isCurrent ? 1 : 0.35,
                  height: isCurrent ? "10px" : "6px",
                  marginTop: isCurrent ? "-2px" : "0px"
                }}
                title={`${c.category} (${c.min_aqi}-${c.max_aqi})`}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-6 text-[9px] font-mono text-[var(--obs-text-faint)] mt-1 text-center">
          <span>Good</span>
          <span>Satisfactory</span>
          <span>Moderate</span>
          <span>Poor</span>
          <span>Very Poor</span>
          <span>Severe</span>
        </div>
      </div>
    </div>
  );
}
