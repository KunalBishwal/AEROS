"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import CityComparisonBar from "@/components/charts/CityComparisonBar";
import { BarChart3, CheckSquare, Square, Info } from "lucide-react";

export default function ComparePage() {
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([
    "Delhi", "Mumbai", "Bengaluru", "Kolkata", "Hyderabad"
  ]);
  const [selectedMetric, setSelectedMetric] = useState<any>("mean_aqi");
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getCities().then((list) => {
      const names = list.map((c: any) => c.name);
      setAvailableCities(names);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCities.length === 0) return;
    setLoading(true);
    api.getCityComparison(selectedCities)
      .then((res) => {
        setComparisonData(res.profiles || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCities]);

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      if (selectedCities.length > 1) {
        setSelectedCities(selectedCities.filter((c) => c !== city));
      }
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const METRICS = [
    { key: "mean_aqi", label: "Average AQI" },
    { key: "mean_pm25", label: "PM2.5 (µg/m³)" },
    { key: "mean_pm10", label: "PM10 (µg/m³)" },
    { key: "mean_no2", label: "NO2 (µg/m³)" },
    { key: "exceedance_days", label: "Poor Days (>200 AQI)" }
  ];

  return (
    <div className="space-y-8">
      {/* Editorial Masthead */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--obs-border)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] mb-1 uppercase tracking-widest">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>CROSS-METROPOLITAN COMPARATIVE FORENSICS</span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl font-extrabold text-[var(--obs-text-main)] tracking-tight">
            Multi-City Atmospheric Fingerprints
          </h1>
          <p className="text-xs text-[var(--obs-text-muted)] mt-1 max-w-2xl font-mono">
            Objective side-by-side evaluation across 8 Indian urban centers.
            No artificial single city rankings or subjective 'best/worst' designations;
            empirical physical measurements speak for themselves.
          </p>
        </div>
      </div>

      {/* City Selector Multi-Select Strip */}
      <div className="obs-panel p-4 space-y-3">
        <div className="text-xs font-mono text-[var(--obs-text-muted)] font-semibold uppercase tracking-wider">
          SELECT URBAN CENTERS TO COMPARE ({selectedCities.length} ACTIVE)
        </div>
        <div className="flex flex-wrap gap-2">
          {availableCities.map((city) => {
            const isSelected = selectedCities.includes(city);
            return (
              <button
                key={city}
                onClick={() => toggleCity(city)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs border transition-all ${
                  isSelected
                    ? "bg-[var(--obs-accent)] text-black border-[var(--obs-accent)] font-bold shadow-sm"
                    : "bg-[var(--obs-surface-hover)] text-[var(--obs-text-muted)] border-[var(--obs-border)] hover:border-[var(--obs-border-light)]"
                }`}
              >
                {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span>{city}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grouped Bar Chart */}
      <div className="obs-panel reticle-corner p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--obs-border)] pb-3 gap-3">
          <h2 className="font-editorial text-lg font-bold text-[var(--obs-text-main)]">
            Atmospheric Profiling Across Monitored Centers
          </h2>

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap gap-1 font-mono text-xs">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`px-2.5 py-1 rounded border transition-all ${
                  selectedMetric === m.key
                    ? "bg-[var(--obs-surface-hover)] text-[var(--obs-accent)] border-[var(--obs-accent)] font-bold"
                    : "bg-[var(--obs-surface)] text-[var(--obs-text-muted)] border-[var(--obs-border)] hover:border-[var(--obs-border-light)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {comparisonData.length > 0 && (
          <CityComparisonBar profiles={comparisonData} metric={selectedMetric} />
        )}
      </div>

      {/* Full Cross-Metropolitan Data Matrix */}
      <div className="obs-panel reticle-corner p-6 space-y-4 overflow-x-auto">
        <div className="border-b border-[var(--obs-border)] pb-3">
          <h3 className="font-editorial text-base font-bold text-[var(--obs-text-main)]">
            Comparative Physical Parameter Matrix
          </h3>
          <p className="text-xs font-mono text-[var(--obs-text-muted)] mt-0.5">
            Annualized averages across particulates (PM2.5, PM10) and combustion oxides (NO2, SO2, CO, O3) with exceedance counts.
          </p>
        </div>

        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--obs-border)] text-[var(--obs-text-muted)]">
              <th className="py-2.5 pr-4">CITY</th>
              <th className="py-2.5 px-3">MONITORS</th>
              <th className="py-2.5 px-3">AVG AQI</th>
              <th className="py-2.5 px-3">MAX AQI</th>
              <th className="py-2.5 px-3">PM2.5 (µg/m³)</th>
              <th className="py-2.5 px-3">PM10 (µg/m³)</th>
              <th className="py-2.5 px-3">NO2 (µg/m³)</th>
              <th className="py-2.5 px-3">CO (mg/m³)</th>
              <th className="py-2.5 px-3 text-right">POOR DAYS (&gt;200)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--obs-border)]/50">
            {comparisonData.map((row) => (
              <tr key={row.city} className="hover:bg-[var(--obs-surface-hover)]">
                <td className="py-3 pr-4 font-bold text-[var(--obs-text-main)]">{row.city}</td>
                <td className="py-3 px-3 text-[var(--obs-text-muted)]">{row.station_count}</td>
                <td className="py-3 px-3 font-bold text-[var(--obs-accent)]">{row.mean_aqi}</td>
                <td className="py-3 px-3 text-red-400 font-semibold">{row.max_aqi}</td>
                <td className="py-3 px-3">{row.mean_pm25}</td>
                <td className="py-3 px-3">{row.mean_pm10}</td>
                <td className="py-3 px-3">{row.mean_no2}</td>
                <td className="py-3 px-3">{row.mean_co}</td>
                <td className="py-3 px-3 text-right font-bold text-amber-400">
                  {row.exceedance_days} <span className="text-[10px] text-[var(--obs-text-faint)]">({row.exceedance_pct}%)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--obs-text-faint)] pt-2">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Notice: Coastal centers (Mumbai, Chennai) reflect marine boundary layer dispersion; northern inland centers (Delhi, Lucknow) exhibit seasonal inversion effects.</span>
        </div>
      </div>
    </div>
  );
}
