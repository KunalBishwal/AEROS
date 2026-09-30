"""
Machine Learning Clustering & Dimensionality Reduction Module.
Applies StandardScaler, KMeans (k=2..5), silhouette_score, and 2D PCA projection for visualization.
Assigns purely data-grounded profile labels derived from feature centroids.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score

from ..firebase.repository import get_repository
from ..models.analytics import ClusterResponse, ClusterProfile, PCAPoint




def compute_station_clusters(k: int = 3) -> ClusterResponse:
    k = max(2, min(5, k))
    repo = get_repository()
    stations = repo.get_stations()
    daily_records = repo.get_daily_aqi()

    if not stations or not daily_records:
        return ClusterResponse(k=k, silhouette_score=0.0, explained_variance=[0.0, 0.0], profiles=[], points=[])

    df = pd.DataFrame(daily_records)
    
    # Build 7-dimensional feature vectors per station
    # mean_PM25, mean_PM10, mean_NO2, mean_SO2, mean_CO, mean_O3, mean_AQI
    station_features = []
    station_meta = []

    for st in stations:
        st_df = df[df["station_id"] == st.station_id]
        if st_df.empty:
            continue

        # Extract concentrations
        pm25_vals, pm10_vals, no2_vals, so2_vals, co_vals, o3_vals = [], [], [], [], [], []
        for _, row in st_df.iterrows():
            c = row.get("concentrations", {})
            if c.get("PM2.5") is not None: pm25_vals.append(c["PM2.5"])
            if c.get("PM10") is not None: pm10_vals.append(c["PM10"])
            if c.get("NO2") is not None: no2_vals.append(c["NO2"])
            if c.get("SO2") is not None: so2_vals.append(c["SO2"])
            if c.get("CO") is not None: co_vals.append(c["CO"])
            if c.get("O3") is not None: o3_vals.append(c["O3"])

        mean_pm25 = float(np.mean(pm25_vals)) if pm25_vals else 50.0
        mean_pm10 = float(np.mean(pm10_vals)) if pm10_vals else 100.0
        mean_no2 = float(np.mean(no2_vals)) if no2_vals else 40.0
        mean_so2 = float(np.mean(so2_vals)) if so2_vals else 15.0
        mean_co = float(np.mean(co_vals)) if co_vals else 1.2
        mean_o3 = float(np.mean(o3_vals)) if o3_vals else 35.0
        mean_aqi = float(st_df["aqi"].dropna().mean()) if not st_df["aqi"].dropna().empty else 100.0

        dom_pol = st_df["dominant_pollutant"].mode()[0] if not st_df["dominant_pollutant"].empty else "PM2.5"

        station_features.append([
            mean_pm25, mean_pm10, mean_no2, mean_so2, mean_co, mean_o3, mean_aqi
        ])
        station_meta.append({
            "station_id": st.station_id,
            "name": st.name,
            "city": st.city,
            "aqi": round(mean_aqi, 1),
            "dominant_pollutant": dom_pol
        })

    if len(station_features) < k:
        return ClusterResponse(k=k, silhouette_score=0.0, explained_variance=[0.0, 0.0], profiles=[], points=[])

    X = np.array(station_features)

    # 1. StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 2. KMeans on full standardized feature space
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    # 3. Silhouette score
    sil_score = round(float(silhouette_score(X_scaled, labels)), 3)

    # 4. PCA strictly for 2D visualization
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    exp_var = [round(float(v), 3) for v in pca.explained_variance_ratio_]

    # 5. Extract Cluster Profiles & Grounded Labels
    feature_names = ["mean_PM25", "mean_PM10", "mean_NO2", "mean_SO2", "mean_CO", "mean_O3", "mean_AQI"]
    profiles: List[ClusterProfile] = []

    for cid in range(k):
        cluster_indices = [i for i, l in enumerate(labels) if l == cid]
        cluster_X = X[cluster_indices]
        centroid_vals = np.mean(cluster_X, axis=0)
        centroid_dict = {feature_names[j]: round(float(centroid_vals[j]), 2) for j in range(len(feature_names))}

        c_stations = [station_meta[i]["name"] for i in cluster_indices]

        # Grounded naming logic based on centroid characteristics
        c_pm25 = centroid_dict["mean_PM25"]
        c_no2 = centroid_dict["mean_NO2"]
        c_aqi = centroid_dict["mean_AQI"]

        if c_aqi >= 220 or c_pm25 >= 110:
            name = "High Particulate & Elevated AQI Profile"
            desc = f"Characterized by elevated particulate concentrations (mean PM2.5: {c_pm25} µg/m³) and higher average AQI ({c_aqi})."
        elif c_no2 >= 55 and c_aqi < 200:
            name = "Elevated NO2 Combustion Corridor Profile"
            desc = f"Distinctive nitrogen dioxide presence (mean NO2: {c_no2} µg/m³) accompanied by moderate particulate levels."
        elif c_aqi <= 90:
            name = "Low-Exposure Baseline Profile"
            desc = f"Maintains comparatively lower average sub-indices across all monitored parameters (mean AQI: {c_aqi})."
        else:
            name = "Mixed-Pollutant Intermediate Profile"
            desc = f"Balanced multi-pollutant distribution across particulates and oxides (mean AQI: {c_aqi}, PM2.5: {c_pm25} µg/m³)."

        profiles.append(ClusterProfile(
            cluster_id=cid,
            name=name,
            size=len(cluster_indices),
            description=desc,
            centroid=centroid_dict,
            stations=c_stations
        ))

    # 6. Map Points for 2D PCA Scatter
    points: List[PCAPoint] = []
    for i, meta in enumerate(station_meta):
        cid = int(labels[i])
        p_name = profiles[cid].name
        points.append(PCAPoint(
            station_id=meta["station_id"],
            station_name=meta["name"],
            city=meta["city"],
            cluster_id=cid,
            cluster_name=p_name,
            pc1=round(float(X_pca[i, 0]), 2),
            pc2=round(float(X_pca[i, 1]), 2),
            aqi=meta["aqi"],
            dominant_pollutant=meta["dominant_pollutant"]
        ))

    return ClusterResponse(
        k=k,
        silhouette_score=sil_score,
        explained_variance=exp_var,
        profiles=profiles,
        points=points
    )
