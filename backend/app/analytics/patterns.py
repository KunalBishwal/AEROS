"""
Temporal Patterns Analytics.
Calculates diurnal (hourly 0-23) weekday vs weekend profiles and seasonal/monthly distributions.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from ..firebase.repository import get_repository
from ..models.analytics import DiurnalPoint, DiurnalResponse, CalendarDay, CalendarResponse


def compute_diurnal_patterns(
    pollutant: str = "PM2.5",
    city: Optional[str] = None,
    station_id: Optional[str] = None
) -> DiurnalResponse:
    repo = get_repository()
    # Fetch sample hourly measurements
    # If station_id specified, filter by station, else filter by city if given
    col = repo.db.collection("measurements")
    docs = col.where("pollutant", "==", pollutant.upper()).stream()
    records = [d.to_dict() for d in docs if d.to_dict()]

    if not records:
        # Fallback empty profile
        empty_points = [DiurnalPoint(hour=h, mean=0.0, median=0.0, p25=0.0, p75=0.0, count=0) for h in range(24)]
        return DiurnalResponse(pollutant=pollutant, city=city, station_id=station_id, overall=empty_points, weekdays=empty_points, weekends=empty_points)

    df = pd.DataFrame(records)

    if station_id:
        df = df[df["station_id"] == station_id]
    elif city:
        df = df[df["city"].str.lower() == city.lower()]

    if df.empty:
        empty_points = [DiurnalPoint(hour=h, mean=0.0, median=0.0, p25=0.0, p75=0.0, count=0) for h in range(24)]
        return DiurnalResponse(pollutant=pollutant, city=city, station_id=station_id, overall=empty_points, weekdays=empty_points, weekends=empty_points)

    def extract_stats(subset_df: pd.DataFrame) -> List[DiurnalPoint]:
        points = []
        for h in range(24):
            h_df = subset_df[subset_df["hour"] == h]
            if not h_df.empty and "concentration" in h_df:
                vals = h_df["concentration"].dropna().values
                if len(vals) > 0:
                    points.append(DiurnalPoint(
                        hour=h,
                        mean=round(float(np.mean(vals)), 2),
                        median=round(float(np.median(vals)), 2),
                        p25=round(float(np.percentile(vals, 25)), 2),
                        p75=round(float(np.percentile(vals, 75)), 2),
                        count=int(len(vals))
                    ))
                    continue
            points.append(DiurnalPoint(hour=h, mean=0.0, median=0.0, p25=0.0, p75=0.0, count=0))
        return points

    overall_pts = extract_stats(df)
    wkday_df = df[df["is_weekend"] == False]
    wkend_df = df[df["is_weekend"] == True]

    wkday_pts = extract_stats(wkday_df)
    wkend_pts = extract_stats(wkend_df)

    return DiurnalResponse(
        pollutant=pollutant,
        city=city,
        station_id=station_id,
        overall=overall_pts,
        weekdays=wkday_pts,
        weekends=wkend_pts
    )


def compute_calendar_data(
    year: int = 2026,
    city: Optional[str] = None,
    station_id: Optional[str] = None
) -> CalendarResponse:
    repo = get_repository()
    daily_records = repo.get_daily_aqi(station_id=station_id, city=city, year=year)

    days_map: Dict[str, Dict[str, Any]] = {}
    for r in daily_records:
        d_str = r.get("date")
        if not d_str:
            continue
        if d_str not in days_map:
            days_map[d_str] = {
                "aqis": [],
                "dominant_pollutants": [],
                "categories": [],
                "colors": []
            }
        if r.get("aqi") is not None:
            days_map[d_str]["aqis"].append(r["aqi"])
            days_map[d_str]["dominant_pollutants"].append(r.get("dominant_pollutant", "PM2.5"))
            days_map[d_str]["categories"].append(r.get("aqi_category", "Moderate"))
            days_map[d_str]["colors"].append(r.get("color", "#EAB308"))

    from ..aqi.breakpoints import get_aqi_category_info
    calendar_days: List[CalendarDay] = []
    for d_str, data in sorted(days_map.items()):
        dt = pd.to_datetime(d_str)
        if data["aqis"]:
            avg_aqi = int(round(np.mean(data["aqis"])))
            cat_info = get_aqi_category_info(avg_aqi)
            # Most frequent dominant pollutant
            dom_pol = max(set(data["dominant_pollutants"]), key=data["dominant_pollutants"].count)
            calendar_days.append(CalendarDay(
                date=d_str,
                month=dt.month,
                day=dt.day,
                aqi=avg_aqi,
                category=cat_info["category"],
                color=cat_info["color"],
                dominant_pollutant=dom_pol
            ))
        else:
            calendar_days.append(CalendarDay(
                date=d_str,
                month=dt.month,
                day=dt.day,
                aqi=None,
                category=None,
                color=None,
                dominant_pollutant=None
            ))

    return CalendarResponse(year=year, city=city, station_id=station_id, days=calendar_days)


def compute_seasonal_summary(city: Optional[str] = None) -> Dict[str, Any]:
    repo = get_repository()
    records = repo.get_daily_aqi(city=city)
    if not records:
        return {"seasons": {}, "monthly": []}

    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month
    
    season_map = {
        12: "Winter", 1: "Winter", 2: "Winter",
        3: "Summer", 4: "Summer", 5: "Summer",
        6: "Monsoon", 7: "Monsoon", 8: "Monsoon", 9: "Monsoon",
        10: "Post-Monsoon", 11: "Post-Monsoon"
    }
    df["season"] = df["month"].map(season_map)

    # Monthly aggregates
    monthly_stats = []
    for m in range(1, 13):
        m_df = df[df["month"] == m]
        if not m_df.empty:
            mean_aqi = round(float(m_df["aqi"].mean()), 1)
            max_aqi = int(m_df["aqi"].max())
            dom_pol = m_df["dominant_pollutant"].mode()[0] if not m_df["dominant_pollutant"].empty else "PM2.5"
            monthly_stats.append({
                "month": m,
                "month_name": pd.to_datetime(f"2026-{m:02d}-01").strftime("%b"),
                "mean_aqi": mean_aqi,
                "max_aqi": max_aqi,
                "dominant_pollutant": dom_pol
            })

    # Seasonal aggregates
    seasonal_stats = {}
    for s_name in ["Winter", "Summer", "Monsoon", "Post-Monsoon"]:
        s_df = df[df["season"] == s_name]
        if not s_df.empty:
            seasonal_stats[s_name] = {
                "mean_aqi": round(float(s_df["aqi"].mean()), 1),
                "max_aqi": int(s_df["aqi"].max()),
                "exceedance_pct": round(float((s_df["aqi"] > 200).mean() * 100), 1),
                "sample_days": len(s_df)
            }

    return {
        "monthly": monthly_stats,
        "seasons": seasonal_stats
    }
