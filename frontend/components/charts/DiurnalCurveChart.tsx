"use client";

import React from "react";
import ReactECharts from "echarts-for-react";

interface DiurnalPoint {
  hour: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
  count: number;
}

interface DiurnalCurveChartProps {
  pollutant: string;
  unit: string;
  weekdays: DiurnalPoint[];
  weekends: DiurnalPoint[];
  overall?: DiurnalPoint[];
}

export default function DiurnalCurveChart({
  pollutant,
  unit,
  weekdays,
  weekends,
  overall
}: DiurnalCurveChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

  const weekdayMeans = weekdays.map((p) => p.mean);
  const weekendMeans = weekends.map((p) => p.mean);
  const overallMeans = (overall || []).map((p) => p.mean);

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
        const h = params[0]?.axisValue;
        let html = `<div style="font-size: 11px; color: #8596a6; margin-bottom: 4px;">Hour: <strong>${h}</strong></div>`;
        for (const p of params) {
          html += `
            <div style="display: flex; justify-content: space-between; gap: 16px; margin: 2px 0;">
              <span style="color: ${p.color};">${p.seriesName}:</span>
              <span style="font-weight: bold; font-family: monospace;">${p.value} ${unit}</span>
            </div>
          `;
        }
        return html;
      }
    },
    legend: {
      data: ["Weekdays (Mon-Fri)", "Weekends (Sat-Sun)", "Full Cycle Average"],
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
      right: 20,
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: hours,
      axisLine: { lineStyle: { color: "#1e2a35" } },
      axisLabel: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10
      },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      name: `${pollutant} (${unit})`,
      nameTextStyle: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        align: "right"
      },
      splitLine: { lineStyle: { color: "#161e26" } },
      axisLine: { show: false },
      axisLabel: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10
      }
    },
    series: [
      {
        name: "Weekdays (Mon-Fri)",
        type: "line",
        data: weekdayMeans,
        smooth: true,
        lineStyle: { color: "#38bdf8", width: 2.5 },
        itemStyle: { color: "#38bdf8" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(56, 189, 248, 0.22)" },
              { offset: 1, color: "rgba(56, 189, 248, 0.0)" }
            ]
          }
        }
      },
      {
        name: "Weekends (Sat-Sun)",
        type: "line",
        data: weekendMeans,
        smooth: true,
        lineStyle: { color: "#f59e0b", width: 2.5, type: "dashed" },
        itemStyle: { color: "#f59e0b" }
      },
      ...(overall && overall.length === 24
        ? [
            {
              name: "Full Cycle Average",
              type: "line",
              data: overallMeans,
              smooth: true,
              lineStyle: { color: "#64748b", width: 1.5 },
              itemStyle: { color: "#64748b" }
            }
          ]
        : [])
    ]
  };

  return (
    <div className="w-full h-[320px]">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
