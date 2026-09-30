"use client";

import React, { useEffect, useState } from "react";
import { api, ExceedanceResponse } from "@/lib/api";
import { Sliders, Flame, Calendar, Activity, AlertTriangle } from "lucide-react";

export default function ExceedancePage() {
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("Delhi");
  const [selectedPollutant, setSelectedPollutant] = useState<string>("PM2.5");
  const [threshold, setThreshold] = useState<number>(60);
  const [data, setData] = useState<ExceedanceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Pollutant default threshold presets (CPCB Satisfactory / Moderate limits)
  const THRESHOLD_PRESETS: Record<string, { standard: number; maxSlider: number; unit: string }> = {
    "PM2.5": { standard: 60, maxSlider: 250, unit: "µg/m³" },
    "PM10": { standard: 100, maxSlider: 400, unit: "µg/m³" },
    "NO2": { standard: 80, maxSlider: 250, unit: "µg/m³" },
    "SO2": { standard: 80, maxSlider: 250, unit: "µg/m³" },
    "CO": { standard: 2.0, maxSlider: 15.0, unit: "mg/m³" },
    "O3": { standard: 100, maxSlider: 250, unit: "µg/m³" }
  };

  const currentPreset = THRESHOLD_PRESETS[selectedPollutant] || THRESHOLD_PRESETS["PM2.5"];

  useEffect(() => {
    api.getCities().then((list) => {
      setCities(list.map((c: any) => c.name));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getExceedance(selectedPollutant, threshold, selectedCity)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPollutant, threshold, selectedCity]);

  const handlePollutantChange = (pol: string) => {
    setSelectedPollutant(pol);
    setThreshold(THRESHOLD_PRESETS[pol]?.standard || 60);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--obs-border)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] mb-1 uppercase tracking-widest">
            <Sliders className="w-3.5 h-3.5" />
            <span>THRESHOLD FORENSICS & DURATION ANALYSIS</span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl font-extrabold text-[var(--obs-text-main)] tracking-tight">
            Exceedance Days & Streak Counter
          </h1>
          <p className="text-xs text-[var(--obs-text-muted)] mt-1 max-w-2xl font-mono">
            User-directed dynamic threshold testing. Slide the concentration limit to evaluate consecutive run-length exposure streaks and cumulative exposure frequency.
          </p>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[var(--obs-text-muted)]">URBAN CENTER:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            aria-label="Filter by urban center"
            className="bg-[var(--obs-surface)] border border-[var(--obs-border)] text-[var(--obs-text-main)] px-3 py-1.5 rounded focus:outline-none focus:border-[var(--obs-accent)]"
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Controls Strip */}
      <div className="obs-panel reticle-corner p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--obs-border)] pb-4">
          {/* Pollutant Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[var(--obs-text-muted)] uppercase tracking-wider block">
              Parameter Selection:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(THRESHOLD_PRESETS).map((pol) => (
                <button
                  key={pol}
                  onClick={() => handlePollutantChange(pol)}
                  className={`px-3 py-1.5 rounded font-mono text-xs border transition-all ${
                    selectedPollutant === pol
                      ? "bg-[var(--obs-accent)] text-black font-bold border-[var(--obs-accent)]"
                      : "bg-[var(--obs-surface-hover)] text-[var(--obs-text-muted)] border-[var(--obs-border)] hover:border-[var(--obs-border-light)]"
                  }`}
                >
                  {pol}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[var(--obs-text-muted)] uppercase tracking-wider block">
              Official Benchmark Preset:
            </label>
            <button
              onClick={() => setThreshold(currentPreset.standard)}
              className="px-3 py-1.5 bg-[var(--obs-surface)] border border-[var(--obs-border-light)] text-[var(--obs-accent)] font-mono text-xs rounded hover:bg-[var(--obs-surface-hover)]"
            >
              CPCB 24-hr Standard ({currentPreset.standard} {currentPreset.unit})
            </button>
          </div>
        </div>

        {/* Interactive Threshold Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline font-mono text-xs">
            <span className="text-[var(--obs-text-muted)]">
              TEST THRESHOLD: <strong className="text-[var(--obs-text-main)] text-base">{threshold} {currentPreset.unit}</strong>
            </span>
            <span className="text-[11px] text-[var(--obs-text-faint)]">
              Range: 0 to {currentPreset.maxSlider} {currentPreset.unit}
            </span>
          </div>

          <input
            type="range"
            min={selectedPollutant === "CO" ? 0.5 : 10}
            max={currentPreset.maxSlider}
            step={selectedPollutant === "CO" ? 0.2 : 5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            aria-label="Adjust concentration threshold"
            className="w-full accent-[var(--obs-accent)] h-2 bg-[var(--obs-bg)] rounded-lg cursor-pointer border border-[var(--obs-border)]"
          />
        </div>
      </div>

      {/* Dynamic Results KPI Grid */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="obs-panel p-5 border-l-4 border-l-[var(--obs-accent)]">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--obs-text-muted)] uppercase tracking-wider">
              <Activity className="w-4 h-4 text-[var(--obs-accent)]" />
              <span>Exceedance Frequency</span>
            </div>
            <div className="text-4xl font-mono font-black text-[var(--obs-text-main)] my-2">
              {data.exceedance_percentage}%
            </div>
            <div className="text-xs font-mono text-[var(--obs-text-muted)]">
              <strong>{data.exceedance_days}</strong> of {data.total_days} monitored days breached {threshold} {data.unit}.
            </div>
          </div>

          <div className="obs-panel p-5 border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--obs-text-muted)] uppercase tracking-wider">
              <Flame className="w-4 h-4 text-red-500" />
              <span>Longest Continuous Streak</span>
            </div>
            <div className="text-4xl font-mono font-black text-red-400 my-2">
              {data.longest_streak_days} <span className="text-base text-[var(--obs-text-muted)]">DAYS</span>
            </div>
            <div className="text-xs font-mono text-[var(--obs-text-muted)]">
              Uninterrupted consecutive daily exceedance run length.
            </div>
          </div>

          <div className="obs-panel p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--obs-text-muted)] uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Maximum Recorded Peak</span>
            </div>
            <div className="text-4xl font-mono font-black text-amber-400 my-2">
              {data.max_concentration} <span className="text-base text-[var(--obs-text-muted)]">{data.unit}</span>
            </div>
            <div className="text-xs font-mono text-[var(--obs-text-muted)]">
              Highest single-day station reading in the dataset.
            </div>
          </div>

          <div className="obs-panel p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--obs-text-muted)] uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Trailing Current Streak</span>
            </div>
            <div className="text-4xl font-mono font-black text-emerald-400 my-2">
              {data.current_streak_days} <span className="text-base text-[var(--obs-text-muted)]">DAYS</span>
            </div>
            <div className="text-xs font-mono text-[var(--obs-text-muted)]">
              Active consecutive exceedance streak leading up to latest telemetry.
            </div>
          </div>
        </div>
      )}

      {/* Streak Timeline & Explanation */}
      {data && data.streak_dates && data.streak_dates.length > 0 && (
        <div className="obs-panel reticle-corner p-6 space-y-3">
          <h3 className="font-editorial text-base font-bold text-[var(--obs-text-main)]">
            Forensic Run-Length Verification ({selectedCity})
          </h3>
          <p className="text-xs font-mono text-[var(--obs-text-muted)]">
            Sample sequence from the peak {data.longest_streak_days}-day exceedance streak:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {data.streak_dates.map((dStr: string, idx: number) => (
              <span
                key={dStr}
                className="font-mono text-xs px-2.5 py-1 bg-[var(--obs-surface-hover)] border border-red-900/60 text-red-300 rounded"
              >
                Day {idx + 1}: {dStr}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
