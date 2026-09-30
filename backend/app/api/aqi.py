from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from ..config import settings
from ..firebase.repository import get_repository
from ..analytics.patterns import compute_calendar_data
from ..models.analytics import CalendarResponse
from ..aqi.breakpoints import get_aqi_category_info

router = APIRouter(tags=["AQI & Current Telemetry"])


@router.get("/current")
def get_current_telemetry():
    repo = get_repository()
    # Check precomputed cache
    cached = repo.get_precomputed("current_summary")
    if not cached:
        stations = repo.get_stations()
        cities = sorted(list(set(s.city for s in stations)))
        severe = [s.model_dump(mode="json") for s in stations if s.latest_aqi and s.latest_aqi >= 401]
        valid_aqis = [s.latest_aqi for s in stations if s.latest_aqi is not None]
        avg_aqi = int(round(sum(valid_aqis) / len(valid_aqis))) if valid_aqis else 150
        cat_info = get_aqi_category_info(avg_aqi)
        dom_pols = [s.latest_dominant_pollutant for s in stations if s.latest_dominant_pollutant]
        top_pol = max(set(dom_pols), key=dom_pols.count) if dom_pols else "PM2.5"

        cached = {
            "monitored_stations_count": len(stations),
            "monitored_cities_count": len(cities),
            "average_aqi": avg_aqi,
            "category": cat_info["category"],
            "color": cat_info["color"],
            "dominant_pollutant": top_pol,
            "severe_stations_count": len(severe),
            "severe_stations": severe,
            "last_updated": stations[0].last_updated.isoformat() if stations and stations[0].last_updated else None
        }

    # Attach live/demo metadata
    cached["mode"] = "LIVE" if settings.OPENAQ_API_KEY else "DEMO"
    cached["data_source"] = "OpenAQ v3" if settings.OPENAQ_API_KEY else "CPCB Official (Real Monitoring Benchmark)"
    return cached


@router.get("/aqi/daily")
def get_daily_aqi(
    station_id: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    year: Optional[int] = Query(None)
):
    repo = get_repository()
    return repo.get_daily_aqi(station_id=station_id, city=city, year=year)


@router.get("/aqi/calendar", response_model=CalendarResponse)
def get_calendar_heatmap(
    year: int = Query(2026, ge=2020, le=2030),
    city: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None)
):
    repo = get_repository()
    # Use precomputed cache if requesting default full 2026 dataset
    if year == 2026 and not city and not station_id:
        cached = repo.get_precomputed("calendar_2026")
        if cached:
            return CalendarResponse(**cached)
    return compute_calendar_data(year=year, city=city, station_id=station_id)


@router.get("/pollutants/contribution")
def get_pollutant_contributions(city: Optional[str] = Query(None)):
    repo = get_repository()
    daily_records = repo.get_daily_aqi(city=city)
    if not daily_records:
        return {"frequencies": {}, "dominant_by_month": {}, "total_records": 0}

    import pandas as pd
    df = pd.DataFrame(daily_records)
    total_records = len(df)
    
    # Sub-index frequency distribution
    freq_counts = df["dominant_pollutant"].value_counts().to_dict()
    freq_pcts = {k: round(v / total_records * 100, 1) for k, v in freq_counts.items()}

    # Dominant pollutant by month
    df["month"] = pd.to_datetime(df["date"]).dt.month
    monthly_dom = {}
    for m in range(1, 13):
        m_df = df[df["month"] == m]
        if not m_df.empty:
            mode_val = m_df["dominant_pollutant"].mode()
            monthly_dom[m] = mode_val[0] if not mode_val.empty else "PM2.5"

    return {
        "frequencies": freq_pcts,
        "raw_counts": freq_counts,
        "dominant_by_month": monthly_dom,
        "total_records": total_records
    }
