"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileText, MapPin, Compass, AlertOctagon, CheckCircle2, Target, Calendar, Clock } from "lucide-react";

export default function StoryPage() {
  const [story, setStory] = useState<any>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("Delhi");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getCities().then((list) => {
      setCities(list.map((c: any) => c.name));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getCommissionerStory(selectedCity)
      .then(setStory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCity]);

  if (!story) {
    return (
      <div className="obs-panel p-12 text-center font-mono text-xs text-[var(--obs-text-muted)]">
        SYNTHESIZING COMMISSIONER BRIEFING...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Editorial Report Cover Header */}
      <div className="border-b-2 border-[var(--obs-text-main)] pb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-[var(--obs-text-muted)]">
          <span>MEMORANDUM FOR MUNICIPAL LEADERSHIP</span>
          <span>DATE: {story.generated_at}</span>
        </div>

        <h1 className="font-editorial text-3xl md:text-5xl font-black text-[var(--obs-text-main)] tracking-tight leading-tight">
          {story.title}
        </h1>

        <p className="font-editorial text-lg text-[var(--obs-text-muted)] italic">
          "{story.subtitle}"
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[var(--obs-text-muted)]">TARGET MUNICIPALITY:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label="Target municipality selection"
              className="bg-[var(--obs-surface)] border border-[var(--obs-border)] text-[var(--obs-accent)] font-bold px-3 py-1 rounded focus:outline-none"
            >
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <span className="font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-0.5 rounded uppercase">
            EMPIRICALLY GROUNDED
          </span>
        </div>
      </div>

      {/* Chapter 1: THE SITUATION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] uppercase tracking-widest border-b border-[var(--obs-border)] pb-2">
          <span>01. THE SITUATION</span>
        </div>

        <h2 className="font-editorial text-2xl font-bold text-[var(--obs-text-main)]">
          {story.situation.headline}
        </h2>

        <p className="text-sm font-mono text-[var(--obs-text-muted)] leading-relaxed">
          {story.situation.narrative}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="obs-panel p-3 text-center">
            <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block">ANNUAL MEAN AQI</span>
            <strong className="text-2xl font-mono text-[var(--obs-accent)]">{story.situation.mean_aqi}</strong>
          </div>
          <div className="obs-panel p-3 text-center">
            <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block">PEAK RECORDED AQI</span>
            <strong className="text-2xl font-mono text-red-400">{story.situation.max_aqi}</strong>
          </div>
          <div className="obs-panel p-3 text-center">
            <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block">ACTIVE STATIONS</span>
            <strong className="text-2xl font-mono text-[var(--obs-text-main)]">{story.situation.monitored_stations_count}</strong>
          </div>
          <div className="obs-panel p-3 text-center">
            <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block">TOTAL DAYS AUDITED</span>
            <strong className="text-2xl font-mono text-[var(--obs-text-main)]">{story.situation.total_observed_days}</strong>
          </div>
        </div>
      </section>

      {/* Chapter 2: THE DRIVER */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] uppercase tracking-widest border-b border-[var(--obs-border)] pb-2">
          <span>02. THE DRIVER</span>
        </div>

        <h2 className="font-editorial text-2xl font-bold text-[var(--obs-text-main)]">
          {story.driver.headline}
        </h2>

        <p className="text-sm font-mono text-[var(--obs-text-muted)] leading-relaxed">
          {story.driver.narrative}
        </p>

        <div className="obs-panel p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div className="font-mono text-xs">
            <span className="text-[var(--obs-text-muted)]">PRIMARY RESPIRATORY THREAT:</span>{" "}
            <strong className="text-[var(--obs-text-main)] text-sm">{story.driver.dominant_pollutant}</strong>
          </div>
          <div className="font-mono text-xs text-amber-400 font-bold">
            {story.driver.share_percentage}% AQI DETERMINATION SHARE
          </div>
        </div>
      </section>

      {/* Chapter 3: THE PATTERN */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] uppercase tracking-widest border-b border-[var(--obs-border)] pb-2">
          <span>03. THE PATTERN</span>
        </div>

        <h2 className="font-editorial text-2xl font-bold text-[var(--obs-text-main)]">
          {story.pattern.headline}
        </h2>

        <p className="text-sm font-mono text-[var(--obs-text-muted)] leading-relaxed">
          {story.pattern.narrative}
        </p>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="obs-panel p-4 border-l-4 border-l-red-500">
            <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block uppercase">Winter Mean AQI</span>
            <strong className="text-3xl font-mono text-red-400">{story.pattern.winter_mean_aqi}</strong>
            <span className="text-[11px] font-mono text-[var(--obs-text-muted)] block mt-1">
              Trapped surface emissions due to thermal temperature inversion.
            </span>
          </div>

          <div className="obs-panel p-4 border-l-4 border-l-emerald-500">
            <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block uppercase">Monsoon Mean AQI</span>
            <strong className="text-3xl font-mono text-emerald-400">{story.pattern.monsoon_mean_aqi}</strong>
            <span className="text-[11px] font-mono text-[var(--obs-text-muted)] block mt-1">
              Natural wet atmospheric scavenging and convective dispersion.
            </span>
          </div>
        </div>
      </section>

      {/* Chapter 4: THE EXPOSURE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] uppercase tracking-widest border-b border-[var(--obs-border)] pb-2">
          <span>04. THE EXPOSURE</span>
        </div>

        <h2 className="font-editorial text-2xl font-bold text-[var(--obs-text-main)]">
          {story.exposure.headline}
        </h2>

        <p className="text-sm font-mono text-[var(--obs-text-muted)] leading-relaxed">
          {story.exposure.narrative}
        </p>

        <div className="obs-panel p-4 border-l-4 border-l-red-600 bg-red-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="font-mono text-xs">
            <div className="font-bold text-red-400 uppercase">Emergency Category Breaches</div>
            <div className="text-[var(--obs-text-muted)]">
              {story.exposure.severe_days} days exceeded AQI 400 (CPCB 'Severe' Band).
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-red-400 px-3 py-1 bg-red-900/60 rounded border border-red-700 self-start md:self-auto">
            {story.exposure.exceedance_percentage}% High-Exposure Days
          </span>
        </div>
      </section>

      {/* Chapter 5: THE INTERVENTION WINDOW */}
      <section className="space-y-4 border-t-2 border-[var(--obs-accent)] pt-6">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] uppercase tracking-widest">
          <Target className="w-4 h-4" />
          <span>05. THE INTERVENTION WINDOW (RECOMMENDED ACTION)</span>
        </div>

        <h2 className="font-editorial text-2xl md:text-3xl font-extrabold text-[var(--obs-text-main)]">
          {story.intervention_window.headline}
        </h2>

        <p className="text-sm font-mono text-[var(--obs-text-muted)] leading-relaxed">
          {story.intervention_window.narrative}
        </p>

        <div className="obs-panel reticle-corner p-6 bg-[var(--obs-surface-hover)] border border-[var(--obs-accent)]/60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--obs-border)] pb-3">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--obs-accent)]">
              <Clock className="w-4 h-4" />
              <span>Target Window: {story.intervention_window.window_hours} ({story.intervention_window.day_type})</span>
            </div>
            <span className="font-mono text-xs bg-[var(--obs-accent)] text-black px-2.5 py-0.5 rounded font-bold">
              +{story.intervention_window.elevation_percentage}% Above Average
            </span>
          </div>

          <div className="text-xs font-mono text-[var(--obs-text-main)] leading-relaxed">
            <strong>Actionable Directive:</strong> {story.intervention_window.recommendation}
          </div>

          <div className="text-[11px] font-mono text-[var(--obs-text-faint)] italic border-t border-[var(--obs-border)] pt-2">
            Observation based strictly on empirical CAAQMS diurnal distributions.
            Does not assert causal linkage without secondary sensor validation.
          </div>
        </div>
      </section>
    </div>
  );
}
