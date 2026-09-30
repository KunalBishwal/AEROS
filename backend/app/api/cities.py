from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from ..firebase.repository import get_repository

router = APIRouter(prefix="/cities", tags=["Cities & Comparison"])


@router.get("")
def list_cities():
    repo = get_repository()
    stations = repo.get_stations()
    cities_map = {}
    for s in stations:
        if s.city not in cities_map:
            cities_map[s.city] = {
                "name": s.city,
                "state": s.state,
                "station_count": 0,
                "latitudes": [],
                "longitudes": [],
                "aqis": []
            }
        cities_map[s.city]["station_count"] += 1
        cities_map[s.city]["latitudes"].append(s.latitude)
        cities_map[s.city]["longitudes"].append(s.longitude)
        if s.latest_aqi:
            cities_map[s.city]["aqis"].append(s.latest_aqi)

    results = []
    for city, data in sorted(cities_map.items()):
        avg_aqi = int(round(np.mean(data["aqis"]))) if data["aqis"] else None
        results.append({
            "name": city,
            "state": data["state"],
            "station_count": data["station_count"],
            "latitude": round(float(np.mean(data["latitudes"])), 4),
            "longitude": round(float(np.mean(data["longitudes"])), 4),
            "latest_average_aqi": avg_aqi
        })
    return results


@router.get("/compare")
def compare_cities(
    cities: str = Query("Delhi,Mumbai,Bengaluru", description="Comma-separated city names")
):
    repo = get_repository()
    city_list = [c.strip() for c in cities.split(",") if c.strip()]
    
    comparisons = []
    daily_records = repo.get_daily_aqi()
    df = pd.DataFrame(daily_records) if daily_records else pd.DataFrame()

    for c in city_list:
        c_stations = repo.get_stations(city=c)
        c_df = df[df["city"].str.lower() == c.lower()] if not df.empty and "city" in df else pd.DataFrame()

        if c_df.empty:
            continue

        # Compute multi-pollutant averages
        pm25_list, pm10_list, no2_list, so2_list, co_list, o3_list = [], [], [], [], [], []
        for _, row in c_df.iterrows():
            concs = row.get("concentrations", {})
            if concs.get("PM2.5") is not None: pm25_list.append(concs["PM2.5"])
            if concs.get("PM10") is not None: pm10_list.append(concs["PM10"])
            if concs.get("NO2") is not None: no2_list.append(concs["NO2"])
            if concs.get("SO2") is not None: so2_list.append(concs["SO2"])
            if concs.get("CO") is not None: co_list.append(concs["CO"])
            if concs.get("O3") is not None: o3_list.append(concs["O3"])

        mean_aqi = round(float(c_df["aqi"].mean()), 1)
        max_aqi = int(c_df["aqi"].max())
        exceedance_days = int((c_df["aqi"] > 200).sum())
        total_days = len(c_df)
        exceedance_pct = round(exceedance_days / total_days * 100, 1) if total_days > 0 else 0.0

        comparisons.append({
            "city": c,
            "station_count": len(c_stations),
            "total_monitored_days": total_days,
            "mean_aqi": mean_aqi,
            "max_aqi": max_aqi,
            "mean_pm25": round(float(np.mean(pm25_list)), 1) if pm25_list else 0.0,
            "mean_pm10": round(float(np.mean(pm10_list)), 1) if pm10_list else 0.0,
            "mean_no2": round(float(np.mean(no2_list)), 1) if no2_list else 0.0,
            "mean_so2": round(float(np.mean(so2_list)), 1) if so2_list else 0.0,
            "mean_co": round(float(np.mean(co_list)), 2) if co_list else 0.0,
            "mean_o3": round(float(np.mean(o3_list)), 1) if o3_list else 0.0,
            "exceedance_days": exceedance_days,
            "exceedance_pct": exceedance_pct,
            "dominant_pollutant": c_df["dominant_pollutant"].mode()[0] if not c_df["dominant_pollutant"].empty else "PM2.5"
        })

    return {
        "compared_cities": city_list,
        "profiles": comparisons
    }
