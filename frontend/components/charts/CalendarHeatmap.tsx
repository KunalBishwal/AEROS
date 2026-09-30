"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { CalendarDay } from "@/lib/api";
import { getAQICategory } from "@/lib/aqi-constants";

interface CalendarHeatmapProps {
  days: CalendarDay[];
  year: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarHeatmap({ days, year }: CalendarHeatmapProps) {
  // Transform days into matrix coordinates: [day_index (0..30), month_index (0..11), aqi, date, dominant_pol]
  const { seriesData, maxAqi } = useMemo(() => {
    let maxVal = 300;
    const data: any[] = [];

    // Initialize all 12 x 31 slots
    const dayMap = new Map<string, CalendarDay>();
    for (const d of days) {
      dayMap.set(`${d.month}-${d.day}`, d);
      if (d.aqi && d.aqi > maxVal) maxVal = d.aqi;
    }

    for (let m = 1; m <= 12; m++) {
      // Days in month m
      const daysInMonth = new Date(year, m, 0).getDate();
      for (let day = 1; day <= 31; day++) {
        if (day <= daysInMonth) {
          const entry = dayMap.get(`${m}-${day}`);
          if (entry && entry.aqi !== null && entry.aqi !== undefined) {
            data.push([
              day - 1,
              12 - m, // Invert Y-axis so January is at the top
              entry.aqi,
              entry.date,
              entry.category,
              entry.dominant_pollutant,
              m
            ]);
          } else {
            // Explicit missing observation (rendered with missing color, not 0)
            data.push([
              day - 1,
              12 - m,
              "-",
              `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
              "No Data",
              "None",
              m
            ]);
          }
        }
      }
    }

    return { seriesData: data, maxAqi: Math.min(500, maxVal) };
  }, [days, year]);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      position: "top",
      backgroundColor: "#11171d",
      borderColor: "#283745",
      textStyle: {
        color: "#f0f4f8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12
      },
      formatter: (params: any) => {
        const item = params.data;
        const aqiVal = item[2];
        const dateStr = item[3];
        const catName = item[4];
        const domPol = item[5];
        const cat = getAQICategory(typeof aqiVal === "number" ? aqiVal : null);

        if (aqiVal === "-") {
          return `
            <div style="padding: 4px 6px;">
              <strong style="color: #8596a6;">${dateStr}</strong><br/>
              <span style="color: #71717a;">Observation: Missing / Not Recorded</span>
            </div>
          `;
        }

        return `
          <div style="padding: 6px 8px; min-width: 160px;">
            <div style="color: #8596a6; font-size: 11px; margin-bottom: 4px;">${dateStr}</div>
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 16px; font-weight: bold; color: ${cat.color};">AQI ${aqiVal}</span>
              <span style="font-size: 11px; font-weight: 600; color: ${cat.color};">${catName}</span>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: #a0aec0;">
              Dominant: <strong style="color: #f0f4f8;">${domPol}</strong>
            </div>
          </div>
        `;
      }
    },
    grid: {
      top: 24,
      bottom: 24,
      left: 80,
      right: 20,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: Array.from({ length: 31 }, (_, i) => `${i + 1}`),
      splitArea: { show: false },
      axisLine: { lineStyle: { color: "#1e2a35" } },
      axisLabel: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10
      },
      axisTick: { show: false }
    },
    yAxis: {
      type: "category",
      data: [...MONTH_NAMES].reverse(), // Inverted for Jan at top
      splitArea: { show: false },
      axisLine: { lineStyle: { color: "#1e2a35" } },
      axisLabel: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11
      },
      axisTick: { show: false }
    },
    visualMap: {
      type: "piecewise",
      min: 0,
      max: 500,
      calculable: false,
      orient: "horizontal",
      left: "center",
      bottom: -15,
      show: false, // We render our own persistent CPCB legend
      pieces: [
        { min: 0, max: 50, label: "Good", color: "#00B050" },
        { min: 51, max: 100, label: "Satisfactory", color: "#92D050" },
        { min: 101, max: 200, label: "Moderate", color: "#EAB308" },
        { min: 201, max: 300, label: "Poor", color: "#FF9900" },
        { min: 301, max: 400, label: "Very Poor", color: "#FF0000" },
        { min: 401, max: 500, label: "Severe", color: "#C00000" }
      ],
      outOfRange: {
        color: "#161e26" // For missing days
      }
    },
    series: [
      {
        name: "AQI",
        type: "heatmap",
        data: seriesData,
        label: { show: false },
        itemStyle: {
          borderWidth: 1.5,
          borderColor: "#090d10",
          borderRadius: 2
        }
      }
    ]
  };

  return (
    <div className="w-full">
      <div className="h-[360px] w-full">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>

      {/* Missing Data Note */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--obs-text-faint)] mt-2 pt-2 border-t border-[var(--obs-border)]">
        <span>Rows: Months 1–12 (Jan at top) • Columns: Calendar Days 1–31</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#161e26] border border-[#1e2a35] inline-block" />
          <span>Unrecorded / Off-calendar days</span>
        </div>
      </div>
    </div>
  );
}
