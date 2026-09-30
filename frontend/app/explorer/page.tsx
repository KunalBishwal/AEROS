"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Table, Search, Filter, ShieldCheck, Download, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ExplorerPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [cityFilter, setCityFilter] = useState<string>("");
  const [pollutantFilter, setPollutantFilter] = useState<string>("");
  const [flagFilter, setFlagFilter] = useState<string>("");
  const [qualityAudit, setQualityAudit] = useState<any>(null);

  useEffect(() => {
    api.getDataQualityAudit().then(setQualityAudit).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getExplorerRecords({
      city: cityFilter || undefined,
      pollutant: pollutantFilter || undefined,
      quality_flag: flagFilter || undefined,
      page,
      limit: 30
    })
      .then((res) => {
        setRecords(res.records || []);
        setTotalRecords(res.total_records || 0);
        setTotalPages(res.total_pages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cityFilter, pollutantFilter, flagFilter, page]);

  const exportCSV = () => {
    if (records.length === 0) return;
    const headers = ["Station", "City", "Pollutant", "Concentration", "Unit", "Timestamp", "Source", "Quality Flag"];
    const rows = records.map((r) => [
      `"${r.station_name}"`,
      `"${r.city}"`,
      `"${r.pollutant}"`,
      r.concentration,
      `"${r.unit}"`,
      `"${r.timestamp}"`,
      `"${r.source}"`,
      `"${r.quality_flag}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aqi_telemetry_export_p${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--obs-border)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] mb-1 uppercase tracking-widest">
            <Table className="w-3.5 h-3.5" />
            <span>TRANSPARENCY & QUALITY VALIDATION AUDIT</span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl font-extrabold text-[var(--obs-text-main)] tracking-tight">
            Raw Telemetry Explorer
          </h1>
          <p className="text-xs text-[var(--obs-text-muted)] mt-1 max-w-2xl font-mono">
            Directly inspect underlying canonical measurements, timestamps, physical units, and quality validation flags.
            Zero black-box data.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--obs-surface)] border border-[var(--obs-border)] hover:border-[var(--obs-accent)] text-[var(--obs-accent)] font-mono text-xs rounded transition-all"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT PAGE AS CSV</span>
        </button>
      </div>

      {/* Quality Audit Stats Panel */}
      {qualityAudit && (
        <div className="obs-panel reticle-corner p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--obs-border)] pb-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[var(--obs-text-main)] font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DATA QUALITY & INGESTION PROVENANCE AUDIT</span>
            </div>
            <span className="text-[var(--obs-text-muted)]">
              Date Range: <strong className="text-[var(--obs-accent)]">{qualityAudit.date_range}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            <div className="obs-panel p-3 text-center">
              <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block uppercase">Stations Audited</span>
              <strong className="text-xl font-mono text-[var(--obs-text-main)]">{qualityAudit.station_count}</strong>
            </div>
            <div className="obs-panel p-3 text-center">
              <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block uppercase">Total Observations</span>
              <strong className="text-xl font-mono text-[var(--obs-accent)]">{qualityAudit.total_observations_audited.toLocaleString()}</strong>
            </div>
            <div className="obs-panel p-3 text-center">
              <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block uppercase">Valid Ratio</span>
              <strong className="text-xl font-mono text-emerald-400">{qualityAudit.valid_percentage}%</strong>
            </div>
            <div className="obs-panel p-3 text-center">
              <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block uppercase">Sensor Outliers</span>
              <strong className="text-xl font-mono text-amber-400">{qualityAudit.quality_flags?.OUTLIER || 0}</strong>
            </div>
            <div className="obs-panel p-3 text-center">
              <span className="text-[10px] font-mono text-[var(--obs-text-faint)] block uppercase">Invalid Flagged</span>
              <strong className="text-xl font-mono text-red-400">{qualityAudit.quality_flags?.INVALID || 0}</strong>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[var(--obs-text-faint)] italic pt-1">
            * {qualityAudit.transparency_note}
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="obs-panel p-4 flex flex-wrap gap-4 items-center justify-between text-xs font-mono">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--obs-text-muted)]" />
            <span className="text-[var(--obs-text-muted)]">FILTERS:</span>
          </div>

          {/* City */}
          <input
            type="text"
            placeholder="Search City..."
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            className="bg-[var(--obs-surface-hover)] border border-[var(--obs-border)] text-[var(--obs-text-main)] px-2.5 py-1 rounded w-36 focus:outline-none focus:border-[var(--obs-accent)]"
          />

          {/* Pollutant */}
          <select
            value={pollutantFilter}
            onChange={(e) => { setPollutantFilter(e.target.value); setPage(1); }}
            className="bg-[var(--obs-surface-hover)] border border-[var(--obs-border)] text-[var(--obs-text-main)] px-2.5 py-1 rounded focus:outline-none focus:border-[var(--obs-accent)]"
          >
            <option value="">All Pollutants</option>
            <option value="PM2.5">PM2.5</option>
            <option value="PM10">PM10</option>
            <option value="NO2">NO2</option>
            <option value="SO2">SO2</option>
            <option value="CO">CO</option>
            <option value="O3">O3</option>
          </select>

          {/* Quality Flag */}
          <select
            value={flagFilter}
            onChange={(e) => { setFlagFilter(e.target.value); setPage(1); }}
            className="bg-[var(--obs-surface-hover)] border border-[var(--obs-border)] text-[var(--obs-text-main)] px-2.5 py-1 rounded focus:outline-none focus:border-[var(--obs-accent)]"
          >
            <option value="">All Flags</option>
            <option value="VALID">VALID</option>
            <option value="OUTLIER">OUTLIER</option>
            <option value="INVALID">INVALID</option>
            <option value="DUPLICATE">DUPLICATE</option>
          </select>
        </div>

        <div className="text-[var(--obs-text-muted)]">
          Showing <strong>{records.length}</strong> of <strong>{totalRecords.toLocaleString()}</strong> matches
        </div>
      </div>

      {/* Raw Records Table */}
      <div className="obs-panel reticle-corner overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--obs-border)] text-[var(--obs-text-muted)] bg-[var(--obs-surface)]">
              <th className="py-3 px-4">MONITOR STATION</th>
              <th className="py-3 px-3">URBAN CENTER</th>
              <th className="py-3 px-3">POLLUTANT</th>
              <th className="py-3 px-3">CONCENTRATION</th>
              <th className="py-3 px-3">TIMESTAMP (UTC)</th>
              <th className="py-3 px-3">SOURCE</th>
              <th className="py-3 px-4 text-right">QUALITY FLAG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--obs-border)]/50">
            {records.map((r, idx) => (
              <tr key={idx} className="hover:bg-[var(--obs-surface-hover)]">
                <td className="py-2.5 px-4 font-semibold text-[var(--obs-text-main)]">{r.station_name}</td>
                <td className="py-2.5 px-3 text-[var(--obs-text-muted)]">{r.city}</td>
                <td className="py-2.5 px-3 font-bold text-[var(--obs-accent)]">{r.pollutant}</td>
                <td className="py-2.5 px-3 font-mono font-bold">
                  {r.concentration} <span className="text-[10px] text-[var(--obs-text-faint)] font-normal">{r.unit}</span>
                </td>
                <td className="py-2.5 px-3 text-[var(--obs-text-muted)]">{new Date(r.timestamp).toISOString().replace("T", " ").substring(0, 19)}</td>
                <td className="py-2.5 px-3 text-[11px] text-[var(--obs-text-faint)]">{r.source}</td>
                <td className="py-2.5 px-4 text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      r.quality_flag === "VALID"
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                        : r.quality_flag === "OUTLIER"
                        ? "bg-amber-950/60 text-amber-400 border border-amber-900/60"
                        : "bg-red-950/60 text-red-400 border border-red-900/60"
                    }`}
                  >
                    {r.quality_flag}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[var(--obs-border)] flex items-center justify-between font-mono text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded border border-[var(--obs-border)] text-[var(--obs-text-muted)] hover:text-[var(--obs-text-main)] disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-[var(--obs-text-muted)]">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded border border-[var(--obs-border)] text-[var(--obs-text-muted)] hover:text-[var(--obs-text-main)] disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
