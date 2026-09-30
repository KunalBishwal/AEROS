"use client";

import React, { useEffect, useState } from "react";
import { api, CalendarDay } from "@/lib/api";
import CalendarHeatmap from "@/components/charts/CalendarHeatmap";
import DiurnalCurveChart from "@/components/charts/DiurnalCurveChart";
import WeatherDualAxisChart from "@/components/charts/WeatherDualAxisChart";
import { Clock, Calendar, CloudRain, Filter, Activity } from "lucide-react";

export default function PatternsPage() {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("Delhi");
  const [selectedPollutant, setSelectedPollutant] = useState<string>("PM2.5");
  const [diurnalData, setDiurnalData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [seasonalStats, setSeasonalStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cities, setCities] = useState<string[]>([]);

  const POLLUTANTS = [
    { code: "PM2.5", unit: "µg/m³" },
    { code: "PM10", unit: "µg/m³" },
    { code: "NO2", unit: "µg/m³" },
    { code: "SO2", unit: "µg/m³" },
    { code: "CO", unit: "mg/m³" },
    { code: "O3", unit: "µg/m³" }
  ];

  const activeUnit = POLLUTANTS.find(p => p.code === selectedPollutant)?.unit || "µg/m³";

  useEffect(() => {
    // Load city list
    api.getCities().then((cList) => {
      const names = cList.map((c: any) => c.name);
      setCities(names);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    async function loadPatterns() {
      setLoading(true);
      try {
        const [calRes, diurnalRes, seasonalRes, weatherRes] = await Promise.all([
          api.getCalendarData(2026, selectedCity),
          api.getDiurnalPatterns(selectedPollutant, selectedCity),
          api.getSeasonalPatterns(selectedCity),
          api.getWeatherCorrelation(28.6469, 77.3160, selectedPollutant)
        ]);

        setCalendarDays(calRes.days || []);
        setDiurnalData(diurnalRes);
        setSeasonalStats(seasonalRes);
        setWeatherData(weatherRes.timeseries || []);
      } catch (err) {
        console.error("Failed to load pattern analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPatterns();
  }, [selectedCity, selectedPollutant]);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--obs-border)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] mb-1 uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5" />
            <span>CHRONO-SPATIAL FORENSICS</span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl font-extrabold text-[var(--obs-text-main)] tracking-tight">
            Seasonal & Diurnal Pollution Patterns
          </h1>
          <p className="text-xs text-[var(--obs-text-muted)] mt-1 max-w-2xl font-mono">
            Full annual cycle calendar distribution and 24-hour diurnal curves contrasting weekday commuter transit vs weekend baselines.
          </p>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[var(--obs-text-muted)]">URBAN FILTER:</span>
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

      {/* Section 1: Full-Year Calendar Heatmap */}
      <div className="obs-panel reticle-corner p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--obs-border)] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--obs-accent)]" />
            <h2 className="font-editorial text-lg font-bold text-[var(--obs-text-main)]">
              Full-Year 365-Day Atmospheric Calendar Heatmap (2026)
            </h2>
          </div>
          <span className="font-mono text-xs text-[var(--obs-accent)] bg-[var(--obs-surface-hover)] border border-[var(--obs-border)] px-2.5 py-0.5 rounded">
            {selectedCity} • 12 Months × 31 Days
          </span>
        </div>

        <CalendarHeatmap days={calendarDays} year={2026} />
      </div>

      {/* Section 2: Diurnal (Hourly 0-23) Weekday vs Weekend Analysis */}
      <div className="obs-panel reticle-corner p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--obs-border)] pb-3 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--obs-accent)]" />
              <h2 className="font-editorial text-lg font-bold text-[var(--obs-text-main)]">
                Diurnal Hourly Dynamics: Weekdays vs Weekends
              </h2>
            </div>
            <p className="text-xs font-mono text-[var(--obs-text-muted)] mt-0.5">
              Hourly concentration cycle revealing morning vehicular rush hours (07:00–10:00) and nocturnal boundary layer compression.
            </p>
          </div>

          {/* Pollutant Parameter Tabs */}
          <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
            {POLLUTANTS.map((pol) => (
              <button
                key={pol.code}
                onClick={() => setSelectedPollutant(pol.code)}
                className={`px-2.5 py-1 rounded border transition-all ${
                  selectedPollutant === pol.code
                    ? "bg-[var(--obs-accent)] text-black font-bold border-[var(--obs-accent)]"
                    : "bg-[var(--obs-surface)] text-[var(--obs-text-muted)] border-[var(--obs-border)] hover:border-[var(--obs-border-light)]"
                }`}
              >
                {pol.code}
              </button>
            ))}
          </div>
        </div>

        {diurnalData && (
          <DiurnalCurveChart
            pollutant={selectedPollutant}
            unit={activeUnit}
            weekdays={diurnalData.weekdays || []}
            weekends={diurnalData.weekends || []}
            overall={diurnalData.overall || []}
          />
        )}
      </div>

      {/* Section 3: Dual Grid: Weather Relationship & Seasonal Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weather Dual-Axis Chart */}
        <div className="lg:col-span-7 obs-panel reticle-corner p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--obs-border)] pb-3">
            <CloudRain className="w-4 h-4 text-[var(--obs-accent)]" />
            <div>
              <h3 className="font-editorial text-base font-bold text-[var(--obs-text-main)]">
                Atmospheric Dispersion & Weather Correlation
              </h3>
              <div className="text-[11px] font-mono text-[var(--obs-text-muted)]">
                Temperature & Wind Speed vs Ambient Concentration (Open-Meteo Telemetry)
              </div>
            </div>
          </div>

          <WeatherDualAxisChart
            weatherData={weatherData}
            pollutantName={selectedPollutant}
            isAvailable={weatherData.length > 0}
          />
        </div>

        {/* Seasonal Aggregation Table */}
        <div className="lg:col-span-5 obs-panel reticle-corner p-6 space-y-4">
          <div className="border-b border-[var(--obs-border)] pb-3">
            <h3 className="font-editorial text-base font-bold text-[var(--obs-text-main)]">
              Seasonal Climate Disparity ({selectedCity})
            </h3>
            <div className="text-[11px] font-mono text-[var(--obs-text-muted)]">
              Monitored AQI Averages across Official Indian Meteorological Seasons
            </div>
          </div>

          {seasonalStats?.seasons && (
            <div className="space-y-2.5 font-mono text-xs">
              {Object.entries(seasonalStats.seasons).map(([seasonName, data]: [string, any]) => (
                <div
                  key={seasonName}
                  className="p-3 border border-[var(--obs-border)] bg-[var(--obs-bg)]/50 rounded flex justify-between items-center"
                >
                  <div>
                    <strong className="text-[var(--obs-text-main)] text-sm">{seasonName}</strong>
                    <div className="text-[11px] text-[var(--obs-text-muted)] mt-0.5">
                      Exceedance Rate: <strong className="text-amber-400">{data.exceedance_pct}%</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[var(--obs-accent)]">
                      {data.mean_aqi} <span className="text-[10px] text-[var(--obs-text-muted)]">AQI</span>
                    </div>
                    <div className="text-[10px] text-[var(--obs-text-faint)]">
                      Peak: {data.max_aqi}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
