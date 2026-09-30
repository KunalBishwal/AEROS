"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, ShieldAlert, Database, Clock, Compass, BarChart3, Layers, Sliders, FileText, Table } from "lucide-react";
import { api, CurrentTelemetry } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/", label: "OBSERVATORY", icon: Compass },
  { href: "/patterns", label: "PATTERNS", icon: Clock },
  { href: "/compare", label: "COMPARISON", icon: BarChart3 },
  { href: "/exceedance", label: "EXCEEDANCE", icon: Sliders },
  { href: "/clustering", label: "CLUSTERING ML", icon: Layers },
  { href: "/story", label: "COMMISSIONER BRIEF", icon: FileText },
  { href: "/explorer", label: "RAW EXPLORER", icon: Table },
];

export default function Header() {
  const pathname = usePathname();
  const [telemetry, setTelemetry] = useState<CurrentTelemetry | null>(null);
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    // Clock
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toUTCString().replace("GMT", "UTC"));
    }, 1000);

    // Initial telemetry fetch
    api.getCurrentTelemetry()
      .then(setTelemetry)
      .catch((err) => console.warn("Header telemetry fetch error:", err));

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-[var(--obs-border)] bg-[var(--obs-surface)] sticky top-0 z-50 backdrop-blur-md">
      {/* Upper Telemetry Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 border-b border-[var(--obs-border)] flex flex-wrap items-center justify-between text-xs font-mono text-[var(--obs-text-muted)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--obs-text-main)] font-semibold tracking-wider">CPCB CAAQMS OBSERVATORY</span>
          </div>
          <span className="hidden sm:inline text-[var(--obs-border-light)]">|</span>
          <span className="hidden sm:inline">COORD: 28°38'N 77°13'E</span>
          <span className="hidden md:inline text-[var(--obs-border-light)]">|</span>
          <span className="hidden md:inline">SYSTEM TIME: {timeStr || "CALIBRATING..."}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live / Demo Mode Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-[var(--obs-border-light)] bg-[var(--obs-bg)]">
            <Radio className={`w-3 h-3 ${telemetry?.mode === "LIVE" ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
            <span className="font-semibold text-[11px] uppercase tracking-wider">
              {telemetry ? `${telemetry.mode} DATA` : "INITIALIZING..."}
            </span>
            <span className="text-[10px] text-[var(--obs-text-muted)] hidden lg:inline">
              ({telemetry?.data_source || "CPCB Benchmark"})
            </span>
          </div>

          {/* Severe Stations Indicator */}
          {telemetry && telemetry.severe_stations_count > 0 && (
            <div className="flex items-center gap-1 text-red-400 font-semibold px-2 py-0.5 rounded border border-red-900/60 bg-red-950/40 animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              <span>{telemetry.severe_stations_count} SEVERE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto scrollbar-none">
        <div className="flex items-center py-2.5 pr-6 border-r border-[var(--obs-border)]">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-editorial text-lg font-bold tracking-tight text-[var(--obs-text-main)]">
              AEROS<span className="text-[var(--obs-accent)] font-mono text-sm ml-0.5">.INTELLIGENCE</span>
            </span>
          </Link>
        </div>

        <nav className="flex items-center space-x-1 py-1 font-mono text-xs">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--obs-surface-hover)] text-[var(--obs-accent)] border-b-2 border-[var(--obs-accent)] font-semibold"
                    : "text-[var(--obs-text-muted)] hover:text-[var(--obs-text-main)] hover:bg-[var(--obs-surface-hover)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
