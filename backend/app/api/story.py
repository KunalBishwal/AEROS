from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from ..firebase.repository import get_repository
from ..analytics.story import generate_commissioner_story
from ..analytics.intervention import compute_intervention_window
from ..analytics.insights import generate_dynamic_insights
from ..models.analytics import CommissionerStoryResponse, InterventionWindowResponse, InsightItem
from ..models.station import StationSummary
from ..aqi.breakpoints import get_aqi_category_info

router = APIRouter(tags=["Editorial Story & Insights"])


@router.get("/story", response_model=CommissionerStoryResponse)
def get_commissioner_story(
    city: str = Query("Delhi", description="City for Commissioner Briefing")
):
    repo = get_repository()
    if city.lower() == "delhi":
        cached = repo.get_precomputed("story_delhi")
        if cached:
            return CommissionerStoryResponse(**cached)
    return generate_commissioner_story(city=city)


@router.get("/intervention-windows", response_model=InterventionWindowResponse)
def get_intervention_windows(
    city: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None)
):
    repo = get_repository()
    if not city and not station_id:
        cached = repo.get_precomputed("intervention_window")
        if cached:
            return InterventionWindowResponse(**cached)
    return compute_intervention_window(city=city, station_id=station_id)


@router.get("/insights", response_model=List[InsightItem])
def get_dynamic_insights(city: Optional[str] = Query(None)):
    repo = get_repository()
    if not city:
        cached = repo.get_precomputed("dynamic_insights")
        if cached and "insights" in cached:
            return [InsightItem(**i) for i in cached["insights"]]
    return generate_dynamic_insights(city=city)


@router.get("/alerts")
def get_severe_alerts():
    repo = get_repository()
    stations = repo.get_stations()
    severe = []
    for s in stations:
        if s.latest_aqi and s.latest_aqi >= 301:  # Very Poor or Severe
            cat_info = get_aqi_category_info(s.latest_aqi)
            severe.append({
                "station_id": s.station_id,
                "station_name": s.name,
                "city": s.city,
                "aqi": s.latest_aqi,
                "category": s.latest_aqi_category,
                "dominant_pollutant": s.latest_dominant_pollutant,
                "color": cat_info["color"],
                "health_advisory": cat_info["health_advisory"],
                "severity_level": "CRITICAL" if s.latest_aqi >= 401 else "WARNING",
                "last_updated": s.last_updated.isoformat() if s.last_updated else None
            })
    return {
        "alert_count": len(severe),
        "has_active_alerts": len(severe) > 0,
        "alerts": sorted(severe, key=lambda x: x["aqi"], reverse=True)
    }
