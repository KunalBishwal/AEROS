"use client";

import React from "react";
import ReactECharts from "echarts-for-react";

interface PCAPoint {
  station_id: string;
  station_name: string;
  city: string;
  cluster_id: number;
  cluster_name: string;
  pc1: number;
  pc2: number;
  aqi: number;
  dominant_pollutant: string;
}

interface ClusterProfile {
  cluster_id: number;
  name: string;
  size: number;
  description: string;
  centroid: Record<string, number>;
  stations: string[];
}

interface PCAClusterScatterProps {
  points: PCAPoint[];
  profiles: ClusterProfile[];
  explainedVariance: number[];
  onSelectStation?: (stationId: string) => void;
}

const CLUSTER_COLORS = ["#38bdf8", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"];

export default function PCAClusterScatter({
  points,
  profiles,
  explainedVariance,
  onSelectStation
}: PCAClusterScatterProps) {
  // Group points by cluster_id
  const series = profiles.map((p, idx) => {
    const clusterPoints = points
      .filter((pt) => pt.cluster_id === p.cluster_id)
      .map((pt) => [pt.pc1, pt.pc2, pt.station_name, pt.city, pt.aqi, pt.dominant_pollutant, pt.station_id]);

    return {
      name: p.name,
      type: "scatter",
      data: clusterPoints,
      symbolSize: (dataItem: any) => {
        // Size proportional to AQI magnitude: 12px to 26px
        const aqi = dataItem[4] || 100;
        return Math.max(12, Math.min(26, 10 + (aqi / 500) * 16));
      },
      itemStyle: {
        color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
        borderColor: "#ffffff",
        borderWidth: 1.5,
        shadowBlur: 8,
        shadowColor: `${CLUSTER_COLORS[idx % CLUSTER_COLORS.length]}80`
      }
    };
  });

  const pc1Pct = Math.round((explainedVariance[0] || 0.5) * 100);
  const pc2Pct = Math.round((explainedVariance[1] || 0.25) * 100);

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: "#11171d",
      borderColor: "#283745",
      textStyle: {
        color: "#f0f4f8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12
      },
      formatter: (params: any) => {
        const item = params.data;
        return `
          <div style="padding: 4px 6px;">
            <strong style="color: #f0f4f8; font-size: 13px;">${item[2]}</strong>
            <div style="font-size: 11px; color: #8596a6; margin-bottom: 4px;">${item[3]} • Cluster: ${params.seriesName}</div>
            <div style="display: flex; gap: 12px; margin-top: 4px;">
              <span>Mean AQI: <strong>${item[4]}</strong></span>
              <span>Dominant: <strong style="color: #38bdf8;">${item[5]}</strong></span>
            </div>
            <div style="font-size: 10px; color: #526372; margin-top: 4px;">
              PCA Coordinates: [${item[0]}, ${item[1]}]
            </div>
          </div>
        `;
      }
    },
    legend: {
      orient: "horizontal",
      top: 0,
      textStyle: {
        color: "#8596a6",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10
      }
    },
    grid: {
      top: 40,
      bottom: 30,
      left: 48,
      right: 20,
      containLabel: true
    },
    xAxis: {
      type: "value",
      name: `PC 1 (${pc1Pct}% variance)`,
      nameLocation: "middle",
      nameGap: 24,
      nameTextStyle: { color: "#8596a6", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 },
      splitLine: { lineStyle: { color: "#161e26" } },
      axisLine: { lineStyle: { color: "#1e2a35" } },
      axisLabel: { color: "#8596a6", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }
    },
    yAxis: {
      type: "value",
      name: `PC 2 (${pc2Pct}% variance)`,
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: { color: "#8596a6", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 },
      splitLine: { lineStyle: { color: "#161e26" } },
      axisLine: { lineStyle: { color: "#1e2a35" } },
      axisLabel: { color: "#8596a6", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }
    },
    series: series
  };

  const onChartClick = (e: any) => {
    if (e.data && e.data[6] && onSelectStation) {
      onSelectStation(e.data[6]);
    }
  };

  return (
    <div className="w-full h-[380px]">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
        onEvents={{ click: onChartClick }}
      />
    </div>
  );
}
