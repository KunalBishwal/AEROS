"""
Analytics Precomputation Orchestrator.
Precomputes high-computation aggregations (clustering, calendar grids, insights, patterns)
and writes them to the Firestore 'precomputed_analytics' collection for sub-50ms frontend loads.
"""

from typing import Dict, Any
from ..firebase.repository import get_repository
from .patterns import compute_diurnal_patterns, compute_calendar_data, compute_seasonal_summary
from .clustering import compute_station_clusters
from .exceedance import compute_exceedance_metrics
from .intervention import compute_intervention_window
from .insights import generate_dynamic_insights
from .story import generate_commissioner_story


def compute_all_analytics():
    repo = get_repository()
    print("Precomputing analytics for instantaneous API delivery...")

    # 1. Current Overview Metrics
    stations = repo.get_stations()
    cities = sorted(list(set(s.city for s in stations)))
    
    # Severe stations count
    severe_stations = [s for s in stations if s.latest_aqi and s.latest_aqi >= 401]
    valid_aqis = [s.latest_aqi for s in stations if s.latest_aqi is not None]
    avg_aqi = int(round(sum(valid_aqis) / len(valid_aqis))) if valid_aqis else 150

    from ..aqi.breakpoints import get_aqi_category_info
    cat_info = get_aqi_category_info(avg_aqi)

    dom_pols = [s.latest_dominant_pollutant for s in stations if s.latest_dominant_pollutant]
    top_pol = max(set(dom_pols), key=dom_pols.count) if dom_pols else "PM2.5"

    current_summary = {
        "monitored_stations_count": len(stations),
        "monitored_cities_count": len(cities),
        "average_aqi": avg_aqi,
        "category": cat_info["category"],
        "color": cat_info["color"],
        "dominant_pollutant": top_pol,
        "severe_stations_count": len(severe_stations),
        "severe_stations": [s.model_dump(mode="json") for s in severe_stations],
        "last_updated": stations[0].last_updated.isoformat() if stations and stations[0].last_updated else None
    }
    repo.save_precomputed("current_summary", current_summary)

    # 2. Precompute Clusters for K = 2, 3, 4, 5
    for k in range(2, 6):
        cl_res = compute_station_clusters(k=k)
        repo.save_precomputed(f"clusters_k{k}", cl_res.model_dump(mode="json"))

    # 3. Precompute Calendar for 2026
    cal_res = compute_calendar_data(year=2026)
    repo.save_precomputed("calendar_2026", cal_res.model_dump(mode="json"))

    # 4. Precompute Intervention Window
    iw_res = compute_intervention_window()
    repo.save_precomputed("intervention_window", iw_res.model_dump(mode="json"))

    # 5. Precompute Insights
    insights_list = generate_dynamic_insights()
    repo.save_precomputed("dynamic_insights", {"insights": [i.model_dump(mode="json") for i in insights_list]})

    # 6. Precompute Commissioner Story for Delhi
    story_res = generate_commissioner_story("Delhi")
    repo.save_precomputed("story_delhi", story_res.model_dump(mode="json"))

    # Flush changes to disk/cache
    if hasattr(repo.db, "flush"):
        repo.db.flush()

    print("All analytics precomputed successfully!")


if __name__ == "__main__":
    compute_all_analytics()
