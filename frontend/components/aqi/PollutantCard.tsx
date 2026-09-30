"use client";

import React from "react";
import { POLLUTANT_DESCRIPTIONS, getAQICategory } from "@/lib/aqi-constants";

interface PollutantCardProps {
  pollutant: string;
  concentration: number | null | undefined;
  subIndex?: number | null;
  unit?: string;
}

// CPCB 24-hr standard limits (Satisfactory boundary) for reference
const CPCB_STANDARDS: Record<string, number> = {
  "PM2.5": 60,
  "PM10": 100,
  "NO2": 80,
  "SO2": 80,
  "CO": 2.0,
  "O3": 100
};

export default function PollutantCard({
  pollutant,
  concentration,
  subIndex,
  unit
}: PollutantCardProps) {
  const meta = POLLUTANT_DESCRIPTIONS[pollutant] || {
    name: pollutant,
    unit: unit || "µg/m³",
    description: "Atmospheric pollutant"
  };

  const stdLimit = CPCB_STANDARDS[pollutant] || 100;
  const category = getAQICategory(subIndex);
  const displayConc = concentration !== null && concentration !== undefined ? concentration : "--";
  const pctOfStandard = concentration ? Math.min(250, (concentration / stdLimit) * 100) : 0;

  return (
    <div className="obs-panel obs-panel-hover p-4 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-mono text-sm font-bold text-[var(--obs-text-main)]">
            {pollutant}
          </span>
          <div className="text-[11px] text-[var(--obs-text-muted)] truncate max-w-[160px]" title={meta.name}>
            {meta.name}
          </div>
        </div>

        {subIndex !== undefined && subIndex !== null && (
          <span
            className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
            style={{
              color: category.color,
              borderColor: `${category.color}60`,
              backgroundColor: `${category.color}15`
            }}
          >
            I: {subIndex}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 my-2">
        <span className="font-mono text-2xl font-black text-[var(--obs-text-main)]">
          {displayConc}
        </span>
        <span className="font-mono text-xs text-[var(--obs-text-muted)]">
          {meta.unit}
        </span>
      </div>

      {/* Progress relative to standard */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] font-mono text-[var(--obs-text-faint)] mb-1">
          <span>vs CPCB Std ({stdLimit} {meta.unit})</span>
          <span className={pctOfStandard > 100 ? "text-amber-400 font-bold" : ""}>
            {Math.round(pctOfStandard)}%
          </span>
        </div>
        <div className="w-full bg-[var(--obs-bg)] h-1.5 rounded overflow-hidden border border-[var(--obs-border)]">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(100, pctOfStandard)}%`,
              backgroundColor: category.color
            }}
          />
        </div>
      </div>
    </div>
  );
}
