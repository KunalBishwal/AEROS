"use client";

import React from "react";
import ReactECharts from "echarts-for-react";

interface CityProfile {
  city: string;
  station_count: number;
  mean_aqi: number;
  max_aqi: number;
  mean_pm25: number;
  mean_pm10: number;
  mean_no2: number;
  mean_so2: number;
  mean_co: number;
  mean_o3: number;
  exceedance_days: number;
  exceedance_pct: number;
  dominant_pollutant: string;
}

interface CityComparisonBarProps {
  profiles: CityProfile[];
  metric: "mean_aqi" | "mean_pm25" | "mean_pm10" | "mean_no2" | "exceedance_days";
}

const METRIC_LABELS: Record<string, { label: string; unit: string; color: string }> = {
  mean_aqi: { label: "Average AQI Sub-Index", unit: "AQI", color: "#38bdf8" },
  mean_pm25: { label: "Mean PM2.5 Concentration", unit: "µg/m³", color: "#f97316" },
  mean_pm10: { label: "Mean PM10 Concentration", unit: "µg/m³", color: "#eab308" },
  mean_no2: { label: "Mean NO2 Concentration", unit: "µg/m³", color: "#10b981" },
  exceedance_days: { label: "Days Exceeding CPCB Poor Threshold (>200)", unit: "days", color: "#ef4444" }
};

export default function CityComparisonBar({ profiles, metric }: CityComparisonBarProps) {
  const meta = METRIC_LABELS[metric] || METRIC_LABELS.mean_aqi;
  const cities = profiles.map((p) => p.city);
  const values = profiles.map((p) => p[metric]);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "#11171d",
      borderColor: "#283745",
      textStyle: {
        color: "#f0f4f8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12
      },
      formatter: (params: any) => {
        const item = params[0];
        const p = profiles.find((prof) => prof.city === item.name);
        return `
          <div style="padding: 4px 6px;">
            <strong style="color: #f0f4f8;">${item.name}</strong>
            <div style="color: ${meta.color}; font-size: 14px; font-weight: bold; margin: 4px 0;">
              ${item.value} ${meta.unit}
            </div>
            <div style="font-size: 11px; color: #8596a6;">
              Dominant Driver: <strong>${p?.dominant_pollutant || "PM2.5"}</strong><br/>
              Max AQI: <strong>${p?.max_aqi}</strong> | Active Monitors: <strong>${p?.station_count}</strong>
            </div>
          </div>
        `;
      }
    },
    grid: {
      top: 24,
      bottom: 24,
      left: 48,
      right: 20,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: cities,
      axisLine: { lineStyle: { color: "#1e2a35" } },
      axisLabel: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11
      },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      name: meta.unit,
      nameTextStyle: { color: "#8596a6", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 },
      splitLine: { lineStyle: { color: "#161e26" } },
      axisLine: { show: false },
      axisLabel: { color: "#8596a6", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }
    },
    series: [
      {
        name: meta.label,
        type: "bar",
        data: values,
        itemStyle: {
          color: meta.color,
          borderRadius: [3, 3, 0, 0]
        },
        label: {
          show: true,
          position: "top",
          color: "#8596a6",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10
        }
      }
    ]
  };

  return (
    <div className="w-full h-[300px]">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
