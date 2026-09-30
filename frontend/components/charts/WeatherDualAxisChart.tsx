"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { CloudRain } from "lucide-react";

interface WeatherPoint {
  time: string;
  temperature_c: number | null;
  relative_humidity_pct: number | null;
  wind_speed_kmh: number | null;
}

interface WeatherDualAxisChartProps {
  weatherData: WeatherPoint[];
  pollutantData?: { time: string; value: number }[];
  pollutantName?: string;
  isAvailable?: boolean;
}

export default function WeatherDualAxisChart({
  weatherData,
  pollutantData = [],
  pollutantName = "PM2.5",
  isAvailable = true
}: WeatherDualAxisChartProps) {
  if (!isAvailable || weatherData.length === 0) {
    return (
      <div className="w-full h-[280px] flex flex-col items-center justify-center font-mono text-xs text-[var(--obs-text-muted)] border border-dashed border-[var(--obs-border)] p-6 text-center">
        <CloudRain className="w-8 h-8 text-[var(--obs-text-faint)] mb-2" />
        <span className="font-semibold text-[var(--obs-text-main)]">METEOROLOGICAL INTEGRATION OFFLINE</span>
        <span className="text-[11px] text-[var(--obs-text-faint)] max-w-md mt-1">
          Ambient temperature, humidity, and wind speed telemetry from Open-Meteo is currently unreachable.
          Core air quality calculations remain fully operational.
        </span>
      </div>
    );
  }

  const times = weatherData.map((d) => d.time.split("T")[1] || d.time);
  const temps = weatherData.map((d) => d.temperature_c);
  const winds = weatherData.map((d) => d.wind_speed_kmh);

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
      }
    },
    legend: {
      data: ["Temperature (°C)", "Wind Speed (km/h)"],
      textStyle: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11
      },
      top: 0
    },
    grid: {
      top: 40,
      bottom: 24,
      left: 48,
      right: 48,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: times,
      axisLine: { lineStyle: { color: "#1e2a35" } },
      axisLabel: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10
      },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: "value",
        name: "Temp (°C)",
        position: "left",
        nameTextStyle: { color: "#f97316", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 },
        splitLine: { lineStyle: { color: "#161e26" } },
        axisLine: { show: false },
        axisLabel: { color: "#f97316", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }
      },
      {
        type: "value",
        name: "Wind (km/h)",
        position: "right",
        nameTextStyle: { color: "#38bdf8", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 },
        splitLine: { show: false },
        axisLine: { show: false },
        axisLabel: { color: "#38bdf8", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }
      }
    ],
    series: [
      {
        name: "Temperature (°C)",
        type: "line",
        yAxisIndex: 0,
        data: temps,
        smooth: true,
        lineStyle: { color: "#f97316", width: 2 },
        itemStyle: { color: "#f97316" }
      },
      {
        name: "Wind Speed (km/h)",
        type: "bar",
        yAxisIndex: 1,
        data: winds,
        itemStyle: { color: "rgba(56, 189, 248, 0.45)", borderRadius: [2, 2, 0, 0] }
      }
    ]
  };

  return (
    <div className="w-full h-[280px]">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
      <div className="text-[10px] font-mono text-[var(--obs-text-faint)] mt-1 italic text-right">
        * Source: Open-Meteo ambient telemetry. Evaluates atmospheric dispersion; does not assert causal linkage.
      </div>
    </div>
  );
}
