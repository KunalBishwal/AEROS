"use client";

import React, { useState } from "react";
import { AlertOctagon, CheckCircle2, ChevronRight, X, ShieldAlert } from "lucide-react";

interface AlertStation {
  station_id: string;
  station_name: string;
  city: string;
  aqi: number;
  category: string;
  dominant_pollutant: string;
  color: string;
  health_advisory: string;
  severity_level: string;
  last_updated: string | null;
}

interface SevereAlertBannerProps {
  alerts: AlertStation[];
  onSelectStation?: (stationId: string) => void;
}

export default function SevereAlertBanner({ alerts, onSelectStation }: SevereAlertBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const severeCount = alerts.length;

  if (severeCount === 0) {
    return (
      <div className="obs-panel border-l-4 border-l-emerald-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-mono text-xs font-semibold text-[var(--obs-text-main)]">
              NO STATIONS IN SEVERE POLLUTION STATE
            </div>
            <div className="text-[11px] text-[var(--obs-text-muted)]">
              All active monitoring stations are currently reporting below the CPCB 'Severe' threshold (AQI &lt; 401).
            </div>
          </div>
        </div>
        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 uppercase tracking-wider">
          Nominal
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="obs-panel border-l-4 border-l-red-600 bg-red-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-900/40 border border-red-700/60 rounded">
            <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-red-400 flex items-center gap-2">
              <span>ATMOSPHERIC EMERGENCY ALERT</span>
              <span className="bg-red-900/60 border border-red-700 text-red-200 px-1.5 py-0.2 rounded text-[10px]">
                {severeCount} ACTIVE STATION{severeCount > 1 ? "S" : ""}
              </span>
            </div>
            <div className="text-[11px] text-[var(--obs-text-muted)] mt-0.5">
              Severe air quality recorded in {alerts.map(a => a.city).filter((v, i, a) => a.indexOf(v) === i).join(", ")}.
              Affects healthy people and seriously impacts those with existing respiratory conditions.
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1 text-xs font-mono font-semibold text-red-400 hover:text-red-300 bg-red-950/60 border border-red-800/80 px-3 py-1.5 rounded transition-all"
        >
          <span>INSPECT SEVERE MONITORS</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Detail Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="obs-panel reticle-corner max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--obs-border)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="font-editorial text-lg font-bold text-[var(--obs-text-main)]">
                  Active Severe Station Advisories
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--obs-text-muted)] hover:text-[var(--obs-text-main)] p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {alerts.map((st) => (
                <div
                  key={st.station_id}
                  className="p-4 border border-red-900/60 bg-red-950/20 rounded flex flex-col justify-between gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-red-400 font-bold uppercase tracking-wider">
                        {st.city} • {st.station_name}
                      </span>
                      <div className="font-mono text-xs text-[var(--obs-text-muted)] mt-0.5">
                        Dominant: <strong className="text-[var(--obs-text-main)]">{st.dominant_pollutant}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-2xl font-black text-red-500">
                        {st.aqi}
                      </span>
                      <div className="font-mono text-[10px] text-red-400 font-semibold uppercase">
                        {st.category}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--obs-text-muted)] border-t border-red-950/60 pt-2 italic">
                    Health Advisory: {st.health_advisory}
                  </p>

                  {onSelectStation && (
                    <button
                      onClick={() => {
                        onSelectStation(st.station_id);
                        setIsOpen(false);
                      }}
                      className="mt-2 text-xs font-mono text-[var(--obs-accent)] hover:underline text-left"
                    >
                      Focus this monitor on map →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
