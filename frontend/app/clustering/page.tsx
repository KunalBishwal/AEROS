"use client";

import React, { useEffect, useState } from "react";
import { api, ClusterResponse } from "@/lib/api";
import PCAClusterScatter from "@/components/charts/PCAClusterScatter";
import { Layers, Activity, Sparkles, CheckCircle, Info } from "lucide-react";

export default function ClusteringPage() {
  const [k, setK] = useState<number>(3);
  const [clusterData, setClusterData] = useState<ClusterResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.getClusters(k)
      .then(setClusterData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [k]);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--obs-border)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--obs-accent)] mb-1 uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            <span>UNSUPERVISED MACHINE LEARNING & DIMENSIONALITY REDUCTION</span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl font-extrabold text-[var(--obs-text-main)] tracking-tight">
            Atmospheric Profiling via K-Means & PCA
          </h1>
          <p className="text-xs text-[var(--obs-text-muted)] mt-1 max-w-2xl font-mono">
            Unsupervised discovery of multi-pollutant signatures across monitoring stations.
            Standardized in 7-dimensional space (PM2.5, PM10, NO2, SO2, CO, O3, AQI) and projected via 2-Component PCA for spatial scatter.
          </p>
        </div>

        {/* K Selector Slider / Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[var(--obs-text-muted)]">CLUSTERS (K):</span>
          <div className="flex gap-1">
            {[2, 3, 4, 5].map((kVal) => (
              <button
                key={kVal}
                onClick={() => setK(kVal)}
                className={`w-8 h-8 rounded border font-mono text-xs font-bold transition-all ${
                  k === kVal
                    ? "bg-[var(--obs-accent)] text-black border-[var(--obs-accent)]"
                    : "bg-[var(--obs-surface)] text-[var(--obs-text-muted)] border-[var(--obs-border)] hover:border-[var(--obs-border-light)]"
                }`}
              >
                {kVal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Diagnostic Metrics Strip */}
      {clusterData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="obs-panel p-4 border-l-4 border-l-[var(--obs-accent)]">
            <div className="text-[11px] font-mono text-[var(--obs-text-muted)] uppercase tracking-wider">
              Silhouette Separation Score
            </div>
            <div className="text-3xl font-mono font-black text-[var(--obs-text-main)] my-1">
              {clusterData.silhouette_score}
            </div>
            <div className="text-[11px] font-mono text-[var(--obs-text-muted)]">
              {clusterData.silhouette_score > 0.45 ? "Strong cluster density and distinct boundary separation." : "Moderate multi-pollutant gradient overlap."}
            </div>
          </div>

          <div className="obs-panel p-4 border-l-4 border-l-emerald-500">
            <div className="text-[11px] font-mono text-[var(--obs-text-muted)] uppercase tracking-wider">
              PCA Explained Variance Ratio
            </div>
            <div className="text-3xl font-mono font-black text-emerald-400 my-1">
              {Math.round(((clusterData.explained_variance[0] || 0) + (clusterData.explained_variance[1] || 0)) * 100)}%
            </div>
            <div className="text-[11px] font-mono text-[var(--obs-text-muted)]">
              PC1: {Math.round((clusterData.explained_variance[0] || 0) * 100)}% • PC2: {Math.round((clusterData.explained_variance[1] || 0) * 100)}% of total multi-feature variance.
            </div>
          </div>

          <div className="obs-panel p-4 border-l-4 border-l-amber-500">
            <div className="text-[11px] font-mono text-[var(--obs-text-muted)] uppercase tracking-wider">
              Feature Vector Normalization
            </div>
            <div className="text-3xl font-mono font-black text-amber-400 my-1">
              7 FEATURES
            </div>
            <div className="text-[11px] font-mono text-[var(--obs-text-muted)]">
              Standardized with StandardScaler prior to Euclidean distance optimization.
            </div>
          </div>
        </div>
      )}

      {/* 2D PCA Scatter Visualization */}
      <div className="obs-panel reticle-corner p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--obs-border)] pb-3 gap-2">
          <div>
            <h2 className="font-editorial text-lg font-bold text-[var(--obs-text-main)]">
              2D Principal Component Feature Projection (K={k})
            </h2>
            <div className="text-xs font-mono text-[var(--obs-text-muted)]">
              Monitoring stations projected onto orthogonal principal axes with cluster color segregation.
            </div>
          </div>
          <span className="font-mono text-xs text-[var(--obs-accent)] bg-[var(--obs-surface-hover)] border border-[var(--obs-border)] px-2.5 py-0.5 rounded">
            {clusterData?.points.length || 20} Stations Clustered
          </span>
        </div>

        {clusterData && (
          <PCAClusterScatter
            points={clusterData.points}
            profiles={clusterData.profiles}
            explainedVariance={clusterData.explained_variance}
          />
        )}
      </div>

      {/* Data-Grounded Cluster Profile Breakdown Cards */}
      {clusterData && (
        <div className="space-y-4">
          <div className="border-b border-[var(--obs-border)] pb-2">
            <h3 className="font-editorial text-base font-bold text-[var(--obs-text-main)]">
              Empirical Cluster Profiles & Feature Centroids
            </h3>
            <p className="text-xs font-mono text-[var(--obs-text-muted)] mt-0.5">
              Grounded descriptions generated purely from mathematical feature averages, without unsubstantiated causal assumptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusterData.profiles.map((profile: any) => (
              <div key={profile.cluster_id} className="obs-panel p-5 space-y-3">
                <div className="flex justify-between items-start border-b border-[var(--obs-border)] pb-2">
                  <div>
                    <span className="font-mono text-xs text-[var(--obs-accent)] font-bold">
                      CLUSTER #{profile.cluster_id + 1}
                    </span>
                    <h4 className="font-editorial text-base font-bold text-[var(--obs-text-main)]">
                      {profile.name}
                    </h4>
                  </div>
                  <span className="font-mono text-xs bg-[var(--obs-surface-hover)] border border-[var(--obs-border)] px-2 py-0.5 rounded text-[var(--obs-text-muted)]">
                    {profile.size} Stations
                  </span>
                </div>

                <p className="text-xs font-mono text-[var(--obs-text-muted)] leading-relaxed">
                  {profile.description}
                </p>

                {/* Centroid Values Mini Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] font-mono border-t border-[var(--obs-border)]/60">
                  <div className="p-1.5 bg-[var(--obs-bg)] rounded border border-[var(--obs-border)]">
                    <span className="text-[var(--obs-text-faint)] block text-[9px]">Mean AQI</span>
                    <strong className="text-[var(--obs-accent)]">{profile.centroid["mean_AQI"]}</strong>
                  </div>
                  <div className="p-1.5 bg-[var(--obs-bg)] rounded border border-[var(--obs-border)]">
                    <span className="text-[var(--obs-text-faint)] block text-[9px]">PM2.5</span>
                    <strong className="text-amber-400">{profile.centroid["mean_PM25"]}</strong>
                  </div>
                  <div className="p-1.5 bg-[var(--obs-bg)] rounded border border-[var(--obs-border)]">
                    <span className="text-[var(--obs-text-faint)] block text-[9px]">PM10</span>
                    <strong className="text-[var(--obs-text-main)]">{profile.centroid["mean_PM10"]}</strong>
                  </div>
                  <div className="p-1.5 bg-[var(--obs-bg)] rounded border border-[var(--obs-border)]">
                    <span className="text-[var(--obs-text-faint)] block text-[9px]">NO2</span>
                    <strong className="text-emerald-400">{profile.centroid["mean_NO2"]}</strong>
                  </div>
                </div>

                {/* Associated Stations List */}
                <div className="text-[11px] font-mono text-[var(--obs-text-muted)] pt-1">
                  <span className="text-[var(--obs-text-faint)]">Representative Stations:</span>{" "}
                  {profile.stations.slice(0, 4).join(", ")}
                  {profile.stations.length > 4 ? ` (+${profile.stations.length - 4} more)` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
